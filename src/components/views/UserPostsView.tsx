import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '../general/PostCard';
import UserDetailsDialog from '../dialogs/UserDetailsDialog';
import { type Post } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';
import { generateAuthorInfo, truncateKaspaAddress } from '@/utils/postUtils';

interface UserPostsViewProps {
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const UserPostsView: React.FC<UserPostsViewProps> = ({ onUpVote, onDownVote, onRepost }) => {
  const { userPubkey } = useParams<{ userPubkey: string }>();
  const navigate = useNavigate();
  const { publicKey } = useAuth();
  const { fetchAndConvertMyPosts, selectedNetwork, networkId, apiBaseUrl } = useKaspaPostsApi();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{
    name: string;
    username: string;
    avatar: string;
    pubkey: string;
    nickname?: string;
    profileImage?: string;
  } | null>(null);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store the latest values to avoid dependency issues
  const fetchFunctionRef = useRef(fetchAndConvertMyPosts);
  const publicKeyRef = useRef(publicKey);
  const userPubkeyRef = useRef(userPubkey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const setPostsRef = useRef(setPosts);

  // Update refs when values change
  fetchFunctionRef.current = fetchAndConvertMyPosts;
  publicKeyRef.current = publicKey;
  userPubkeyRef.current = userPubkey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  setPostsRef.current = setPosts;

  // Generate author info for display (same format as PostCard)
  useEffect(() => {
    const generateUserAuthorInfo = async () => {
      if (userPubkey && networkId) {
        const info = await generateAuthorInfo(userPubkey, publicKey ?? undefined, networkId);
        setAuthorInfo(info);
      }
    };
    generateUserAuthorInfo();
  }, [userPubkey, networkId, publicKey]);

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
      
      setLastFetchTime(new Date());
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

          // Only update if we got new posts (compare with first post timestamp)
          if ((response.posts || []).length > 0 && postsRef.current.length > 0) {
            const newestExistingTimestamp = postsRef.current[0]?.timestamp;
            const newestServerPost = response.posts[0];
            
            if (newestServerPost && newestServerPost.timestamp !== newestExistingTimestamp) {
              // Reset the list with fresh data from server
              setPostsRef.current(response.posts || []);
              setHasMore(response.pagination.hasMore);
              setNextCursor(response.pagination.nextCursor);
            }
          } else if (postsRef.current.length === 0) {
            // If no posts exist locally, update with server data
            setPostsRef.current(response.posts || []);
            setHasMore(response.pagination.hasMore);
            setNextCursor(response.pagination.nextCursor);
          }
          
          setLastFetchTime(new Date());
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

  // Handle case where userPubkey is missing
  if (!userPubkey) {
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
  const isCurrentUser = publicKey === userPubkey;

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
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {isCurrentUser ? 'My posts' : `${authorInfo?.name || 'Loading...'}'s posts`}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {authorInfo?.username && (
                <span 
                  className="text-sm sm:text-lg text-muted-foreground truncate hover:underline cursor-pointer"
                  onClick={() => setShowUserDetailsDialog(true)}
                  title="Click to view user details"
                >
                  @{truncateKaspaAddress(authorInfo.username, 6, 6)}
                </span>
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle"></div>
              )}
              {lastFetchTime && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Updated: {lastFetchTime.toLocaleTimeString()}
                </span>
              )}
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
        {posts.length === 0 && !isLoading ? (
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
          displayName={authorInfo.name}
          userNickname={authorInfo.nickname}
          onNavigateToUserPosts={
            // Show button if viewing another user's posts, hide if viewing own posts
            !isCurrentUser ? () => navigate(`/user/${userPubkey}`) : undefined
          }
        />
      )}
    </div>
  );
};

export default UserPostsView;