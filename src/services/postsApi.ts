import { type ServerPost, type Post, type ServerReply, type ServerComment, type ServerUserPost, type PaginatedWatchingPostsResponse, type PaginationOptions, type PaginatedPostsResponse, type PaginatedUsersResponse, type PaginatedRepliesResponse, type PaginatedCommentsResponse } from '@/models/types';
import { generateAuthorInfo } from '@/utils/postUtils';
import { Base64 } from 'js-base64';

/**
 * Fetch posts from the server for a specific user with pagination
 */
export const fetchMyPosts = async (userPublicKey: string, requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedPostsResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-posts`);
    
    // User parameter is mandatory
    url.searchParams.append('user', userPublicKey);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedPostsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching paginated posts:', error);
    throw error;
  }
};

/**
 * Fetch following posts from the server with pagination
 */
export const fetchFollowingPosts = async (requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedPostsResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-posts-following`);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedPostsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching paginated following posts:', error);
    throw error;
  }
};

/**
 * Fetch watching posts from the server with pagination
 */
export const fetchWatchingPosts = async (requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedWatchingPostsResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-posts-watching`);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for get-posts-watching endpoint
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedWatchingPostsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching watching posts with pagination:', error);
    throw error;
  }
};

/**
 * Fetch mentions for a specific user with pagination
 */
export const fetchMentions = async (userPublicKey: string, requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedPostsResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-mentions`);
    
    // User parameter is mandatory
    url.searchParams.append('user', userPublicKey);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedPostsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching mentions with pagination:', error);
    throw error;
  }
};

/**
 * Fetch users from the server with pagination
 */
export const fetchUsers = async (options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedUsersResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-users`);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaginatedUsersResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching paginated users:', error);
    throw error;
  }
};

/**
 * Convert server post format to client post format
 */
export const convertServerPostToClientPost = async (serverPost: ServerPost, currentUserPubkey?: string, networkId?: string): Promise<Post> => {
  // Decode base64 content
  let decodedContent: string;
  try {
    decodedContent = Base64.decode(serverPost.postContent);
  } catch (error) {
    console.error('Error decoding base64 content:', error);
    decodedContent = '[Unable to decode content]';
  }

  // Decode nickname if available
  let decodedNickname: string | undefined;
  if (serverPost.userNickname) {
    try {
      decodedNickname = Base64.decode(serverPost.userNickname);
    } catch (error) {
      console.error('Error decoding base64 nickname:', error);
    }
  }

  // Convert unix timestamp to relative time string
  const now = Date.now();
  const postTime = serverPost.timestamp; // Already in milliseconds
  const diffMs = now - postTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let timeString: string;
  if (diffDays > 0) {
    timeString = `${diffDays}d`;
  } else if (diffHours > 0) {
    timeString = `${diffHours}h`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      timeString = `${diffMinutes}m`;
    } else {
      timeString = 'now';
    }
  }

  // Use the cryptographic hash ID from server
  const postId = serverPost.id;

  // Generate proper author info with display formatting and optional nickname
  const authorInfo = await generateAuthorInfo(
    serverPost.userPublicKey, 
    currentUserPubkey, 
    networkId,
    decodedNickname,
    serverPost.userProfileImage
  );

  return {
    id: postId,
    author: authorInfo, // Use the properly formatted author info
    content: decodedContent,
    timestamp: timeString,
    upVotes: serverPost.upVotesCount,
    downVotes: serverPost.downVotesCount || 0, // Default to 0 if not provided
    reposts: serverPost.repostsCount,
    replies: serverPost.repliesCount,
    upVoted: serverPost.isUpvoted ?? false, // Use server data or default to false
    downVoted: serverPost.isDownvoted ?? false, // Use server data or default to false
    reposted: false, // Default to not reposted
    nestedReplies: [], // Replies will be empty for server posts initially
    parentPostId: serverPost.parentPostId,
    mentionedPubkeys: serverPost.mentionedPubkeys || []
  };
};

/**
 * Convert array of server posts to client posts
 */
export const convertServerPostsToClientPosts = async (serverPosts: ServerPost[], currentUserPubkey?: string, networkId?: string): Promise<Post[]> => {
  // Sort posts by timestamp (newest first) before converting
  const sortedPosts = serverPosts.sort((a, b) => b.timestamp - a.timestamp);
  return Promise.all(sortedPosts.map(serverPost => convertServerPostToClientPost(serverPost, currentUserPubkey, networkId)));
};

/**
 * Convert server user post format to client post format (without interaction counts)
 */
export const convertServerUserPostToClientPost = async (serverUserPost: ServerUserPost, currentUserPubkey?: string, networkId?: string): Promise<Post> => {
  // Decode base64 content
  let decodedContent: string;
  try {
    decodedContent = Base64.decode(serverUserPost.postContent);
  } catch (error) {
    console.error('Error decoding base64 content:', error);
    decodedContent = '[Unable to decode content]';
  }

  // Decode nickname if available
  let decodedNickname: string | undefined;
  if (serverUserPost.userNickname) {
    try {
      decodedNickname = Base64.decode(serverUserPost.userNickname);
    } catch (error) {
      console.error('Error decoding base64 nickname:', error);
    }
  }

  // Convert unix timestamp to relative time string
  const now = Date.now();
  const postTime = serverUserPost.timestamp; // Already in milliseconds
  const diffMs = now - postTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let timeString: string;
  if (diffDays > 0) {
    timeString = `${diffDays}d`;
  } else if (diffHours > 0) {
    timeString = `${diffHours}h`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      timeString = `${diffMinutes}m`;
    } else {
      timeString = 'now';
    }
  }

  // Use the cryptographic hash ID from server
  const postId = serverUserPost.id;

  // Generate proper author info with display formatting and optional nickname
  const authorInfo = await generateAuthorInfo(
    serverUserPost.userPublicKey, 
    currentUserPubkey, 
    networkId,
    decodedNickname,
    serverUserPost.userProfileImage
  );

  return {
    id: postId,
    author: authorInfo, // Use the properly formatted author info
    content: decodedContent,
    timestamp: timeString,
    upVotes: 0, // Users view doesn't show upvotes
    downVotes: 0, // Users view doesn't show downvotes
    reposts: 0, // Users view doesn't show reposts
    replies: 0, // Users view doesn't show replies
    upVoted: false, // Default to not upvoted
    downVoted: false, // Default to not downvoted
    reposted: false, // Default to not reposted
    nestedReplies: [], // Replies will be empty for user posts
    // Note: Users API doesn't include parentPostId and mentionedPubkeys
  };
};

/**
 * Convert array of server user posts to client posts
 */
export const convertServerUserPostsToClientPosts = async (serverUserPosts: ServerUserPost[], currentUserPubkey?: string, networkId?: string): Promise<Post[]> => {
  // Sort posts by timestamp (newest first) before converting
  const sortedPosts = serverUserPosts.sort((a, b) => b.timestamp - a.timestamp);
  return Promise.all(sortedPosts.map(serverUserPost => convertServerUserPostToClientPost(serverUserPost, currentUserPubkey, networkId)));
};

/**
 * Fetch details for a specific post/reply
 */
export const fetchPostDetails = async (postId: string, requesterPubkey: string, apiBaseUrl: string = 'http://localhost:3000'): Promise<{ post: ServerPost }> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-post-details`);
    
    // Post ID parameter is mandatory
    url.searchParams.append('id', postId);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch post details: ${response.status} ${response.statusText}`);
    }

    const data: { post: ServerPost } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching post details:', error);
    throw error;
  }
};

/**
 * Fetch replies for a specific post with pagination
 */
export const fetchPostReplies = async (postId: string, requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedRepliesResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-replies`);
    
    // Post parameter is mandatory
    url.searchParams.append('post', postId);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch paginated replies: ${response.status} ${response.statusText}`);
    }

    const data: PaginatedRepliesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching paginated replies:', error);
    throw error;
  }
};

/**
 * Fetch user replies with pagination (replies made by a specific user)
 */
export const fetchUserReplies = async (userPublicKey: string, requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedRepliesResponse> => {
  try {
    const url = new URL(`${apiBaseUrl}/get-replies`);
    
    // User parameter (instead of post) for user replies
    url.searchParams.append('user', userPublicKey);
    
    // Requester pubkey parameter is mandatory
    url.searchParams.append('requesterPubkey', requesterPubkey);
    
    // Limit is mandatory for paginated endpoints
    const limit = options?.limit || 10; // Default to 10 if not provided
    url.searchParams.append('limit', limit.toString());
    
    // Before and after are optional
    if (options?.before) {
      url.searchParams.append('before', options.before);
    }
    if (options?.after) {
      url.searchParams.append('after', options.after);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user replies: ${response.status} ${response.statusText}`);
    }

    const data: PaginatedRepliesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user replies:', error);
    throw error;
  }
};

/**
 * Fetch comments for a specific post with pagination
 * @deprecated Use fetchPostReplies instead - comments and replies are the same in this system
 */
export const fetchPostComments = async (postId: string, requesterPubkey: string, options?: PaginationOptions, apiBaseUrl: string = 'http://localhost:3000'): Promise<PaginatedCommentsResponse> => {
  // Comments and replies are the same in our system, so we can reuse the replies endpoint
  const repliesResponse = await fetchPostReplies(postId, requesterPubkey, options, apiBaseUrl);
  
  // Transform the response to match PaginatedCommentsResponse structure
  return {
    replies: repliesResponse.replies, // ServerComment is an alias for ServerReply
    pagination: repliesResponse.pagination
  };
};


/**
 * Format timestamp to relative time string
 */
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const postTime = timestamp; // Already in milliseconds
  const diffMs = now - postTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return 'now';
    }
  }
};

/**
 * Convert server reply to client post format
 */
export const convertServerReplyToClientPost = async (serverReply: ServerReply, currentUserPubkey?: string, networkId?: string): Promise<Post> => {
  // Decode Base64 content
  let decodedContent: string;
  try {
    decodedContent = Base64.decode(serverReply.postContent);
  } catch (error) {
    console.error('Failed to decode Base64 content:', error);
    decodedContent = '[Content could not be decoded]';
  }

  // Decode nickname if available
  let decodedNickname: string | undefined;
  if (serverReply.userNickname) {
    try {
      decodedNickname = Base64.decode(serverReply.userNickname);
    } catch (error) {
      console.error('Error decoding base64 nickname:', error);
    }
  }

  // Convert timestamp to relative time
  const timestamp = formatTimestamp(serverReply.timestamp);

  // Generate proper author info with display formatting and optional nickname
  const authorInfo = await generateAuthorInfo(
    serverReply.userPublicKey, 
    currentUserPubkey, 
    networkId,
    decodedNickname,
    serverReply.userProfileImage
  );

  return {
    id: serverReply.id, // Use the cryptographic hash ID from server
    author: authorInfo, // Use the properly formatted author info
    content: decodedContent,
    timestamp: timestamp,
    upVotes: serverReply.upVotesCount,
    downVotes: serverReply.downVotesCount || 0, // Default to 0 if not provided
    reposts: serverReply.repostsCount,
    replies: serverReply.repliesCount,
    upVoted: serverReply.isUpvoted ?? false, // Use server data or default to false
    downVoted: serverReply.isDownvoted ?? false, // Use server data or default to false
    reposted: false,
    nestedReplies: [],
    parentPostId: serverReply.parentPostId,
    mentionedPubkeys: serverReply.mentionedPubkeys || []
  };
};

/**
 * Convert array of server replies to client posts
 */
export const convertServerRepliesToClientPosts = async (serverReplies: ServerReply[], currentUserPubkey?: string, networkId?: string): Promise<Post[]> => {
  // Sort replies by timestamp (newest first) before converting
  const sortedReplies = serverReplies.sort((a, b) => b.timestamp - a.timestamp);
  return Promise.all(sortedReplies.map(serverReply => convertServerReplyToClientPost(serverReply, currentUserPubkey, networkId)));
};

// Legacy function names for backward compatibility
/**
 * Convert server comment to client post format
 * @deprecated Use convertServerReplyToClientPost instead
 */
export const convertServerCommentToClientPost = async (serverComment: ServerComment, currentUserPubkey?: string, networkId?: string): Promise<Post> => {
  return convertServerReplyToClientPost(serverComment, currentUserPubkey, networkId);
};

/**
 * Convert array of server comments to client posts
 * @deprecated Use convertServerRepliesToClientPosts instead
 */
export const convertServerCommentsToClientPosts = async (serverComments: ServerComment[], currentUserPubkey?: string, networkId?: string): Promise<Post[]> => {
  return convertServerRepliesToClientPosts(serverComments, currentUserPubkey, networkId);
};