import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
  immediate?: boolean;
}

/**
 * Custom hook for managing polling intervals
 * Prevents multiple intervals from running and ensures proper cleanup
 */
export const usePolling = (
  callback: () => Promise<void> | void,
  options: UsePollingOptions
) => {
  const { interval, enabled = true, immediate = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const isPollingRef = useRef(false);

  // Keep callback ref up to date
  callbackRef.current = callback;

  const startPolling = useCallback(() => {
    if (!enabled || isPollingRef.current) return;

    isPollingRef.current = true;

    // Execute immediately if requested
    if (immediate) {
      callbackRef.current();
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval, enabled, immediate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const restartPolling = useCallback(() => {
    stopPolling();
    startPolling();
  }, [stopPolling, startPolling]);

  // Manage polling lifecycle
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, interval]); // Only restart when enabled or interval changes, not when callbacks change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling: isPollingRef.current
  };
};