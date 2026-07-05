import 'dotenv/config';
import { loadAgentConfig, loadPersonalityConfig } from './config.js';
import { createAgentLogger } from './logger.js';
import { StateManager } from './state.js';
import { ensureProfile, runAgentCycle } from './agent.js';

function cancellableSleep(ms: number): { promise: Promise<void>; cancel: () => void } {
  let timer: NodeJS.Timeout;
  let resolveFn: () => void;
  const promise = new Promise<void>(resolve => {
    resolveFn = resolve;
    timer = setTimeout(resolve, ms);
  });
  return { promise, cancel: () => { clearTimeout(timer); resolveFn(); } };
}

async function main(): Promise<void> {
  // --- Load config ---
  let config;
  try {
    config = loadAgentConfig();
  } catch (err: any) {
    console.error('Configuration error:', err.message);
    process.exit(1);
  }

  // --- Init logger ---
  const logger = createAgentLogger(config.logLevel);

  // --- Load personality ---
  let personality;
  try {
    personality = loadPersonalityConfig();
  } catch (err: any) {
    logger.error('Failed to load personality config', { event: 'startup_error', error: err.message });
    process.exit(1);
  }

  // --- Init state ---
  const state = new StateManager(logger);

  // --- Startup log ---
  logger.info('K Agent starting', {
    event: 'agent_start',
    model: config.claudeModel,
    pollIntervalMinutes: config.pollIntervalMinutes,
    mcpServer: config.mcpServerPath,
    personality: personality.identity.name,
  });

  // --- Ensure profile exists ---
  try {
    await ensureProfile(config, personality, logger);
  } catch (err: any) {
    logger.warn('Profile check failed — continuing anyway', { event: 'profile_check', error: err.message });
  }

  // --- Graceful shutdown ---
  let running = true;
  let cancelSleep: (() => void) | null = null;
  const shutdown = () => {
    logger.info('Shutdown signal received — stopping', { event: 'agent_stop' });
    running = false;
    cancelSleep?.();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // --- Main loop ---
  let cycleNumber = 0;

  while (running) {
    cycleNumber++;
    logger.info(`Starting cycle #${cycleNumber}`, { event: 'cycle_start', cycle: cycleNumber });

    try {
      const result = await runAgentCycle(cycleNumber, config, personality, state, logger);

      logger.info(`Cycle #${cycleNumber} complete`, {
        event: 'cycle_complete',
        cycle: cycleNumber,
        notificationsTotal: result.notificationsTotal,
        notificationsNew: result.notificationsNew,
        actionsCount: result.actionsPerformed.length,
        actions: result.actionsPerformed.map(a => ({ type: a.type, tool: a.toolName, txId: a.transactionId })),
        errorsCount: result.errors.length,
        durationMs: result.durationMs,
        claudeSummary: result.claudeSummary,
      });

      if (result.errors.length > 0) {
        logger.warn('Cycle completed with errors', { event: 'cycle_error', cycle: cycleNumber, errors: result.errors });
      }
    } catch (err: any) {
      logger.error('Cycle failed unexpectedly', { event: 'cycle_error', cycle: cycleNumber, error: err.message, stack: err.stack });
    }

    // Run weekly cleanup of old state entries
    if (cycleNumber % (7 * 24 * 6) === 0) {
      state.cleanup(90);
    }

    if (!running) break;

    const sleepMs = config.pollIntervalMinutes * 60 * 1000;
    logger.info(`Sleeping ${config.pollIntervalMinutes}m until next cycle`, { event: 'agent_sleep', cycle: cycleNumber, nextCycle: cycleNumber + 1 });
    const sleeper = cancellableSleep(sleepMs);
    cancelSleep = sleeper.cancel;
    await sleeper.promise;
    cancelSleep = null;
  }

  state.close();
  logger.info('K Agent stopped', { event: 'agent_stop', totalCycles: cycleNumber });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
