export interface ImageLayout {
  width: number;
  height: number;
}

export function preloadImageDimensions(
  src: string,
  timeoutMs: number = 8000
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      reject(new Error("Image preload timed out"));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Image preload failed"));
    };
    img.src = src;
  });
}

export function computeImageLayout(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  maxHeight: number = 620
): ImageLayout {
  const ratio = naturalWidth / naturalHeight;

  let width: number;
  let height: number;

  if (ratio < 1) {
    // Portrait: cap height, derive width
    height = Math.min(maxHeight, containerWidth / ratio);
    width = height * ratio;
    // Ensure it doesn't exceed container
    if (width > containerWidth) {
      width = containerWidth;
      height = width / ratio;
    }
  } else {
    // Landscape or square: fill width, derive height
    width = containerWidth;
    height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
}
