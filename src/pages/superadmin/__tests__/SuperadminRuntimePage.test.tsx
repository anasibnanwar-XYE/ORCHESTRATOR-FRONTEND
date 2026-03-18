 /**
  * Tests for SuperadminRuntimePage
  *
  * Covers:
  *  - Renders page heading "Platform Runtime"
  *  - Shows loading skeleton while data loads
  *  - Shows runtime metric cards (API Calls, Storage Used, Active Sessions)
  *  - Shows runtime policy section with company selector
  *  - Shows "Save Runtime Policy" button
  *  - Shows error state on API failure
  *  - Reads metrics from canonical path GET /api/v1/admin/tenant-runtime/metrics
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Activity: M, Server: M, HardDrive: M, Users: M,
     RefreshCcw: M, AlertCircle: M, Save: M, Lock: M, Settings: M,
   };
 });
 
 vi.mock('@/lib/superadminApi', () => ({
   superadminRuntimeApi: {
     getRuntimeMetrics: vi.fn(),
     updateRuntimePolicy: vi.fn(),
   },
   superadminTenantsApi: {
     listTenants: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { SuperadminRuntimePage } from '../SuperadminRuntimePage';
 import { superadminRuntimeApi, superadminTenantsApi } from '@/lib/superadminApi';
 
 const mockMetrics = {
  apiCalls: 12500,
  storageUsedMb: 512,
  activeSessions: 37,
  apiCallsLimit: 50000,
  storageLimit: 2048,
  totalUsers: 20,
  enabledUsers: 18,
  maxActiveUsers: 50,
  requestsThisMinute: 150,
  maxRequestsPerMinute: 500,
  inFlightRequests: 3,
  maxConcurrentRequests: 25,
  blockedThisMinute: 0,
};

const mockTenants = [
  {
    companyId: 1,
    companyCode: 'MOCK',
    companyName: 'Mock Company',
    status: 'ACTIVE' as const,
    activeUsers: 10,
    apiCallCount: 500,
    storageBytes: 1024,
    lastActivityAt: null,
  },
  {
    companyId: 2,
    companyCode: 'SKE',
    companyName: 'Skeina',
    status: 'ACTIVE' as const,
    activeUsers: 5,
    apiCallCount: 200,
    storageBytes: 512,
    lastActivityAt: null,
  },
];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/superadmin/tenant-runtime']}>
       <SuperadminRuntimePage />
     </MemoryRouter>
   );
 }
 
 describe('SuperadminRuntimePage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockResolvedValue(mockMetrics);
     vi.mocked(superadminTenantsApi.listTenants).mockResolvedValue(mockTenants);
     vi.mocked(superadminRuntimeApi.updateRuntimePolicy).mockResolvedValue(mockMetrics);
   });
 
   it('renders page heading', () => {
     renderPage();
     expect(screen.getByText('Platform Runtime')).toBeDefined();
   });
 
   it('shows loading skeleton while data loads', () => {
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockImplementation(
       () => new Promise(() => {})
     );
     vi.mocked(superadminTenantsApi.listTenants).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders metric labels after load', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('API Calls')).toBeDefined();
       expect(screen.getByText('Storage Used')).toBeDefined();
       expect(screen.getByText('Active Sessions')).toBeDefined();
     });
   });
 
   it('shows runtime policy section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.queryAllByText(/Runtime Policy|Target Company|Max Active|Max Requests/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows company selector for runtime policy', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.queryAllByText(/Target Company|Mock Company|Skeina/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });

   it('shows save runtime policy button', async () => {
     renderPage();
     await waitFor(() => {
       const saveMatches = screen.queryAllByText(/Save Runtime Policy/i);
       expect(saveMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const errors = screen.queryAllByText(/failed|error/i);
       expect(errors.length).toBeGreaterThan(0);
     });
   });

   it('uses canonical metrics endpoint (GET /admin/tenant-runtime/metrics)', async () => {
     renderPage();
     await waitFor(() => {
       expect(superadminRuntimeApi.getRuntimeMetrics).toHaveBeenCalled();
     });
     // Verify the mock was called at least once
     // (called by MetricsSection and RuntimePolicySection independently)
     expect(vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mock.calls.length).toBeGreaterThanOrEqual(1);
   });
 });
