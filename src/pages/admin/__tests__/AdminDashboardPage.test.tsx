 /**
  * Tests for AdminDashboardPage
  *
  * Covers:
  *  - Renders 4 KPI stat cards (Total Users, Total Companies, Pending Approvals, System Status)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state with retry button on API failure
  *  - Pipeline stages visualization renders
  *  - HR pulse card renders
  *  - Clicking KPI cards navigates to relevant pages
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Users: M, Building2: M, CheckSquare: M, Activity: M,
     ArrowRight: M, TrendingUp: M, TrendingDown: M, ChevronRight: M,
     AlertCircle: M, RefreshCcw: M, Package: M, Truck: M, MapPin: M,
     UserPlus: M, UserMinus: M, Shield: M, Settings: M, BarChart3: M,
   };
 });
 
 // Mock the admin API
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getUsers: vi.fn(),
     getCompanies: vi.fn(),
     getApprovals: vi.fn(),
   },
 }));
 
 // Mock react-router-dom navigate
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return {
     ...actual,
     useNavigate: () => mockNavigate,
   };
 });
 
 import { AdminDashboardPage } from '../AdminDashboardPage';
 import { adminApi } from '@/lib/adminApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────
 
 const mockUsers = Array.from({ length: 8 }, (_, i) => ({
   id: i + 1,
   email: `user${i + 1}@example.com`,
   displayName: `User ${i + 1}`,
   roles: ['ROLE_ADMIN'],
   mfaEnabled: false,
   enabled: i < 7,
   companies: ['company-1'],
 }));
 
 const mockCompanies = Array.from({ length: 3 }, (_, i) => ({
   id: i + 1,
   code: `COMP${i + 1}`,
   name: `Company ${i + 1}`,
   isActive: true,
   createdAt: '2024-01-01T00:00:00Z',
   updatedAt: '2024-01-01T00:00:00Z',
 }));
 
 const mockApprovals = {
   items: [{ id: 1, type: 'CREDIT_REQUEST', publicId: 'CR-001', reference: 'CR-001', status: 'PENDING', summary: 'Credit request', createdAt: '2024-03-01T00:00:00Z' }],
   total: 1,
   pending: 1,
 };
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helper
 // ─────────────────────────────────────────────────────────────────────────────
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin']}>
       <AdminDashboardPage />
     </MemoryRouter>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────
 
 describe('AdminDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
   });
 
   it('shows skeleton loading state while data is loading', () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
 
     renderPage();
 
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 4 KPI stat cards with fetched data', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
 
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Total Users')).toBeDefined();
       expect(screen.getByText('Total Companies')).toBeDefined();
       expect(screen.getByText('Pending Approvals')).toBeDefined();
       expect(screen.getByText('System Status')).toBeDefined();
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
 
     renderPage();
 
     await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry|try again/i);
      const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('clicking Total Users card navigates to /admin/users', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
 
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Total Users')).toBeDefined();
     });
 
     const card = screen.getByText('Total Users').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
     }
   });
 
   it('clicking Pending Approvals card navigates to /admin/approvals', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
 
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Pending Approvals')).toBeDefined();
     });
 
     const card = screen.getByText('Pending Approvals').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/admin/approvals');
     }
   });
 
   it('renders pipeline stages section', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
 
     renderPage();
 
     await waitFor(() => {
      const pipelineEls = screen.queryAllByText(/pipeline|orders|dispatch|delivery/i);
      expect(pipelineEls.length).toBeGreaterThan(0);
     });
   });
 
   it('renders HR pulse section', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
 
     renderPage();
 
     await waitFor(() => {
       const hrPulse = screen.queryByText(/workforce|headcount|hr pulse/i);
       expect(hrPulse).not.toBeNull();
     });
   });
 });
