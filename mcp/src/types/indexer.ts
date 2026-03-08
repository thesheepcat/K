export interface ServerPost {
  id: string;
  userPublicKey: string;
  postContent: string;
  signature: string;
  timestamp: number;
  repliesCount: number;
  upVotesCount: number;
  downVotesCount: number;
  quotesCount: number;
  repostsCount: number;
  parentPostId?: string;
  mentionedPubkeys?: string[];
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  userNickname?: string;
  userProfileImage?: string;
  blockedUser?: boolean;
  isQuote?: boolean;
  quote?: ServerQuoteData;
}

export interface ServerQuoteData {
  referencedContentId: string;
  referencedMessage: string;
  referencedSenderPubkey: string;
  referencedNickname?: string;
  referencedProfileImage?: string;
}

export interface ServerUserPost {
  id: string;
  userPublicKey: string;
  postContent: string;
  signature: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  followedUser: boolean;
  blockedUser?: boolean;
  contentsCount?: number;
}

export interface ServerUserDetails extends ServerPost {
  followersCount: number;
  followingCount: number;
  blockedCount: number;
  followedUser: boolean;
}

export interface ServerNotification {
  id: string;
  userPublicKey: string;
  postContent: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  contentType: 'post' | 'reply' | 'quote' | 'vote';
  cursor: string;
  voteType: 'upvote' | 'downvote' | null;
  contentId: string | null;
  votedContent: string | null;
}

export interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: PaginationMetadata;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  network: string;
}

export interface StatsResponse {
  broadcasts: number;
  posts: number;
  replies: number;
  quotes: number;
  votes: number;
  follows: number;
  blocks: number;
}

export interface UsersCountResponse {
  count: number;
}

export interface NotificationsCountResponse {
  count: number;
}

export interface TrendingHashtag {
  hashtag: string;
  usageCount: number;
  rank: number;
}
