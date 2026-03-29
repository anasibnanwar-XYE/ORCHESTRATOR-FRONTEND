 /**
  * FinishedGoodsPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { FinishedGoodsPage } from '../FinishedGoodsPage';
 import { inventoryApi } from '@/lib/inventoryApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/inventoryApi', () => ({
   inventoryApi: {
     getFinishedGoods: vi.fn(),
     getFinishedGoodsStockSummary: vi.fn(),
     getFinishedGoodBatches: vi.fn(),
   },
 }));
 
 const mockFinishedGoods = [
   {
     id: 1,
     name: 'White Paint 20L',
     sku: 'ACME-WP-20L',
     brandName: 'Acme Paints',
     unitOfMeasure: 'LITRE',
     onHandQty: 250,
     reservedQty: 50,
     availableQty: 200,
     reorderLevel: 100,
     active: true,
   },
   {
     id: 2,
     name: 'Roof Shield 4L',
     sku: 'ACME-RS-4L',
     brandName: 'Acme Paints',
     unitOfMeasure: 'LITRE',
     onHandQty: 30,
     reservedQty: 0,
     availableQty: 30,
     reorderLevel: 50,
     active: true,
   },
 ];
 
 const mockSummary = [
   {
     finishedGoodId: 1,
     name: 'White Paint 20L',
     sku: 'ACME-WP-20L',
     currentStock: 250,
     reservedStock: 50,
     availableStock: 200,
     weightedAverageCost: 850,
   },
   {
     finishedGoodId: 2,
     name: 'Roof Shield 4L',
     sku: 'ACME-RS-4L',
     currentStock: 30,
     reservedStock: 0,
     availableStock: 30,
     weightedAverageCost: 450,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <FinishedGoodsPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('FinishedGoodsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(inventoryApi.getFinishedGoods).mockResolvedValue(mockFinishedGoods);
     vi.mocked(inventoryApi.getFinishedGoodsStockSummary).mockResolvedValue(mockSummary);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Finished Goods')).toBeInTheDocument();
     });
   });
 
   it('shows product names in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('White Paint 20L').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Roof Shield 4L').length).toBeGreaterThan(0);
     });
   });
 
   it('shows stock summary tiles', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Total On Hand').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Batches buttons for each item', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Batches').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Low Stock badge for item below reorder level', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Low Stock').length).toBeGreaterThan(0);
     });
   });
 
   it('shows In Stock badge for items above reorder level', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('In Stock').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(inventoryApi.getFinishedGoods).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load finished goods/i)).toBeInTheDocument();
     });
   });
 });
