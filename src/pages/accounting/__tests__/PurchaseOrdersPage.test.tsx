 /**
  * PurchaseOrdersPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { PurchaseOrdersPage } from '../PurchaseOrdersPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getPurchaseOrders: vi.fn(),
     getSuppliers: vi.fn(),
     getRawMaterials: vi.fn(),
     createPurchaseOrder: vi.fn(),
     approvePurchaseOrder: vi.fn(),
     voidPurchaseOrder: vi.fn(),
     closePurchaseOrder: vi.fn(),
     getPurchaseOrderTimeline: vi.fn(),
   },
 }));
 
 const mockOrders = [
   {
     id: 1,
     publicId: 'po-001',
     orderNumber: 'PO-2026-001',
     orderDate: '2026-03-01',
     totalAmount: 50000,
     status: 'DRAFT' as const,
     supplierName: 'Acme Materials',
     supplierId: 1,
     createdAt: '2026-03-01T10:00:00Z',
     lines: [],
   },
   {
     id: 2,
     publicId: 'po-002',
     orderNumber: 'PO-2026-002',
     orderDate: '2026-03-05',
     totalAmount: 80000,
     status: 'APPROVED' as const,
     supplierName: 'Beta Chemicals',
     supplierId: 2,
     createdAt: '2026-03-05T10:00:00Z',
     lines: [],
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <PurchaseOrdersPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('PurchaseOrdersPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue(mockOrders);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue([]);
     vi.mocked(purchasingApi.getRawMaterials).mockResolvedValue([]);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
     });
   });
 
  it('shows PO order numbers in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('PO-2026-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PO-2026-002').length).toBeGreaterThan(0);
    });
  });

  it('shows DRAFT and APPROVED status badges', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    });
  });
 
   it('shows New PO button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New PO')).toBeInTheDocument();
     });
   });
 
   it('opens create PO modal when New PO is clicked', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New PO')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => {
       expect(screen.getByText('New Purchase Order')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getPurchaseOrders).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load purchase orders/i)).toBeInTheDocument();
     });
   });
 
   it('calls getPurchaseOrders on mount', async () => {
     renderPage();
     await waitFor(() => {
       expect(purchasingApi.getPurchaseOrders).toHaveBeenCalledTimes(1);
     });
   });
 });
