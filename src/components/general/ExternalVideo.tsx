import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { computeImageLayout } from "@/utils/mediaLayout";

type PlaybackIntent = "auto" | "playing" | "paused";

interface ExternalVideoProps {
  src: string;
  mimeType: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const ExternalVideo: React.FC<ExternalVideoProps> = ({
  src,
  mimeType,
  className = "",
}) => {
  const { autoRenderVideos } = useUserSettings();
  const [isRevealed, setIsRevealed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [intent, setIntent] = useState<PlaybackIntent>("auto");
  const [isMutedByUser, setIsMutedByUser] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const wrapRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxHeight = 540;

  // Measure container width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute layout from video metadata
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || containerWidth === 0) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) return;
    setLayout(computeImageLayout(vw, vh, containerWidth, maxHeight));
    setDuration(video.duration || 0);
  }, [containerWidth]);

  // Viewport-aware autoplay
  useEffect(() => {
    if (!autoRenderVideos && !isRevealed) return;

    const container = wrapRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const video = videoRef.current;
        if (!video) return;

        if (entries[0].isIntersecting) {
          if (intent === "paused") return;
          video.muted = intent === "auto" ? true : isMutedByUser;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [intent, isMutedByUser, autoRenderVideos, isRevealed]);

  // Track time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [autoRenderVideos, isRevealed]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2000);
  }, []);

  const cancelHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = isMutedByUser;
      video.play().catch(() => {});
      setIntent("playing");
    } else {
      video.pause();
      setIntent("paused");
    }
    resetHideTimer();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    setIsMutedByUser(newMuted);
    resetHideTimer();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = fraction * duration;
    resetHideTimer();
  };

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(true);
  };

  const handleVideoError = () => {
    setFailed(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = isMutedByUser;
      video.play().catch(() => {});
      setIntent("playing");
    } else {
      video.pause();
      setIntent("paused");
    }
    resetHideTimer();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Failed state: bare link
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
          [video]
        </a>
      </span>
    );
  }

  // Placeholder (when auto-render is disabled and not revealed)
  if (!autoRenderVideos && !isRevealed) {
    return (
      <span
        ref={wrapRef}
        className={`external-video-wrap my-2 block ${className}`}
      >
        <div
          className="relative overflow-hidden rounded-lg border border-border bg-background cursor-pointer hover:bg-muted transition-colors"
          style={{
            ...(layout
              ? { width: `${layout.width}px`, height: `${layout.height}px`, margin: "0 auto" }
              : { width: "100%", aspectRatio: "16 / 9", maxHeight: `${maxHeight}px` }),
          }}
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

  // Video player
  return (
    <span
      ref={wrapRef}
      className={`external-video-wrap my-2 block ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-black"
        style={
          layout
            ? { width: `${layout.width}px`, height: `${layout.height}px`, margin: "0 auto" }
            : { width: "100%", aspectRatio: "16 / 9", maxHeight: `${maxHeight}px` }
        }
        onMouseMove={resetHideTimer}
        onMouseEnter={cancelHideTimer}
        onMouseLeave={resetHideTimer}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          className="h-full w-full cursor-pointer"
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          onClick={handleVideoClick}
        >
          <source src={src} type={mimeType} />
        </video>

        {/* Controls overlay */}
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 transition-opacity duration-200"
          style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? "auto" : "none" }}
        >
          {/* Progress bar */}
          <div
            className="mb-2 h-1 w-full cursor-pointer rounded-full bg-white/30"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Button row */}
          <div className="flex items-center gap-3 text-white">
            <button onClick={handlePlayPause} className="hover:text-white/80">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={handleMuteToggle} className="hover:text-white/80">
              {isMutedByUser ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <span className="ml-1 text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </span>
  );
};

export default ExternalVideo;
