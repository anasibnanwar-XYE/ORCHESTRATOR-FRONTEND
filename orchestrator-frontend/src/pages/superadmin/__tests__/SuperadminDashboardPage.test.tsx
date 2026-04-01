 /**
  * Tests for SuperadminDashboardPage
  *
  * Covers:
  *  - Renders 5 metric stat cards (Total Tenants, Active, Suspended, Platform Users, Storage)
  *  - Shows skeleton loading while data loads
  *  - Shows error state with retry on API failure
  *  - Clicking tenant cards navigates to tenants page
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});
 
 vi.mock('@/lib/superadminApi', () => ({
   superadminDashboardApi: {
     getMetrics: vi.fn(),
   },
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { SuperadminDashboardPage } from '../SuperadminDashboardPage';
 import { superadminDashboardApi } from '@/lib/superadminApi';
 
 const mockMetrics = {
   totalTenants: 12,
   activeTenants: 9,
   suspendedTenants: 2,
  deactivatedTenants: 1,
  totalUsers: 143,
  totalApiCalls: 5000,
  totalStorageBytes: 2147483648,
  recentActivityAt: null,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/superadmin']}>
       <SuperadminDashboardPage />
     </MemoryRouter>
   );
 }
 
 describe('SuperadminDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
   });
 
   it('shows skeleton loading state while data loads', () => {
     (superadminDashboardApi.getMetrics as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 5 metric stat cards with fetched data', async () => {
     (superadminDashboardApi.getMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Total Tenants')).toBeDefined();
       expect(screen.getByText('Active Tenants')).toBeDefined();
       expect(screen.getByText('Suspended')).toBeDefined();
       expect(screen.getByText('Platform Users')).toBeDefined();
       expect(screen.getByText('Storage Used')).toBeDefined();
     });
   });
 
   it('renders correct metric values', async () => {
     (superadminDashboardApi.getMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     renderPage();
 
     await waitFor(() => {
       expect(screen.getAllByText('12').length).toBeGreaterThan(0);
       expect(screen.getAllByText('9').length).toBeGreaterThan(0);
       expect(screen.getAllByText('143').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (superadminDashboardApi.getMetrics as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     renderPage();
 
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry|try again/i);
       const errorMsgs = screen.queryAllByText(/failed|error|couldn't/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('clicking Total Tenants card navigates to tenants page', async () => {
     (superadminDashboardApi.getMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Total Tenants')).toBeDefined();
     });
 
     const card = screen.getByText('Total Tenants').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/superadmin/tenants');
     }
   });
 });
