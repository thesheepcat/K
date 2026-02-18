import { find } from 'linkifyjs';

export interface GifPlatformResult {
  platform: "giphy" | "tenor";
  mediaUrl: string;
  originalUrl: string;
}

const GIPHY_PAGE_HOSTS = new Set(["giphy.com", "www.giphy.com"]);
const GIPHY_MEDIA_HOSTS = new Set([
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "i.giphy.com",
]);

function extractGiphyId(slugOrId: string): string | null {
  const lastHyphen = slugOrId.lastIndexOf("-");
  const id = lastHyphen >= 0 ? slugOrId.substring(lastHyphen + 1) : slugOrId;
  if (id.length < 5 || !/^[a-zA-Z0-9]+$/.test(id)) return null;
  return id;
}

function buildGiphyCdnUrl(gifId: string): string {
  return `https://i.giphy.com/media/${gifId}/giphy.webp`;
}

function matchGiphyUrl(parsed: URL, host: string, originalUrl: string): string | null {
  // Pattern 1: Page URL — giphy.com/gifs/{slug}-{gifId}
  // Must construct a CDN URL since page URLs don't serve media directly
  if (GIPHY_PAGE_HOSTS.has(host)) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments[0] !== "gifs" || !segments[1]) return null;
    const gifId = extractGiphyId(segments[1]);
    if (!gifId) return null;
    return buildGiphyCdnUrl(gifId);
  }

  // Pattern 2: Direct media URL — media.giphy.com/media/{gifId}/...
  // Already a working CDN URL, use as-is
  if (GIPHY_MEDIA_HOSTS.has(host)) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    let gifId: string | null = null;
    if (segments[0] === "media" && segments[1]) {
      gifId = segments[1];
    } else if (segments[0] && segments[0] !== "media") {
      gifId = segments[0];
    }
    if (!gifId || gifId.length < 5) return null;
    return originalUrl;
  }

  return null;
}

export function detectGifPlatform(url: string): GifPlatformResult | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Giphy
    const giphyResult = matchGiphyUrl(parsed, host, url);
    if (giphyResult) {
      return { platform: "giphy", mediaUrl: giphyResult, originalUrl: url };
    }

    // Tenor (direct media URLs only)
    if (host === "media.tenor.com") {
      return { platform: "tenor", mediaUrl: url, originalUrl: url };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Count how many Giphy/Tenor GIF URLs are present in a text string.
 */
export function countGifUrls(text: string): number {
  const links = find(text);
  return links.filter(link => link.type === 'url' && detectGifPlatform(link.href)).length;
}
