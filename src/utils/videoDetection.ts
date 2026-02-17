import { find } from 'linkifyjs';

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".ogg"];

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
};

export function detectVideoFile(url: string): { src: string; mimeType: string } | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const match = VIDEO_EXTENSIONS.find((ext) => pathname.endsWith(ext));
    if (!match) return null;
    return { src: url, mimeType: MIME_MAP[match] };
  } catch {
    return null;
  }
}

/**
 * Count how many external video file URLs are present in a text string.
 * Uses linkifyjs to detect URLs, then filters for video extensions.
 */
export function countVideoFileUrls(text: string): number {
  const links = find(text);
  return links.filter(link => link.type === 'url' && detectVideoFile(link.href)).length;
}
