import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageCircle, MessageSquareQuote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { LinkifiedText } from '@/utils/linkUtils';
import { countImageUrls } from '@/utils/mediaDetection';
import { countYouTubeUrls } from '@/utils/youtubeDetection';
import { countVideoFileUrls } from '@/utils/videoDetection';
import { countGifUrls } from '@/utils/gifDetection';
import { Base64 } from 'js-base64';
import { formatAuthorDisplayName, pubkeyToKaspaAddress } from '@/utils/postUtils';
import { useUserSettings } from '@/contexts/UserSettingsContext';

interface NotificationData {
  id: string;
  userPublicKey: string;
  postContent: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  contentType: 'post' | 'reply' | 'vote' | 'quote';
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
  const { getNetworkRPCId, selectedNetwork } = useUserSettings();
  const [userKaspaAddress, setUserKaspaAddress] = useState<string>('');

  // Get Kaspa address from public key
  useEffect(() => {
    const getAddress = async () => {
      try {
        const networkId = getNetworkRPCId(selectedNetwork);
        const address = await pubkeyToKaspaAddress(notification.userPublicKey, networkId);
        setUserKaspaAddress(address);
      } catch (error) {
        console.error('Error getting Kaspa address:', error);
        setUserKaspaAddress(notification.userPublicKey); // Fallback to public key
      }
    };
    getAddress();
  }, [notification.userPublicKey, selectedNetwork, getNetworkRPCId]);

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
  const displayName = decodedNickname || formatAuthorDisplayName(notification.userPublicKey);

  // Handle mention clicks similar to PostCard
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
      case 'quote':
        return <MessageSquareQuote className="h-5 w-5 text-blue-500" />;
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
      case 'quote':
        return 'quoted your content:';
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
                <div className="text-sm [&_.external-image-wrap]:max-w-[20%] [&_.youtube-embed-wrap]:max-w-[20%] [&_.external-video-wrap]:max-w-[20%] [&_.gif-embed-wrap]:max-w-[20%]">
                  <LinkifiedText onMentionClick={handleMentionClick} onHashtagClick={handleHashtagClick} maxImages={1} maxVideos={1} staticPreview>
                    {getDisplayContent(decodedVotedContent)}
                  </LinkifiedText>
                </div>
                {(countImageUrls(decodedVotedContent) > 1 || countYouTubeUrls(decodedVotedContent) + countVideoFileUrls(decodedVotedContent) + countGifUrls(decodedVotedContent) > 1) && (
                  <div className="mt-2 p-2 bg-muted border-l-4 border-primary rounded-r">
                    <p className="text-xs text-muted-foreground">
                      Click to read more...
                    </p>
                  </div>
                )}
              </div>
            ) : decodedContent ? (
              <div className="mt-2">
                <div className="text-sm [&_.external-image-wrap]:max-w-[20%] [&_.youtube-embed-wrap]:max-w-[20%] [&_.external-video-wrap]:max-w-[20%] [&_.gif-embed-wrap]:max-w-[20%]">
                  <LinkifiedText onMentionClick={handleMentionClick} onHashtagClick={handleHashtagClick} maxImages={1} maxVideos={1} staticPreview>
                    {getDisplayContent(decodedContent)}
                  </LinkifiedText>
                </div>
                {(countImageUrls(decodedContent) > 1 || countYouTubeUrls(decodedContent) + countVideoFileUrls(decodedContent) + countGifUrls(decodedContent) > 1) && (
                  <div className="mt-2 p-2 bg-muted border-l-4 border-primary rounded-r">
                    <p className="text-xs text-muted-foreground">
                      Click to read more...
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      {showUserDetailsDialog && (
        <UserDetailsDialog
          userPubkey={notification.userPublicKey}
          userAddress={userKaspaAddress}
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