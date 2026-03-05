 /**
  * GoodsReceiptNotesPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { GoodsReceiptNotesPage } from '../GoodsReceiptNotesPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getGoodsReceipts: vi.fn(),
     getPurchaseOrders: vi.fn(),
     createGoodsReceipt: vi.fn(),
   },
 }));
 
 const mockGRNs = [
   {
     id: 1,
     publicId: 'grn-001',
     receiptNumber: 'GRN-2026-001',
     receiptDate: '2026-03-01',
     totalAmount: 45000,
     status: 'RECEIVED' as const,
     supplierId: 1,
     supplierName: 'Acme Materials',
     purchaseOrderId: 1,
     purchaseOrderNumber: 'PO-2026-001',
     createdAt: '2026-03-01T10:00:00Z',
     lines: [],
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <GoodsReceiptNotesPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('GoodsReceiptNotesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue(mockGRNs);
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue([]);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Goods Receipt Notes')).toBeInTheDocument();
     });
   });
 
  it('shows GRN receipt numbers in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('GRN-2026-001').length).toBeGreaterThan(0);
    });
  });

  it('shows RECEIVED status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Received').length).toBeGreaterThan(0);
    });
  });
 
   it('shows New GRN button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New GRN')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getGoodsReceipts).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load goods receipts/i)).toBeInTheDocument();
     });
   });
 });
