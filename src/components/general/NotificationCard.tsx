import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { truncateKaspaAddress } from "@/utils/postUtils";
import { LinkifiedText } from '@/utils/linkUtils';
import { Base64 } from 'js-base64';

interface NotificationData {
  id: string;
  userPublicKey: string;
  postContent: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  contentType: 'post' | 'reply' | 'vote';
  cursor: string;
  voteType?: 'upvote' | 'downvote' | null;
  mentionBlockTime?: number | null;
  contentId?: string | null;
  postId?: string | null;
  votedContent?: string | null;
}

interface NotificationCardProps {
  notification: NotificationData;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
  const navigate = useNavigate();
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);

  // Decode content
  let decodedContent: string = '';
  let decodedVotedContent: string = '';
  let decodedNickname: string | undefined;

  try {
    if (notification.postContent) {
      decodedContent = Base64.decode(notification.postContent);
    }
    if (notification.votedContent) {
      decodedVotedContent = Base64.decode(notification.votedContent);
    }
    if (notification.userNickname) {
      decodedNickname = Base64.decode(notification.userNickname);
    }
  } catch (error) {
    console.error('Error decoding notification content:', error);
  }

  // Generate avatar and author info
  const avatarDataUrl = useJdenticonAvatar(notification.userPublicKey, 40);
  const displayName = decodedNickname || truncateKaspaAddress(notification.userPublicKey);

  // Handle mention clicks similar to PostCard
  const handleMentionClick = (pubkey: string) => {
    navigate(`/user/${encodeURIComponent(pubkey)}`, {
      state: { fromMention: true }
    });
  };

  // Use PostCard approach: check if message is longer than 500 characters and truncate if needed
  const MAX_CHARS = 500;
  const getDisplayContent = (content: string) => {
    const isLongMessage = content.length > MAX_CHARS;
    return isLongMessage ? content.substring(0, MAX_CHARS) + '.....' : content;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes > 0) {
        return `${diffMinutes}m`;
      } else {
        return 'now';
      }
    }
  };

  const timeString = formatTimestamp(notification.timestamp);

  // Handle clicks
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserDetailsDialog(true);
  };

  const handleDisplayNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${encodeURIComponent(notification.userPublicKey)}`);
  };

  const handleNavigateToContent = () => {
    if (notification.contentType === 'vote' && notification.contentId) {
      navigate(`/post/${notification.contentId}`);
    } else {
      navigate(`/post/${notification.id}`);
    }
  };

  // Get notification icon and message
  const getNotificationIcon = () => {
    switch (notification.contentType) {
      case 'post':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'reply':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'vote':
        return notification.voteType === 'upvote' ?
          <ThumbsUp className="h-5 w-5 text-green-500" /> :
          <ThumbsDown className="h-5 w-5 text-red-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = () => {
    switch (notification.contentType) {
      case 'post':
        return 'mentioned you in a post:';
      case 'reply':
        return 'mentioned you in a reply:';
      case 'vote':
        return `${notification.voteType === 'upvote' ? 'liked' : 'disliked'} your content:`;
      default:
        return 'interacted with your content';
    }
  };

  return (
    <>
      <div
        className="border-b border-border p-4 hover:bg-accent hover:bg-opacity-50 cursor-pointer transition-colors duration-200"
        onClick={handleNavigateToContent}
      >
        <div className="flex items-start space-x-3">
          {/* Notification Icon */}
          <div className="flex items-center h-10">
            {getNotificationIcon()}
          </div>

          {/* User Avatar */}
          <Avatar
            className="h-10 w-10 cursor-pointer"
            onClick={handleUserClick}
          >
            {notification.userProfileImage ? (
              <AvatarImage
                src={`data:image/png;base64,${notification.userProfileImage}`}
                alt={displayName}
              />
            ) : (
              <AvatarImage src={avatarDataUrl} alt={displayName} />
            )}
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDisplayNameClick}
                  className="font-semibold text-foreground hover:underline text-sm"
                >
                  {displayName}
                </button>
                <span className="text-sm text-muted-foreground">
                  {getNotificationMessage()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{timeString}</span>
            </div>

            {/* Content Preview */}
            {notification.contentType === 'vote' && decodedVotedContent ? (
              <div className="mt-2">
                <div className="text-sm">
                  <LinkifiedText onMentionClick={handleMentionClick}>
                    {getDisplayContent(decodedVotedContent)}
                  </LinkifiedText>
                </div>
              </div>
            ) : decodedContent ? (
              <div className="mt-2">
                <div className="text-sm">
                  <LinkifiedText onMentionClick={handleMentionClick}>
                    {getDisplayContent(decodedContent)}
                  </LinkifiedText>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      {showUserDetailsDialog && (
        <UserDetailsDialog
          userPubkey={notification.userPublicKey}
          userAddress={notification.userPublicKey} // Using pubkey as address placeholder
          displayName={displayName}
          userNickname={decodedNickname}
          isOpen={showUserDetailsDialog}
          onClose={() => setShowUserDetailsDialog(false)}
          onNavigateToUserPosts={() => navigate(`/user/${encodeURIComponent(notification.userPublicKey)}`)}
        />
      )}
    </>
  );
};

export default NotificationCard;