 /**
  * InvoicesPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { InvoicesPage } from '../InvoicesPage';
 import { invoicesApi } from '@/lib/reportsApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/reportsApi', () => ({
   invoicesApi: {
     getInvoices: vi.fn(),
     getInvoice: vi.fn(),
     downloadInvoicePdf: vi.fn(),
     sendInvoiceEmail: vi.fn(),
   },
   reportsApi: {
     getTrialBalance: vi.fn(),
     getProfitLoss: vi.fn(),
     getBalanceSheet: vi.fn(),
     getCashFlow: vi.fn(),
     getAgedDebtors: vi.fn(),
     getGstReturn: vi.fn(),
     getInventoryValuation: vi.fn(),
     getReconciliationDashboard: vi.fn(),
   },
 }));

 const mockInvoices = [
   {
     id: 1,
     publicId: 'inv-001',
     invoiceNumber: 'INV-001',
     issueDate: '2026-01-15',
     dueDate: '2026-02-15',
     status: 'SENT',
     currency: 'INR',
     dealerId: 1,
     dealerName: 'ABC Dealers',
     salesOrderId: null,
     journalEntryId: null,
     subtotal: 10000,
     taxTotal: 1800,
     totalAmount: 11800,
     outstandingAmount: 11800,
     lines: [],
     createdAt: '2026-01-15T10:00:00Z',
   },
   {
     id: 2,
     publicId: 'inv-002',
     invoiceNumber: 'INV-002',
     issueDate: '2026-01-20',
     dueDate: '2026-01-25',
     status: 'OVERDUE',
     currency: 'INR',
     dealerId: 2,
     dealerName: 'XYZ Traders',
     salesOrderId: null,
     journalEntryId: null,
     subtotal: 5000,
     taxTotal: 900,
     totalAmount: 5900,
     outstandingAmount: 5900,
     lines: [],
     createdAt: '2026-01-20T10:00:00Z',
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <InvoicesPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('InvoicesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(invoicesApi.getInvoices).mockResolvedValue(mockInvoices);
   });

   it('renders the invoices page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Invoices')).toBeInTheDocument();
     });
   });

   it('renders All status tab by default', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('All')).toBeInTheDocument();
     });
   });

   it('shows all invoices on All tab', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('INV-001').length).toBeGreaterThan(0);
       expect(screen.getAllByText('INV-002').length).toBeGreaterThan(0);
     });
   });

   it('filters invoices by status tab', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('INV-001').length).toBeGreaterThan(0);
     });

    const overdueButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.trim().startsWith('Overdue')
    );
    expect(overdueButtons.length).toBeGreaterThan(0);
    fireEvent.click(overdueButtons[0]);
     await waitFor(() => {
       expect(screen.getAllByText('INV-002').length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     vi.mocked(invoicesApi.getInvoices).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load invoices/i)).toBeInTheDocument();
     });
   });

   it('calls getInvoices on mount', async () => {
     renderPage();
     await waitFor(() => {
       expect(invoicesApi.getInvoices).toHaveBeenCalledTimes(1);
     });
   });
 });
