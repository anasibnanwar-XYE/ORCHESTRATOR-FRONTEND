 /**
  * PurchaseReturnsPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { PurchaseReturnsPage } from '../PurchaseReturnsPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getRawMaterialPurchases: vi.fn(),
     getSuppliers: vi.fn(),
     createPurchaseReturn: vi.fn(),
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
     lines: [
       {
         rawMaterialId: 10,
         rawMaterialName: 'Titanium Dioxide',
         quantity: 100,
         unit: 'kg',
         costPerUnit: 450,
         lineTotal: 45000,
       },
     ],
   },
 ];
 
 const mockSuppliers = [
   {
     id: 1,
     publicId: 'sup-001',
     code: 'SUP001',
     name: 'Acme Materials',
     status: 'ACTIVE' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'REGULAR' as const,
     paymentTerms: 'NET_30' as const,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <PurchaseReturnsPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('PurchaseReturnsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(mockPurchases);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockSuppliers);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Purchase Returns')).toBeInTheDocument();
     });
   });
 
   it('renders the return form with supplier select', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Supplier *')).toBeInTheDocument();
     });
   });
 
   it('renders the Process Return button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Process Return')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getRawMaterialPurchases).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
     });
   });
 });
