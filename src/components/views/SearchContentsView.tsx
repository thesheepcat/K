import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PostCard from '../general/PostCard';
import { type Post, type PaginationOptions, type ServerPost } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';
import { convertServerPostToClientPost } from '@/services/postsApi';
import { toast } from 'sonner';

interface SearchContentsViewProps {
  posts: Post[];
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
  onServerPostsUpdate: (posts: Post[]) => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const SearchContentsView: React.FC<SearchContentsViewProps> = ({
  posts,
  onUpVote,
  onDownVote,
  onRepost,
  onServerPostsUpdate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { publicKey } = useAuth();
  const { apiBaseUrl, selectedNetwork } = useKaspaPostsApi();

  // Get initial hashtag from navigation state
  const initialHashtag = (location.state as { initialHashtag?: string })?.initialHashtag;

  // Search form state
  const [searchValue, setSearchValue] = useState(initialHashtag ? `#${initialHashtag}` : '');
  const [isSearching, setIsSearching] = useState(false);
  const [shouldPaginate, setShouldPaginate] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Store search params for pagination
  const [lastSearchHashtag, setLastSearchHashtag] = useState<string | undefined>(undefined);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const shouldPaginateRef = useRef(shouldPaginate);
  const lastSearchHashtagRef = useRef(lastSearchHashtag);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  shouldPaginateRef.current = shouldPaginate;
  lastSearchHashtagRef.current = lastSearchHashtag;

  // Validate hashtag based on HASHTAG_IMPLEMENTATION_SPEC.md rules
  const validateHashtag = (input: string): { isValid: boolean; error?: string; hashtag?: string } => {
    // Remove # if user included it
    const cleanedInput = input.trim().replace(/^#/, '');

    // Check if empty
    if (!cleanedInput) {
      return { isValid: false, error: 'Please enter a hashtag' };
    }

    // Check length (1-30 characters)
    if (cleanedInput.length > 30) {
      return { isValid: false, error: 'Hashtag exceeds 30 character limit' };
    }

    // Check for invalid characters - only Unicode letters, numbers, and underscore allowed
    // Using a simple regex that covers most common cases
    const validPattern = /^[\p{L}\p{N}_]+$/u;
    if (!validPattern.test(cleanedInput)) {
      return { isValid: false, error: 'Hashtag contains invalid characters (only letters, numbers, and underscore allowed)' };
    }

    // Convert to lowercase for storage
    return { isValid: true, hashtag: cleanedInput.toLowerCase() };
  };

  // Fetch hashtag content from API
  const fetchHashtagContent = async (hashtag: string, options: PaginationOptions = {}) => {
    const params = new URLSearchParams({
      hashtag,
      requesterPubkey: publicKeyRef.current || '',
      limit: (options.limit || 10).toString(),
      ...(options.before ? { before: options.before } : {}),
      ...(options.after ? { after: options.after } : {})
    });

    const response = await fetch(`${apiBaseUrl}/get-hashtag-content?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch hashtag content: ${response.statusText}`);
    }

    return response.json();
  };

  // Handle search button click
  const handleSearch = useCallback(async () => {
    const validation = validateHashtag(searchValue);

    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid hashtag');
      return;
    }

    // Clear validation error
    setValidationError(null);
    setIsSearching(true);
    setIsLoading(true);
    setError(null);
    setShouldPaginate(false);

    try {
      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }

      // Store search params for pagination
      setLastSearchHashtag(validation.hashtag);

      const options: PaginationOptions = {
        limit: 10
      };

      const response = await fetchHashtagContent(validation.hashtag!, options);

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Convert server posts to client posts
      const serverPosts: ServerPost[] = response.posts || [];
      const convertedPosts = await Promise.all(
        serverPosts.map(serverPost =>
          convertServerPostToClientPost(serverPost, publicKeyRef.current || undefined, selectedNetwork)
        )
      );

      onServerPostsUpdateRef.current(convertedPosts);
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);

      // Enable pagination if we got results
      const resultCount = convertedPosts.length;
      const enablePagination = resultCount >= 10;
      setShouldPaginate(enablePagination);

      if (resultCount === 0) {
        toast.info('No content found', {
          description: `No posts found with #${validation.hashtag}`,
          duration: 3000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search hashtag content';
      setError(errorMessage);
      console.error('Error searching hashtag content:', err);
      toast.error('Search failed', {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [searchValue, apiBaseUrl]);

  // Load more posts (pagination)
  const loadMorePosts = useCallback(async () => {
    if (!shouldPaginateRef.current || !hasMoreRef.current || isLoadingMoreRef.current || !lastSearchHashtagRef.current) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const options: PaginationOptions = {
        limit: 10,
        before: nextCursorRef.current
      };

      const response = await fetchHashtagContent(lastSearchHashtagRef.current, options);

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Convert server posts to client posts
      const serverPosts: ServerPost[] = response.posts || [];
      const convertedPosts = await Promise.all(
        serverPosts.map(serverPost =>
          convertServerPostToClientPost(serverPost, publicKeyRef.current || undefined, selectedNetwork)
        )
      );

      // Append new posts to existing ones
      const updatedPosts = [...postsRef.current, ...convertedPosts];
      onServerPostsUpdateRef.current(updatedPosts);
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more content';
      setError(errorMessage);
      console.error('Error loading more hashtag content:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiBaseUrl]);

  // Set up polling with stable references
  useEffect(() => {
    // Only poll if we have an active search
    if (!lastSearchHashtagRef.current) return;

    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          const options: PaginationOptions = {
            limit: 10
          };

          const response = await fetchHashtagContent(lastSearchHashtagRef.current!, options);

          // Defensive check for response structure
          if (!response || !response.pagination) {
            console.error('Invalid polling response structure:', response);
            return;
          }

          // Convert server posts to client posts
          const rawServerPosts: ServerPost[] = response.posts || [];
          const serverPosts = await Promise.all(
            rawServerPosts.map(serverPost =>
              convertServerPostToClientPost(serverPost, publicKeyRef.current || undefined, selectedNetwork)
            )
          );

          // Check if server data has any changes compared to local data
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
          console.error('Error polling hashtag content:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastSearchHashtag, selectedNetwork, apiBaseUrl]);

  // Single scroll-based infinite scroll mechanism (only if pagination is enabled)
  useEffect(() => {
    if (!shouldPaginate) return;

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
  }, [loadMorePosts, shouldPaginate]);

  // Check if content fills the container and load more if needed (only if pagination is enabled)
  useEffect(() => {
    if (!shouldPaginate) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading) return;

    const checkAndLoadMore = () => {
      const { scrollHeight, clientHeight } = scrollContainer;
      const hasScrollbar = scrollHeight > clientHeight;

      // If there's no scrollbar and we have more content to load, load it
      if (!hasScrollbar && hasMoreRef.current && !isLoadingMoreRef.current && posts.length > 0) {
        loadMorePosts();
      }
    };

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkAndLoadMore, 100);

    return () => clearTimeout(timeoutId);
  }, [posts, isLoading, loadMorePosts, shouldPaginate]);

  // Handle Enter key press in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  // Handle input change and clear validation error
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove all spaces from the input
    value = value.replace(/\s/g, '');

    // Always ensure # is at the start and cannot be deleted
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/^#+/, ''); // Remove any # that might be in the middle and add one at start
    }

    // Prevent the user from having just "#" without being able to clear it
    // But if they select all and delete, reset to "#"
    if (value === '') {
      value = '#';
    }

    setSearchValue(value);
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  // Handle input focus - add # if empty
  const handleInputFocus = () => {
    if (searchValue.trim() === '') {
      setSearchValue('#');
    }
  };

  // Auto-search when navigating with initial hashtag
  useEffect(() => {
    if (initialHashtag) {
      // Update search value
      setSearchValue(`#${initialHashtag}`);

      // Trigger search directly with the new hashtag
      const performSearch = async () => {
        const validation = validateHashtag(`#${initialHashtag}`);

        if (!validation.isValid) {
          setValidationError(validation.error || 'Invalid hashtag');
          return;
        }

        setValidationError(null);
        setIsSearching(true);
        setIsLoading(true);
        setError(null);
        setShouldPaginate(false);

        try {
          if (!publicKeyRef.current) {
            throw new Error('User not authenticated');
          }

          setLastSearchHashtag(validation.hashtag);

          const options: PaginationOptions = {
            limit: 10
          };

          const response = await fetchHashtagContent(validation.hashtag!, options);

          if (!response || !response.pagination) {
            console.error('Invalid response structure:', response);
            throw new Error('Invalid response from server');
          }

          const serverPosts: ServerPost[] = response.posts || [];
          const convertedPosts = await Promise.all(
            serverPosts.map(serverPost =>
              convertServerPostToClientPost(serverPost, publicKeyRef.current || undefined, selectedNetwork)
            )
          );

          onServerPostsUpdateRef.current(convertedPosts);
          setNextCursor(response.pagination.nextCursor);
          setHasMore(response.pagination.hasMore);

          const resultCount = convertedPosts.length;
          const enablePagination = resultCount >= 10;
          setShouldPaginate(enablePagination);

          if (resultCount === 0) {
            toast.info('No content found', {
              description: `No posts found with #${validation.hashtag}`,
              duration: 3000,
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to search hashtag content';
          setError(errorMessage);
          console.error('Error searching hashtag content:', err);
          toast.error('Search failed', {
            description: errorMessage,
            duration: 4000,
          });
        } finally {
          setIsLoading(false);
          setIsSearching(false);
        }
      };

      performSearch();
    }
  }, [location.state]); // Watch for changes in navigation state

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
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
            <h1 className="text-xl font-bold">Search by hashtag</h1>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="border-b border-border p-4">
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={searchValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              placeholder="Search by hashtag..."
              className="h-10 pr-10 text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              disabled={isSearching}
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                title="Search"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {validationError && (
            <div className="text-sm text-destructive">
              {validationError}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
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
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : posts.length === 0 && !isLoading && !isSearching ? (
          <div className="p-8 text-center text-muted-foreground">
            Enter a hashtag to search for content
          </div>
        ) : posts.length === 0 && !isLoading && isSearching ? (
          <div className="p-8 text-center text-muted-foreground">
            No content found. Try a different hashtag.
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

            {/* Auto-load more content when scrolling near bottom (only if pagination is enabled) */}
            {shouldPaginate && hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more contents...</p>
              </div>
            )}

            {/* End of posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No more contents to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchContentsView;
