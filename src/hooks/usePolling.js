import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for background data polling with intelligent lifecycle management
 * 
 * Features:
 * - Automatic polling at specified intervals
 * - Pause/resume based on tab visibility
 * - Exponential backoff retry on errors
 * - Clean lifecycle management
 * - Performance optimized
 * 
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 30000)
 * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.retryBackoff - Initial retry backoff in milliseconds (default: 5000)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @param {Function} options.shouldUpdate - Function to determine if state should update (default: always true)
 * 
 * @returns {Object} - Polling state and controls
 */
export const usePolling = (fetchFunction, options = {}) => {
  const {
    interval = 30000,
    timeout = 10000,
    maxRetries = 3,
    retryBackoff = 5000,
    enabled = true,
    onSuccess,
    onError,
    shouldUpdate = () => true,
  } = options;

  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('active'); // 'active' | 'paused' | 'error'
  const [pollingError, setPollingError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const isTabVisibleRef = useRef(true);
  const isMountedRef = useRef(true);

  /**
   * Fetch data with timeout support
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {boolean} bypassCache - Whether to bypass cache (for manual refresh)
   */
  const fetchWithTimeout = useCallback(async (timeoutMs, bypassCache = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Pass bypassCache to fetchFunction
      const result = await fetchFunction(bypassCache);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }, [fetchFunction]);

  /**
   * Execute a single poll
   * @param {boolean} isManual - Whether this is a manual refresh (bypasses cache)
   */
  const executePoll = useCallback(async (isManual = false) => {
    console.log('[usePolling] executePoll called', { isManual, isMounted: isMountedRef.current, isTabVisible: isTabVisibleRef.current });

    if (!isMountedRef.current) {
      console.log('[usePolling] Component unmounted, skipping poll');
      return;
    }

    // Don't poll if tab is not visible (unless manual refresh)
    if (!isTabVisibleRef.current && !isManual) {
      console.log('[usePolling] Tab not visible, skipping poll');
      return;
    }

    try {
      if (isManual) {
        console.log('[usePolling] Manual refresh - setting isRefreshing to true and bypassing cache');
        setIsRefreshing(true);
      }

      // For manual refresh, bypass cache to force fresh data
      const bypassCache = isManual;
      console.log('[usePolling] Fetching data with timeout:', timeout, 'bypassCache:', bypassCache);
      const data = await fetchWithTimeout(timeout, bypassCache);
      console.log('[usePolling] Data fetched successfully', { lotsCount: data?.lots?.length, studentsCount: data?.students?.length });

      if (!isMountedRef.current) {
        console.log('[usePolling] Component unmounted after fetch, skipping update');
        return;
      }

      // Check if we should update state
      console.log('[usePolling] Checking if should update state...');
      const shouldUpdateState = shouldUpdate(data);
      console.log('[usePolling] shouldUpdate returned:', shouldUpdateState);

      if (shouldUpdateState) {
        console.log('[usePolling] Updating state and calling onSuccess');
        setLastUpdated(new Date());
        setPollingStatus('active');
        setPollingError(null);
        setRetryCount(0);

        if (onSuccess) {
          onSuccess(data, isManual);
        }
      } else {
        console.log('[usePolling] No update needed, skipping state update');
      }

      return data;
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('[usePolling] Fetch error:', error);

      // Only handle errors for manual refresh or if we've exceeded retries
      if (isManual || retryCount >= maxRetries - 1) {
        setPollingStatus('error');
        setPollingError(error.message || 'Failed to fetch data');

        if (onError) {
          onError(error, isManual);
        }
      }

      // Implement exponential backoff for automatic retries
      if (!isManual && retryCount < maxRetries) {
        const backoffDelay = retryBackoff * Math.pow(2, retryCount);
        setRetryCount(prev => prev + 1);

        console.log(`[usePolling] Retry ${retryCount + 1}/${maxRetries} in ${backoffDelay}ms`);

        retryTimeoutRef.current = setTimeout(() => {
          executePoll(false);
        }, backoffDelay);
      }

      throw error;
    } finally {
      if (isMountedRef.current && isManual) {
        setIsRefreshing(false);
      }
    }
  }, [fetchWithTimeout, timeout, shouldUpdate, onSuccess, onError, retryCount, maxRetries, retryBackoff]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    console.log('[usePolling] Manual refresh triggered');

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      console.log('[usePolling] Clearing pending retry timeout');
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Reset retry count on manual refresh
    setRetryCount(0);

    console.log('[usePolling] Executing manual poll');
    return executePoll(true);
  }, [executePoll]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    console.log('[usePolling] startPolling called, interval:', interval);

    if (intervalRef.current) {
      console.log('[usePolling] Clearing existing interval');
      clearInterval(intervalRef.current);
    }

    // Execute immediately on start
    console.log('[usePolling] Executing initial poll');
    executePoll(false);

    // Then set up interval
    console.log('[usePolling] Setting up interval for', interval, 'ms');
    intervalRef.current = setInterval(() => {
      console.log('[usePolling] Interval triggered, executing poll');
      executePoll(false);
    }, interval);

    setPollingStatus('active');
    console.log('[usePolling] Polling started successfully');
  }, [executePoll, interval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setPollingStatus('paused');
  }, []);

  /**
   * Handle tab visibility changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isTabVisibleRef.current = isVisible;

      if (enabled) {
        if (isVisible) {
          console.log('[usePolling] Tab visible - resuming polling');
          setPollingStatus('active');
          // Fetch immediately when tab becomes visible
          executePoll(false);
          // Restart interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          intervalRef.current = setInterval(() => {
            executePoll(false);
          }, interval);
        } else {
          console.log('[usePolling] Tab hidden - pausing polling');
          setPollingStatus('paused');
          // Stop interval but don't clear retry timeout
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, executePoll, interval]);

  /**
   * Start/stop polling based on enabled flag
   */
  useEffect(() => {
    console.log('[usePolling] enabled flag changed:', enabled);

    if (enabled) {
      console.log('[usePolling] Polling enabled, starting...');
      startPolling();
    } else {
      console.log('[usePolling] Polling disabled, stopping...');
      stopPolling();
    }

    return () => {
      console.log('[usePolling] Cleanup: stopping polling');
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  /**
   * Set mounted flag on mount and cleanup on unmount
   * This is critical for React StrictMode compatibility
   */
  useEffect(() => {
    console.log('[usePolling] Component mounted, setting isMountedRef to true');
    isMountedRef.current = true;

    return () => {
      console.log('[usePolling] Component unmounting, setting isMountedRef to false');
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    lastUpdated,
    isRefreshing,
    pollingStatus,
    pollingError,
    retryCount,
    refresh,
    startPolling,
    stopPolling,
  };
};

export default usePolling;

