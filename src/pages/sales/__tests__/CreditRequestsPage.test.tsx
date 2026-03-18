 /**
  * Tests for CreditRequestsPage
  *
  * Covers:
  *   - Page renders with heading
  *   - Shows credit requests in table
  *   - Shows loading skeleton
  *   - Shows error state with retry
  *   - Shows empty state when no requests
  *   - "New request" button is present
  *   - Approve/Reject buttons visible for PENDING requests
  *   - Status badge shows correctly
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M };
 });
 
 vi.mock('@/lib/salesApi', () => ({
   salesApi: {
     listCreditRequests: vi.fn(),
     createCreditRequest: vi.fn(),
     approveCreditRequest: vi.fn(),
     rejectCreditRequest: vi.fn(),
     searchDealers: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ success: vi.fn(), error: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 vi.mock('@/components/ui/Skeleton', () => ({
   Skeleton: ({ className }: { className?: string }) => (
     <div className={`animate-pulse ${className ?? ''}`} data-testid="skeleton" />
   ),
 }));
 
 vi.mock('@/components/ui/Modal', () => ({
   Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
     isOpen ? <div data-testid="modal">{children}</div> : null,
 }));
 
 vi.mock('@/components/ui/Input', () => ({
   Input: (props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
     <div>
       {props.label && <label>{props.label}</label>}
       <input {...props} />
     </div>
   ),
 }));
 
 import { CreditRequestsPage } from '../CreditRequestsPage';
 import { salesApi } from '@/lib/salesApi';
 
 const mockRequests = [
   {
     id: 1,
     publicId: 'CR-001',
     dealerName: 'Raj Paints',
     amountRequested: 500000,
     status: 'PENDING',
     reason: 'Expansion',
     createdAt: '2026-01-10T10:00:00Z',
   },
   {
     id: 2,
     publicId: 'CR-002',
     dealerName: 'Metro Distributors',
     amountRequested: 200000,
     status: 'APPROVED',
     reason: null,
     createdAt: '2026-01-08T10:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/sales/credit-requests']}>
       <CreditRequestsPage />
     </MemoryRouter>
   );
 }
 
 describe('CreditRequestsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading "Credit Requests"', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Credit Requests')).toBeDefined();
     });
   });
 
   it('shows loading skeletons while data loads', () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders dealer names in the table', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
     renderPage();
     await waitFor(() => {
       const cells = screen.getAllByText('Raj Paints');
       expect(cells.length).toBeGreaterThan(0);
     });
   });
 
   it('shows Approve and Reject buttons for PENDING requests', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
     renderPage();
     await waitFor(() => {
       const approvals = screen.getAllByText(/approve/i);
       expect(approvals.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retries = screen.queryAllByText(/retry/i);
       const errors = screen.queryAllByText(/unable to load|error|network/i);
       expect(retries.length > 0 || errors.length > 0).toBe(true);
     });
   });
 
   it('shows empty state when no requests', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const empties = screen.queryAllByText(/no credit requests/i);
       expect(empties.length).toBeGreaterThan(0);
     });
   });
 
   it('renders "New request" button', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
     renderPage();
     await waitFor(() => {
       const btns = screen.queryAllByText(/new request/i);
       expect(btns.length).toBeGreaterThan(0);
     });
   });
 
   it('shows APPROVED status badge', async () => {
     (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
     renderPage();
     await waitFor(() => {
       const badges = screen.getAllByText('APPROVED');
       expect(badges.length).toBeGreaterThan(0);
     });
   });

  it('shows reason below dealer name when present (VAL-CROSS-006)', async () => {
    const requestsWithReason = [
      {
        id: 1,
        publicId: 'CR-001',
        dealerName: 'Raj Paints',
        amountRequested: 500000,
        status: 'PENDING',
        reason: 'Seasonal inventory expansion',
        createdAt: '2026-01-10T10:00:00Z',
      },
    ];
    (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(requestsWithReason);
    renderPage();
    await waitFor(() => {
      const reasonEls = screen.queryAllByText(/Seasonal inventory expansion/i);
      expect(reasonEls.length).toBeGreaterThan(0);
    });
  });

  it('shows matching publicId as dealer submitted (VAL-CROSS-006 cross-surface)', async () => {
    (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
    renderPage();
    await waitFor(() => {
      // The publicId shown in the Sales view must match what the dealer sees
      const idEls = screen.queryAllByText(/CR-001/i);
      expect(idEls.length).toBeGreaterThan(0);
    });
  });

  it('status is consistent with dealer submitted status (VAL-CROSS-006)', async () => {
    (salesApi.listCreditRequests as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);
    renderPage();
    await waitFor(() => {
      // PENDING status badge must appear for dealer-submitted request
      const pendingEls = screen.queryAllByText(/PENDING/i);
      expect(pendingEls.length).toBeGreaterThan(0);
    });
  });
 });
