export interface AgentConfig {
  anthropicApiKey: string;
  mcpServerPath: string;
  mcpConfigPath: string;
  pollIntervalMinutes: number;
  claudeModel: string;
  claudeMaxTokens: number;
  maxLoops: number;
  logLevel: string;
}

export interface EngagementToggle {
  enabled: boolean;
  maxPerCycle: number;
}

export interface PersonalityConfig {
  identity: {
    name: string;
    bio: string;
    language: string;
    multilingualReply: boolean;
  };
  voice: {
    tone: string;
    emojiUsage: string;
    humorLevel: string;
    averageReplyLength: string;
    formality: string;
  };
  interests: {
    topics: string[];
    avoid: string[];
  };
  engagement: {
    maxActionsPerCycle: number;

    replyToMentions:            EngagementToggle;
    replyToRepliesOnMyPosts:    EngagementToggle;
    quoteInterestingPosts:      EngagementToggle;
    upvoteInterestingPosts:     EngagementToggle;
    downvoteLowQualityPosts:    EngagementToggle;
    followBackUsersWhoInteract: EngagementToggle;
    unfollowInactiveUsers:      EngagementToggle;
    engageWithTrendingHashtags: EngagementToggle;
    engageWithFollowingFeed:    EngagementToggle;
    engageWithWatchingFeed:     EngagementToggle;
    proactivePosting:           EngagementToggle & { onlyIfNothingElseToDo: boolean };
  };
  contentGuidelines: string[];
}

export interface Action {
  type: 'reply' | 'quote' | 'vote' | 'follow' | 'post' | 'other';
  toolName: string;
  targetId?: string;
  targetUser?: string;
  content?: string;
  transactionId?: string;
  rawInput?: Record<string, unknown>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CycleResult {
  timestamp: string;
  cycleNumber: number;
  notificationsTotal: number;
  notificationsNew: number;
  actionsPerformed: Action[];
  claudeSummary: string;
  errors: string[];
  durationMs: number;
  model: string;
  tokenUsage: TokenUsage;
}

export interface KNotification {
  id: string;
  userPublicKey: string;
  userNickname?: string;
  contentType: string;
  voteType?: string;
  contentId?: string;
  votedContent?: string;
  postContent?: string;
  timestamp: number;
  cursor: string;
}

export interface KPost {
  id: string;
  userPublicKey: string;
  userNickname?: string;
  postContent: string;
  timestamp: number;
  repliesCount?: number;
  upVotesCount?: number;
  isQuote?: boolean;
}
