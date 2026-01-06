import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '../general/PostCard';
import { type Post, type PaginationOptions } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';

interface MentionsProps {
  posts: Post[];
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
  onServerPostsUpdate: (posts: Post[]) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const Mentions: React.FC<MentionsProps> = ({ posts, onUpVote, onDownVote, onRepost, onServerPostsUpdate }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { publicKey } = useAuth();
  const { fetchAndConvertMentions, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();
  
  
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const fetchFunctionRef = useRef(fetchAndConvertMentions);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  fetchFunctionRef.current = fetchAndConvertMentions;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  const loadPosts = useCallback(async (reset: boolean = true) => {
    try {
      if (!publicKeyRef.current) {
        console.warn('No public key available for fetching mentions');
        return;
      }

      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      
      const options: PaginationOptions = {
        limit: 10,
        ...(reset ? {} : { before: nextCursorRef.current })
      };
      
      const response = await fetchFunctionRef.current(publicKeyRef.current, publicKeyRef.current, options);
      
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mentions';
      setError(errorMessage);
      console.error('Error fetching mentions from server:', err);
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

// Load posts on component mount and when network or apiBaseUrl changes
  useEffect(() => {
    if (publicKey) {
      // Use setTimeout to make this non-blocking
      setTimeout(() => loadPosts(true), 0);
    }
  }, [publicKey, selectedNetwork, apiBaseUrl]);

  // Auto-refresh every 30 seconds (less aggressive to avoid interfering with infinite scroll)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if user is near the top to avoid disrupting infinite scroll
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer && scrollContainer.scrollTop < 100) {
        loadPosts(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadPosts]);

  // Set up polling with stable references
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          if (!publicKeyRef.current) {
            return;
          }

          const options: PaginationOptions = {
            limit: 10
          };
          
          const response = await fetchFunctionRef.current(publicKeyRef.current, publicKeyRef.current, options);
          
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
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mentions';
          setError(errorMessage);
          console.error('Error fetching mentions from server:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, apiBaseUrl]); // Removed posts dependency since we use refs

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

  

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Mentions</h1>
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
            <p className="text-muted-foreground">Loading mentions...</p>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            No mentions found.
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
    </div>
  );
};

export default Mentions;