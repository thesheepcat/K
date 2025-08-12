import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { type Post } from "@/models/types";
import { useNavigate } from "react-router-dom";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { truncateKaspaAddress } from "@/utils/postUtils";
import { LinkifiedText } from '@/utils/linkUtils';

interface UserPostCardProps {
  post: Post;
  isDetailView?: boolean;
  isComment?: boolean;
  onClick?: () => void;
}

const UserPostCard: React.FC<UserPostCardProps> = ({ 
  post, 
  isDetailView = false, 
  isComment = false, 
  onClick
}) => {
  const navigate = useNavigate();
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  
  // Generate dynamic avatar based on pubkey for consistency, but use profile image if available
  const avatarSizePixels = isDetailView ? 48 : isComment ? 32 : 40;
  const jdenticonAvatar = useJdenticonAvatar(post.author.pubkey || post.author.username, avatarSizePixels);
  
  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = post.author.avatar || jdenticonAvatar;

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

  const avatarSize = isDetailView ? "h-12 w-12" : isComment ? "h-8 w-8" : "h-10 w-10";
  const contentTextSize = isDetailView ? "text-lg" : "text-base";
  
  return (
    <div 
      className={`border-b border-gray-200 p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 bg-white`}
      onClick={handleCardClick}
    >
      <div className="flex space-x-2 sm:space-x-3">
        <Avatar 
          className={`${avatarSize} rounded-none flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={(e) => {
            e.stopPropagation();
            setShowUserDetailsDialog(true);
          }}
        >
          <AvatarImage src={displayAvatar} />
          <AvatarFallback className="bg-gray-200 text-gray-700 rounded-none">
            {post.author.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span 
                className="font-bold text-black truncate hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${post.author.pubkey}`);
                }}
              >
                {post.author.name}
              </span>
              <span 
                className="text-gray-500 cursor-help hidden sm:inline hover:underline cursor-pointer" 
                title={post.author.username}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${post.author.pubkey}`);
                }}
              >
                @{truncateKaspaAddress(post.author.username)}
              </span>
            </div>
            <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0 ml-2">{post.timestamp}</span>
          </div>
          <div className={`mt-1 text-black ${contentTextSize} break-words`}>
            <LinkifiedText>{post.content}</LinkifiedText>
          </div>
          {/* No interaction buttons (likes, reposts, replies) for Users view */}
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        isOpen={showUserDetailsDialog}
        onClose={() => setShowUserDetailsDialog(false)}
        userPubkey={post.author.pubkey}
        userAddress={post.author.username}
        displayName={post.author.name}
        userNickname={post.author.nickname}
        onNavigateToUserPosts={() => navigate(`/user/${post.author.pubkey}`)}
      />
    </div>
  );
};

export default UserPostCard;