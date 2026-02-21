import React, { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { getYouTubeThumbnail, buildEmbedUrl } from "@/utils/youtubeDetection";

interface YouTubeEmbedProps {
  videoId: string;
  startTime?: number;
  isShort?: boolean;
  className?: string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  startTime = 0,
  isShort = false,
  className = "",
}) => {
  const { autoRenderVideos } = useUserSettings();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const thumbnailUrl = getYouTubeThumbnail(videoId);
  const embedUrl = buildEmbedUrl(videoId, startTime);
  const aspectRatio = isShort ? "9 / 14" : "16 / 9";

  // Deactivate iframe when scrolled out of view
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          setIsActive(false);  // Unmounts iframe
          setIsLoading(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isActive]);

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(true);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setIsActive(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Placeholder (when auto-render is disabled and not revealed)
  if (!autoRenderVideos && !isRevealed) {
    return (
      <span
        ref={containerRef}
        className={`youtube-embed-wrap my-2 block ${className}`}
      >
        <div
          className="relative overflow-hidden rounded-lg border border-border bg-background cursor-pointer hover:bg-muted transition-colors"
          style={{ aspectRatio, maxWidth: isShort ? "400px" : "100%", maxHeight: "540px", margin: "0 auto" }}
          onClick={handleReveal}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to reveal video</p>
          </div>
        </div>
      </span>
    );
  }

  // Thumbnail with play button (active when auto-render is on OR manually revealed)
  return (
    <span
      ref={containerRef}
      className={`youtube-embed-wrap my-2 block ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-black"
        style={{
          aspectRatio,
          maxWidth: isShort ? "400px" : "100%",
          maxHeight: "540px",
          margin: "0 auto"
        }}
      >
        {!isActive ? (
          <>
            {/* Thumbnail */}
            <img
              src={thumbnailUrl}
              alt="YouTube video"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />

            {/* Play button overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-colors hover:bg-black/30"
              onClick={handlePlayClick}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg hover:bg-red-700 transition-colors">
                <Play className="h-7 w-7 translate-x-0.5 text-white fill-white" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              </div>
            )}

            {/* YouTube iframe */}
            <iframe
              src={embedUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="eager"
              onLoad={handleIframeLoad}
              className="absolute inset-0 h-full w-full border-0"
            />
          </>
        )}
      </div>
    </span>
  );
};

export default YouTubeEmbed;
