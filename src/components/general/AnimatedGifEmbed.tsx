import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play } from "lucide-react";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { preloadImageDimensions, computeImageLayout } from "@/utils/mediaLayout";

const MAX_RETRY_ATTEMPTS = 3;

interface AnimatedGifEmbedProps {
  mediaUrl: string;
  originalUrl: string;
  platform: "giphy" | "tenor";
  className?: string;
}

const AnimatedGifEmbed: React.FC<AnimatedGifEmbedProps> = ({
  mediaUrl,
  originalUrl,
  platform: _platform,
  className = "",
}) => {
  const { autoRenderVideos } = useUserSettings();
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const maxHeight = 540;

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload dimensions and compute layout
  useEffect(() => {
    if (containerWidth === 0) return;
    let cancelled = false;

    preloadImageDimensions(mediaUrl)
      .then(({ width, height }) => {
        if (cancelled) return;
        setLayout(computeImageLayout(width, height, containerWidth, maxHeight));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackHeight = Math.min(Math.round(containerWidth * 9 / 16), maxHeight);
        setLayout({ width: containerWidth, height: fallbackHeight });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mediaUrl, containerWidth]);

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (attempt >= MAX_RETRY_ATTEMPTS) {
        setFailed(true);
        return;
      }
      const separator = mediaUrl.includes("?") ? "&" : "?";
      const retryUrl = `${mediaUrl}${separator}_r=${attempt + 1}`;
      const img = event.currentTarget;
      img.src = retryUrl;
      setAttempt((a) => a + 1);
    },
    [mediaUrl, attempt]
  );

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  // Failed state: bare link
  if (failed) {
    return (
      <span className="my-1 block">
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline break-all text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          [GIF]
        </a>
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`gif-embed-wrap my-2 block ${className}`}
    >
      <span
        className="relative block overflow-hidden rounded-lg border border-border"
        style={
          layout
            ? { width: `${layout.width}px`, height: `${layout.height}px`, margin: '0 auto' }
            : { width: "100%", aspectRatio: "16 / 9", maxHeight: `${maxHeight}px` }
        }
      >
        {/* Loading shimmer */}
        {loading && (
          <span className="absolute inset-0 block animate-pulse rounded-lg bg-muted" />
        )}

        {/* Placeholder (when auto-render is disabled and not revealed) */}
        {!autoRenderVideos && !isRevealed && !loading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-background cursor-pointer hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(true);
            }}
          >
            <Play className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to reveal GIF</p>
          </div>
        )}

        {/* GIF (shown when auto-render is on OR manually revealed) */}
        {(autoRenderVideos || isRevealed) && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block h-full w-full"
          >
            <img
              src={mediaUrl}
              alt="Animated GIF"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain"
              onError={handleError}
              onLoad={handleLoad}
              style={{ cursor: "pointer" }}
            />
          </a>
        )}

        {/* GIF badge */}
        {(autoRenderVideos || isRevealed) && !loading && (
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white pointer-events-none">
            GIF
          </div>
        )}
      </span>
    </span>
  );
};

export default AnimatedGifEmbed;
