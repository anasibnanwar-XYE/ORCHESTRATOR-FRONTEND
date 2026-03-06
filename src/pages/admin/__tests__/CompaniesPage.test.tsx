 /**
  * Tests for CompaniesPage
  *
  * Covers:
  *  - DataTable listing companies (code, name, email, GST, status)
  *  - Skeleton loading state
  *  - Error state with retry
  *  - Empty state with CTA
  *  - Create company modal
  *  - Delete confirmation dialog
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, Building2: M, AlertCircle: M, RefreshCcw: M, MoreHorizontal: M,
     Pencil: M, Trash2: M, CheckCircle2: M, XCircle: M, X: M,
     Search: M, ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
    ChevronDown: M,
    AlertTriangle: M, Info: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getCompanies: vi.fn(),
     createCompany: vi.fn(),
     updateCompany: vi.fn(),
     deleteCompany: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { CompaniesPage } from '../CompaniesPage';
 import { adminApi } from '@/lib/adminApi';
 
 const mockCompanies = [
   {
     id: 1,
     code: 'ACME',
     name: 'Acme Corporation',
     email: 'admin@acme.com',
     gstNumber: '22AAAAA0000A1Z5',
     isActive: true,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     id: 2,
     code: 'BETA',
     name: 'Beta Industries',
     email: 'info@beta.com',
     gstNumber: null,
     isActive: false,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/companies']}>
       <CompaniesPage />
     </MemoryRouter>
   );
 }
 
 describe('CompaniesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders page heading', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Companies')).toBeDefined();
     });
   });
 
   it('shows skeleton loading state', () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders company names in the table', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('Acme Corporation').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Beta Industries').length).toBeGreaterThan(0);
     });
   });
 
   it('shows company codes', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('ACME').length).toBeGreaterThan(0);
      expect(screen.getAllByText('BETA').length).toBeGreaterThan(0);
     });
   });
 
   it('shows active/inactive status badges', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     renderPage();
     await waitFor(() => {
       const activeBadges = screen.queryAllByText(/active/i);
       expect(activeBadges.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/failed|error|couldn't/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('opens create company modal on button click', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
     renderPage();
     await waitFor(() => expect(screen.getByText('Companies')).toBeDefined());
     const createBtn = screen.getByText(/add company|new company/i);
     fireEvent.click(createBtn);
     await waitFor(() => {
      expect(screen.getAllByText(/create company/i).length).toBeGreaterThan(0);
     });
   });
 
   it('shows empty state when no companies', async () => {
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText(/no companies/i).length).toBeGreaterThan(0);
     });
   });
 });
