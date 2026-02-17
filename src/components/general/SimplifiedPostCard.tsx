import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type QuoteData } from "@/models/types";
import { toSvg } from 'jdenticon';
import { LinkifiedText } from '@/utils/linkUtils';
import { countImageUrls } from '@/utils/mediaDetection';
import { countYouTubeUrls } from '@/utils/youtubeDetection';
import { countVideoFileUrls } from '@/utils/videoDetection';
import { countGifUrls } from '@/utils/gifDetection';
import { useNavigate } from 'react-router-dom';

interface SimplifiedPostCardProps {
  quote: QuoteData;
  onClick?: (e?: React.MouseEvent) => void;
}

const SimplifiedPostCard: React.FC<SimplifiedPostCardProps> = ({ quote, onClick }) => {
  const navigate = useNavigate();

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to search contents view with the hashtag
    navigate('/search-contents', {
      state: { initialHashtag: hashtag }
    });
  };
  // Generate avatar for referenced post
  const displayAvatar = useMemo(() => {
    if (quote.referencedProfileImage) {
      return `data:image/png;base64,${quote.referencedProfileImage}`;
    }

    const identifier = quote.referencedSenderPubkey;
    const svgString = toSvg(identifier, 32);
    const encodedSvg = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
  }, [quote.referencedProfileImage, quote.referencedSenderPubkey]);

  // Display name logic: use nickname if available, otherwise truncate pubkey
  const displayName = quote.referencedNickname
    ? quote.referencedNickname
    : `${quote.referencedSenderPubkey.slice(0, 4)}...${quote.referencedSenderPubkey.slice(-4)}`;

  // Truncate long quoted messages
  const MAX_CHARS = 250;
  const isLongMessage = quote.referencedMessage.length > MAX_CHARS;
  const displayContent = isLongMessage
    ? quote.referencedMessage.substring(0, MAX_CHARS) + '.....'
    : quote.referencedMessage;

  const hasHiddenImages = countImageUrls(quote.referencedMessage) > 1;
  const hasHiddenVideos = (countYouTubeUrls(quote.referencedMessage) + countVideoFileUrls(quote.referencedMessage) + countGifUrls(quote.referencedMessage)) > 1;

  return (
    <div
      className={`border border-border p-3 bg-muted rounded-md transition-colors ${
        onClick ? 'cursor-pointer hover:bg-accent hover:bg-opacity-30' : 'cursor-default'
      }`}
      onClick={onClick}
    >
      <div className="flex space-x-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={displayAvatar} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {displayName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-foreground text-sm truncate">
              {displayName}
            </span>
          </div>
          <div className="mt-1 text-foreground text-sm break-words whitespace-pre-wrap">
            <LinkifiedText onMentionClick={() => {}} onHashtagClick={handleHashtagClick} maxImages={1} maxVideos={1}>{displayContent}</LinkifiedText>
          </div>
          {(hasHiddenImages || hasHiddenVideos) && (
            <div className="mt-2 p-2 bg-muted border-l-4 border-primary rounded-r">
              <p className="text-xs text-muted-foreground">
                Click to read more...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedPostCard;
