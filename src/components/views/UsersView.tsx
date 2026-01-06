import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserPostCard from '../general/UserPostCard';
import { type Post } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';

interface UsersViewProps {
  posts: Post[];
  onServerPostsUpdate: (posts: Post[]) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const UsersView: React.FC<UsersViewProps> = ({ posts, onServerPostsUpdate }) => {
      const navigate = useNavigate();
      const { publicKey } = useAuth();
      const { fetchAndConvertUsers, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [usersCount, setUsersCount] = useState<number | null>(null);
    const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const fetchFunctionRef = useRef(fetchAndConvertUsers);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  fetchFunctionRef.current = fetchAndConvertUsers;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  // Function to fetch users count
  const fetchUsersCount = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/get-users-count`);
      if (!response.ok) {
        throw new Error('Failed to fetch users count');
      }
      const data = await response.json();
      setUsersCount(data.count);
      setIsLoadingCount(false);
    } catch (error) {
      console.error('Error fetching users count:', error);
      setIsLoadingCount(false);
    }
  }, [apiBaseUrl]);

const loadUsers = useCallback(async (reset: boolean = true) => {
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

      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }
      const response = await fetchFunctionRef.current(publicKeyRef.current, options);
      
      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      if (reset) {
        onServerPostsUpdateRef.current(response.posts || []);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      } else {
        // Append new posts to existing ones
        const updatedPosts = [...postsRef.current, ...(response.posts || [])];
        onServerPostsUpdateRef.current(updatedPosts);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []); // Remove dependencies to prevent recreation

const loadMoreUsers = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMoreRef.current) return;
    await loadUsers(false);
  }, [loadUsers]);

  // Load users on component mount and when network or apiBaseUrl changes
  useEffect(() => {
    if (publicKey) {
      // Use setTimeout to make this non-blocking
      setTimeout(() => loadUsers(true), 0);
    }
  }, [publicKey, selectedNetwork, apiBaseUrl]);

  // Fetch users count on mount and poll every 30 seconds
  useEffect(() => {
    // Initial fetch
    fetchUsersCount();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchUsersCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUsersCount]);

  // Auto-refresh every 30 seconds (less aggressive to avoid interfering with infinite scroll)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if user is near the top to avoid disrupting infinite scroll
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && scrollContainer.scrollTop < 100) {
        loadUsers(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadUsers]);

  // Set up polling with stable references
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          const options = {
            limit: 10
          };

          if (!publicKeyRef.current) {
            console.error('User not authenticated for polling');
            return;
          }
          const response = await fetchFunctionRef.current(publicKeyRef.current, options);
          
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
            // Compare each post for changes in timestamps or other properties
            for (let i = 0; i < Math.min(serverPosts.length, localPosts.length); i++) {
              const serverPost = serverPosts[i];
              const localPost = localPosts[i];
              
              if (
                serverPost.id !== localPost.id ||
                serverPost.timestamp !== localPost.timestamp ||
                serverPost.content !== localPost.content
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
              onServerPostsUpdateRef.current(serverPosts);
              setHasMore(response.pagination.hasMore);
              setNextCursor(response.pagination.nextCursor);
            } else {
              // If we have more than first page, only update the first 10 posts
              // to preserve the user's scroll position and additional loaded content
              const updatedPosts = [
                ...serverPosts.slice(0, Math.min(serverPosts.length, 10)),
                ...currentPosts.slice(10)
              ];
              onServerPostsUpdateRef.current(updatedPosts);
              // Don't update pagination state as it would affect infinite scroll
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
          setError(errorMessage);
          console.error('Error fetching users from server:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

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
        loadMoreUsers();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreUsers]);

  // Check if content fills the container and load more if needed
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading) return;

    const checkAndLoadMore = () => {
      const { scrollHeight, clientHeight } = scrollContainer;
      const hasScrollbar = scrollHeight > clientHeight;

      // If there's no scrollbar and we have more content to load, load it
      if (!hasScrollbar && hasMoreRef.current && !isLoadingMoreRef.current && posts.length > 0) {
        loadMoreUsers();
      }
    };

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkAndLoadMore, 100);

    return () => clearTimeout(timeoutId);
  }, [posts, isLoading, loadMoreUsers]);

  const handleFollow = (userPubkey: string) => {
    // Optimistically update the UI
    const updatedPosts = posts.map(post =>
      post.author.pubkey === userPubkey
        ? { ...post, followedUser: true }
        : post
    );
    onServerPostsUpdate(updatedPosts);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full" data-main-content>
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-accent rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Users</h1>
                {isLoadingCount ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : usersCount !== null ? (
                  <span className="text-xl font-bold">({usersCount.toLocaleString()})</span>
                ) : null}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search-users')}
              className="p-2 hover:bg-accent rounded-full"
              title="Search users"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll" 
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {isLoading && posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-transparent rounded-full animate-loader-circle mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            No user introductions found. Be the first to introduce yourself!
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <UserPostCard
                key={post.id}
                post={post}
                showFollowButton={true}
                onFollow={handleFollow}
              />
            ))}

            {/* Auto-load more content when scrolling near bottom */}
            {hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more users...</p>
              </div>
            )}
            
            {/* End of posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No more users to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersView;