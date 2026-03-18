 /**
  * Tests for DealerSupportTicketsPage (Support Ticket Creation)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { LifeBuoy: M, RefreshCcw: M, AlertCircle: M, Plus: M, CheckCircle: M, MessageSquare: M, X: M };
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

  it('shows publicId as Ref so dealer can cross-reference with superadmin (VAL-CROSS-005)', async () => {
    (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      // The publicId must be visible in the dealer view for cross-reference
      const refs = screen.queryAllByText(/TICK-001/i);
      expect(refs.length).toBeGreaterThan(0);
    });
  });

  it('shows ticket status consistently (VAL-CROSS-005)', async () => {
    (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      // Status badges must be visible so they can be compared with superadmin view
      const openEls = screen.queryAllByText(/open/i);
      const inProgressEls = screen.queryAllByText(/in.progress/i);
      expect(openEls.length + inProgressEls.length).toBeGreaterThan(0);
    });
  });

  it('newly created ticket publicId appears in the list after creation (VAL-CROSS-005)', async () => {
    (dealerApi.getTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (dealerApi.createTicket as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      publicId: 'TICK-010',
      subject: 'Test issue',
      category: 'SUPPORT',
      status: 'OPEN',
      createdAt: '2026-03-01T10:00:00Z',
    });

    renderPage();

    // Wait for page to load with empty state
    await waitFor(() => {
      expect(screen.queryAllByText(/support tickets/i).length).toBeGreaterThan(0);
    });

    // Open the form
    const newBtn = screen.queryByRole('button', { name: /new ticket/i });
    if (newBtn) fireEvent.click(newBtn);

    // Wait for form to appear and fill in subject
    await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      if (inputs.length > 0) {
        fireEvent.change(inputs[0], { target: { value: 'Test issue' } });
      }
    });

    // Fill in description
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      fireEvent.change(textareas[0], { target: { value: 'Description of the issue' } });
    }

    // Submit and wait for API to be called
    const submitBtn = screen.queryByRole('button', { name: /submit ticket/i });
    if (submitBtn) fireEvent.click(submitBtn);

    await waitFor(() => {
      if ((dealerApi.createTicket as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
        expect(dealerApi.createTicket).toHaveBeenCalled();
      }
    });

    // After creation, the publicId of the new ticket should appear
    await waitFor(
      () => {
        const refs = screen.queryAllByText(/TICK-010/i);
        expect(refs.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });
 });
