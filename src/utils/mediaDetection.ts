import { find } from 'linkifyjs';

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

export function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Count how many image URLs are present in a text string.
 * Uses linkifyjs to detect URLs, then filters for image extensions.
 */
export function countImageUrls(text: string): number {
  const links = find(text);
  return links.filter(link => link.type === 'url' && isImageUrl(link.href)).length;
}
