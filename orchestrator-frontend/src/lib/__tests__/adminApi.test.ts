/**
 * Tests for admin API 204 No Content handling
 *
 * Covers:
 *  - deleteUser handles 204 without JSON parsing
 *  - suspendUser handles 204 without JSON parsing
 *  - unsuspendUser handles 204 without JSON parsing
 *  - disableUserMfa handles 204 without JSON parsing
 *  - All four methods propagate HTTP errors from axios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module to intercept axios calls
vi.mock('../api', () => {
  const mockAxios = {
    delete: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  };
  return {
    apiRequest: mockAxios,
    STORAGE_KEYS: {
      ACCESS_TOKEN: 'bbp-orchestrator-access-token',
      REFRESH_TOKEN: 'bbp-orchestrator-refresh-token',
      USER: 'bbp-orchestrator-user',
      COMPANY_CODE: 'bbp-orchestrator-company-code',
      COMPANY_ID: 'bbp-orchestrator-company-id',
    },
  };
});

import { adminApi } from '../adminApi';
import { apiRequest } from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simulate a 204 No Content response (empty body). */
function mock204() {
  return { status: 204, data: '', headers: {}, config: {}, statusText: 'No Content' };
}

/** Simulate a non-2xx error thrown by axios. */
function mockAxiosError(status: number, message: string) {
  const error = new Error(message) as Error & { response: { status: number; data: unknown } };
  error.response = { status, data: { success: false, message } };
  return error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('adminApi 204 No Content handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── deleteUser ────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('resolves void on 204 without JSON parsing', async () => {
      (apiRequest.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      const result = await adminApi.deleteUser(42);

      expect(result).toBeUndefined();
      expect(apiRequest.delete).toHaveBeenCalledWith('/admin/users/42');
    });

    it('does not access response.data.success', async () => {
      // 204 response has no body — response.data is empty string
      const response = mock204();
      (apiRequest.delete as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      // Should NOT throw even though response.data.success is falsy
      await expect(adminApi.deleteUser(1)).resolves.toBeUndefined();
    });

    it('propagates axios errors on non-2xx status', async () => {
      const error = mockAxiosError(403, 'Forbidden');
      (apiRequest.delete as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(adminApi.deleteUser(1)).rejects.toThrow('Forbidden');
    });
  });

  // ─── suspendUser ───────────────────────────────────────────────────────────

  describe('suspendUser', () => {
    it('resolves void on 204 without JSON parsing', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      const result = await adminApi.suspendUser(10);

      expect(result).toBeUndefined();
      expect(apiRequest.patch).toHaveBeenCalledWith('/admin/users/10/suspend');
    });

    it('does not access response.data.success', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      await expect(adminApi.suspendUser(10)).resolves.toBeUndefined();
    });

    it('propagates axios errors on non-2xx status', async () => {
      const error = mockAxiosError(404, 'User not found');
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(adminApi.suspendUser(99)).rejects.toThrow('User not found');
    });
  });

  // ─── unsuspendUser ─────────────────────────────────────────────────────────

  describe('unsuspendUser', () => {
    it('resolves void on 204 without JSON parsing', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      const result = await adminApi.unsuspendUser(10);

      expect(result).toBeUndefined();
      expect(apiRequest.patch).toHaveBeenCalledWith('/admin/users/10/unsuspend');
    });

    it('does not access response.data.success', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      await expect(adminApi.unsuspendUser(10)).resolves.toBeUndefined();
    });

    it('propagates axios errors on non-2xx status', async () => {
      const error = mockAxiosError(500, 'Internal error');
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(adminApi.unsuspendUser(10)).rejects.toThrow('Internal error');
    });
  });

  // ─── disableUserMfa ────────────────────────────────────────────────────────

  describe('disableUserMfa', () => {
    it('resolves void on 204 without JSON parsing', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      const result = await adminApi.disableUserMfa(7);

      expect(result).toBeUndefined();
      expect(apiRequest.patch).toHaveBeenCalledWith('/admin/users/7/mfa/disable');
    });

    it('does not access response.data.success', async () => {
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mock204());

      await expect(adminApi.disableUserMfa(7)).resolves.toBeUndefined();
    });

    it('propagates axios errors on non-2xx status', async () => {
      const error = mockAxiosError(400, 'MFA not enabled');
      (apiRequest.patch as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(adminApi.disableUserMfa(7)).rejects.toThrow('MFA not enabled');
    });
  });
});
