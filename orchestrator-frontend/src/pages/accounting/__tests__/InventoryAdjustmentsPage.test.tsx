 /**
  * InventoryAdjustmentsPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { InventoryAdjustmentsPage } from '../InventoryAdjustmentsPage';
 import { inventoryApi } from '@/lib/inventoryApi';
 import { accountingApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/inventoryApi', () => ({
   inventoryApi: {
     getAdjustments: vi.fn(),
     createAdjustment: vi.fn(),
     getFinishedGoods: vi.fn(),
   },
 }));
 
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getAccounts: vi.fn(),
   },
 }));
 
 const mockAdjustments = [
   {
     id: 1,
     referenceNumber: 'ADJ-001',
     adjustmentDate: '2026-01-15',
     type: 'DAMAGED' as const,
     status: 'POSTED',
     reason: 'Water damage in warehouse',
     totalAmount: 25000,
     journalEntryId: 42,
     lines: [],
   },
   {
     id: 2,
     referenceNumber: 'ADJ-002',
     adjustmentDate: '2026-02-01',
     type: 'RECOUNT_UP' as const,
     reason: 'Stock recount correction',
     totalAmount: 15000,
     lines: [],
   },
 ];
 
 const mockFinishedGoods = [
   { id: 1, name: 'White Paint 20L', sku: 'WP-20L', onHandQty: 100, active: true },
 ];
 
 const mockAccounts = [
  { id: 10, publicId: 'acc-010', code: 'EXP-001', name: 'Inventory Loss', type: 'EXPENSE' as const, balance: 0, parentId: null },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <InventoryAdjustmentsPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('InventoryAdjustmentsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(inventoryApi.getAdjustments).mockResolvedValue(mockAdjustments);
     vi.mocked(inventoryApi.getFinishedGoods).mockResolvedValue(mockFinishedGoods);
     vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Inventory Adjustments')).toBeInTheDocument();
     });
   });
 
   it('shows adjustment references in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('ADJ-001').length).toBeGreaterThan(0);
       expect(screen.getAllByText('ADJ-002').length).toBeGreaterThan(0);
     });
   });
 
   it('shows adjustment type badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Damaged').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Recount Up').length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Adjustment button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Adjustment')).toBeInTheDocument();
     });
   });
 
   it('shows journal entry link', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('#42').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(inventoryApi.getAdjustments).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load inventory adjustments/i)).toBeInTheDocument();
     });
   });

  it('shows permission state when finished goods access is unavailable', async () => {
    vi.mocked(inventoryApi.getFinishedGoods).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
      message: 'Request failed with status code 404',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Access restricted')).toBeInTheDocument();
      expect(
        screen.getByText(/Finished goods inventory is unavailable for this accounting role/i),
      ).toBeInTheDocument();
    });
  });
 });
