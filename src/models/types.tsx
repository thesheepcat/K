export interface Post {
  id: string;
  author: {
    name: string; // Display name: "You" for current user, or "abcd...wxyz" format for others
    username: string; // Full Kaspa address calculated from pubkey
    avatar: string;
    pubkey: string; // Original pubkey - CRITICAL for reply chain functionality
  };
  content: string;
  timestamp: string;
  upVotes: number;
  downVotes: number;
  reposts: number;
  replies: number;
  upVoted: boolean;
  downVoted: boolean;
  reposted: boolean;
  nestedReplies?: Post[];
  parentPostId?: string; // ID of the post/reply being replied to (only for replies)
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
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
  repostsCount: number;
  parentPostId?: string; // ID of the post/reply being replied to (only for replies)
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
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
  repostsCount: number;
  parentPostId?: string; // ID of the post/reply being replied to
  mentionedPubkeys?: string[]; // Array of mentioned pubkeys from the original transaction
}

// Server response types for Users API
export interface ServerUserPost {
  id: string; // 32-byte cryptographic hash
  userPublicKey: string;
  postContent: string; // Base64 encoded
  signature: string; // 64 bytes schnorr signature
  timestamp: number; // Unix timestamp
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