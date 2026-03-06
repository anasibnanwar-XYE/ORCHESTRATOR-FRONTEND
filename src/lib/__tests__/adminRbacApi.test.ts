import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequestMocks, mockShowToast } = vi.hoisted(() => ({
  apiRequestMocks: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  mockShowToast: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: apiRequestMocks,
}));

vi.mock('@/components/ui/toast-bridge', () => ({
  showToast: mockShowToast,
}));

import { operationsControlApi, tenantApi } from '@/lib/adminApi';
import { superadminRuntimeApi } from '@/lib/superadminApi';

describe('admin/superadmin RBAC stub APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stubs tenant policy reads without hitting the dead admin policy endpoint', async () => {
    await expect(tenantApi.getPolicy()).resolves.toEqual({
      sessionTimeoutMinutes: 60,
      passwordMinLength: 10,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      maxLoginAttempts: 5,
      mfaRequired: false,
    });

    expect(apiRequestMocks.get).not.toHaveBeenCalled();
  });

  it('stubs tenant policy updates with an info toast instead of calling the dead endpoint', async () => {
    const result = await tenantApi.updatePolicy({ sessionTimeoutMinutes: 90 });

    expect(result.sessionTimeoutMinutes).toBe(60);
    expect(apiRequestMocks.put).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Policy updates require backend configuration',
      type: 'info',
    });
  });

  it('stubs superadmin policy reads and updates without network calls', async () => {
    const policy = await superadminRuntimeApi.getPolicy();
    const updated = await superadminRuntimeApi.updatePolicy({ passwordMinLength: 14 });

    expect(policy.passwordMinLength).toBe(10);
    expect(updated.passwordMinLength).toBe(10);
    expect(apiRequestMocks.get).not.toHaveBeenCalled();
    expect(apiRequestMocks.put).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Policy updates require backend configuration',
      type: 'info',
    });
  });

  it('stubs operations status and action endpoints without touching the missing operations controller', async () => {
    const status = await operationsControlApi.getStatus();
    const maintenance = await operationsControlApi.setMaintenanceMode(true);
    const featureFlags = await operationsControlApi.toggleFeatureFlag('NEW_FLAG', true);
    const cache = await operationsControlApi.purgeCache();

    expect(status).toEqual({
      maintenanceMode: false,
      featureFlags: [],
      cacheLastPurged: null,
    });
    expect(maintenance).toEqual(status);
    expect(featureFlags).toEqual(status);
    expect(cache).toEqual(status);
    expect(apiRequestMocks.get).not.toHaveBeenCalled();
    expect(apiRequestMocks.post).not.toHaveBeenCalled();
    expect(apiRequestMocks.patch).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenNthCalledWith(1, {
      title: 'Maintenance mode requires backend setup',
      type: 'info',
    });
    expect(mockShowToast).toHaveBeenNthCalledWith(2, {
      title: 'Feature flag updates require backend setup',
      type: 'info',
    });
    expect(mockShowToast).toHaveBeenNthCalledWith(3, {
      title: 'Cache purge requires backend setup',
      type: 'info',
    });
  });
});
