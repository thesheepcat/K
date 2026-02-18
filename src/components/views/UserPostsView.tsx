import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostCard from '../general/PostCard';
import UserDetailsDialog from '../dialogs/UserDetailsDialog';
import { type Post } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';
import { useJdenticonAvatar } from '@/hooks/useJdenticonAvatar';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import { generateAuthorInfo } from '@/utils/postUtils';
import { Base64 } from 'js-base64';
import { toast } from 'sonner';
import { getExplorerTransactionUrl } from '@/utils/explorerUtils';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { LinkifiedText } from '@/utils/linkUtils';

interface UserPostsViewProps {
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const UserPostsView: React.FC<UserPostsViewProps> = ({ onUpVote, onDownVote, onRepost }) => {
  const { userPubkey } = useParams<{ userPubkey: string }>();
  const location = useLocation();
  
  // Handle pubkeys (decode URL encoding)
  const userIdentifier = userPubkey ? decodeURIComponent(userPubkey) : '';
  const navigate = useNavigate();
  
  // Check if this navigation came from a mention click
  const isFromMention = location.state?.fromMention === true;
  const { publicKey, privateKey } = useAuth();
  const { fetchAndConvertMyPosts, fetchUserDetails, networkId, apiBaseUrl } = useKaspaPostsApi();
  const { sendTransaction } = useKaspaTransactions();
  const { selectedNetwork, showSuccessNotifications } = useUserSettings();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [authorInfo, setAuthorInfo] = useState<{
    name: string;
    username: string;
    avatar: string;
    pubkey: string;
    nickname?: string;
    profileImage?: string;
  } | null>(null);
  const [userDetails, setUserDetails] = useState<{
    id: string;
    userPublicKey: string;
    postContent: string;
    signature: string;
    timestamp: number;
    userNickname?: string;
    userProfileImage?: string;
    blockedUser: boolean;
    followedUser: boolean;
    followersCount: number;
    followingCount: number;
  } | null>(null);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store the latest values to avoid dependency issues
  const fetchFunctionRef = useRef(fetchAndConvertMyPosts);
  const publicKeyRef = useRef(publicKey);
  const userPubkeyRef = useRef(userIdentifier);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const setPostsRef = useRef(setPosts);

  // Update refs when values change
  fetchFunctionRef.current = fetchAndConvertMyPosts;
  publicKeyRef.current = publicKey;
  userPubkeyRef.current = userIdentifier;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  setPostsRef.current = setPosts;

  // Generate author info for display (same format as PostCard)
  useEffect(() => {
    const generateUserAuthorInfo = async () => {
      if (userIdentifier && networkId) {
        const info = await generateAuthorInfo(userIdentifier, publicKey ?? undefined, networkId);
        setAuthorInfo(info);
      }
    };
    generateUserAuthorInfo();
  }, [userIdentifier, networkId, publicKey]);

  // Fetch user details from get-user-details API with 10-second polling
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchUserDetailsData = async () => {
      if (userIdentifier && publicKey) {
        try {
          const details = await fetchUserDetails(userIdentifier, publicKey);
          setUserDetails(details);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      }
    };

    // Initial fetch
    fetchUserDetailsData();

    // Set up polling every 10 seconds
    if (userIdentifier && publicKey) {
      interval = setInterval(fetchUserDetailsData, 10000);
    }

    // Cleanup interval on unmount or dependency change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdentifier, publicKey]); // fetchUserDetails intentionally omitted to prevent infinite re-renders

const loadUserPosts = useCallback(async (reset: boolean = true) => {
    if (!userPubkeyRef.current) return;

    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const options = {
        limit: 10,
        ...(reset ? {} : { before: nextCursorRef.current })
      };
      
      // Use the same API endpoint as "My Posts" but with the specific user's pubkey
      // Pass the current user's public key for proper "You" display logic
      const response = await fetchFunctionRef.current(userPubkeyRef.current, publicKeyRef.current ?? '', options);
      
      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      if (reset) {
        setPostsRef.current(response.posts || []);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      } else {
        // Append new posts to existing ones
        const updatedPosts = [...postsRef.current, ...(response.posts || [])];
        setPostsRef.current(updatedPosts);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user posts');
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []); // Remove dependencies to prevent recreation

const loadMorePosts = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMoreRef.current) return;
    await loadUserPosts(false);
  }, [loadUserPosts]);

  // Load posts on component mount and when userPubkey, network, or apiBaseUrl changes
  useEffect(() => {
    if (userPubkey) {
      // Use setTimeout to make this non-blocking
      setTimeout(() => loadUserPosts(true), 0);
    }
  }, [userPubkey, selectedNetwork, apiBaseUrl]);

  // Auto-refresh every 30 seconds (less aggressive to avoid interfering with infinite scroll)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if user is near the top to avoid disrupting infinite scroll
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && scrollContainer.scrollTop < 100) {
        loadUserPosts(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadUserPosts]);

  // Set up polling with stable references
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(async () => {
        // Check if we still have a userPubkey
        if (!userPubkeyRef.current) return;

        try {
          const options = {
            limit: 10
          };

          const response = await fetchFunctionRef.current(userPubkeyRef.current, publicKeyRef.current ?? '', options);

          // Defensive check for response structure
          if (!response || !response.pagination) {
            console.error('Invalid polling response structure:', response);
            return;
          }

          // Check if server data has any changes compared to local data
          const serverPosts = response.posts || [];
          const localPosts = postsRef.current;

          let hasChanges = false;

          // Check if post count differs
          if (serverPosts.length !== localPosts.length) {
            hasChanges = true;
          } else {
            // Compare each post for changes in vote counts, timestamps, or other properties
            for (let i = 0; i < Math.min(serverPosts.length, localPosts.length); i++) {
              const serverPost = serverPosts[i];
              const localPost = localPosts[i];

              if (
                serverPost.id !== localPost.id ||
                serverPost.upVotes !== localPost.upVotes ||
                serverPost.downVotes !== localPost.downVotes ||
                serverPost.replies !== localPost.replies ||
                serverPost.reposts !== localPost.reposts ||
                serverPost.timestamp !== localPost.timestamp ||
                serverPost.upVoted !== localPost.upVoted ||
                serverPost.downVoted !== localPost.downVoted ||
                serverPost.reposted !== localPost.reposted
              ) {
                hasChanges = true;
                break;
              }
            }
          }

          if (hasChanges) {
            // Only update the first page of posts to preserve infinite scroll state
            const currentPosts = postsRef.current;

            if (currentPosts.length <= 10) {
              // If we only have first page loaded, replace all
              setPostsRef.current(serverPosts);
              setHasMore(response.pagination.hasMore);
              setNextCursor(response.pagination.nextCursor);
            } else {
              // If we have more than first page, only update the first 10 posts
              // to preserve the user's scroll position and additional loaded content
              const updatedPosts = [
                ...serverPosts.slice(0, Math.min(serverPosts.length, 10)),
                ...currentPosts.slice(10)
              ];
              setPostsRef.current(updatedPosts);
              // Don't update pagination state as it would affect infinite scroll
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user posts';
          setError(errorMessage);
          console.error('Error fetching user posts from server:', err);
        }
      }, POLLING_INTERVAL);
    };

    // Only start polling if we have a userPubkey
    if (userPubkeyRef.current) {
      startPolling();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, apiBaseUrl]);

  // Single scroll-based infinite scroll mechanism (works on both desktop and mobile)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const shouldLoadMore = distanceFromBottom < 300; // Load when within 300px of bottom

      if (shouldLoadMore && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMorePosts();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMorePosts]);

  const handleBlock = async () => {
    if (!privateKey || !userIdentifier || isSubmittingBlock) return;

    try {
      setIsSubmittingBlock(true);

      // Determine the action based on current blocked state
      const action = userDetails?.blockedUser ? 'unblock' : 'block';

      // Send block transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for blocking actions
        type: 'block' as any, // Cast as any since it's a new type
        blockingAction: action,
        blockedUserPubkey: userIdentifier
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success(`${action === 'block' ? 'Block' : 'Unblock'} transaction successful!`, {
            description: (
              <div className="space-y-2">
                <div>Transaction ID: {result.id}</div>
                <div>Fees: {result.feeAmount.toString()} sompi</div>
                <div>Fees: {result.feeKAS} KAS</div>
                <button
                  onClick={() => window.open(getExplorerTransactionUrl(result.id, selectedNetwork), '_blank')}
                  className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Open explorer
                </button>
              </div>
            ),
            duration: 5000
          });
        }

        // Optimistically update the UI
        setUserDetails(prev => prev ? { ...prev, blockedUser: !prev.blockedUser } : null);
      }
    } catch (error) {
      console.error(`Error submitting ${userDetails?.blockedUser ? 'unblock' : 'block'}:`, error);
      toast.error(`Error submitting ${userDetails?.blockedUser ? 'unblock' : 'block'}`, {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleFollow = async () => {
    if (!privateKey || !userIdentifier || isSubmittingFollow) return;

    try {
      setIsSubmittingFollow(true);

      // Determine the action based on current followed state
      const action = userDetails?.followedUser ? 'unfollow' : 'follow';

      // Send follow transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for following actions
        type: 'follow' as any, // Cast as any since it's a new type
        followingAction: action,
        followedUserPubkey: userIdentifier
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success(`${action === 'follow' ? 'Follow' : 'Unfollow'} transaction successful!`, {
            description: (
              <div className="space-y-2">
                <div>Transaction ID: {result.id}</div>
                <div>Fees: {result.feeAmount.toString()} sompi</div>
                <div>Fees: {result.feeKAS} KAS</div>
                <button
                  onClick={() => window.open(getExplorerTransactionUrl(result.id, selectedNetwork), '_blank')}
                  className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Open explorer
                </button>
              </div>
            ),
            duration: 5000
          });
        }

        // Optimistically update the UI
        setUserDetails(prev => prev ? { ...prev, followedUser: !prev.followedUser } : null);
      }
    } catch (error) {
      console.error(`Error submitting ${userDetails?.followedUser ? 'unfollow' : 'follow'}:`, error);
      toast.error(`Error submitting ${userDetails?.followedUser ? 'unfollow' : 'follow'}`, {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate('/search-contents', {
      state: { initialHashtag: hashtag }
    });
  };

  // Generate dynamic avatar (must be called before any early returns)
  const jdenticonAvatar = useJdenticonAvatar(userIdentifier || '', 48);

  // Handle case where userPubkey is missing
  if (!userIdentifier) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold">Error</h1>
          </div>
          <div className="text-center px-4">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Invalid user public key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get display info from generated author info
  // Check if this is the current user's profile
  const isCurrentUser = publicKey === userIdentifier;

  // Decode userNickname and postContent from userDetails
  const decodedNickname = userDetails?.userNickname ? (() => {
    try {
      return Base64.decode(userDetails.userNickname);
    } catch (error) {
      console.error('Error decoding userNickname:', error);
      return undefined;
    }
  })() : undefined;

  const decodedPostContent = userDetails?.postContent ? (() => {
    try {
      return Base64.decode(userDetails.postContent);
    } catch (error) {
      console.error('Error decoding postContent:', error);
      return undefined;
    }
  })() : undefined;

  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = userDetails?.userProfileImage
    ? `data:image/png;base64,${userDetails.userProfileImage}`
    : jdenticonAvatar;

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header with back button */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-start space-x-3 mb-4">
            <Avatar
              className="h-12 w-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowUserDetailsDialog(true)}
            >
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {(decodedNickname || authorInfo?.name || 'U').split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {isCurrentUser ? 'My posts' : `${decodedNickname || authorInfo?.name || 'Loading...'}`}
                  </h1>
                  {decodedPostContent && (
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      <LinkifiedText onHashtagClick={handleHashtagClick} maxImages={0} maxVideos={0}>{decodedPostContent}</LinkifiedText>
                    </div>
                  )}
                  {userDetails && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <div className="flex gap-1">
                        <span className="font-semibold text-foreground">{userDetails.followingCount}</span>
                        <span
                          className="text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => navigate(`/users-following/${encodeURIComponent(userIdentifier)}`)}
                        >
                          Following
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <span className="font-semibold text-foreground">{userDetails.followersCount}</span>
                        <span
                          className="text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => navigate(`/users-followers/${encodeURIComponent(userIdentifier)}`)}
                        >
                          Followers
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!isCurrentUser && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSubmittingBlock || !privateKey}
                        onClick={handleBlock}
                        className={
                          userDetails?.blockedUser
                            ? 'text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground'
                            : 'text-foreground border-border hover:bg-muted hover:text-foreground'
                        }
                      >
                        {isSubmittingBlock && (
                          <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-1"></div>
                        )}
                        {userDetails?.blockedUser ? 'Unblock' : 'Block'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSubmittingFollow || !privateKey}
                        onClick={handleFollow}
                        className={
                          userDetails?.followedUser
                            ? 'text-primary border-primary hover:bg-primary hover:text-primary-foreground'
                            : 'text-foreground border-border hover:bg-muted hover:text-foreground'
                        }
                      >
                        {isSubmittingFollow && (
                          <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-1"></div>
                        )}
                        {userDetails?.followedUser ? 'Unfollow' : 'Follow'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll" 
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Show only loading state when coming from mention click and still loading */}
        {isFromMention && isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-transparent rounded-full animate-loader-circle mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user posts...</p>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            {isCurrentUser ? 'No posts found. Create your first post!' : 'This user has no posts yet.'}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpVote={onUpVote}
                onDownVote={onDownVote}
                onRepost={onRepost}
                context="list"
              />
            ))}
            
            {/* Auto-load more content when scrolling near bottom */}
            {hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more posts...</p>
              </div>
            )}
            
            {/* End of posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No more posts to load
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Dialog */}
      {authorInfo && (
        <UserDetailsDialog
          isOpen={showUserDetailsDialog}
          onClose={() => setShowUserDetailsDialog(false)}
          userPubkey={userPubkey || ''}
          userAddress={authorInfo.username}
          userNickname={decodedNickname || authorInfo.nickname}
          onNavigateToUserPosts={
            // Show button if viewing another user's posts, hide if viewing own posts
            !isCurrentUser ? () => navigate(`/user/${encodeURIComponent(userIdentifier)}`) : undefined
          }
        />
      )}
    </div>
  );
};

export default UserPostsView;