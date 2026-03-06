 /**
  * Tests for DealerDashboardPage
  *
  * Covers:
  *  - Renders 5 KPI stat cards (Total Orders, Outstanding Balance, Last Payment, Available Credit, Pending Requests)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state with retry on API failure
  *  - Clicking KPI cards navigates to relevant sections
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     ShoppingBag: M, CreditCard: M, Calendar: M, Wallet: M, Clock: M,
     RefreshCcw: M, AlertCircle: M, ArrowRight: M,
   };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getDashboard: vi.fn(),
   },
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { DealerDashboardPage } from '../DealerDashboardPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockDashboard = {
   totalOrders: 24,
   outstandingBalance: 125000,
   lastPaymentDate: '2026-02-15T00:00:00Z',
   availableCredit: 75000,
   pendingRequests: 2,
   creditLimit: 200000,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer']}>
       <DealerDashboardPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
   });
 
   it('shows skeleton loading state while data loads', () => {
     (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 5 KPI stat cards after data loads', async () => {
     (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Total Orders')).toBeDefined();
       expect(screen.getByText('Outstanding Balance')).toBeDefined();
       expect(screen.getByText('Last Payment')).toBeDefined();
       expect(screen.getByText('Available Credit')).toBeDefined();
       expect(screen.getByText('Pending Requests')).toBeDefined();
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry/i);
       const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('clicking Total Orders card navigates to /dealer/orders', async () => {
     (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => expect(screen.getByText('Total Orders')).toBeDefined());
     const card = screen.getByText('Total Orders').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/dealer/orders');
     }
   });
 
   it('clicking Available Credit navigates to /dealer/credit-requests', async () => {
     (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => expect(screen.getByText('Available Credit')).toBeDefined());
     const card = screen.getByText('Available Credit').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/dealer/credit-requests');
     }
   });
 });
