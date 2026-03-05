 /**
  * RawMaterialPurchasesPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { RawMaterialPurchasesPage } from '../RawMaterialPurchasesPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getRawMaterialPurchases: vi.fn(),
     getSuppliers: vi.fn(),
     getGoodsReceipts: vi.fn(),
     createRawMaterialPurchase: vi.fn(),
   },
 }));
 
 const mockPurchases = [
   {
     id: 1,
     publicId: 'rmp-001',
     invoiceNumber: 'INV-RM-001',
     invoiceDate: '2026-03-01',
     totalAmount: 45000,
     taxAmount: 8100,
     outstandingAmount: 45000,
     status: 'POSTED',
     supplierId: 1,
     supplierName: 'Acme Materials',
     goodsReceiptId: 1,
     goodsReceiptNumber: 'GRN-2026-001',
     createdAt: '2026-03-01T10:00:00Z',
     lines: [],
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <RawMaterialPurchasesPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('RawMaterialPurchasesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(mockPurchases);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue([]);
     vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([]);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Raw Material Purchases')).toBeInTheDocument();
     });
   });
 
  it('shows invoice numbers in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('INV-RM-001').length).toBeGreaterThan(0);
    });
  });

  it('shows POSTED status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Posted').length).toBeGreaterThan(0);
    });
  });
 
   it('shows Record Purchase button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Record Purchase')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getRawMaterialPurchases).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load purchases/i)).toBeInTheDocument();
     });
   });
 
   it('calls getRawMaterialPurchases on mount', async () => {
     renderPage();
     await waitFor(() => {
       expect(purchasingApi.getRawMaterialPurchases).toHaveBeenCalledTimes(1);
     });
   });
 });
