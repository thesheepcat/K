import React, { useState, useEffect, useRef, useCallback } from "react";
import { Eye } from "lucide-react";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { preloadImageDimensions, computeImageLayout } from "@/utils/mediaLayout";

const MAX_RETRY_ATTEMPTS = 3;

interface ExternalImageProps {
  src: string;
  alt?: string;
  maxHeight?: number;
  className?: string;
  onLoad?: () => void;
}

const ExternalImage: React.FC<ExternalImageProps> = ({
  src,
  alt = "External image",
  maxHeight = 540,
  className = "",
  onLoad,
}) => {
  const { autoRenderImages } = useUserSettings();
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

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

    preloadImageDimensions(src)
      .then(({ width, height }) => {
        if (cancelled) return;
        setLayout(computeImageLayout(width, height, containerWidth, maxHeight));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: 16:9 at container width
        const fallbackHeight = Math.min(Math.round(containerWidth * 9 / 16), maxHeight);
        setLayout({ width: containerWidth, height: fallbackHeight });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [src, containerWidth, maxHeight]);

  // Recalculate layout when container resizes (if we already have natural dimensions)
  useEffect(() => {
    if (containerWidth === 0 || loading) return;
    // Re-measure: we can't re-read natural dims from state, so just use CSS for resize handling.
    // The initial layout is correct; CSS object-contain handles further resizing.
  }, [containerWidth, loading]);

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (attempt >= MAX_RETRY_ATTEMPTS) {
        setFailed(true);
        return;
      }

      const separator = src.includes("?") ? "&" : "?";
      const retryUrl = `${src}${separator}_r=${attempt + 1}`;

      const img = event.currentTarget;
      img.src = retryUrl;
      setAttempt((a) => a + 1);
    },
    [src, attempt]
  );

  const handleLoad = useCallback(() => {
    setLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Failed state: collapse to bare link
  if (failed) {
    return (
      <span className="my-1 block">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80 font-medium cursor-pointer hover:underline break-all text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          [image]
        </a>
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`external-image-wrap my-2 block ${className}`}
    >
      {/* Sized container */}
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
        {!autoRenderImages && !isRevealed && !loading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-background cursor-pointer hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(true);
            }}
          >
            <Eye className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to reveal image</p>
          </div>
        )}

        {/* Image (shown when auto-render is on OR manually revealed) */}
        {(autoRenderImages || isRevealed) && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
            onError={handleError}
            onLoad={handleLoad}
            onClick={(e) => {
              e.stopPropagation();
              window.open(src, "_blank");
            }}
            style={{ cursor: "pointer" }}
          />
        )}
      </span>
    </span>
  );
};

export default ExternalImage;
