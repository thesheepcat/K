import { useMemo } from 'react';
import { toSvg } from 'jdenticon';

/**
 * Custom hook to generate a jdenticon avatar based on a pubkey or username
 * @param identifier - The pubkey or username to generate the avatar for (preferably full pubkey for consistency)
 * @param size - The size of the avatar (default: 100)
 * @returns A data URL for the generated SVG avatar
 */
export const useJdenticonAvatar = (identifier: string, size: number = 100): string => {
  const avatarDataUrl = useMemo(() => {
    if (!identifier) return '';
    
    // Generate SVG using jdenticon
    const svgString = toSvg(identifier, size);
    
    // Encode the SVG for use as a data URL
    const encodedSvg = encodeURIComponent(svgString);
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
    
    return dataUrl;
  }, [identifier, size]);

  return avatarDataUrl;
};