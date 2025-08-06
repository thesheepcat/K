import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Repeat2 } from "lucide-react";
import { type Post } from "@/models/types";
import { useNavigate } from "react-router-dom";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { truncateKaspaAddress } from "@/utils/postUtils";

interface PostCardProps {
  post: Post;
  onUpVote: (id: string) => void;
  onDownVote: (id: string) => void;
  onRepost: (id: string) => void;
  isDetailView?: boolean;
  isComment?: boolean;
  onClick?: () => void;
  onReply?: (postId: string) => void;
  context?: 'detail' | 'list'; // New prop to indicate where the PostCard is being rendered
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onUpVote, // Currently disabled - TO BE IMPLEMENTED
  onDownVote, // Currently disabled - TO BE IMPLEMENTED
  onRepost, // Currently disabled - TO BE IMPLEMENTED
  isDetailView = false, 
  isComment = false, 
  onClick,
  onReply,
  context = 'list'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}) => {
  // Suppress TypeScript warnings for temporarily disabled parameters
  void onUpVote;
  void onDownVote;
  void onRepost;
  const navigate = useNavigate();
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  
  // Generate dynamic avatar based on pubkey for consistency
  const avatarSizePixels = isDetailView ? 48 : isComment ? 32 : 40;
  const jdenticonAvatar = useJdenticonAvatar(post.author.pubkey || post.author.username, avatarSizePixels);

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
  const avatarSize = isDetailView ? "h-12 w-12" : isComment ? "h-8 w-8" : "h-10 w-10";
  const contentTextSize = isDetailView ? "text-lg" : "text-base";
  
  // Check if message is longer than 500 characters and truncate if needed
  const MAX_CHARS = 500;
  const isLongMessage = post.content.length > MAX_CHARS;
  const displayContent = isDetailView || !isLongMessage 
    ? post.content 
    : post.content.substring(0, MAX_CHARS) + '.....';
  
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
          <AvatarImage src={jdenticonAvatar} />
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
          <p className={`mt-1 text-black ${contentTextSize} break-words whitespace-pre-wrap`}>{displayContent}</p>
          {isLongMessage && !isDetailView && (
            <div className="mt-2 p-2 bg-gray-100 border-l-4 border-blue-500 rounded-r">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Long message.</span> Click to read more...
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 p-1 sm:p-2 rounded-none flex-1 flex justify-center min-w-0"
              // TO BE IMPLEMENTED - Reply count click functionality and hover effects
              // className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-1 sm:p-2 rounded-none hover:rounded-none flex-1 flex justify-center min-w-0"
              // onClick={() => handleReplyCountClick(post.id)}
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">{post.replies}</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className={`p-1 sm:p-2 rounded-none flex-1 flex justify-center min-w-0 ${post.upVoted ? 'text-blue-500' : 'text-gray-500'}`}
              // TO BE IMPLEMENTED - Up-vote count click functionality and hover effects
              // className={`p-1 sm:p-2 rounded-none hover:rounded-none flex-1 flex justify-center min-w-0 ${post.upVoted ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'}`}
              // onClick={() => onUpVote(post.id)}
            >
              <ThumbsUp className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${post.upVoted ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm">{post.upVotes || 0}</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className={`p-1 sm:p-2 rounded-none flex-1 flex justify-center min-w-0 ${post.downVoted ? 'text-red-500' : 'text-gray-500'}`}
              // TO BE IMPLEMENTED - Down-vote count click functionality and hover effects
              // className={`p-1 sm:p-2 rounded-none hover:rounded-none flex-1 flex justify-center min-w-0 ${post.downVoted ? 'text-red-500' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
              // onClick={() => onDownVote(post.id)}
            >
              <ThumbsDown className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${post.downVoted ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm">{post.downVotes || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 sm:p-2 rounded-none flex-1 flex justify-center min-w-0 ${post.reposted ? 'text-green-500' : 'text-gray-500'}`}
              // TO BE IMPLEMENTED - Repost count click functionality and hover effects
              // className={`p-1 sm:p-2 rounded-none hover:rounded-none flex-1 flex justify-center min-w-0 ${post.reposted ? 'text-green-500' : 'text-gray-500 hover:text-green-500 hover:bg-green-50'}`}
              // onClick={() => onRepost(post.id)}
            >
              <Repeat2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">{post.reposts}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-1 sm:p-2 rounded-none hover:rounded-none flex-1 flex justify-center min-w-0"
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
              <span className="text-xs sm:text-sm">Reply</span>
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
        displayName={post.author.name}
        onNavigateToUserPosts={() => navigate(`/user/${post.author.pubkey}`)}
      />
    </div>
  );
};

export default PostCard;