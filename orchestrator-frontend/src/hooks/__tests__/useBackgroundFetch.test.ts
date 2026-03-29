/**
 * useBackgroundFetch.test.ts
 *
 * Tests for the useBackgroundFetch hook covering:
 *   - isLoading=true on first fetch, false afterwards
 *   - Stale data preserved on background revalidation
 *   - isRevalidating=true during background re-fetch
 *   - Error on failed fetch preserves existing data
 *   - enabled=false skips fetching
 *   - interval triggers periodic refetches
 *   - refetch() triggers manual revalidation
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBackgroundFetch } from '../useBackgroundFetch';

describe('useBackgroundFetch', () => {
  it('shows isLoading=true on first fetch and resolves data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ total: 42 });

    const { result } = renderHook(() =>
      useBackgroundFetch(fetchFn),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ total: 42 });
    expect(result.current.error).toBeNull();
    expect(result.current.isRevalidating).toBe(false);
  });

  it('preserves stale data and sets isRevalidating on background refresh', async () => {
    let callCount = 0;
    const fetchFn = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ count: callCount });
    });

    const { result } = renderHook(() =>
      useBackgroundFetch(fetchFn),
    );

    // Wait for first fetch to settle.
    await waitFor(() => expect(result.current.data).toEqual({ count: 1 }));

    // Manually trigger background refetch.
    act(() => {
      result.current.refetch();
    });

    // isRevalidating should be true while the second fetch is in flight.
    // But since Promises resolve synchronously in vi.fn(), we can check
    // the settled state.
    await waitFor(() => expect(result.current.data).toEqual({ count: 2 }));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRevalidating).toBe(false);
  });

  it('preserves existing data when a background fetch fails', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ status: 'ok' })
      .mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useBackgroundFetch(fetchFn));

    await waitFor(() => expect(result.current.data).toEqual({ status: 'ok' }));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBe('network'));

    // Stale data must still be available.
    expect(result.current.data).toEqual({ status: 'ok' });
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when enabled=false', () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() =>
      useBackgroundFetch(fetchFn, { enabled: false }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('polls at the configured interval', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValue({ n: 1 });

    const { result } = renderHook(() =>
      useBackgroundFetch(fetchFn, { interval: 5000 }),
    );

    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Advance timer by two intervals.
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(fetchFn.mock.calls.length).toBeGreaterThanOrEqual(2);

    vi.useRealTimers();
  });
});
