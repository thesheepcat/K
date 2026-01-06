import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import UserPostCard from '../general/UserPostCard';
import { type Post } from '@/models/types';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';
import { validateKaspaAddress, addressToPublicKey } from '@/utils/kaspaAddressUtils';
import { toast } from 'sonner';

interface SearchUsersViewProps {
  posts: Post[];
  onServerPostsUpdate: (posts: Post[]) => void;
}

const SearchUsersView: React.FC<SearchUsersViewProps> = ({ posts, onServerPostsUpdate }) => {
  const navigate = useNavigate();
  const { publicKey } = useAuth();
  const { fetchAndConvertSearchUsers, selectedNetwork } = useKaspaPostsApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search form state
  const [searchType, setSearchType] = useState<'pubkey' | 'address' | 'nickname'>('pubkey');
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [shouldPaginate, setShouldPaginate] = useState(false);

  // Store search params for pagination
  const [lastSearchPubkey, setLastSearchPubkey] = useState<string | undefined>(undefined);
  const [lastSearchNickname, setLastSearchNickname] = useState<string | undefined>(undefined);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to store the latest values to avoid dependency issues
  const onServerPostsUpdateRef = useRef(onServerPostsUpdate);
  const fetchFunctionRef = useRef(fetchAndConvertSearchUsers);
  const publicKeyRef = useRef(publicKey);
  const postsRef = useRef(posts);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const shouldPaginateRef = useRef(shouldPaginate);

  // Update refs when values change
  onServerPostsUpdateRef.current = onServerPostsUpdate;
  fetchFunctionRef.current = fetchAndConvertSearchUsers;
  publicKeyRef.current = publicKey;
  postsRef.current = posts;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  shouldPaginateRef.current = shouldPaginate;

  // Validate public key format (66 hex characters with 02/03 prefix)
  const validatePublicKey = (pubkey: string): boolean => {
    if (!pubkey) return true; // Empty is valid, will be omitted from search
    const pubkeyRegex = /^(02|03)[0-9a-fA-F]{64}$/;
    return pubkeyRegex.test(pubkey);
  };

  // Handle search button click
  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) {
      const searchTypeLabel = searchType === 'pubkey' ? 'public key' : searchType === 'address' ? 'address' : 'nickname';
      toast.error(`Please enter a ${searchTypeLabel} to search`);
      return;
    }

    // Validate public key if that's the selected search type
    if (searchType === 'pubkey' && !validatePublicKey(searchValue.trim())) {
      toast.error('Invalid public key format', {
        description: 'Public key must be 66 hex characters starting with 02 or 03',
        duration: 4000,
      });
      return;
    }

    // Validate and convert address if that's the selected search type
    if (searchType === 'address') {
      const isValidAddress = await validateKaspaAddress(searchValue.trim(), selectedNetwork);
      if (!isValidAddress) {
        toast.error('Invalid Kaspa address', {
          description: `Please enter a valid ${selectedNetwork.includes('mainnet') ? 'mainnet' : 'testnet'} address`,
          duration: 4000,
        });
        return;
      }
    }

    setIsSearching(true);
    setIsLoading(true);
    setError(null);
    setShouldPaginate(false);

    try {
      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }

      // Prepare search parameters based on search type
      let searchedPubkey: string | undefined;
      let searchedNickname: string | undefined;

      if (searchType === 'pubkey') {
        searchedPubkey = searchValue.trim();
      } else if (searchType === 'address') {
        // Convert address to public key
        const convertedPubkey = await addressToPublicKey(searchValue.trim());
        if (!convertedPubkey) {
          throw new Error('Failed to convert address to public key');
        }
        searchedPubkey = convertedPubkey;
      } else if (searchType === 'nickname') {
        searchedNickname = searchValue.trim();
      }

      // Store search params for pagination
      setLastSearchPubkey(searchedPubkey);
      setLastSearchNickname(searchedNickname);

      const options = {
        limit: 10,
      };

      const response = await fetchFunctionRef.current(
        publicKeyRef.current,
        searchedPubkey,
        searchedNickname,
        options
      );

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      onServerPostsUpdateRef.current(response.posts || []);
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);

      // Enable pagination if we got 10 or more results
      const resultCount = (response.posts || []).length;
      const enablePagination = resultCount >= 10;
      setShouldPaginate(enablePagination);

      if (resultCount === 0) {
        toast.info('No users found', {
          description: 'Try adjusting your search criteria',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search users';
      setError(errorMessage);
      toast.error('Search failed', {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [searchValue, searchType, selectedNetwork]);

  // Load more users (pagination)
  const loadMoreUsers = useCallback(async () => {
    if (!shouldPaginateRef.current || !hasMoreRef.current || isLoadingMoreRef.current) return;

    setIsLoadingMore(true);

    try {
      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }

      const options = {
        limit: 10,
        before: nextCursorRef.current
      };

      const response = await fetchFunctionRef.current(
        publicKeyRef.current,
        lastSearchPubkey,
        lastSearchNickname,
        options
      );

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Append new posts to existing ones
      const updatedPosts = [...postsRef.current, ...(response.posts || [])];
      onServerPostsUpdateRef.current(updatedPosts);
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error('Error loading more users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load more users');
    } finally {
      setIsLoadingMore(false);
    }
  }, [lastSearchPubkey, lastSearchNickname]);

  // Handle search type change - clear search value when switching types
  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as 'pubkey' | 'address' | 'nickname');
    setSearchValue(''); // Clear input when switching types
  };

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
        loadMoreUsers();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreUsers, shouldPaginate]);

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
        loadMoreUsers();
      }
    };

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkAndLoadMore, 100);

    return () => clearTimeout(timeoutId);
  }, [posts, isLoading, loadMoreUsers, shouldPaginate]);

  const handleFollow = (userPubkey: string) => {
    // Optimistically update the UI
    const updatedPosts = posts.map(post =>
      post.author.pubkey === userPubkey
        ? { ...post, followedUser: true }
        : post
    );
    onServerPostsUpdate(updatedPosts);
  };

  // Handle Enter key press in input fields
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearchValue(text.trim());
    } catch (error) {
      toast.error('Failed to paste from clipboard', {
        description: 'Please check clipboard permissions',
        duration: 3000,
      });
    }
  };

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
            <h1 className="text-xl font-bold">Search users</h1>
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search by
            </label>
            <Select
              value={searchType}
              onChange={(e) => handleSearchTypeChange(e.target.value)}
              disabled={isSearching}
              className="text-sm"
            >
              <SelectOption value="pubkey">Public key</SelectOption>
              <SelectOption value="address">Address</SelectOption>
              <SelectOption value="nickname">Nickname</SelectOption>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  searchType === 'pubkey'
                    ? 'Enter public key...'
                    : searchType === 'address'
                    ? 'Enter Kaspa address...'
                    : 'Enter nickname...'
                }
                className="h-10 pr-16 text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                disabled={isSearching}
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  disabled={isSearching}
                  className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                  title="Paste from clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
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
          </div>
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
            Enter a public key or nickname to search for users
          </div>
        ) : posts.length === 0 && !isLoading && isSearching ? (
          <div className="p-8 text-center text-muted-foreground">
            No users found. Try adjusting your search criteria.
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

            {/* Auto-load more content when scrolling near bottom (only if pagination is enabled) */}
            {shouldPaginate && hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more users...</p>
              </div>
            )}

            {/* End of results indicator - show total count */}
            {!hasMore && posts.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {posts.length} {posts.length === 1 ? 'user' : 'users'} found
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchUsersView;
