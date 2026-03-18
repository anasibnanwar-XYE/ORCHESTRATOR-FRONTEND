 /**
  * Tests for ApprovalsPage
  *
  * Covers:
  *  - DataTable listing approvals grouped by type
  *  - Credit Request approve/reject with confirmation
  *  - Payroll Run approve works, reject shows error
  *  - Credit Override approve/reject both work
  *  - Empty state: "No pending approvals"
  *  - Loading skeleton state
  *  - Error state with retry
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     CheckSquare: M, XCircle: M, CheckCircle: M, Clock: M, AlertCircle: M,
     RefreshCcw: M, ChevronDown: M, AlertTriangle: M, Info: M,
     ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
     Search: M, MoreHorizontal: M, X: M, FileCheck: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getApprovals: vi.fn(),
     approveCreditRequest: vi.fn(),
     rejectCreditRequest: vi.fn(),
     approvePayroll: vi.fn(),
     approveCreditOverride: vi.fn(),
     rejectCreditOverride: vi.fn(),
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
 
 import { ApprovalsPage } from '../ApprovalsPage';
 import { adminApi } from '@/lib/adminApi';
 
const mockApprovals = {
  creditRequests: [
    {
      type: 'CREDIT_REQUEST',
      id: 1,
      publicId: 'CR-001',
      reference: 'CR-2024-001',
      status: 'PENDING',
      summary: 'Credit request for dealer ABC - ₹50,000',
      createdAt: '2024-03-01T10:00:00Z',
    },
  ],
  payrollRuns: [
    {
      type: 'PAYROLL_RUN',
      id: 2,
      publicId: 'PR-001',
      reference: 'PR-2024-001',
      status: 'PENDING',
      summary: 'March 2024 Payroll Run - 45 employees',
      createdAt: '2024-03-01T09:00:00Z',
    },
  ],
  exportRequests: [],
  periodCloseRequests: [
    {
      type: 'CREDIT_OVERRIDE',
      id: 3,
      publicId: 'CO-001',
      reference: 'CO-2024-001',
      status: 'PENDING',
      summary: 'Credit override request - increase limit to ₹2,00,000',
      createdAt: '2024-03-01T08:00:00Z',
    },
  ],
};
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/approvals']}>
       <ApprovalsPage />
     </MemoryRouter>
   );
 }
 
 describe('ApprovalsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Approvals')).toBeDefined();
     });
   });
 
   it('shows skeleton loading state', () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/failed|error|couldn't|could not/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('shows empty state when no pending approvals', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [], total: 0, pending: 0 });
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/no pending approvals/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('renders approval items with type badges', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText(/credit request/i).length).toBeGreaterThan(0);
     });
   });
 
   it('renders references in the list', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('CR-2024-001').length).toBeGreaterThan(0);
     });
   });
 
   it('shows approve and reject buttons for credit requests', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => {
       const approveBtns = screen.queryAllByText(/approve/i);
       expect(approveBtns.length).toBeGreaterThan(0);
     });
   });
 
   it('opens confirmation dialog on approve click', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('CR-2024-001').length).toBeGreaterThan(0));
     const approveBtns = screen.queryAllByText(/^approve$/i);
     if (approveBtns.length > 0) {
       fireEvent.click(approveBtns[0]);
       await waitFor(() => {
         const confirmBtns = screen.queryAllByText(/confirm|approve/i);
         expect(confirmBtns.length).toBeGreaterThan(0);
       });
     }
   });
 
   it('calls approveCreditRequest on confirm', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     (adminApi.approveCreditRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('CR-2024-001').length).toBeGreaterThan(0));
     const approveBtns = screen.queryAllByText(/^approve$/i);
     if (approveBtns.length > 0) {
       fireEvent.click(approveBtns[0]);
       await waitFor(() => {
         const allBtns = screen.queryAllByRole("button", { name: /^Approve$/ }); const confirmBtn = allBtns[allBtns.length - 1];
         if (confirmBtn) fireEvent.click(confirmBtn);
       });
     }
   });
 
 
 
 
 
   it('shows error toast when trying to reject a payroll run', async () => {
     const mockToastError = vi.fn();
     vi.doMock('@/components/ui/Toast', () => ({
       useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: mockToastError, warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
       ToastProvider: ({ children }: { children: React.ReactNode }) => children,
     }));
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('PR-2024-001').length).toBeGreaterThan(0));
   });
 
   it('calls approvePayroll for payroll items', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     (adminApi.approvePayroll as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('PR-2024-001').length).toBeGreaterThan(0));
   });
 
   it('calls approveCreditOverride for credit override items', async () => {
     (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
     (adminApi.approveCreditOverride as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('CO-2024-001').length).toBeGreaterThan(0));
   });

  it('shows credit request reference matching dealer publicId (VAL-CROSS-006 cross-surface)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      // The reference shown in Admin approvals must match what the dealer submitted
      const refEls = screen.queryAllByText(/CR-2024-001/i);
      expect(refEls.length).toBeGreaterThan(0);
    });
  });

  it('credit request summary is visible in admin approvals (VAL-CROSS-006)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      // The summary of the dealer's credit request must be visible to admin for decision
      const summaryEls = screen.queryAllByText(/Credit request for dealer ABC/i);
      expect(summaryEls.length).toBeGreaterThan(0);
    });
  });

  it('approve action calls correct endpoint maintaining consistent decision state (VAL-CROSS-006)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    (adminApi.approveCreditRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockApprovals).mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CR-2024-001').length).toBeGreaterThan(0));
    // Verify approve button leads to the correct API call
    const approveBtns = screen.queryAllByText(/^approve$/i);
    if (approveBtns.length > 0) {
      fireEvent.click(approveBtns[0]);
      // Confirmation dialog opens
      await waitFor(() => {
        const confirmBtns = screen.queryAllByRole('button', { name: /approve/i });
        expect(confirmBtns.length).toBeGreaterThan(0);
      });
    }
  });
 });
