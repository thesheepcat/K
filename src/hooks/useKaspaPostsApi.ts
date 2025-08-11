import { useCallback } from 'react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { 
  fetchMyPosts, 
  fetchFollowingPosts, 
  fetchWatchingPosts,
  fetchMentions,
  fetchUsers,
  fetchPostDetails,
  fetchPostReplies,
  fetchUserReplies,
  fetchPostComments,
  convertServerPostsToClientPosts,
  convertServerUserPostsToClientPosts,
  convertServerRepliesToClientPosts,
  convertServerPostToClientPost
} from '@/services/postsApi';
import { type Post, type ServerPost, type ServerReply, type ServerUserPost, type PaginationOptions, type PaginatedWatchingPostsResponse, type PaginatedPostsResponse, type PaginatedUsersResponse, type PaginatedRepliesResponse, type PaginatedCommentsResponse } from '@/models/types';

export const useKaspaPostsApi = () => {
  const { selectedNetwork, getNetworkRPCId, apiBaseUrl } = useUserSettings();

  const networkAwareConvertServerPostsToClientPosts = useCallback(async (
    serverPosts: ServerPost[], 
    currentUserPubkey?: string
  ): Promise<Post[]> => {
    return convertServerPostsToClientPosts(serverPosts, currentUserPubkey, getNetworkRPCId(selectedNetwork));
  }, [selectedNetwork, getNetworkRPCId]);

  const networkAwareConvertServerRepliesToClientPosts = useCallback(async (
    serverReplies: ServerReply[], 
    currentUserPubkey?: string
  ): Promise<Post[]> => {
    return convertServerRepliesToClientPosts(serverReplies, currentUserPubkey, getNetworkRPCId(selectedNetwork));
  }, [selectedNetwork, getNetworkRPCId]);

  const networkAwareConvertServerUserPostsToClientPosts = useCallback(async (
    serverUserPosts: ServerUserPost[], 
    currentUserPubkey?: string
  ): Promise<Post[]> => {
    return convertServerUserPostsToClientPosts(serverUserPosts, currentUserPubkey, getNetworkRPCId(selectedNetwork));
  }, [selectedNetwork, getNetworkRPCId]);

  const fetchAndConvertMyPosts = useCallback(async (userPublicKey: string, currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedPostsResponse['pagination'] }> => {
    try {
      const response = await fetchMyPosts(userPublicKey, currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchMyPosts returned null/undefined response');
        throw new Error('No response from fetchMyPosts');
      }
      
      if (!response.pagination) {
        console.error('fetchMyPosts response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const posts = response.posts || [];
      // Pass the actual current user's pubkey, not the post author's pubkey
      const convertedPosts = await networkAwareConvertServerPostsToClientPosts(posts, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertMyPosts:', error);
      throw error;
    }
  }, [networkAwareConvertServerPostsToClientPosts, apiBaseUrl]);

  const fetchAndConvertFollowingPosts = useCallback(async (currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedPostsResponse['pagination'] }> => {
    const response = await fetchFollowingPosts(currentUserPubkey, options, apiBaseUrl);
    const convertedPosts = await networkAwareConvertServerPostsToClientPosts(response.posts, currentUserPubkey);
    return {
      posts: convertedPosts,
      pagination: response.pagination
    };
  }, [networkAwareConvertServerPostsToClientPosts, apiBaseUrl]);

  const fetchAndConvertWatchingPosts = useCallback(async (currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedWatchingPostsResponse['pagination'] }> => {
    try {
      const response = await fetchWatchingPosts(currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchWatchingPosts returned null/undefined response');
        throw new Error('No response from fetchWatchingPosts');
      }
      
      if (!response.pagination) {
        console.error('fetchWatchingPosts response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const posts = response.posts || [];
      const convertedPosts = await networkAwareConvertServerPostsToClientPosts(posts, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertWatchingPosts:', error);
      throw error;
    }
  }, [networkAwareConvertServerPostsToClientPosts, apiBaseUrl]);

  const fetchAndConvertMentions = useCallback(async (userPublicKey: string, currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedPostsResponse['pagination'] }> => {
    try {
      const response = await fetchMentions(userPublicKey, currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchMentions returned null/undefined response');
        throw new Error('No response from fetchMentions');
      }
      
      if (!response.pagination) {
        console.error('fetchMentions response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const posts = response.posts || [];
      // Pass the actual current user's pubkey, not the mentioned user's pubkey
      const convertedPosts = await networkAwareConvertServerPostsToClientPosts(posts, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertMentions:', error);
      throw error;
    }
  }, [networkAwareConvertServerPostsToClientPosts, apiBaseUrl]);

  const fetchAndConvertUsers = useCallback(async (currentUserPubkey?: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedUsersResponse['pagination'] }> => {
    try {
      const response = await fetchUsers(options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchUsers returned null/undefined response');
        throw new Error('No response from fetchUsers');
      }
      
      if (!response.pagination) {
        console.error('fetchUsers response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const posts = response.posts || [];
      const convertedPosts = await networkAwareConvertServerUserPostsToClientPosts(posts, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertUsers:', error);
      throw error;
    }
  }, [networkAwareConvertServerUserPostsToClientPosts, apiBaseUrl]);

  const fetchAndConvertPostDetails = useCallback(async (postId: string, currentUserPubkey: string): Promise<Post> => {
    try {
      const response = await fetchPostDetails(postId, currentUserPubkey, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchPostDetails returned null/undefined response');
        throw new Error('No response from fetchPostDetails');
      }
      
      if (!response.post) {
        console.error('fetchPostDetails response missing post:', response);
        throw new Error('Response missing post data');
      }

      const convertedPost = await convertServerPostToClientPost(response.post, currentUserPubkey, getNetworkRPCId(selectedNetwork));
      
      return convertedPost;
    } catch (error) {
      console.error('Error in fetchAndConvertPostDetails:', error);
      throw error;
    }
  }, [apiBaseUrl, selectedNetwork, getNetworkRPCId]);

  const fetchAndConvertPostReplies = useCallback(async (postId: string, currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedRepliesResponse['pagination'] }> => {
    try {
      const response = await fetchPostReplies(postId, currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchPostReplies returned null/undefined response');
        throw new Error('No response from fetchPostReplies');
      }
      
      if (!response.pagination) {
        console.error('fetchPostReplies response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const replies = response.replies || [];
      const convertedPosts = await networkAwareConvertServerRepliesToClientPosts(replies, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertPostReplies:', error);
      throw error;
    }
  }, [networkAwareConvertServerRepliesToClientPosts, apiBaseUrl]);

  const fetchAndConvertPostComments = useCallback(async (postId: string, currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedCommentsResponse['pagination'] }> => {
    try {
      const response = await fetchPostComments(postId, currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchPostComments returned null/undefined response');
        throw new Error('No response from fetchPostComments');
      }
      
      if (!response.pagination) {
        console.error('fetchPostComments response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const replies = response.replies || [];
      const convertedPosts = await networkAwareConvertServerRepliesToClientPosts(replies, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertPostComments:', error);
      throw error;
    }
  }, [networkAwareConvertServerRepliesToClientPosts, apiBaseUrl]);

  const fetchAndConvertUserReplies = useCallback(async (userPublicKey: string, currentUserPubkey: string, options?: PaginationOptions): Promise<{ posts: Post[], pagination: PaginatedRepliesResponse['pagination'] }> => {
    try {
      const response = await fetchUserReplies(userPublicKey, currentUserPubkey, options, apiBaseUrl);
      
      // Defensive check for response structure
      if (!response) {
        console.error('fetchUserReplies returned null/undefined response');
        throw new Error('No response from fetchUserReplies');
      }
      
      if (!response.pagination) {
        console.error('fetchUserReplies response missing pagination:', response);
        throw new Error('Response missing pagination data');
      }

      const replies = response.replies || [];
      const convertedPosts = await networkAwareConvertServerRepliesToClientPosts(replies, currentUserPubkey);
      
      return {
        posts: convertedPosts,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error in fetchAndConvertUserReplies:', error);
      throw error;
    }
  }, [networkAwareConvertServerRepliesToClientPosts, apiBaseUrl]);

  // Create bound versions of the raw API functions with apiBaseUrl pre-filled
  const boundFetchMyPosts = useCallback((userPublicKey: string, requesterPubkey: string, options?: PaginationOptions) => 
    fetchMyPosts(userPublicKey, requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchFollowingPosts = useCallback((requesterPubkey: string, options?: PaginationOptions) => 
    fetchFollowingPosts(requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchWatchingPosts = useCallback((requesterPubkey: string, options?: PaginationOptions) => 
    fetchWatchingPosts(requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchMentions = useCallback((userPublicKey: string, requesterPubkey: string, options?: PaginationOptions) => 
    fetchMentions(userPublicKey, requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchUsers = useCallback((options?: PaginationOptions) => 
    fetchUsers(options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchPostDetails = useCallback((postId: string, requesterPubkey: string) => 
    fetchPostDetails(postId, requesterPubkey, apiBaseUrl), [apiBaseUrl]);
  const boundFetchPostReplies = useCallback((postId: string, requesterPubkey: string, options?: PaginationOptions) => 
    fetchPostReplies(postId, requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchUserReplies = useCallback((userPublicKey: string, requesterPubkey: string, options?: PaginationOptions) => 
    fetchUserReplies(userPublicKey, requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);
  const boundFetchPostComments = useCallback((postId: string, requesterPubkey: string, options?: PaginationOptions) => 
    fetchPostComments(postId, requesterPubkey, options, apiBaseUrl), [apiBaseUrl]);

  return {
    // Core API functions (all paginated) - bound with current apiBaseUrl
    fetchMyPosts: boundFetchMyPosts,
    fetchFollowingPosts: boundFetchFollowingPosts,
    fetchWatchingPosts: boundFetchWatchingPosts,
    fetchMentions: boundFetchMentions,
    fetchUsers: boundFetchUsers,
    fetchPostDetails: boundFetchPostDetails,
    fetchPostReplies: boundFetchPostReplies,
    fetchUserReplies: boundFetchUserReplies,
    fetchPostComments: boundFetchPostComments,
    
    // Enhanced conversion functions with network awareness (all paginated)
    fetchAndConvertMyPosts,
    fetchAndConvertFollowingPosts,
    fetchAndConvertWatchingPosts,
    fetchAndConvertMentions,
    fetchAndConvertUsers,
    fetchAndConvertPostDetails,
    fetchAndConvertPostReplies,
    fetchAndConvertUserReplies,
    fetchAndConvertPostComments,
    
    // Network info
    selectedNetwork,
    networkId: getNetworkRPCId(selectedNetwork),
    
    // API URL for reference
    apiBaseUrl
  };
};