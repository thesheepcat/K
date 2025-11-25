import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type QuoteData } from "@/models/types";
import { toSvg } from 'jdenticon';
import { LinkifiedText } from '@/utils/linkUtils';

interface SimplifiedPostCardProps {
  quote: QuoteData;
  onClick?: (e?: React.MouseEvent) => void;
}

const SimplifiedPostCard: React.FC<SimplifiedPostCardProps> = ({ quote, onClick }) => {
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

  return (
    <div
      className={`border border-border p-3 bg-muted rounded-none transition-colors ${
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
            <LinkifiedText onMentionClick={() => {}}>{quote.referencedMessage}</LinkifiedText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedPostCard;
