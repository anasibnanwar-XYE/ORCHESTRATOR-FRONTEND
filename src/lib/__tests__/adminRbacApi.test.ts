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
import { superadminRuntimeApi, superadminTenantsApi } from '@/lib/superadminApi';

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

  it('stubs superadmin deprecated policy reads without network calls', async () => {
    const policy = await superadminRuntimeApi.getPolicy();
    expect(policy.passwordMinLength).toBe(10);
    expect(apiRequestMocks.get).not.toHaveBeenCalled();
  });

  it('stubs superadmin deprecated policy updates without network calls', async () => {
    const updated = await superadminRuntimeApi.updatePolicy({ passwordMinLength: 14 });
    expect(updated.passwordMinLength).toBe(10);
    expect(apiRequestMocks.put).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Policy updates require backend configuration',
      type: 'info',
    });
  });

  it('superadmin getRuntimeMetrics uses canonical GET /admin/tenant-runtime/metrics path', async () => {
    apiRequestMocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          apiCalls: 100,
          storageUsedMb: 50,
          activeSessions: 5,
          apiCallsLimit: 1000,
          storageLimit: 500,
          totalUsers: 10,
          enabledUsers: 8,
          maxActiveUsers: 20,
          requestsThisMinute: 30,
          maxRequestsPerMinute: 100,
          inFlightRequests: 2,
          maxConcurrentRequests: 10,
          blockedThisMinute: 0,
        },
        message: '',
        timestamp: '',
      },
    });

    const metrics = await superadminRuntimeApi.getRuntimeMetrics();
    expect(apiRequestMocks.get).toHaveBeenCalledWith('/admin/tenant-runtime/metrics');
    expect(metrics.apiCalls).toBe(100);
  });

  it('superadmin updateRuntimePolicy uses canonical PUT /companies/{id}/tenant-runtime/policy path', async () => {
    const updatedMetrics = {
      apiCalls: 100,
      storageUsedMb: 50,
      activeSessions: 5,
      apiCallsLimit: 1000,
      storageLimit: 500,
      totalUsers: 10,
      enabledUsers: 8,
      maxActiveUsers: 25,
      requestsThisMinute: 30,
      maxRequestsPerMinute: 200,
      inFlightRequests: 2,
      maxConcurrentRequests: 15,
      blockedThisMinute: 0,
    };
    apiRequestMocks.put.mockResolvedValueOnce({
      data: { success: true, data: updatedMetrics, message: '', timestamp: '' },
    });

    const result = await superadminRuntimeApi.updateRuntimePolicy(42, {
      maxActiveUsers: 25,
      maxRequestsPerMinute: 200,
    });

    expect(apiRequestMocks.put).toHaveBeenCalledWith(
      '/companies/42/tenant-runtime/policy',
      { maxActiveUsers: 25, maxRequestsPerMinute: 200 }
    );
    expect(result.maxActiveUsers).toBe(25);
  });

  it('superadmin getCompanyRuntimePolicy uses canonical GET /companies/{id}/tenant-runtime/policy path', async () => {
    const policyMetrics = {
      apiCalls: 50,
      storageUsedMb: 20,
      activeSessions: 2,
      apiCallsLimit: 500,
      storageLimit: 200,
      totalUsers: 5,
      enabledUsers: 4,
      maxActiveUsers: 30,
      requestsThisMinute: 10,
      maxRequestsPerMinute: 200,
      inFlightRequests: 1,
      maxConcurrentRequests: 20,
      blockedThisMinute: 0,
    };
    apiRequestMocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: policyMetrics,
        message: '',
        timestamp: '',
      },
    });

    const result = await superadminRuntimeApi.getCompanyRuntimePolicy(7);
    expect(apiRequestMocks.get).toHaveBeenCalledWith('/companies/7/tenant-runtime/policy');
    expect(result.maxActiveUsers).toBe(30);
    expect(result.maxRequestsPerMinute).toBe(200);
  });

  it('superadmin getTenantModules uses canonical GET /superadmin/tenants/{id}/modules path', async () => {
    const modulesResponse = {
      companyId: 3,
      companyCode: 'TEST',
      enabledModules: ['MANUFACTURING', 'PURCHASING'],
    };
    apiRequestMocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: modulesResponse,
        message: '',
        timestamp: '',
      },
    });

    const result = await superadminTenantsApi.getTenantModules(3);
    expect(apiRequestMocks.get).toHaveBeenCalledWith('/superadmin/tenants/3/modules');
    expect(result.enabledModules).toEqual(['MANUFACTURING', 'PURCHASING']);
    expect(result.companyId).toBe(3);
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
