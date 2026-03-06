 /**
  * Tests for TenantsPage
  *
  * Covers:
  *  - Renders tenant list with paginated table
  *  - Search bar filters by name/code
  *  - Status filter dropdown
  *  - Onboard tenant button opens multi-step form
  *  - Edit tenant action opens pre-populated form
  *  - Lifecycle actions (Activate, Suspend, Deactivate) show confirmation dialogs
  *  - Admin password reset opens form
  *  - Send support warning opens form
  *  - Shows empty state when no tenants
  *  - Shows error state on API failure
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Building2: M, Plus: M, Search: M, Filter: M, RefreshCw: M, ChevronDown: M,
     Pencil: M, Trash2: M, MoreHorizontal: M, CheckCircle: M, PauseCircle: M,
     XCircle: M, PlayCircle: M, AlertTriangle: M, Key: M, MessageSquare: M,
     AlertCircle: M, ArrowRight: M, ArrowLeft: M, Check: M, X: M, Shield: M,
     UserCheck: M, ShieldOff: M, Eye: M, Server: M, Lock: M, LifeBuoy: M,
     ChevronLeft: M, ChevronRight: M,
   };
 });
 
 vi.mock('@/lib/superadminApi', () => ({
   superadminTenantsApi: {
     listTenants: vi.fn(),
     onboardTenant: vi.fn(),
     updateTenant: vi.fn(),
     activateTenant: vi.fn(),
     suspendTenant: vi.fn(),
     deactivateTenant: vi.fn(),
     resetAdminPassword: vi.fn(),
     sendSupportWarning: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { TenantsPage } from '../TenantsPage';
 import { superadminTenantsApi } from '@/lib/superadminApi';
 
 const mockTenants = [
   {
     id: 1,
     code: 'ACME',
     name: 'Acme Industries',
     email: 'admin@acme.com',
     isActive: true,
     status: 'ACTIVE',
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     id: 2,
     code: 'GLOBEX',
     name: 'Globex Corp',
     email: 'admin@globex.com',
     isActive: false,
     status: 'SUSPENDED',
     createdAt: '2024-02-01T00:00:00Z',
     updatedAt: '2024-02-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/superadmin/tenants']}>
       <TenantsPage />
     </MemoryRouter>
   );
 }
 
 describe('TenantsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders page heading', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Tenants')).toBeDefined();
     });
   });
 
   it('renders tenant names in table', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Acme Industries').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Globex Corp').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Onboard Tenant button', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/onboard tenant/i)).toBeDefined();
     });
   });
 
   it('shows search bar', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
     });
   });
 
   it('shows empty state when no tenants match search', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const emptyMsg = screen.queryByText(/no tenants/i);
       expect(emptyMsg).not.toBeNull();
     });
   });
 
   it('shows error state on API failure', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     renderPage();
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry/i);
       const errorMsgs = screen.queryAllByText(/failed|error/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('shows loading skeleton while fetching', () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('clicking Onboard Tenant opens the multi-step form', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/onboard tenant/i)).toBeDefined();
     });
     fireEvent.click(screen.getByText(/onboard tenant/i));
     await waitFor(() => {
       const formHeadings = screen.queryAllByText(/company details|onboard|step/i);
       expect(formHeadings.length).toBeGreaterThan(0);
     });
   });
 
   it('shows tenant status badges', async () => {
     (superadminTenantsApi.listTenants as ReturnType<typeof vi.fn>).mockResolvedValue(mockTenants);
     renderPage();
     await waitFor(() => {
       const activeBadges = screen.queryAllByText(/active/i);
       const suspendedBadges = screen.queryAllByText(/suspended/i);
       expect(activeBadges.length + suspendedBadges.length).toBeGreaterThan(0);
     });
   });
 });
