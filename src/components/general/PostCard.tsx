import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, MessageSquareQuote } from "lucide-react";
import { type Post } from "@/models/types";
import { useNavigate } from "react-router-dom";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import { LinkifiedText } from '@/utils/linkUtils';
import QuoteDialog from "../dialogs/QuoteDialog";
import SimplifiedPostCard from "./SimplifiedPostCard";
import { getExplorerTransactionUrl } from '@/utils/explorerUtils';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { countImageUrls } from '@/utils/mediaDetection';
import { countYouTubeUrls } from '@/utils/youtubeDetection';
import { countVideoFileUrls } from '@/utils/videoDetection';
import { countGifUrls } from '@/utils/gifDetection';

interface PostCardProps {
  post: Post;
  onUpVote?: (id: string) => void;
  onDownVote?: (id: string) => void;
  onRepost?: (id: string) => void;
  isDetailView?: boolean;
  onClick?: () => void;
  onReply?: (postId: string) => void;
  context?: 'detail' | 'list'; // New prop to indicate where the PostCard is being rendered
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onUpVote,
  onDownVote,
  isDetailView = false,
  onClick,
  onReply,
  context = 'list'
}) => {
  
  const navigate = useNavigate();
  
  const handleMentionClick = (pubkey: string) => {
    // Navigate to user profile using the pubkey as identifier
    // Pass state to indicate this is a mention click so UI can show loading state
    navigate(`/user/${encodeURIComponent(pubkey)}`, {
      state: { fromMention: true }
    });
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to search contents view with the hashtag
    navigate('/search-contents', {
      state: { initialHashtag: hashtag }
    });
  };
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const { privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const { selectedNetwork, showSuccessNotifications } = useUserSettings();
  
  // Generate dynamic avatar based on pubkey for consistency, but use profile image if available
  const avatarSizePixels = isDetailView ? 48 : 40;
  const jdenticonAvatar = useJdenticonAvatar(post.author.pubkey || post.author.username, avatarSizePixels);
  
  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = post.author.avatar || jdenticonAvatar;

  const handleUpVote = async () => {
    if (!privateKey || isSubmittingVote) return;
    
    try {
      setIsSubmittingVote(true);
      
      // Send vote transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for votes
        type: 'vote' as any, // Cast as any since it's not in the official types yet
        postId: post.id,
        vote: 'upvote',
        mentionedPubkey: post.author.pubkey // Include the author's pubkey as per protocol specification
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success("Upvote transaction successful!", {
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

        // Call the parent handler if provided
        if (onUpVote) {
          onUpVote(post.id);
        }
      }
    } catch (error) {
      console.error('Error submitting upvote:', error);
      toast.error("Error submitting upvote", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleDownVote = async () => {
    if (!privateKey || isSubmittingVote) return;
    
    try {
      setIsSubmittingVote(true);
      
      // Send vote transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for votes
        type: 'vote' as any, // Cast as any since it's not in the official types yet
        postId: post.id,
        vote: 'downvote',
        mentionedPubkey: post.author.pubkey // Include the author's pubkey as per protocol specification
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success("Downvote transaction successful!", {
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

        // Call the parent handler if provided
        if (onDownVote) {
          onDownVote(post.id);
        }
      }
    } catch (error) {
      console.error('Error submitting downvote:', error);
      toast.error("Error submitting downvote", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (e.target instanceof HTMLElement) {
      const isInteractive = e.target.closest('button') || e.target.closest('a');
      if (isInteractive) return;
    }

    if (onClick) {
      onClick();
    } else if (!isDetailView) {
      // Allow navigation for both posts and comments, passing post data
      navigate(`/post/${post.id}`, { state: { post } });
    }
  };
  const avatarSize = isDetailView ? "h-12 w-12" : "h-10 w-10";
  const contentTextSize = isDetailView ? "text-lg" : "text-base";
  const authorNameSize = isDetailView ? "text-lg" : "text-base";
  const timestampSize = isDetailView ? "text-base" : "text-xs sm:text-sm";

  // Check if message is longer than 500 characters and truncate if needed
  const MAX_CHARS = 500;
  const isLongMessage = post.content.length > MAX_CHARS;
  const displayContent = isDetailView || !isLongMessage
    ? post.content
    : post.content.substring(0, MAX_CHARS) + '.....';

  // Media limiting: 1 in list view, unlimited in detail view
  const maxImages = isDetailView ? undefined : 1;
  const maxVideos = isDetailView ? undefined : 1;
  const hasHiddenImages = !isDetailView && countImageUrls(post.content) > 1;
  const hasHiddenVideos = !isDetailView && (countYouTubeUrls(post.content) + countVideoFileUrls(post.content) + countGifUrls(post.content)) > 1;

  return (
    <div
      className={`border-b border-border sm:border-l sm:border-r p-3 sm:p-4 hover:bg-accent hover:bg-opacity-50 cursor-pointer transition-colors duration-200 bg-card`}
      onClick={handleCardClick}
    >
      <div className="flex space-x-2 sm:space-x-3">
        <Avatar
          className={`${avatarSize} flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={(e) => {
            e.stopPropagation();
            setShowUserDetailsDialog(true);
          }}
        >
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {post.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span
                className={`font-bold text-foreground truncate hover:underline cursor-pointer ${authorNameSize}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${post.author.pubkey}`);
                }}
              >
                {post.author.name}
              </span>
            </div>
            <span className={`text-muted-foreground ${timestampSize} flex-shrink-0 ml-2`}>{post.timestamp}</span>
          </div>
          <div className={`mt-1 text-foreground ${contentTextSize} break-words whitespace-pre-wrap`}>
            <LinkifiedText onMentionClick={handleMentionClick} onHashtagClick={handleHashtagClick} maxImages={maxImages} maxVideos={maxVideos}>{displayContent}</LinkifiedText>
          </div>
          {(isLongMessage || hasHiddenImages || hasHiddenVideos) && !isDetailView && (
            <div className="mt-2 p-2 bg-muted border-l-4 border-primary rounded-r">
              <p className="text-sm text-muted-foreground">
                Click to read more...
              </p>
            </div>
          )}
          {/* Render quoted post if this is a quote */}
          {post.isQuote && post.quote && (
            <div className="mt-3">
              <SimplifiedPostCard
                quote={post.quote}
                onClick={post.quote.referencedId ? (e) => {
                  e?.stopPropagation();
                  if (post.quote) {
                    navigate(`/post/${post.quote.referencedId}`);
                  }
                } : undefined}
              />
            </div>
          )}
          <div className="flex items-center justify-between mt-3 w-full">
            
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-info p-1 sm:p-2 flex-1 flex justify-center min-w-0"
              // TO BE IMPLEMENTED - Reply count click functionality and hover effects
              //className="text-secondary-action hover:text-info hover:bg-interactive-hover p-1 sm:p-2 flex-1 flex justify-center min-w-0"
              onClick={() => {
                if (context === 'list') {
                  // Navigate to PostDetailView with reply intent
                  navigate(`/post/${post.id}`, {
                    state: {
                      post,
                      shouldReply: true,
                      replyToId: post.id
                    }
                  });
                } else if (onReply) {
                  // Use current behavior for detail view
                  onReply(post.id);
                }
              }}
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">{post.replies}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!privateKey}
              className="text-muted-foreground hover:text-info p-1 sm:p-2 flex-1 flex justify-center min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuoteDialog(true);
              }}
            >
              <MessageSquareQuote className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">{post.quotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={post.downVoted || post.upVoted || isSubmittingVote || !privateKey}
              className={`p-1 sm:p-2 flex-1 flex justify-center min-w-0 ${
                post.downVoted || !privateKey
                  ? 'text-muted-foreground'
                  : post.upVoted
                  ? 'text-success'
                  : 'text-muted-foreground hover:text-success'
              }`}
              onClick={handleUpVote}
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex items-center justify-center flex-shrink-0">
                {isSubmittingVote ? (
                  <div className="w-[8px] h-[8px] sm:w-[12px] sm:h-[12px] border-2 border-transparent rounded-full animate-loader-circle"></div>
                ) : (
                  <ThumbsUp className={`h-3 w-3 sm:h-4 sm:w-4 ${post.upVoted ? 'fill-current' : ''}`} />
                )}
              </div>
              <span className="text-xs sm:text-sm">{post.upVotes || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={post.upVoted || post.downVoted || isSubmittingVote || !privateKey}
              className={`p-1 sm:p-2 flex-1 flex justify-center min-w-0 ${
                post.upVoted || !privateKey
                  ? 'text-muted-foreground'
                  : post.downVoted
                  ? 'text-destructive'
                  : 'text-muted-foreground hover:text-destructive'
              }`}
              onClick={handleDownVote}
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex items-center justify-center flex-shrink-0">
                {isSubmittingVote ? (
                  <div className="w-[8px] h-[8px] sm:w-[12px] sm:h-[12px] border-2 border-transparent rounded-full animate-loader-circle"></div>
                ) : (
                  <ThumbsDown className={`h-3 w-3 sm:h-4 sm:w-4 ${post.downVoted ? 'fill-current' : ''}`} />
                )}
              </div>
              <span className="text-xs sm:text-sm">{post.downVotes || 0}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        isOpen={showUserDetailsDialog}
        onClose={() => setShowUserDetailsDialog(false)}
        userPubkey={post.author.pubkey}
        userAddress={post.author.username}
        userNickname={post.author.nickname}
        onNavigateToUserPosts={() => navigate(`/user/${post.author.pubkey}`)}
      />

      {/* Quote Dialog */}
      <QuoteDialog
        isOpen={showQuoteDialog}
        onClose={() => setShowQuoteDialog(false)}
        postId={post.id}
        quotedAuthorPubkey={post.author.pubkey}
      />
    </div>
  );
};

export default PostCard;