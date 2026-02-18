import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { type Post } from "@/models/types";
import { useNavigate } from "react-router-dom";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { LinkifiedText } from '@/utils/linkUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import { toast } from 'sonner';
import { getExplorerTransactionUrl } from '@/utils/explorerUtils';
import { useUserSettings } from '@/contexts/UserSettingsContext';

interface UserPostCardProps {
  post: Post;
  isDetailView?: boolean;
  isComment?: boolean;
  onClick?: () => void;
  showUnblockButton?: boolean;
  onUnblock?: (userPubkey: string) => void;
  showUnfollowButton?: boolean;
  onUnfollow?: (userPubkey: string) => void;
  showFollowButton?: boolean;
  onFollow?: (userPubkey: string) => void;
}

const UserPostCard: React.FC<UserPostCardProps> = ({
  post,
  isDetailView = false,
  isComment = false,
  onClick,
  showUnblockButton = false,
  onUnblock,
  showUnfollowButton = false,
  onUnfollow,
  showFollowButton = false,
  onFollow
}) => {
  const navigate = useNavigate();
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [isSubmittingUnblock, setIsSubmittingUnblock] = useState(false);
  const [isSubmittingUnfollow, setIsSubmittingUnfollow] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);
  const { privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const { selectedNetwork, showSuccessNotifications } = useUserSettings();
  
  // Generate dynamic avatar based on pubkey for consistency, but use profile image if available
  const avatarSizePixels = isDetailView ? 48 : isComment ? 32 : 40;
  const jdenticonAvatar = useJdenticonAvatar(post.author.pubkey || post.author.username, avatarSizePixels);
  
  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = post.author.avatar || jdenticonAvatar;

  const handleUnblock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!privateKey || !post.author.pubkey || isSubmittingUnblock) return;

    try {
      setIsSubmittingUnblock(true);

      // Send unblock transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for blocking actions
        type: 'block' as any, // Cast as any since it's a new type
        blockingAction: 'unblock',
        blockedUserPubkey: post.author.pubkey
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success('Unblock transaction successful!', {
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

        // Call the callback to notify parent component
        if (onUnblock) {
          onUnblock(post.author.pubkey);
        }
      }
    } catch (error) {
      console.error('Error submitting unblock:', error);
      toast.error('Error submitting unblock', {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingUnblock(false);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!privateKey || !post.author.pubkey || isSubmittingUnfollow) return;

    try {
      setIsSubmittingUnfollow(true);

      // Send unfollow transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for following actions
        type: 'follow' as any, // Cast as any since it's a new type
        followingAction: 'unfollow',
        followedUserPubkey: post.author.pubkey
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success('Unfollow transaction successful!', {
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

        // Call the callback to notify parent component
        if (onUnfollow) {
          onUnfollow(post.author.pubkey);
        }
      }
    } catch (error) {
      console.error('Error submitting unfollow:', error);
      toast.error('Error submitting unfollow', {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingUnfollow(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!privateKey || !post.author.pubkey || isSubmittingFollow) return;

    try {
      setIsSubmittingFollow(true);

      // Send follow transaction
      const result = await sendTransaction({
        privateKey,
        userMessage: '', // Empty message for following actions
        type: 'follow' as any, // Cast as any since it's a new type
        followingAction: 'follow',
        followedUserPubkey: post.author.pubkey
      } as any); // Cast as any to bypass TypeScript for now

      if (result) {
        if (showSuccessNotifications) {
          toast.success('Follow transaction successful!', {
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

        // Call the callback to notify parent component
        if (onFollow) {
          onFollow(post.author.pubkey);
        }
      }
    } catch (error) {
      console.error('Error submitting follow:', error);
      toast.error('Error submitting follow', {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmittingFollow(false);
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
      // Navigate to UserPostsView when clicking on a user's post
      navigate(`/user/${post.author.pubkey}`);
    }
  };

  // Handle mention clicks
  const handleMentionClick = (pubkey: string) => {
    navigate(`/user/${encodeURIComponent(pubkey)}`, {
      state: { fromMention: true }
    });
  };

  // Handle hashtag clicks
  const handleHashtagClick = (hashtag: string) => {
    navigate('/search-contents', {
      state: { initialHashtag: hashtag }
    });
  };

  const avatarSize = isDetailView ? "h-12 w-12" : isComment ? "h-8 w-8" : "h-10 w-10";
  const contentTextSize = isDetailView ? "text-lg" : "text-base";
  
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
        <div className={`flex-1 min-w-0 ${!post.content ? 'flex items-center' : ''}`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span
                className="font-bold text-foreground truncate hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${post.author.pubkey}`);
                }}
              >
                {post.author.name}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {showUnblockButton && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingUnblock || !privateKey}
                  onClick={handleUnblock}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isSubmittingUnblock && (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-1"></div>
                  )}
                  Unblock
                </Button>
              )}
              {showUnfollowButton && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingUnfollow || !privateKey}
                  onClick={handleUnfollow}
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isSubmittingUnfollow && (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-1"></div>
                  )}
                  Unfollow
                </Button>
              )}
              {showFollowButton && (
                <>
                  {post.followedUser === false && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmittingFollow || !privateKey}
                      onClick={handleFollow}
                      className="text-foreground border-border hover:bg-muted hover:text-foreground"
                    >
                      {isSubmittingFollow && (
                        <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-1"></div>
                      )}
                      Follow
                    </Button>
                  )}
                  {post.followedUser === true && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={true}
                      className="text-muted-foreground border-border bg-muted cursor-not-allowed"
                    >
                      Following
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          {post.content && (
            <div className={`mt-1 text-foreground ${contentTextSize} break-words`}>
              <LinkifiedText onMentionClick={handleMentionClick} onHashtagClick={handleHashtagClick} maxImages={0} maxVideos={0}>{post.content}</LinkifiedText>
            </div>
          )}
          {/* No interaction buttons (likes, reposts, replies) for Users view */}
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
    </div>
  );
};

export default UserPostCard;