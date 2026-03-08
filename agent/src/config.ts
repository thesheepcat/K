import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { AgentConfig, PersonalityConfig } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Env schema ---

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  MCP_SERVER_PATH: z.string().min(1, 'MCP_SERVER_PATH is required'),
  K_MCP_CONFIG: z.string().min(1, 'K_MCP_CONFIG is required'),
  POLL_INTERVAL_MINUTES: z.coerce.number().min(1).max(1440).default(60),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-6'),
  CLAUDE_MAX_TOKENS: z.coerce.number().min(256).max(8192).default(2048),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PERSONALITY_PATH: z.string().optional(),
});

// --- Personality schema ---

const engagementToggle = z.object({
  enabled: z.boolean(),
  maxPerCycle: z.number().int().min(0),
});

const personalitySchema = z.object({
  identity: z.object({
    name: z.string(),
    bio: z.string(),
    language: z.string(),
    multilingualReply: z.boolean(),
  }),
  voice: z.object({
    tone: z.string(),
    emojiUsage: z.string(),
    humorLevel: z.string(),
    averageReplyLength: z.string(),
    formality: z.string(),
  }),
  interests: z.object({
    topics: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  engagement: z.object({
    maxActionsPerCycle: z.number(),

    replyToMentions:            engagementToggle,
    replyToRepliesOnMyPosts:    engagementToggle,
    quoteInterestingPosts:      engagementToggle,
    upvoteInterestingPosts:     engagementToggle,
    downvoteLowQualityPosts:    engagementToggle,
    followBackUsersWhoInteract: engagementToggle,
    unfollowInactiveUsers:      engagementToggle,
    engageWithTrendingHashtags: engagementToggle,
    engageWithFollowingFeed:    engagementToggle,
    engageWithWatchingFeed:     engagementToggle,
    proactivePosting:           engagementToggle.extend({ onlyIfNothingElseToDo: z.boolean() }),
  }),
  contentGuidelines: z.array(z.string()),
});

// --- Loaders ---

export function loadAgentConfig(): AgentConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    mcpServerPath: resolve(process.cwd(), env.MCP_SERVER_PATH),
    mcpConfigPath: env.K_MCP_CONFIG.replace(/^~/, process.env.HOME ?? ''),
    pollIntervalMinutes: env.POLL_INTERVAL_MINUTES,
    claudeModel: env.CLAUDE_MODEL,
    claudeMaxTokens: env.CLAUDE_MAX_TOKENS,
    logLevel: env.LOG_LEVEL,
  };
}

export function loadPersonalityConfig(): PersonalityConfig {
  const envPath = process.env.PERSONALITY_PATH;
  const personalityPath = envPath
    ? resolve(process.cwd(), envPath)
    : resolve(__dirname, '../config/personality.json');
  let raw: string;
  try {
    raw = readFileSync(personalityPath, 'utf-8');
  } catch {
    throw new Error(`Could not read personality config at: ${personalityPath}`);
  }
  const parsed = personalitySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid personality configuration:\n${issues}`);
  }
  return parsed.data;
}
