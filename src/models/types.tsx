export interface Post {
  id: string;
  author: {
    name: string; // Display name: "You" for current user, nickname if available, or "abcd...wxyz" format for others
    username: string; // Full Kaspa address calculated from pubkey
    avatar: string; // Profile image if available, otherwise generated avatar
    pubkey: string; // Original pubkey - CRITICAL for reply chain functionality
    nickname?: string; // Decoded nickname if available
    profileImage?: string; // Base64 profile image if available
  };
  content: string;
  timestamp: string;
  upVotes: number;
  downVotes: number;
  reposts: number;
  replies: number;
  quotes: number;
  upVoted: boolean;
  downVoted: boolean;
  reposted: boolean;
  followedUser?: boolean; // Whether the requesting user follows this user (only in Users view)
  contentsCount?: number; // Total content count in time window (only in most-active-users view)
  nestedReplies?: Post[];
  parentPostId?: string; // ID of the post/reply being replied to (only for replies)
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
  isQuote?: boolean; // Whether this is a quote (true) or regular post (false)
  quote?: QuoteData; // Quote reference data (only present when isQuote is true)
}

export interface QuoteData {
  referencedMessage: string; // Decoded message content of the referenced post
  referencedSenderPubkey: string; // Public key of the referenced content's author
  referencedNickname?: string; // Decoded nickname of referenced author (optional)
  referencedProfileImage?: string; // Base64 encoded profile image of referenced author (optional)
  referencedId?: string; // ID of the referenced post (for navigation)
}

// Server response types for My Posts API
export interface ServerPost {
  id: string; // 32-byte cryptographic hash
  userPublicKey: string;
  postContent: string; // Base64 encoded
  signature: string; // 64 bytes schnorr signature
  timestamp: number; // Unix timestamp
  repliesCount: number;
  upVotesCount: number;
  downVotesCount: number; // Optional, defaults to 0
  quotesCount: number;
  repostsCount: number;
  parentPostId?: string; // ID of the post/reply being replied to (only for replies)
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
  isUpvoted?: boolean; // Whether the requesting user has upvoted this post
  isDownvoted?: boolean; // Whether the requesting user has downvoted this post
  userNickname?: string; // Base64 encoded nickname (optional)
  userProfileImage?: string; // Base64 encoded profile image (optional)
  isQuote?: boolean; // Whether this is a quote (true) or regular post (false)
  quote?: ServerQuoteData; // Quote reference data (only present when isQuote is true)
}

export interface ServerQuoteData {
  referencedContentId: string; // Transaction ID of the referenced content (64-character hex string)
  referencedMessage: string; // Base64 encoded message of the referenced content
  referencedSenderPubkey: string; // Public key of the referenced content's author
  referencedNickname?: string; // Base64 encoded nickname of referenced author (optional)
  referencedProfileImage?: string; // Base64 encoded profile image of referenced author (optional)
}

export interface ServerReply {
  id: string; // 32-byte cryptographic hash
  userPublicKey: string;
  postContent: string; // Base64 encoded
  signature: string; // 64-byte Schnorr signature as hex string
  timestamp: number; // Unix timestamp
  repliesCount: number;
  upVotesCount: number;
  downVotesCount: number; // Optional, defaults to 0
  quotesCount: number;
  repostsCount: number;
  parentPostId?: string; // ID of the post/reply being replied to
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
  isUpvoted?: boolean; // Whether the requesting user has upvoted this reply
  isDownvoted?: boolean; // Whether the requesting user has downvoted this reply
  userNickname?: string; // Base64 encoded nickname (optional)
  userProfileImage?: string; // Base64 encoded profile image (optional)
}

// Server response types for Users API
export interface ServerUserPost {
  id: string; // 32-byte cryptographic hash
  userPublicKey: string;
  postContent: string; // Base64 encoded
  signature: string; // 64 bytes schnorr signature
  timestamp: number; // Unix timestamp
  userNickname?: string; // Base64 encoded nickname (optional)
  userProfileImage?: string; // Base64 encoded profile image (optional)
  followedUser: boolean; // Whether the requesting user follows this user
  blockedUser?: boolean; // Whether the requesting user has blocked this user (only in most-active-users)
  contentsCount?: number; // Total content count in time window (only in most-active-users)
  // Note: Users API doesn't include repliesCount, upVotesCount, downVotesCount, repostsCount, parentPostId, mentionedPubkeys
}

// Pagination types
export interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null; // Timestamp for older posts
  prevCursor: string | null; // Timestamp for newer posts
}

export interface PaginationOptions {
  limit?: number; // Number of items to return (default: 10, max: 100)
  before?: string | null; // Return items created before this timestamp
  after?: string | null; // Return items created after this timestamp
}

export interface PaginatedWatchingPostsResponse {
  posts: ServerPost[];
  pagination: PaginationMetadata;
}

// Generic paginated response types
export interface PaginatedPostsResponse {
  posts: ServerPost[];
  pagination: PaginationMetadata;
}

export interface PaginatedUsersResponse {
  posts: ServerUserPost[];
  pagination: PaginationMetadata;
}

export interface PaginatedRepliesResponse {
  replies: ServerReply[];
  pagination: PaginationMetadata;
}

export interface PaginatedCommentsResponse {
  replies: ServerComment[];
  pagination: PaginationMetadata;
}

// Legacy type aliases for backward compatibility during migration
export type ServerComment = ServerReply;
export type RepliesApiResponse = PaginatedRepliesResponse;
export type CommentsApiResponse = RepliesApiResponse;