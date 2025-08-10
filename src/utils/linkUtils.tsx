import React from 'react';

/**
 * Utility function to detect URLs in text and convert them to clickable links
 */

// Enhanced URL regex that supports various URL formats including domains without www
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?|www\.(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?|(?:[-\w]+\.)+(?:pages\.dev|com|org|net|edu|gov|io|co|app|tech|dev|ai|xyz|info|biz)(?:[:\d]+)?(?:\/(?:[\w/_.-])*)?(?:\?(?:[\w&=%.-])*)?(?:#(?:[\w.-])*)?)/gi;

export const linkifyText = (text: string): React.ReactNode[] => {
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    // Check if this part is a URL
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
      
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
        >
          {part}
        </a>
      );
    }
    
    return part;
  });
};

/**
 * React component that renders text with clickable links
 */
interface LinkifiedTextProps {
  children: string;
  className?: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ children, className }) => {
  const linkedContent = linkifyText(children);
  
  return (
    <span className={className}>
      {linkedContent}
    </span>
  );
};