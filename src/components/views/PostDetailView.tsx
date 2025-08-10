import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CornerUpLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '../general/PostCard';
import ComposeReply from '../general/ComposeReply';
import { type Post } from '@/models/types';
import { buildMentionedPubkeysForReply } from '@/utils/replyChainUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';

interface PostDetailViewProps {
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
}

const PostDetailView: React.FC<PostDetailViewProps> = ({ onUpVote, onDownVote, onRepost }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { publicKey } = useAuth();
  const { fetchAndConvertPostDetails, fetchAndConvertPostReplies } = useKaspaPostsApi();
  
  // Main post state
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);
  
  // Replies state
  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // UI state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  
  // Refs for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load the main post details using the new API
  const loadPostDetails = useCallback(async () => {
    if (!postId || !publicKey) return;
    
    setIsLoadingPost(true);
    setPostError(null);
    
    try {
      const post = await fetchAndConvertPostDetails(postId, publicKey);
      setCurrentPost(post);
    } catch (error) {
      console.error('Error loading post details:', error);
      setPostError(error instanceof Error ? error.message : 'Failed to load post');
    } finally {
      setIsLoadingPost(false);
    }
  }, [postId, fetchAndConvertPostDetails, publicKey]);

  // Load replies for the current post
  const loadReplies = useCallback(async (reset: boolean = true) => {
    if (!postId || !publicKey) return;
    
    if (reset) {
      setIsLoadingReplies(true);
      setRepliesError(null);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const options = {
        limit: 10,
        ...(reset ? {} : { before: nextCursor })
      };
      
      const response = await fetchAndConvertPostReplies(postId, publicKey, options);
      
      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      if (reset) {
        setReplies(response.posts || []);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      } else {
        // Append new replies to existing ones
        setReplies(prev => [...prev, ...(response.posts || [])]);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
      
    } catch (error) {
      console.error('Error loading replies:', error);
      setRepliesError(error instanceof Error ? error.message : 'Failed to load replies');
    } finally {
      if (reset) {
        setIsLoadingReplies(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [postId, nextCursor, fetchAndConvertPostReplies, publicKey]);

  // Load more replies
  const loadMoreReplies = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await loadReplies(false);
  }, [loadReplies, hasMore, isLoadingMore]);

  // Initial load when component mounts or postId changes
  useEffect(() => {
    if (postId) {
      loadPostDetails();
      loadReplies(true);
    }
  }, [postId, loadPostDetails, loadReplies]);

  // Set up polling for the main post details (every 5 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const pollPostDetails = async () => {
      if (!postId || !publicKey) return;
      
      try {
        const updatedPost = await fetchAndConvertPostDetails(postId, publicKey);
        setCurrentPost(prev => {
          // Only update if there are actual changes to avoid unnecessary re-renders
          if (!prev || 
              prev.upVotes !== updatedPost.upVotes || 
              prev.downVotes !== updatedPost.downVotes || 
              prev.reposts !== updatedPost.reposts || 
              prev.replies !== updatedPost.replies ||
              prev.upVoted !== updatedPost.upVoted ||
              prev.downVoted !== updatedPost.downVoted) {
            return updatedPost;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error polling post details:', error);
        // Don't update error state for polling failures to avoid disruption
      }
    };

    // Start polling if we have a postId and the post is loaded
    if (postId && currentPost) {
      interval = setInterval(pollPostDetails, 5000); // Poll every 5 seconds
    }

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [postId, currentPost, fetchAndConvertPostDetails, publicKey]);

  // Set up polling for replies (every 5 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const pollReplies = async () => {
      if (!postId || !publicKey || isLoadingReplies) return;
      
      try {
        // Only poll the first page of replies to check for new ones
        const response = await fetchAndConvertPostReplies(postId, publicKey, { limit: 10 });
        
        if (!response || !response.pagination) {
          console.error('Invalid response structure in replies polling:', response);
          return;
        }

        const newReplies = response.posts || [];
        
        // Update replies state if we have new data
        setReplies(prev => {
          // Only update if there are actual changes to avoid unnecessary re-renders
          if (prev.length === 0 || 
              newReplies.length !== prev.length ||
              newReplies.some((reply, index) => 
                !prev[index] || 
                prev[index].id !== reply.id ||
                prev[index].upVotes !== reply.upVotes ||
                prev[index].downVotes !== reply.downVotes ||
                prev[index].reposts !== reply.reposts ||
                prev[index].replies !== reply.replies ||
                prev[index].upVoted !== reply.upVoted ||
                prev[index].downVoted !== reply.downVoted
              )) {
            // Update pagination info as well
            setNextCursor(response.pagination.nextCursor);
            setHasMore(response.pagination.hasMore);
            return newReplies;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error polling replies:', error);
        // Don't update error state for polling failures to avoid disruption
      }
    };

    // Start polling if we have a postId and replies have been loaded at least once
    if (postId && !isLoadingReplies && !repliesError) {
      interval = setInterval(pollReplies, 5000); // Poll every 5 seconds
    }

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [postId, isLoadingReplies, repliesError, fetchAndConvertPostReplies, publicKey]);

  // Infinite scroll for replies
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const shouldLoadMore = distanceFromBottom < 300; // Load when within 300px of bottom

      if (shouldLoadMore && hasMore && !isLoadingMore) {
        loadMoreReplies();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreReplies, hasMore, isLoadingMore]);

  // Handle reply intent from navigation state
  useEffect(() => {
    if (location.state?.shouldReply && location.state?.replyToId && currentPost) {
      setReplyingToId(location.state.replyToId);
      // Clear the navigation state to prevent re-triggering
      navigate(location.pathname, { 
        state: { post: location.state.post }, 
        replace: true 
      });
    }
  }, [location.state, currentPost, navigate, location.pathname]);

  // Reply handling functions
  const handleReply = (replyId: string) => {
    setReplyingToId(replyId);
  };

  const handleReplySubmit = (_content: string) => {
    // Transaction is handled in ComposeReply component
    setReplyingToId(null);
    
    // Refresh replies after a delay to allow the transaction to be processed
    const refreshReplies = async (retryCount = 0) => {
      if (!postId || !publicKey) return;
      
      try {
        const response = await fetchAndConvertPostReplies(postId, publicKey, { limit: 10 });
        
        if (!response || !response.pagination) {
          console.error('Invalid response structure in reply refresh:', response);
          return;
        }
        
        const newReplies = response.posts || [];
        
        // If we got new replies or this is not a retry, update state
        if (newReplies.length > replies.length || retryCount === 0) {
          setReplies(newReplies);
          setNextCursor(response.pagination.nextCursor);
          setHasMore(response.pagination.hasMore);
        } else if (retryCount < 3) {
          // Retry up to 3 times with increasing delays
          setTimeout(() => refreshReplies(retryCount + 1), (retryCount + 1) * 2000);
        }
      } catch (error) {
        console.error('Error refreshing replies after submit:', error);
        if (retryCount < 3) {
          setTimeout(() => refreshReplies(retryCount + 1), (retryCount + 1) * 2000);
        }
      }
    };
    
    // Start the refresh process after 3 seconds
    setTimeout(() => refreshReplies(), 3000);
  };

  const handleReplyCancel = () => {
    setReplyingToId(null);
  };

  // Get mentioned pubkeys for a reply - simplified logic
  const getMentionedPubkeysForReply = (targetPostId: string): string[] => {
    if (targetPostId === currentPost?.id && currentPost) {
      // Replying to the main post
      return buildMentionedPubkeysForReply(currentPost, publicKey ?? undefined);
    }
    
    // Replying to a reply
    const targetReply = replies.find(reply => reply.id === targetPostId);
    if (targetReply) {
      return buildMentionedPubkeysForReply(targetReply, publicKey ?? undefined);
    }
    
    return [];
  };

  // Show error if no public key is available
  if (!publicKey) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold">Authentication Required</h1>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              Please log in to view post details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingPost) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold">Loading...</h1>
            </div>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading post...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (postError || (!currentPost && !isLoadingPost)) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold">
                {postError ? 'Error' : 'Post not found'}
              </h1>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              {postError || "The post you're looking for doesn't exist or has been removed."}
            </p>
            {postError && (
              <Button
                onClick={() => loadPostDetails()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we still don't have a post, return null (should not happen)
  if (!currentPost) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto border-r border-gray-200 flex flex-col h-full">
      {/* Header with back button and optional parent post button */}
      <div className="sticky top-0 bg-white bg-opacity-80 backdrop-blur-md border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Post</h1>
              <p className="text-sm text-gray-500 truncate">
                by {currentPost.author.name}
              </p>
            </div>
          </div>
          
          {/* Parent post navigation button - only show if this is a reply */}
          {currentPost.parentPostId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/post/${currentPost.parentPostId}`)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Go to parent post"
            >
              <CornerUpLeft className="h-5 w-5" />
            </Button>
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
        {/* Main Post/Comment - Larger version */}
        <div className="border-b border-gray-200 bg-white">
          <PostCard
            post={currentPost}
            onUpVote={onUpVote}
            onDownVote={onDownVote}
            onRepost={onRepost}
            isDetailView={true}
            onReply={handleReply}
            context="detail"
          />
          {replyingToId === currentPost.id && (
            <ComposeReply
              onReply={handleReplySubmit}
              onCancel={handleReplyCancel}
              replyingToUser={currentPost.author.username}
              postId={currentPost.id}
              mentionedPubkeys={getMentionedPubkeysForReply(currentPost.id)}
            />
          )}
        </div>

        {/* Replies Section */}
        <div>
          {/* Loading and Error States */}
          {isLoadingReplies && (
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading replies...</span>
            </div>
          )}
          
          {repliesError && (
            <div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-center justify-between">
              <span>Error loading replies: {repliesError}</span>
              <Button
                onClick={() => loadReplies(true)}
                variant="ghost"
                size="sm"
                className="ml-2 p-1 h-auto"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Replies List */}
          {replies.length === 0 && !isLoadingReplies ? (
            <div className="p-8 text-center text-gray-500">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            <>
              {/* Replies Header */}
              {replies.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                    Replies ({replies.length})
                  </h3>
                  <Button
                    onClick={() => loadReplies(true)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-500 hover:text-gray-700"
                    disabled={isLoadingReplies}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingReplies ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}
              <div className="space-y-0">
                {replies.map((reply) => {
                  return (
                    <div key={reply.id}>
                      <PostCard
                        post={reply}
                        onUpVote={onUpVote}
                        onDownVote={onDownVote}
                        onRepost={onRepost}
                        isComment={true}
                        onReply={handleReply}
                        context="detail"
                      />
                      {replyingToId === reply.id && (
                        <ComposeReply
                          onReply={handleReplySubmit}
                          onCancel={handleReplyCancel}
                          replyingToUser={reply.author.username}
                          postId={reply.id}
                          mentionedPubkeys={getMentionedPubkeysForReply(reply.id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Auto-load more content when scrolling near bottom */}
              {hasMore && isLoadingMore && (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading more replies...</p>
                </div>
              )}
              
              {/* End of replies indicator */}
              {!hasMore && replies.length > 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No more replies to load
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailView;