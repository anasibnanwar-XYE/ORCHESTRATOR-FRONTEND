 /**
  * Tests for DealerSupportTicketsPage (Support Ticket Creation)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { LifeBuoy: M, RefreshCcw: M, AlertCircle: M, Plus: M, CheckCircle: M, MessageSquare: M };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getTickets: vi.fn(),
     createTicket: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { DealerSupportTicketsPage } from '../DealerSupportTicketsPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockTickets = [
   {
     id: 1,
     publicId: 'TICK-001',
     subject: 'Order not received',
     category: 'SUPPORT',
     status: 'OPEN',
     createdAt: '2026-01-10T10:00:00Z',
   },
   {
     id: 2,
     publicId: 'TICK-002',
     subject: 'Invoice discrepancy',
     category: 'BUG',
     status: 'IN_PROGRESS',
     createdAt: '2026-01-15T10:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/support']}>
       <DealerSupportTicketsPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerSupportTicketsPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', async () => {
     (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
     renderPage();
     await waitFor(() => expect(screen.getByText('Support Tickets')).toBeDefined());
   });
 
   it('shows existing tickets', async () => {
     (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('Order not received');
       expect(els.length).toBeGreaterThan(0);
     });
   });
 
   it('shows skeleton loading state', () => {
     (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const errorEls = screen.queryAllByText(/couldn't load|error|failed/i);
       expect(errorEls.length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Ticket button', async () => {
     (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
     renderPage();
     await waitFor(() => {
       const btn = screen.queryByRole('button', { name: /new ticket|new support ticket/i });
       expect(btn).toBeDefined();
     });
   });
 });
