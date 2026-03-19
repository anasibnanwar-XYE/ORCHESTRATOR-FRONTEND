 /**
  * GoodsReceiptNotesPage tests
  *
  * Covers:
  *  - Page renders with GRN list
  *  - Only approved POs are offered for GRN creation (idempotent, approved-only)
  *  - GRN create sends a non-empty Idempotency-Key
  *  - Over-receipt quantities are rejected client-side with a recoverable form
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

 const mockApprovedPO = {
   id: 10,
   publicId: 'po-010',
   orderNumber: 'PO-2026-010',
   orderDate: '2026-03-01',
   totalAmount: 50000,
   status: 'APPROVED' as const,
   supplierId: 1,
   supplierName: 'Acme Materials',
   createdAt: '2026-03-01T08:00:00Z',
   lines: [
     {
       rawMaterialId: 1,
       rawMaterialName: 'Titanium Dioxide',
       quantity: 100,
       unit: 'KG',
       costPerUnit: 500,
       lineTotal: 50000,
     },
   ],
 };

 const mockDraftPO = {
   id: 11,
   publicId: 'po-011',
   orderNumber: 'PO-2026-011',
   orderDate: '2026-03-01',
   totalAmount: 10000,
   status: 'DRAFT' as const,
   supplierId: 1,
   supplierName: 'Acme Materials',
   createdAt: '2026-03-01T09:00:00Z',
   lines: [],
 };
 
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

   it('only approved POs appear in the GRN create form', async () => {
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue([mockApprovedPO, mockDraftPO]);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New GRN')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New GRN'));
     await waitFor(() => {
       expect(screen.getByText('New Goods Receipt Note')).toBeInTheDocument();
     });
     // The approved PO label should appear in the select
     expect(screen.getByText(/PO-2026-010/)).toBeInTheDocument();
     // The draft PO should not appear
     expect(screen.queryByText(/PO-2026-011/)).toBeNull();
   });

   it('GRN create sends a non-empty idempotency key', async () => {
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue([mockApprovedPO]);
     vi.mocked(purchasingApi.createGoodsReceipt).mockResolvedValue({
       ...mockGRNs[0],
       id: 2,
       receiptNumber: 'GRN-2026-002',
       purchaseOrderId: 10,
       purchaseOrderNumber: 'PO-2026-010',
     });
     renderPage();
     await waitFor(() => screen.getByText('New GRN'));
     fireEvent.click(screen.getByText('New GRN'));
     await waitFor(() => screen.getByText('New Goods Receipt Note'));

     // Select the approved PO
     const poSelect = screen.getByLabelText(/Purchase Order/i);
     fireEvent.change(poSelect, { target: { value: '10' } });

     // Fill receipt number
     const receiptInput = screen.getByLabelText(/Receipt Number/i);
     fireEvent.change(receiptInput, { target: { value: 'GRN-TEST-001' } });

     // Submit
     fireEvent.click(screen.getByText('Record Receipt'));
     await waitFor(() => {
       expect(purchasingApi.createGoodsReceipt).toHaveBeenCalledTimes(1);
       const [, idempotencyKey] = vi.mocked(purchasingApi.createGoodsReceipt).mock.calls[0];
       expect(typeof idempotencyKey).toBe('string');
       expect(idempotencyKey.length).toBeGreaterThan(0);
     });
   });

   it('over-receipt validation blocks submit and keeps form open', async () => {
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue([mockApprovedPO]);
     renderPage();
     await waitFor(() => screen.getByText('New GRN'));
     fireEvent.click(screen.getByText('New GRN'));
     await waitFor(() => screen.getByText('New Goods Receipt Note'));

     // Select the approved PO to pre-fill lines
     const poSelect = screen.getByLabelText(/Purchase Order/i);
     fireEvent.change(poSelect, { target: { value: '10' } });
     await waitFor(() => screen.getByText('Titanium Dioxide'));

     // Fill receipt number
     const receiptInput = screen.getByLabelText(/Receipt Number/i);
     fireEvent.change(receiptInput, { target: { value: 'GRN-OVER-001' } });

     // Enter a quantity that exceeds the ordered qty (100)
     const qtyInputs = screen.getAllByLabelText(/^Qty/i);
     fireEvent.change(qtyInputs[0], { target: { value: '999' } });

     // Attempt submit
     fireEvent.click(screen.getByText('Record Receipt'));
     await waitFor(() => {
       expect(screen.getByText(/Cannot exceed ordered quantity/i)).toBeInTheDocument();
     });
     // Form should remain open (no GRN created)
     expect(purchasingApi.createGoodsReceipt).not.toHaveBeenCalled();
     // Modal still visible
     expect(screen.getByText('New Goods Receipt Note')).toBeInTheDocument();
   });
 });
