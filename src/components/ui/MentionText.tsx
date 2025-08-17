import React from 'react';
import { detectMentionsInText, formatPublicKeyForDisplay } from '@/utils/kaspaAddressUtils';

interface MentionTextProps {
  text: string;
  className?: string;
  onMentionClick?: (pubkey: string) => void;
}

const MentionText: React.FC<MentionTextProps> = ({ text, className = '', onMentionClick }) => {
  const mentions = detectMentionsInText(text);
  
  if (mentions.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  mentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, mention.startIndex));
    }
    
    // Add styled mention
    parts.push(
      <span
        key={`mention-${index}`}
        className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline"
        title={mention.pubkey}
        onClick={() => {
          if (onMentionClick) {
            onMentionClick(mention.pubkey);
          }
        }}
      >
        @{formatPublicKeyForDisplay(mention.pubkey, 25)}
      </span>
    );
    
    lastIndex = mention.endIndex;
  });
  
  // Add remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return <span className={className}>{parts}</span>;
};

export default MentionText;