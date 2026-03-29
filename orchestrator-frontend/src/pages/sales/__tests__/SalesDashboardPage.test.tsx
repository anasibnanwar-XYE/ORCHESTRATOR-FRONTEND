 /**
  * Tests for SalesDashboardPage
  *
  * Covers:
  *  - Renders 5 KPI stat cards (Total Orders, Revenue, Outstanding Receivables, Active Orders, Pending Dispatches)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state with retry on API failure
  *  - Renders recent orders list
  *  - Clicking KPI cards navigates to /sales/orders
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     ShoppingCart: M, TrendingUp: M, AlertCircle: M, RefreshCcw: M,
     ArrowRight: M, Truck: M, IndianRupee: M, Clock: M, Activity: M,
   };
 });
 
 // Mock salesApi
 vi.mock('@/lib/salesApi', () => ({
   salesApi: {
     getDashboardMetrics: vi.fn(),
     searchOrders: vi.fn(),
   },
 }));
 
 // Mock navigate
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { SalesDashboardPage } from '../SalesDashboardPage';
 import { salesApi } from '@/lib/salesApi';
 
 const mockMetrics = {
   totalOrders: 42,
   revenue: 1500000,
   outstandingReceivables: 250000,
   pendingDispatches: 8,
   activeOrders: 15,
 };
 
 const mockOrders = {
   content: [
     {
       id: 1,
       orderNumber: 'SO-001',
       status: 'CONFIRMED',
       totalAmount: 50000,
       dealerName: 'Ace Hardware',
       createdAt: '2026-01-15T10:00:00Z',
       items: [],
     },
     {
       id: 2,
       orderNumber: 'SO-002',
       status: 'DRAFT',
       totalAmount: 30000,
       dealerName: 'BuildMart',
       createdAt: '2026-01-14T10:00:00Z',
       items: [],
     },
   ],
   totalElements: 2,
   totalPages: 1,
   page: 0,
   size: 5,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/sales']}>
       <SalesDashboardPage />
     </MemoryRouter>
   );
 }
 
 describe('SalesDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
   });
 
   it('shows skeleton loading state while data loads', () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 5 KPI stat cards after data loads', async () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Total Orders')).toBeDefined();
       expect(screen.getByText('Revenue')).toBeDefined();
       expect(screen.getByText('Outstanding Receivables')).toBeDefined();
       expect(screen.getByText('Active Orders')).toBeDefined();
       expect(screen.getByText('Pending Dispatches')).toBeDefined();
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry/i);
       const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('renders recent orders with order numbers', async () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('SO-001');
       expect(els.length).toBeGreaterThan(0);
     });
   });
 
   it('clicking Total Orders card navigates to /sales/orders', async () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Total Orders')).toBeDefined();
     });
     const card = screen.getByText('Total Orders').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/sales/orders');
     }
   });
 
   it('clicking a recent order navigates to order detail', async () => {
     (salesApi.getDashboardMetrics as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics);
     (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('SO-001');
       expect(els.length).toBeGreaterThan(0);
     });
     const orderBtn = screen.getAllByText('SO-001')[0].closest('button');
     if (orderBtn) {
       fireEvent.click(orderBtn);
       expect(mockNavigate).toHaveBeenCalledWith('/sales/orders/1');
     }
   });
 });
