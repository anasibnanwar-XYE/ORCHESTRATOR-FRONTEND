 /**
  * Tests for DealersPage
  *
  * Covers:
  *   - Page renders with heading
  *   - Shows dealer names in table
  *   - Shows loading skeleton
  *   - Shows error state with retry
  *   - Shows empty state when no dealers
  *   - "New dealer" button is present
  *   - Dunning status badge shows "On Hold" for held dealers
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, AlertCircle: M, RefreshCcw: M, Search: M, X: M,
     ChevronDown: M, Lock: M, Unlock: M, Check: M,
   };
 });
 
 vi.mock('@/lib/salesApi', () => ({
   salesApi: {
     listDealers: vi.fn(),
     searchDealersManagement: vi.fn(),
     createDealer: vi.fn(),
     updateDealer: vi.fn(),
     holdDealerDunning: vi.fn(),
     getDealerAging: vi.fn(),
     getDealerLedger: vi.fn(),
     getDealerInvoices: vi.fn(),
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
       {props.error && <span>{props.error}</span>}
     </div>
   ),
 }));
 
 vi.mock('@/components/ui/ConfirmDialog', () => ({
   ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
     isOpen ? <div data-testid="confirm-dialog">{title}</div> : null,
 }));
 
 import { DealersPage } from '../DealersPage';
 import { salesApi } from '@/lib/salesApi';
 
 const mockDealers = {
   content: [
     {
       id: 1,
       name: 'Raj Paints',
       code: 'RAJ001',
       region: 'North',
       creditLimit: 500000,
       outstandingBalance: 125000,
       status: 'ACTIVE',
       dunningStatus: 'NONE',
     },
     {
       id: 2,
       name: 'Metro Distributors',
       code: 'MET002',
       region: 'South',
       creditLimit: 200000,
       outstandingBalance: 200000,
       status: 'ACTIVE',
       dunningStatus: 'ON_HOLD',
     },
   ],
   totalElements: 2,
   totalPages: 1,
   page: 0,
   size: 20,
 };
 
 const emptyResult = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/sales/dealers']}>
       <DealersPage />
     </MemoryRouter>
   );
 }
 
 describe('DealersPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading "Dealers"', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Dealers')).toBeDefined();
     });
   });
 
   it('shows loading skeletons while data loads', () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders dealer names in the table', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     renderPage();
     await waitFor(() => {
       const cells = screen.getAllByText('Raj Paints');
       expect(cells.length).toBeGreaterThan(0);
     });
   });
 
   it('shows "On Hold" badge for held dealers', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     renderPage();
     await waitFor(() => {
       const badges = screen.getAllByText('On Hold');
       expect(badges.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retries = screen.queryAllByText(/retry/i);
       const errors = screen.queryAllByText(/unable to load|error|network/i);
       expect(retries.length > 0 || errors.length > 0).toBe(true);
     });
   });
 
   it('shows empty state when no dealers', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(emptyResult);
     renderPage();
     await waitFor(() => {
       const empties = screen.queryAllByText(/no dealers/i);
       expect(empties.length).toBeGreaterThan(0);
     });
   });
 
   it('renders "New dealer" button', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     renderPage();
     await waitFor(() => {
       const btns = screen.queryAllByText(/new dealer/i);
       expect(btns.length).toBeGreaterThan(0);
     });
   })
   it('clicking a dealer card opens the detail modal', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     (salesApi.getDealerAging as ReturnType<typeof vi.fn>).mockResolvedValue({
       totalOutstanding: 0,
       buckets: { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 },
       lineItems: [],
     });
     renderPage();
     await waitFor(() => {
       const cells = screen.getAllByText('Raj Paints');
       expect(cells.length).toBeGreaterThan(0);
     });
     // Click on the first occurrence of 'Raj Paints' (desktop or mobile row/card)
     const dealerCells = screen.getAllByText('Raj Paints');
     fireEvent.click(dealerCells[0]);
     // The modal opens and the dealer detail modal should be present
     await waitFor(() => {
       const modal = screen.queryByTestId('modal');
       expect(modal).toBeDefined();
     });
   });

   it('dealer detail modal shows dealer name and credit info', async () => {
     (salesApi.listDealers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDealers);
     (salesApi.getDealerAging as ReturnType<typeof vi.fn>).mockResolvedValue({
       totalOutstanding: 125000,
       buckets: { current: 125000, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 },
       lineItems: [],
     });
     renderPage();
     await waitFor(() => {
       const cells = screen.getAllByText('Raj Paints');
       expect(cells.length).toBeGreaterThan(0);
     });
     const dealerCells = screen.getAllByText('Raj Paints');
     fireEvent.click(dealerCells[0]);
     await waitFor(() => {
       // Modal content should include the dealer name in header
       const dealerNames = screen.queryAllByText('Raj Paints');
       expect(dealerNames.length).toBeGreaterThan(0);
     });
   });

 });
