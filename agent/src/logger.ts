import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

const LOG_DIR = resolve(process.cwd(), 'logs');

// Ensure logs directory exists
mkdirSync(LOG_DIR, { recursive: true });

const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

const consoleFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.colorize(),
  format.printf(({ timestamp, level, message, event, cycle, ...rest }) => {
    const meta = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
    const cycleTag = cycle !== undefined ? ` [cycle #${cycle}]` : '';
    const eventTag = event ? ` [${event}]` : '';
    return `${timestamp} ${level}${cycleTag}${eventTag}: ${message}${meta}`;
  }),
);

export function createAgentLogger(logLevel: string) {
  return createLogger({
    level: logLevel,
    transports: [
      // Console — human-readable
      new transports.Console({ format: consoleFormat }),

      // Daily rotating file — all levels, JSON
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: 'agent-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        format: jsonFormat,
        level: logLevel,
      }),

      // Daily rotating file — errors only
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: 'errors-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '90d',
        format: jsonFormat,
        level: 'error',
      }),
    ],
  });
}

export type AgentLogger = ReturnType<typeof createAgentLogger>;
