import React, { useState, useRef, useEffect, useCallback } from "react";
import { EyeOff, Play } from "lucide-react";
import type { MediaClassificationItem } from "@/hooks/useComposeMediaPreview";
import { preloadImageDimensions, computeImageLayout } from "@/utils/mediaLayout";

const MAX_PREVIEW_HEIGHT = 200;

interface ComposeMediaPreviewProps {
  items: MediaClassificationItem[];
  onDismiss: (url: string) => void;
}

// --- YouTube Preview ---

function YouTubePreview({ videoId, isShort }: { videoId: string; isShort: boolean }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const aspectRatio = isShort ? "9 / 14" : "16 / 9";

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio, maxHeight: `${MAX_PREVIEW_HEIGHT}px`, maxWidth: isShort ? "160px" : "100%" }}
    >
      {!thumbFailed && (
        <img
          src={thumbnailUrl}
          alt="YouTube video"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setThumbFailed(true)}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg">
          <svg className="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- GIF Preview ---

function GifPreview({ mediaUrl }: { mediaUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    preloadImageDimensions(mediaUrl)
      .then(({ width, height }) => {
        if (cancelled) return;
        const containerWidth = containerRef.current?.clientWidth || 400;
        setLayout(computeImageLayout(width, height, containerWidth, MAX_PREVIEW_HEIGHT));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mediaUrl]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-muted"
      style={layout ? { width: `${layout.width}px`, height: `${layout.height}px` } : { width: "100%", aspectRatio: "16 / 9", maxHeight: `${MAX_PREVIEW_HEIGHT}px` }}
    >
      {loading && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={mediaUrl}
        alt="GIF preview"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain"
        onLoad={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
      <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white pointer-events-none">
        GIF
      </div>
    </div>
  );
}

// --- Video File Preview ---

function VideoPreview({ src, mimeType }: { src: string; mimeType: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoadedData = useCallback(() => {
    setLoaded(true);
    const video = videoRef.current;
    if (video) video.pause();
  }, []);

  if (failed) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-black"
      style={{ maxHeight: `${MAX_PREVIEW_HEIGHT}px` }}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        style={{ maxHeight: `${MAX_PREVIEW_HEIGHT}px` }}
        onLoadedData={handleLoadedData}
        onError={() => setFailed(true)}
      >
        <source src={src} type={mimeType} />
      </video>
      {loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Play className="h-10 w-10 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}

// --- Image Preview ---

function ImagePreview({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    preloadImageDimensions(src)
      .then(({ width, height }) => {
        if (cancelled) return;
        const containerWidth = containerRef.current?.clientWidth || 400;
        setLayout(computeImageLayout(width, height, containerWidth, MAX_PREVIEW_HEIGHT));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [src]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-muted"
      style={layout ? { width: `${layout.width}px`, height: `${layout.height}px` } : { width: "100%", aspectRatio: "16 / 9", maxHeight: `${MAX_PREVIEW_HEIGHT}px` }}
    >
      {loading && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={src}
        alt="Image preview"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain"
        onLoad={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// --- Single Item Wrapper ---

function PreviewItem({ item, onDismiss }: { item: MediaClassificationItem; onDismiss: () => void }) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleRemove}
        className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 transition-colors"
        aria-label="Hide preview"
      >
        <EyeOff size={16} />
      </button>

      {item.type === "youtube" && (
        <YouTubePreview videoId={item.videoId} isShort={item.isShort} />
      )}
      {item.type === "gif-platform" && (
        <GifPreview mediaUrl={item.mediaUrl} />
      )}
      {item.type === "video-file" && (
        <VideoPreview src={item.src} mimeType={item.mimeType} />
      )}
      {item.type === "image" && (
        <ImagePreview src={item.src} />
      )}
    </div>
  );
}

// --- Main Component ---

const ComposeMediaPreview: React.FC<ComposeMediaPreviewProps> = ({ items, onDismiss }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <PreviewItem
          key={item.url}
          item={item}
          onDismiss={() => onDismiss(item.url)}
        />
      ))}
    </div>
  );
};

export default ComposeMediaPreview;
