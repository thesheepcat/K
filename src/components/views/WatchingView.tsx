import React, { useEffect, useState, useCallback, useRef } from 'react';
import PostCard from '../general/PostCard';
import { type Post, type PaginationOptions } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';

interface WatchingProps {
  posts: Post[];
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
  onServerPostsUpdate: (posts: Post[]) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const Watching: React.FC<WatchingProps> = ({ posts, onUpVote, onDownVote, onRepost, onServerPostsUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [hasNewer, setHasNewer] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const { publicKey } = useAuth();
  const { fetchAndConvertWatchingPosts, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();

  // Bidirectional pagination
  const initialLoadDone = useRef(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const fetchFunctionRef = useRef(fetchAndConvertWatchingPosts);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const prevCursorRef = useRef(prevCursor);
  const hasMoreRef = useRef(hasMore);
  const hasNewerRef = useRef(hasNewer);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const isLoadingNewerRef = useRef(isLoadingNewer);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  fetchFunctionRef.current = fetchAndConvertWatchingPosts;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  prevCursorRef.current = prevCursor;
  hasMoreRef.current = hasMore;
  hasNewerRef.current = hasNewer;
  isLoadingMoreRef.current = isLoadingMore;
  isLoadingNewerRef.current = isLoadingNewer;

  const loadPosts = useCallback(async (reset: boolean = true, startFromTimestamp?: string) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const options: PaginationOptions = {
        limit: 10,
        ...(startFromTimestamp ? { before: startFromTimestamp } : reset ? {} : { before: nextCursorRef.current })
      };

      console.log('[WatchingView] Loading posts with options:', options);

      const response = await fetchFunctionRef.current(publicKeyRef.current || '', options);

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      if (reset) {
        console.log('[WatchingView] Loaded', response.posts?.length, 'posts. First post timestamp:', response.posts?.[0]?.timestamp);
        onServerPostsUpdateRef.current(response.posts || []);
        setNextCursor(response.pagination.nextCursor);
        setPrevCursor(response.pagination.prevCursor);
        setHasMore(response.pagination.hasMore);
        setHasNewer(!!response.pagination.prevCursor);
      } else {
        // Append older posts to existing ones
        const updatedPosts = [...postsRef.current, ...(response.posts || [])];
        onServerPostsUpdateRef.current(updatedPosts);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch watching posts';
      setError(errorMessage);
      console.error('Error fetching watching posts from server:', err);
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []); // Remove dependencies to prevent recreation

  const loadMorePosts = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMoreRef.current) {
      return;
    }

    await loadPosts(false);
  }, [loadPosts]);

  const loadNewerPosts = useCallback(async () => {
    if (!hasNewerRef.current || isLoadingNewerRef.current) {
      return;
    }

    try {
      setIsLoadingNewer(true);

      const options: PaginationOptions = {
        limit: 10,
        after: prevCursorRef.current || undefined
      };

      const response = await fetchFunctionRef.current(publicKeyRef.current || '', options);

      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Prepend newer posts to existing ones
      const updatedPosts = [...(response.posts || []), ...postsRef.current];
      onServerPostsUpdateRef.current(updatedPosts);
      setPrevCursor(response.pagination.prevCursor);
      setHasNewer(!!response.pagination.prevCursor);
    } catch (err) {
      console.error('Error loading newer posts:', err);
    } finally {
      setIsLoadingNewer(false);
    }
  }, []);

// Load posts on component mount and when network or apiBaseUrl changes
  useEffect(() => {
    if (publicKey && !initialLoadDone.current) {
      initialLoadDone.current = true;

      // Check if we should return to a specific timestamp
      const returnToTimestamp = sessionStorage.getItem('watchingView_returnToTimestamp');

      if (returnToTimestamp) {
        console.log('[WatchingView] Returning to timestamp:', returnToTimestamp);
        sessionStorage.removeItem('watchingView_returnToTimestamp');
        // Load posts starting from the saved timestamp
        // Add 1ms to the timestamp so the clicked post is included in the results
        const timestampPlusOne = (parseInt(returnToTimestamp) + 1).toString();
        setTimeout(() => loadPosts(true, timestampPlusOne), 0);
      } else {
        // Normal load from the beginning
        setTimeout(() => loadPosts(true), 0);
      }
    }
  }, [publicKey, selectedNetwork, apiBaseUrl, loadPosts]);

  // Simplified polling - just check for new posts using prevCursor
  useEffect(() => {
    const interval = setInterval(async () => {
      // If we have a prevCursor, check for newer posts
      if (prevCursorRef.current && publicKeyRef.current) {
        try {
          const options: PaginationOptions = {
            limit: 10,
            after: prevCursorRef.current
          };

          const response = await fetchFunctionRef.current(publicKeyRef.current, options);

          if (response && response.posts && response.posts.length > 0) {
            // Found new posts, prepend them silently
            const updatedPosts = [...response.posts, ...postsRef.current];
            onServerPostsUpdateRef.current(updatedPosts);
            setPrevCursor(response.pagination.prevCursor);
            setHasNewer(!!response.pagination.prevCursor);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);


  // Bidirectional scroll-based infinite scroll mechanism
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const distanceFromTop = scrollTop;

      // Load older posts when scrolling down (near bottom)
      const shouldLoadMore = distanceFromBottom < 300;
      if (shouldLoadMore && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMorePosts();
      }

      // Load newer posts when scrolling up (near top)
      const shouldLoadNewer = distanceFromTop < 300;
      if (shouldLoadNewer && hasNewerRef.current && !isLoadingNewerRef.current) {
        loadNewerPosts();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMorePosts, loadNewerPosts]);

  

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Watching</h1>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            Error: {error}
          </div>
        )}
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
            <p className="text-muted-foreground">Loading watching posts...</p>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            No watching posts found.
          </div>
        ) : (
          <>
            {/* Loading indicator at top for newer posts */}
            {isLoadingNewer && (
              <div className="p-4 text-center border-b border-border">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading newer posts...</p>
              </div>
            )}

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
    </div>
  );
};

export default Watching;