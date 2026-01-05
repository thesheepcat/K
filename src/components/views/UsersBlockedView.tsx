import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserPostCard from '../general/UserPostCard';
import { type Post } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';

interface UsersBlockedViewProps {
  posts: Post[];
  onServerPostsUpdate: (posts: Post[]) => void;
}

const POLLING_INTERVAL = 10000; // 10 seconds

const UsersBlockedView: React.FC<UsersBlockedViewProps> = ({ posts, onServerPostsUpdate }) => {
    const navigate = useNavigate();
    const { publicKey } = useAuth();
    const { fetchAndConvertBlockedUsers, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const fetchFunctionRef = useRef(fetchAndConvertBlockedUsers);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  fetchFunctionRef.current = fetchAndConvertBlockedUsers;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

const loadBlockedUsers = useCallback(async (reset: boolean = true) => {
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
        // Append new posts to existing ones, filtering out duplicates
        const existingPostIds = new Set(postsRef.current.map(post => post.id));
        const newPosts = (response.posts || []).filter(post => !existingPostIds.has(post.id));

        // If no new posts were found but API says there are more, we might be in a duplicate situation
        if (newPosts.length === 0 && response.pagination.hasMore) {
          console.warn('No new posts found despite hasMore=true, possible duplicate API response');
        }

        const updatedPosts = [...postsRef.current, ...newPosts];
        onServerPostsUpdateRef.current(updatedPosts);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load blocked users');
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []); // Remove dependencies to prevent recreation

const loadMoreBlockedUsers = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMoreRef.current) return;
    await loadBlockedUsers(false);
  }, [loadBlockedUsers]);

  // Load blocked users on component mount and when network or apiBaseUrl changes
  useEffect(() => {
    if (publicKey) {
      // Use setTimeout to make this non-blocking
      setTimeout(() => loadBlockedUsers(true), 0);
    }
  }, [publicKey, selectedNetwork, apiBaseUrl]);

  // Auto-refresh every 30 seconds (less aggressive to avoid interfering with infinite scroll)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if user is near the top to avoid disrupting infinite scroll
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && scrollContainer.scrollTop < 100) {
        loadBlockedUsers(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadBlockedUsers]);

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
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blocked users';
          setError(errorMessage);
          console.error('Error fetching blocked users from server:', err);
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

      // Check if content doesn't fill the container (no scrollable area) or if near bottom
      const contentTooShort = scrollHeight <= clientHeight;
      const shouldLoadMore = contentTooShort || distanceFromBottom < 300;

      if (shouldLoadMore && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMoreBlockedUsers();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Note: Height check moved to separate effect that triggers when posts change

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreBlockedUsers]);

  // Check if content fills container whenever posts change
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || posts.length === 0) return;

    const checkContentHeight = () => {
      const { scrollHeight, clientHeight } = scrollContainer;
      const needsMoreContent = scrollHeight <= clientHeight + 50;

      if (needsMoreContent && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMoreBlockedUsers();
      }
    };

    // Check after a delay to allow for DOM updates
    const timeoutId = setTimeout(checkContentHeight, 100);

    return () => clearTimeout(timeoutId);
  }, [posts, loadMoreBlockedUsers]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full" data-main-content>
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Blocked</h1>
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
            <p className="text-muted-foreground">Loading blocked users...</p>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            No blocked users found.
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <UserPostCard
                key={post.id}
                post={post}
                showUnblockButton={true}
                onUnblock={(userPubkey) => {
                  // Optimistically remove the user from the blocked list
                  // The real update will come from the next polling cycle
                  const updatedPosts = posts.filter(p => p.author.pubkey !== userPubkey);
                  onServerPostsUpdate(updatedPosts);
                }}
              />
            ))}

            {/* Auto-load more content when scrolling near bottom */}
            {hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more blocked users...</p>
              </div>
            )}

            {/* End of posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No more blocked users to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersBlockedView;