/**
 * Authentication Configuration
 * 
 * Adjust these values to customize the authentication behavior
 */

export const AUTH_CONFIG = {
  // Session duration in minutes
  SESSION_DURATION_MINUTES: 60,
  
  // Show warning when this many minutes are left
  WARNING_THRESHOLD_MINUTES: 5,
  
  // Throttle session extension to this interval (in seconds)
  ACTIVITY_THROTTLE_SECONDS: 60,
} as const;

// Computed values (don't modify these directly)
export const SESSION_DURATION_MS = AUTH_CONFIG.SESSION_DURATION_MINUTES * 60 * 1000;
export const WARNING_THRESHOLD_MS = AUTH_CONFIG.WARNING_THRESHOLD_MINUTES * 60 * 1000;
export const ACTIVITY_THROTTLE_MS = AUTH_CONFIG.ACTIVITY_THROTTLE_SECONDS * 1000;
