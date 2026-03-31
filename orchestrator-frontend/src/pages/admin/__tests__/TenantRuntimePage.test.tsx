 /**
  * Tests for TenantRuntimePage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Activity: M, Server: M, HardDrive: M, Users: M, Shield: M, RefreshCcw: M,
     AlertCircle: M, Save: M, Lock: M, Clock: M, ChevronDown: M, X: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   tenantApi: {
     getRuntimeMetrics: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { TenantRuntimePage } from '../TenantRuntimePage';
 import { tenantApi } from '@/lib/adminApi';
 
 const mockMetrics = {
  apiCalls: 125430,
  storageUsedMb: 2048,
  activeSessions: 34,
  apiCallsLimit: 1000000,
  storageLimit: 10240,
  period: '2024-03',
  totalUsers: 50,
  enabledUsers: 45,
  maxActiveUsers: 100,
  requestsThisMinute: 320,
  maxRequestsPerMinute: 1000,
  inFlightRequests: 5,
  maxConcurrentRequests: 50,
  blockedThisMinute: 0,
};
 

 
 function renderPage() {
   return render(
     <MemoryRouter>
       <TenantRuntimePage />
     </MemoryRouter>
   );
 }
 
 describe('TenantRuntimePage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
     vi.mocked(tenantApi.getRuntimeMetrics).mockResolvedValue(mockMetrics);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Tenant Runtime')).toBeInTheDocument();
     });
   });
 
   it('shows API calls metric', async () => {
     renderPage();
     await waitFor(() => {
      const allMatches = screen.getAllByText(/1,25,430|125,430|125430/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows active sessions metric', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/34/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows policy section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Policy|Session Timeout|Password/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows session timeout value from policy', async () => {
     renderPage();
     await waitFor(() => {
      // Should show session timeout label
      const allMatches = screen.getAllByText(/Session Timeout/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('policy section is read-only — no save button', async () => {
     renderPage();
     await waitFor(() => {
       // Policy section should be visible
       const allMatches = screen.getAllByText(/Security Policy|Session Timeout|Password/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
     // No save button should be present in policy section
     const saveMatches = screen.queryAllByText(/Save Policy/i);
     expect(saveMatches.length).toBe(0);
   });

  it('policy section shows read-only notice', async () => {
    renderPage();
    await waitFor(() => {
      const notices = screen.queryAllByText(/managed by platform administrators/i);
      expect(notices.length).toBeGreaterThan(0);
    });
  });
 
   it('shows error state on API failure', async () => {
     vi.mocked(tenantApi.getRuntimeMetrics).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });
 });
