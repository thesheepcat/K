import { useState, useEffect, useRef, useCallback } from 'react';
import { find } from 'linkifyjs';
import { detectYouTubeUrl } from '@/utils/youtubeDetection';
import { detectGifPlatform } from '@/utils/gifDetection';
import { detectVideoFile } from '@/utils/videoDetection';
import { isImageUrl } from '@/utils/mediaDetection';

const TYPING_DEBOUNCE_MS = 500;

export type MediaClassificationItem =
  | { type: "youtube"; url: string; videoId: string; startTime: number; isShort: boolean }
  | { type: "gif-platform"; url: string; platform: "giphy" | "tenor"; mediaUrl: string; originalUrl: string }
  | { type: "video-file"; url: string; src: string; mimeType: string }
  | { type: "image"; url: string; src: string };

function classifyUrl(url: string): MediaClassificationItem | null {
  const yt = detectYouTubeUrl(url);
  if (yt) return { type: "youtube", url, ...yt };

  const gif = detectGifPlatform(url);
  if (gif) return { type: "gif-platform", url, ...gif };

  const video = detectVideoFile(url);
  if (video) return { type: "video-file", url, ...video };

  if (isImageUrl(url)) return { type: "image", url, src: url };

  return null;
}

export function useComposeMediaPreview(text: string) {
  const [items, setItems] = useState<MediaClassificationItem[]>([]);

  const prevTextRef = useRef(text);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  const processText = useCallback((currentText: string) => {
    const links = find(currentText);
    const urls = links.filter((link) => link.type === 'url');

    // Prune dismissed URLs that are no longer in the text
    const currentHrefs = new Set(urls.map((u) => u.href));
    for (const dismissed of dismissedRef.current) {
      if (!currentHrefs.has(dismissed)) {
        dismissedRef.current.delete(dismissed);
      }
    }

    // Classify all non-dismissed media URLs
    const results: MediaClassificationItem[] = [];
    for (const link of urls) {
      if (dismissedRef.current.has(link.href)) continue;
      const result = classifyUrl(link.href);
      if (result) results.push(result);
    }

    setItems(results);
  }, []);

  useEffect(() => {
    const prevText = prevTextRef.current;
    prevTextRef.current = text;

    // Paste detection: length increase > 1
    const isPaste = text.length - prevText.length > 1;

    if (isPaste) {
      processText(text);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => processText(text), TYPING_DEBOUNCE_MS);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, processText]);

  const dismissItem = useCallback((url: string) => {
    dismissedRef.current.add(url);
    setItems((prev) => prev.filter((item) => item.url !== url));
  }, []);

  return { items, dismissItem };
}
