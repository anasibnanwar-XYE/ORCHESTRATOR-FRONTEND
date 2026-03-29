/**
 * useApiQuery — reusable data-fetching hook.
 *
 * Wraps any async fetch function with consistent loading / error / data state,
 * an optional refetch trigger, and a dependency list that re-runs the query
 * whenever the deps change (just like useEffect).
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useApiQuery(
 *     () => adminApi.getUsers(),
 *     []
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @param fetchFn  Async function that returns the data.
 * @param deps     Dependency array — query re-runs when any dep changes.
 * @param enabled  Set to false to skip the initial fetch.
 */
export function useApiQuery<T>(
  fetchFn: () => Promise<T>,
  deps: readonly unknown[] = [],
  enabled = true,
): UseApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref so the refetch callback always calls the latest fetchFn.
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Counter used to trigger a manual refetch without changing deps.
  const [refetchToken, setRefetchToken] = useState(0);

  const execute = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [enabled, refetchToken, ...deps]);

  useEffect(() => {
    void execute();
  }, [execute]);

  const refetch = useCallback(() => {
    setRefetchToken((n) => n + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
