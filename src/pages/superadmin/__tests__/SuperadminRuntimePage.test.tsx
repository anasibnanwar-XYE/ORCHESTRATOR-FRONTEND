 /**
  * Tests for SuperadminRuntimePage
  *
  * Covers:
  *  - Renders page heading "Platform Runtime"
  *  - Shows loading skeleton while data loads
  *  - Shows runtime metric cards (API Calls, Storage Used, Active Sessions)
  *  - Shows policy section with Session Timeout
  *  - Shows Save Policy button
  *  - Shows error state on API failure
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Activity: M, Server: M, HardDrive: M, Users: M,
     RefreshCcw: M, AlertCircle: M, Save: M, Lock: M,
   };
 });
 
 vi.mock('@/lib/superadminApi', () => ({
   superadminRuntimeApi: {
     getRuntimeMetrics: vi.fn(),
     getPolicy: vi.fn(),
     updatePolicy: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { SuperadminRuntimePage } from '../SuperadminRuntimePage';
 import { superadminRuntimeApi } from '@/lib/superadminApi';
 
 const mockMetrics = {
   apiCalls: 12500,
   storageUsedMb: 512,
   activeSessions: 37,
   apiCallsLimit: 50000,
   storageLimit: 2048,
 };
 
 const mockPolicy = {
   sessionTimeoutMinutes: 30,
   passwordMinLength: 8,
   passwordRequireUppercase: true,
   passwordRequireNumbers: true,
   passwordRequireSymbols: false,
   maxLoginAttempts: 5,
   mfaRequired: false,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/superadmin/runtime']}>
       <SuperadminRuntimePage />
     </MemoryRouter>
   );
 }
 
 describe('SuperadminRuntimePage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockResolvedValue(mockMetrics);
     vi.mocked(superadminRuntimeApi.getPolicy).mockResolvedValue(mockPolicy);
     vi.mocked(superadminRuntimeApi.updatePolicy).mockResolvedValue(mockPolicy);
   });
 
   it('renders page heading', () => {
     renderPage();
     expect(screen.getByText('Platform Runtime')).toBeDefined();
   });
 
   it('shows loading skeleton while data loads', () => {
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockImplementation(
       () => new Promise(() => {})
     );
     vi.mocked(superadminRuntimeApi.getPolicy).mockImplementation(
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
 
   it('shows policy section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.queryAllByText(/Policy|Session Timeout|Password/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows session timeout value from policy', async () => {
     renderPage();
     await waitFor(() => {
       const input = screen.queryAllByDisplayValue('30');
       expect(input.length).toBeGreaterThan(0);
     });
   });
 
   it('shows save policy button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/save policy/i)).toBeDefined();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(superadminRuntimeApi.getRuntimeMetrics).mockRejectedValue(new Error('API error'));
     vi.mocked(superadminRuntimeApi.getPolicy).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const errors = screen.queryAllByText(/failed|error/i);
       expect(errors.length).toBeGreaterThan(0);
     });
   });
 });
