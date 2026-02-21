import { find } from 'linkifyjs';

export interface YouTubeParams {
  videoId: string;
  startTime: number;      // Seek position in seconds (0 = beginning)
  isShort: boolean;       // True if the URL was a youtube.com/shorts/ link
}

const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function sanitizeVideoId(raw: string): string | null {
  // Strip any characters that aren't alphanumeric, underscore, or hyphen
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "");

  // YouTube video IDs are always exactly 11 characters
  if (cleaned.length !== 11) return null;

  // Final validation
  if (!VIDEO_ID_PATTERN.test(cleaned)) return null;

  return cleaned;
}

function parseStartTime(raw: string | null): number {
  if (!raw) return 0;
  // Strip everything except digits (handles "42s" → "42")
  const digits = raw.replace(/[^0-9]/g, "");
  const seconds = parseInt(digits, 10);
  return Number.isFinite(seconds) ? seconds : 0;
}

export function detectYouTubeUrl(url: string): YouTubeParams | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Short URL: youtu.be/{videoId}
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/")[1];
      if (!id) return null;
      const sanitized = sanitizeVideoId(id);
      if (!sanitized) return null;
      return {
        videoId: sanitized,
        startTime: parseStartTime(parsed.searchParams.get("t")),
        isShort: false,
      };
    }

    // Full YouTube URL
    if (!YOUTUBE_HOSTS.has(host)) return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const page = segments[0];
    const pathId = segments[1];

    let rawId: string | null = null;
    let isShort = false;

    if (page === "shorts" && pathId) {
      rawId = pathId;
      isShort = true;
    } else if (page === "live" && pathId) {
      rawId = pathId;
    } else if (page === "watch") {
      rawId = parsed.searchParams.get("v");
    } else if (page === "embed" && pathId) {
      rawId = pathId;
    }

    if (!rawId) return null;
    const sanitized = sanitizeVideoId(rawId);
    if (!sanitized) return null;

    return {
      videoId: sanitized,
      startTime: parseStartTime(
        parsed.searchParams.get("t") ?? parsed.searchParams.get("start")
      ),
      isShort: isShort,
    };
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function buildEmbedUrl(videoId: string, startTime: number): string {
  const params = new URLSearchParams({
    autoplay: "1",          // Start playing immediately after iframe loads
    rel: "0",               // Don't show unrelated videos at the end
    playsinline: "1",       // Inline playback on iOS
    modestbranding: "1",    // Reduce YouTube branding
  });

  if (startTime > 0) {
    params.set("start", String(startTime));
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Count how many YouTube URLs are present in a text string.
 */
export function countYouTubeUrls(text: string): number {
  const links = find(text);
  return links.filter(link => link.type === 'url' && detectYouTubeUrl(link.href)).length;
}
