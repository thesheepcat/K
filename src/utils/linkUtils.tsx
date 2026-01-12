import React from 'react';
import Linkify from 'linkify-react';
import { detectMentionsInText, formatPublicKeyForDisplay } from '@/utils/kaspaAddressUtils';

/**
 * Utility function to detect URLs in text and convert them to clickable links using linkify-react
 * Also detects and styles Kaspa public key mentions
 */

export const linkifyText = (text: string, onMentionClick?: (pubkey: string) => void): React.ReactNode[] => {
  // First, handle mentions
  const mentions = detectMentionsInText(text);

  // Create segments with mentions marked
  const segments: Array<{text: string, type: 'text' | 'mention', pubkey?: string}> = [];
  let lastIndex = 0;

  mentions.forEach((mention) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      segments.push({ text: text.substring(lastIndex, mention.startIndex), type: 'text' });
    }

    // Add mention
    segments.push({
      text: text.substring(mention.startIndex, mention.endIndex),
      type: 'mention',
      pubkey: mention.pubkey
    });

    lastIndex = mention.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), type: 'text' });
  }

  // If no mentions, create single text segment
  if (segments.length === 0) {
    segments.push({ text, type: 'text' });
  }

  // Now process each segment
  const result: React.ReactNode[] = [];
  let nodeIndex = 0;

  segments.forEach((segment) => {
    if (segment.type === 'mention') {
      // Render mention as styled link
      result.push(
        <span
          key={`mention-${nodeIndex++}`}
          className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline"
          title={segment.pubkey}
          onClick={(e) => {
            e.stopPropagation();
            if (onMentionClick && segment.pubkey) {
              onMentionClick(segment.pubkey);
            }
          }}
        >
          @{formatPublicKeyForDisplay(segment.pubkey || '', 25)}
        </span>
      );
    } else {
      // Use linkify-react for URL detection and rendering in text segments
      result.push(
        <Linkify
          key={`text-${nodeIndex++}`}
          options={{
            className: 'text-info hover:text-info/80 underline break-all',
            target: '_blank',
            rel: 'noopener noreferrer',
            onClick: (e: React.MouseEvent) => e.stopPropagation(), // Prevent card click when clicking link
          }}
        >
          {segment.text}
        </Linkify>
      );
    }
  });

  return result;
};

/**
 * React component that renders text with clickable links
 */
interface LinkifiedTextProps {
  children: string;
  className?: string;
  onMentionClick?: (pubkey: string) => void;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ children, className, onMentionClick }) => {
  const linkedContent = linkifyText(children, onMentionClick);
  
  return (
    <span className={className}>
      {linkedContent}
    </span>
  );
};