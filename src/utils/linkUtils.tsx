import React from 'react';
import Linkify from 'linkify-react';
import { find } from 'linkifyjs';
import { detectMentionsInText, formatPublicKeyForDisplay } from '@/utils/kaspaAddressUtils';
import { isImageUrl } from '@/utils/mediaDetection';
import { detectYouTubeUrl } from '@/utils/youtubeDetection';
import { detectVideoFile } from '@/utils/videoDetection';
import { detectGifPlatform } from '@/utils/gifDetection';
import ExternalImage from '@/components/general/ExternalImage';
import YouTubeEmbed from '@/components/general/YouTubeEmbed';
import ExternalVideo from '@/components/general/ExternalVideo';
import AnimatedGifEmbed from '@/components/general/AnimatedGifEmbed';

/**
 * Utility function to detect URLs in text and convert them to clickable links using linkify-react
 * Also detects and styles Kaspa public key mentions and hashtags
 */

/**
 * Detect valid hashtags in text based on HASHTAG_IMPLEMENTATION_SPEC.md rules
 */
const detectHashtagsInText = (text: string): Array<{hashtag: string, startIndex: number, endIndex: number}> => {
  const hashtags: Array<{hashtag: string, startIndex: number, endIndex: number}> = [];

  // Pattern: #[\p{L}\p{N}_]{1,30}
  // Must be preceded by start of string OR whitespace
  // Must be followed by end of string OR whitespace OR punctuation
  const hashtagPattern = /#[\p{L}\p{N}_]{1,30}/gu;

  let match;
  while ((match = hashtagPattern.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    // Check boundary before hashtag
    const validBefore = matchStart === 0 || /\s/.test(text[matchStart - 1]);

    // Check boundary after hashtag
    const validAfter = matchEnd >= text.length || /[\s.,;!?]/.test(text[matchEnd]);

    if (validBefore && validAfter) {
      hashtags.push({
        hashtag: match[0].substring(1).toLowerCase(), // Remove # and convert to lowercase
        startIndex: matchStart,
        endIndex: matchEnd
      });
    }
  }

  return hashtags;
};

export const linkifyText = (text: string, onMentionClick?: (pubkey: string) => void, onHashtagClick?: (hashtag: string) => void, maxImages?: number, maxVideos?: number): React.ReactNode[] => {
  // Pre-scan: build Sets of allowed media URLs (idempotent, safe for React strict mode double-rendering)
  let allowedImageUrls: Set<string> | undefined;
  let allowedVideoUrls: Set<string> | undefined;

  if (maxImages !== undefined || maxVideos !== undefined) {
    const links = find(text);

    if (maxImages !== undefined) {
      const imageUrls = links
        .filter(link => link.type === 'url' && isImageUrl(link.href))
        .map(link => link.href);
      allowedImageUrls = new Set(imageUrls.slice(0, maxImages));
    }

    if (maxVideos !== undefined) {
      const videoUrls = links
        .filter(link => link.type === 'url' && (detectYouTubeUrl(link.href) || detectGifPlatform(link.href) || detectVideoFile(link.href)))
        .map(link => link.href);
      allowedVideoUrls = new Set(videoUrls.slice(0, maxVideos));
    }
  }

  // First, handle mentions and hashtags
  const mentions = detectMentionsInText(text);
  const hashtags = detectHashtagsInText(text);

  // Combine and sort all special segments by position
  const allSegments: Array<{startIndex: number, endIndex: number, type: 'mention' | 'hashtag', data: string}> = [
    ...mentions.map(m => ({ startIndex: m.startIndex, endIndex: m.endIndex, type: 'mention' as const, data: m.pubkey })),
    ...hashtags.map(h => ({ startIndex: h.startIndex, endIndex: h.endIndex, type: 'hashtag' as const, data: h.hashtag }))
  ].sort((a, b) => a.startIndex - b.startIndex);

  // Create segments with mentions and hashtags marked
  const segments: Array<{text: string, type: 'text' | 'mention' | 'hashtag', data?: string}> = [];
  let lastIndex = 0;

  allSegments.forEach((segment) => {
    // Add text before this segment
    if (segment.startIndex > lastIndex) {
      segments.push({ text: text.substring(lastIndex, segment.startIndex), type: 'text' });
    }

    // Add the special segment (mention or hashtag)
    segments.push({
      text: text.substring(segment.startIndex, segment.endIndex),
      type: segment.type,
      data: segment.data
    });

    lastIndex = segment.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), type: 'text' });
  }

  // If no special segments, create single text segment
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
          title={segment.data}
          onClick={(e) => {
            e.stopPropagation();
            if (onMentionClick && segment.data) {
              onMentionClick(segment.data);
            }
          }}
        >
          @{formatPublicKeyForDisplay(segment.data || '', 25)}
        </span>
      );
    } else if (segment.type === 'hashtag') {
      // Render hashtag as styled link
      result.push(
        <span
          key={`hashtag-${nodeIndex++}`}
          className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline"
          title={`Search for #${segment.data}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onHashtagClick && segment.data) {
              onHashtagClick(segment.data);
            }
          }}
        >
          {segment.text}
        </span>
      );
    } else {
      // Use linkify-react for URL detection and rendering in text segments
      result.push(
        <Linkify
          key={`text-${nodeIndex++}`}
          options={{
            render: {
              url: ({ attributes, content }: { attributes: Record<string, any>; content: string }) => {
                const href: string = attributes.href || '';

                // Handle YouTube URLs (priority 1)
                const youtubeParams = detectYouTubeUrl(href);
                if (youtubeParams) {
                  // If no limit or within limit, render the video
                  if (allowedVideoUrls === undefined || allowedVideoUrls.has(href)) {
                    return (
                      <YouTubeEmbed
                        key={`yt-${youtubeParams.videoId}`}
                        videoId={youtubeParams.videoId}
                        startTime={youtubeParams.startTime}
                        isShort={youtubeParams.isShort}
                      />
                    );
                  }
                  // If beyond maxVideos limit, hide it completely (return empty fragment)
                  return <React.Fragment key={`hidden-yt-${youtubeParams.videoId}`} />;
                }

                // Handle Giphy/Tenor GIFs (priority 2)
                const gifResult = detectGifPlatform(href);
                if (gifResult) {
                  if (allowedVideoUrls === undefined || allowedVideoUrls.has(href)) {
                    return (
                      <AnimatedGifEmbed
                        key={`gif-${href}`}
                        mediaUrl={gifResult.mediaUrl}
                        originalUrl={gifResult.originalUrl}
                        platform={gifResult.platform}
                      />
                    );
                  }
                  return <React.Fragment key={`hidden-gif-${href}`} />;
                }

                // Handle external video files (priority 3)
                const videoFile = detectVideoFile(href);
                if (videoFile) {
                  if (allowedVideoUrls === undefined || allowedVideoUrls.has(href)) {
                    return <ExternalVideo key={`vid-${href}`} src={videoFile.src} mimeType={videoFile.mimeType} />;
                  }
                  return <React.Fragment key={`hidden-vid-${href}`} />;
                }

                // Handle image URLs (priority 3)
                if (isImageUrl(href)) {
                  // If no limit or within limit, render the image
                  if (allowedImageUrls === undefined || allowedImageUrls.has(href)) {
                    return <ExternalImage key={`img-${href}`} src={href} />;
                  }
                  // If beyond maxImages limit, hide it completely (return empty fragment)
                  return <React.Fragment key={`hidden-img-${href}`} />;
                }

                // Regular URLs: render as links (priority 3)
                return (
                  <a
                    key={`link-${href}`}
                    href={href}
                    className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {content}
                  </a>
                );
              },
            },
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
 * React component that renders text with clickable links, mentions, and hashtags
 */
interface LinkifiedTextProps {
  children: string;
  className?: string;
  onMentionClick?: (pubkey: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  maxImages?: number;
  maxVideos?: number;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ children, className, onMentionClick, onHashtagClick, maxImages, maxVideos }) => {
  const linkedContent = linkifyText(children, onMentionClick, onHashtagClick, maxImages, maxVideos);

  return (
    <span className={className}>
      {linkedContent}
    </span>
  );
};