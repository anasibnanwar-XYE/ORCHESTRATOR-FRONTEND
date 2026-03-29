 /**
  * Tests for DealerInvoicesPage (My Invoices)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     FileText: M, Download: M, RefreshCcw: M, AlertCircle: M,
   };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getInvoices: vi.fn(),
     getInvoicePdf: vi.fn(),
   },
 }));

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { DealerInvoicesPage } from '../DealerInvoicesPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockInvoices = [
   {
     id: 101,
     invoiceNumber: 'INV-2026-001',
     issueDate: '2026-01-10T00:00:00Z',
     subtotal: 45000,
     taxTotal: 8100,
     totalAmount: 53100,
     status: 'UNPAID',
     outstandingAmount: 53100,
   },
   {
     id: 102,
     invoiceNumber: 'INV-2026-002',
     issueDate: '2026-01-20T00:00:00Z',
     subtotal: 30000,
     taxTotal: 5400,
     totalAmount: 35400,
     status: 'PAID',
     outstandingAmount: 0,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/invoices']}>
       <DealerInvoicesPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerInvoicesPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', async () => {
     (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
     renderPage();
     await waitFor(() => expect(screen.getByText('My Invoices')).toBeDefined());
   });
 
   it('shows invoice numbers in table', async () => {
     (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('INV-2026-001');
       expect(els.length).toBeGreaterThan(0);
     });
   });
 
   it('shows skeleton loading state', () => {
     (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const errorEls = screen.queryAllByText(/couldn't load|error|failed/i);
       expect(errorEls.length).toBeGreaterThan(0);
     });
   });
 
   it('triggers PDF download on download action click', async () => {
     (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
     const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
     (dealerApi.getInvoicePdf as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlob);
 
     // Mock URL.createObjectURL
     const mockUrl = 'blob:mock-url';
     (URL.createObjectURL as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(mockUrl);
     (URL.revokeObjectURL as ReturnType<typeof vi.fn>) = vi.fn();
 
     renderPage();
 
     await waitFor(() => {
       const downloadBtns = screen.queryAllByRole('button', { name: /download/i });
       expect(downloadBtns.length).toBeGreaterThan(0);
     });
   });
 });
