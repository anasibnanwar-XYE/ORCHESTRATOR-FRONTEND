 /**
  * InvoiceDetailPage tests
  *
  * Covers VAL-O2C-011: consistent invoice totals, outstanding balance, and GST
  * component visibility across the Accounting invoice detail surface.
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter, Route, Routes } from 'react-router-dom';
 import { InvoiceDetailPage } from '../InvoiceDetailPage';
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
   },
 }));

 const mockInvoice = {
   id: 1,
   publicId: 'inv-001',
   invoiceNumber: 'INV-2026-001',
   issueDate: '2026-01-15',
   dueDate: '2026-02-15',
   status: 'SENT',
   currency: 'INR',
   dealerId: 1,
   dealerName: 'ABC Dealers',
   salesOrderId: null,
   journalEntryId: 42,
   subtotal: 10000,
   taxTotal: 1800,
   totalAmount: 11800,
   outstandingAmount: 11800,
   lines: [
     {
       id: 1,
       productCode: 'PAINT-001',
       description: 'White Paint 20L',
       quantity: 10,
       unitPrice: 1000,
       discountAmount: 0,
       taxableAmount: 10000,
       taxRate: 18,
       taxAmount: 1800,
       cgstAmount: 900,
       sgstAmount: 900,
       igstAmount: 0,
       lineTotal: 11800,
     },
   ],
   createdAt: '2026-01-15T10:00:00Z',
 };

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/accounting/invoices/1']}>
       <ToastProvider>
         <Routes>
           <Route path="/accounting/invoices/:id" element={<InvoiceDetailPage />} />
         </Routes>
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('InvoiceDetailPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(invoicesApi.getInvoice).mockResolvedValue(mockInvoice);
   });

   it('renders invoice number', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
     });
   });

   it('renders dealer name', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('ABC Dealers').length).toBeGreaterThan(0);
     });
   });

   it('renders line item product code', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('PAINT-001')).toBeInTheDocument();
     });
   });

   it('shows Download PDF button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
     });
   });

   it('shows Send Email button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
     });
   });

   it('opens email dialog when Send Email is clicked', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
     });
     fireEvent.click(screen.getByRole('button', { name: /send email/i }));
     await waitFor(() => {
       expect(screen.getByText('Send Invoice by Email')).toBeInTheDocument();
     });
   });

   it('email dialog shows editable subject and message fields', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
     });
     fireEvent.click(screen.getByRole('button', { name: /send email/i }));
     await waitFor(() => {
       expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
       expect(screen.getByPlaceholderText(/write your message/i)).toBeInTheDocument();
     });
   });

   it('email dialog pre-fills subject with invoice number', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
     });
     fireEvent.click(screen.getByRole('button', { name: /send email/i }));
     await waitFor(() => {
       const subjectInput = screen.getByLabelText(/subject/i) as HTMLInputElement;
       expect(subjectInput.value).toContain('INV-2026-001');
     });
   });

   it('shows error state on API failure', async () => {
     vi.mocked(invoicesApi.getInvoice).mockRejectedValue(new Error('Not found'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load invoice/i)).toBeInTheDocument();
     });
   });

   // ── VAL-O2C-011: invoice consistency across Sales and Accounting surfaces ──

   it('shows outstanding amount when non-zero', async () => {
     renderPage();
     await waitFor(() => {
       // The mockInvoice has outstandingAmount: 11800 > 0
       // It should render as "outstanding" somewhere on the page
       const outstandingEls = screen.queryAllByText(/outstanding/i);
       expect(outstandingEls.length).toBeGreaterThan(0);
     });
   });

   it('shows totals: subtotal, tax, and grand total', async () => {
     renderPage();
     await waitFor(() => {
       const subtotalEls = screen.queryAllByText(/subtotal/i);
       expect(subtotalEls.length).toBeGreaterThan(0);
       const taxEls = screen.queryAllByText(/^tax$/i);
       expect(taxEls.length).toBeGreaterThan(0);
       const totalEls = screen.queryAllByText(/^total$/i);
       expect(totalEls.length).toBeGreaterThan(0);
     });
   });

   it('shows salesOrderId linkage when salesOrderId is present', async () => {
     vi.mocked(invoicesApi.getInvoice).mockResolvedValue({
       ...mockInvoice,
       salesOrderId: 55,
     });
     renderPage();
     await waitFor(() => {
       const orderLink = screen.queryByTestId('sales-order-link');
       expect(orderLink).toBeTruthy();
       expect(orderLink?.textContent).toContain('55');
     });
   });

   it('does not show salesOrderId section when salesOrderId is null', async () => {
     vi.mocked(invoicesApi.getInvoice).mockResolvedValue({
       ...mockInvoice,
       salesOrderId: null,
     });
     renderPage();
     await waitFor(() => {
       const orderLink = screen.queryByTestId('sales-order-link');
       expect(orderLink).toBeNull();
     });
   });

   it('shows GST tax rate on line items', async () => {
     renderPage();
     await waitFor(() => {
       // mockInvoice has taxRate: 18 on its line
       const taxRateEls = screen.queryAllByText(/18%/);
       expect(taxRateEls.length).toBeGreaterThan(0);
     });
   });

   it('shows GST component breakdown (CGST/SGST) when amounts are non-zero', async () => {
     vi.mocked(invoicesApi.getInvoice).mockResolvedValue({
       ...mockInvoice,
       lines: [{
         ...mockInvoice.lines[0],
         cgstAmount: 900,
         sgstAmount: 900,
         igstAmount: 0,
       }],
     });
     renderPage();
     await waitFor(() => {
       const gstComponents = screen.queryAllByTestId('gst-components');
       expect(gstComponents.length).toBeGreaterThan(0);
     });
   });
 });
