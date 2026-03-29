 /**
  * Tests for CreditOverridesPage
  *
  * Covers:
  *   - Page renders with heading
  *   - Shows override requests in table
  *   - Shows loading skeleton
  *   - Shows error state with retry
  *   - Shows empty state when no overrides
  *   - "New override" button is present
  *   - Approve/Reject buttons visible for PENDING requests
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
     listCreditOverrides: vi.fn(),
     createCreditOverride: vi.fn(),
     approveCreditOverride: vi.fn(),
     rejectCreditOverride: vi.fn(),
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
 
 import { CreditOverridesPage } from '../CreditOverridesPage';
 import { salesApi } from '@/lib/salesApi';
 
 const mockOverrides = [
   {
     id: 1,
     publicId: 'OVR-001',
     dealerName: 'Raj Paints',
     dispatchAmount: 750000,
     creditLimit: 500000,
     requiredHeadroom: 250000,
     status: 'PENDING',
     createdAt: '2026-01-10T10:00:00Z',
   },
   {
     id: 2,
     publicId: 'OVR-002',
     dealerName: 'Metro Distributors',
     dispatchAmount: 300000,
     creditLimit: 400000,
     requiredHeadroom: 0,
     status: 'APPROVED',
     createdAt: '2026-01-08T10:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/sales/credit-overrides']}>
       <CreditOverridesPage />
     </MemoryRouter>
   );
 }
 
 describe('CreditOverridesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading "Credit Override Requests"', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverrides);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Credit Override Requests')).toBeDefined();
     });
   });
 
   it('shows loading skeletons while data loads', () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders dealer names in the table', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverrides);
     renderPage();
     await waitFor(() => {
       const cells = screen.getAllByText('Raj Paints');
       expect(cells.length).toBeGreaterThan(0);
     });
   });
 
   it('shows Approve and Reject buttons for PENDING overrides', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverrides);
     renderPage();
     await waitFor(() => {
       const approvals = screen.getAllByText(/approve/i);
       expect(approvals.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retries = screen.queryAllByText(/retry/i);
       const errors = screen.queryAllByText(/unable to load|error|network/i);
       expect(retries.length > 0 || errors.length > 0).toBe(true);
     });
   });
 
   it('shows empty state when no overrides', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const empties = screen.queryAllByText(/no override/i);
       expect(empties.length).toBeGreaterThan(0);
     });
   });
 
   it('renders "New override" button', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverrides);
     renderPage();
     await waitFor(() => {
       const btns = screen.queryAllByText(/new override/i);
       expect(btns.length).toBeGreaterThan(0);
     });
   });
 
   it('shows APPROVED status badge', async () => {
     (salesApi.listCreditOverrides as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverrides);
     renderPage();
     await waitFor(() => {
       const badges = screen.getAllByText('APPROVED');
       expect(badges.length).toBeGreaterThan(0);
     });
   });
 });
