import React from 'react';
import { detectMentionsInText, formatPublicKeyForDisplay } from '@/utils/kaspaAddressUtils';

/**
 * Utility function to detect URLs in text and convert them to clickable links
 * Also detects and styles Kaspa public key mentions
 */

// Enhanced URL regex that supports various URL formats including domains without www
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?|www\.(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?|(?:[-\w]+\.)+(?:pages\.dev|com|org|net|edu|gov|io|co|app|tech|dev|ai|xyz|info|biz)(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?)/gi;

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
  
  // Now process each segment for URLs
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
      // Process text segment for URLs
      const urlParts = segment.text.split(URL_REGEX);
      
      urlParts.forEach((part) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex for next test
          URL_REGEX.lastIndex = 0;
          
          // Determine if we need to add protocol
          let href = part;
          if (part.startsWith('www.') || (!part.startsWith('http://') && !part.startsWith('https://'))) {
            // Add https:// if it doesn't already have a protocol
            if (!part.startsWith('http://') && !part.startsWith('https://')) {
              href = `https://${part}`;
            }
          }
          
          result.push(
            <a
              key={`url-${nodeIndex++}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-info hover:text-info/80 underline break-all"
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
            >
              {part}
            </a>
          );
        } else if (part) {
          result.push(<span key={`text-${nodeIndex++}`}>{part}</span>);
        }
      });
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