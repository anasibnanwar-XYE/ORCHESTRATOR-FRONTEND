/**
 * useBackgroundFetch — stale-while-revalidate data fetching hook.
 *
 * On the very first load (no cached data), shows a loading state.
 * On subsequent refreshes (background revalidation), silently updates
 * the data without showing a loading spinner, keeping the UI stable.
 *
 * Optionally polls on a given interval (ms).
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useBackgroundFetch(
 *     () => salesApi.getDashboard(),
 *     { interval: 60_000 }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseBackgroundFetchOptions {
  /** Auto-refresh interval in milliseconds. Set to 0 to disable. Default: 0 */
  interval?: number;
  /** Whether to kick off the initial fetch. Default: true */
  enabled?: boolean;
}

interface UseBackgroundFetchResult<T> {
  /** Most recent data (stale or fresh). Null only on first load. */
  data: T | null;
  /** True only during the very first fetch (before we have any data). */
  isLoading: boolean;
  /** Error from the last failed fetch, null otherwise. */
  error: string | null;
  /** True when a background revalidation is in flight (data already exists). */
  isRevalidating: boolean;
  /** Manually trigger a background refetch. */
  refetch: () => void;
}

export function useBackgroundFetch<T>(
  fetchFn: () => Promise<T>,
  { interval = 0, enabled = true }: UseBackgroundFetchOptions = {},
): UseBackgroundFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const hasFetchedRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!enabled) return;

    if (hasFetchedRef.current) {
      // Subsequent fetches: revalidate silently — keep stale data visible.
      setIsRevalidating(true);
    } else {
      // First fetch: show loading spinner.
      setIsLoading(true);
    }

    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      hasFetchedRef.current = true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      // On error, preserve existing stale data — only update error state.
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, [enabled]);

  // Initial fetch on mount (and when enabled changes).
  useEffect(() => {
    void fetch();
  }, [fetch]);

  // Background polling interval.
  useEffect(() => {
    if (!enabled || interval <= 0) return;
    const id = setInterval(() => {
      void fetch();
    }, interval);
    return () => clearInterval(id);
  }, [fetch, enabled, interval]);

  const refetch = useCallback(() => {
    void fetch();
  }, [fetch]);

  return { data, isLoading, error, isRevalidating, refetch };
}
