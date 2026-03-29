/**
 * useApiQuery.test.ts
 *
 * Tests for the useApiQuery hook covering:
 *   - Initial loading state on first fetch
 *   - Data set after successful fetch
 *   - Error state after failed fetch
 *   - Refetch triggers a new fetch
 *   - enabled=false skips fetching
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiQuery } from '../useApiQuery';

describe('useApiQuery', () => {
  it('sets isLoading=true initially and resolves to data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

    const { result } = renderHook(() => useApiQuery(fetchFn, []));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.error).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('sets error state on fetch failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApiQuery(fetchFn, []));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('refetch triggers another fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue([1, 2, 3]);

    const { result } = renderHook(() => useApiQuery(fetchFn, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchFn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when enabled=false', () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useApiQuery(fetchFn, [], false));

    expect(result.current.isLoading).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('clears error on successful retry', async () => {
    const fetchFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    const { result } = renderHook(() => useApiQuery(fetchFn, []));

    await waitFor(() => expect(result.current.error).toBe('fail'));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
  });
});
