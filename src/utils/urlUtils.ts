/**
 * Normalizes an API base URL to ensure it's in the correct format
 *
 * Handles various URL formats:
 * - Relative paths: /api → /api
 * - Full URLs with protocol: https://example.com, http://example.com:5000 → unchanged
 * - Domain names without protocol: example.com → https://example.com
 * - Domain names with port: example.com:5000 → https://example.com:5000
 * - IP addresses without protocol: 192.168.1.1 → http://192.168.1.1
 * - IP addresses with port: 192.168.1.1:3000 → http://192.168.1.1:3000
 *
 * Trailing slashes are always removed.
 *
 * @param url - The URL to normalize
 * @returns Normalized URL without trailing slash
 */
export const normalizeApiUrl = (url: string): string => {
  // Trim whitespace
  let normalized = url.trim();

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // If empty after trimming, return as-is
  if (!normalized) {
    return normalized;
  }

  // If it's a relative path (starts with /), return as-is
  if (normalized.startsWith('/')) {
    return normalized;
  }

  // If it already has a protocol (http:// or https://), return as-is
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  // If it's a domain or IP without protocol, add protocol based on type
  // IP addresses (with or without port) get http://
  // Domain names get https://
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(normalized);
  const protocol = isIpAddress ? 'http://' : 'https://';
  normalized = protocol + normalized;

  return normalized;
};

/**
 * Validates if a URL string is a valid API URL
 *
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export const isValidApiUrl = (url: string): boolean => {
  const normalized = normalizeApiUrl(url);

  // Empty URLs are invalid
  if (!normalized) {
    return false;
  }

  // Relative paths are valid
  if (normalized.startsWith('/')) {
    return true;
  }

  // Try to create a URL object to validate full URLs
  try {
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets a user-friendly error message for an invalid URL
 *
 * @param url - The invalid URL
 * @returns Error message describing what's wrong
 */
export const getUrlValidationError = (url: string): string | null => {
  const trimmed = url.trim();

  if (!trimmed) {
    return 'URL cannot be empty';
  }

  if (!isValidApiUrl(trimmed)) {
    return 'Invalid URL format. Use /api, example.com, or https://example.com';
  }

  return null;
};
