 /**
  * Tests for DealerOrdersPage (My Orders)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     ShoppingBag: M, RefreshCcw: M, AlertCircle: M, Search: M,
     ChevronLeft: M, ChevronRight: M,
   };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getOrders: vi.fn(),
   },
 }));
 
 import { DealerOrdersPage } from '../DealerOrdersPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockOrders = [
   {
     id: 1,
     orderNumber: 'SO-1001',
     createdAt: '2026-01-15T10:00:00Z',
     status: 'CONFIRMED',
     totalAmount: 50000,
     paymentStatus: 'UNPAID',
   },
   {
     id: 2,
     orderNumber: 'SO-1002',
     createdAt: '2026-01-20T10:00:00Z',
     status: 'INVOICED',
     totalAmount: 35000,
     paymentStatus: 'PARTIAL',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/orders']}>
       <DealerOrdersPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerOrdersPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', async () => {
     (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => expect(screen.getByText('My Orders')).toBeDefined());
   });
 
   it('shows order numbers in table', async () => {
     (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('SO-1001');
       expect(els.length).toBeGreaterThan(0);
     });
   });
 
   it('shows skeleton loading state', () => {
     (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const errorEls = screen.queryAllByText(/couldn't load|error|failed/i);
       expect(errorEls.length).toBeGreaterThan(0);
     });
   });
 
   it('shows status badge for orders', async () => {
     (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       const confirmed = screen.getAllByText('Confirmed');
       expect(confirmed.length).toBeGreaterThan(0);
     });
   });
 });
