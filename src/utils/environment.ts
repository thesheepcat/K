/**
 * Environment detection utilities
 */

export const isProduction = (): boolean => {
  return import.meta.env.PROD || window.location.protocol === 'https:';
};

export const isDevelopment = (): boolean => {
  return !isProduction();
};

export const isValidApiUrl = (url: string): boolean => {
  try {
    // Allow relative paths
    if (url.startsWith('/')) {
      return true;
    }
    
    // Validate full URLs
    const urlObject = new URL(url);
    return ['http:', 'https:'].includes(urlObject.protocol);
  } catch {
    return false;
  }
};