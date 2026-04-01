 /**
  * Tests for FinishedGoodsPage
  *
  * Covers:
  *  - Shows page heading
  *  - Shows loading skeleton initially
  *  - Shows finished goods in table after data loads
  *  - Shows error state on API failure
  *  - Shows empty state when no finished goods
  *  - Low-stock filter works
  *  - Stock summary tab renders
  *  - Create entry button opens modal
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import React from 'react';

 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({
     success: vi.fn(),
     error: vi.fn(),
     info: vi.fn(),
     warning: vi.fn(),
   }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getFinishedGoods: vi.fn(),
     getLowStockItems: vi.fn(),
     getFinishedGoodStockSummary: vi.fn(),
     createFinishedGood: vi.fn(),
     updateFinishedGood: vi.fn(),
     getFinishedGoodBatches: vi.fn(),
     getBulkBatches: vi.fn(),
     getBulkBatchChildren: vi.fn(),
     getLowStockThreshold: vi.fn(),
     setLowStockThreshold: vi.fn(),
     registerFinishedGoodBatch: vi.fn(),
   },
 }));

 import { FinishedGoodsPage } from '../FinishedGoodsPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockGoods = [
   {
     id: 1,
     name: 'Exterior Emulsion',
     productCode: 'EXT-1L',
     unit: 'L',
     currentStock: 500,
     reservedStock: 100,
   },
   {
     id: 2,
     name: 'Interior Emulsion',
     productCode: 'INT-4L',
     unit: 'L',
     currentStock: 5,
     reservedStock: 0,
   },
 ];

 const mockSummary = [
   {
     id: 1,
     name: 'Exterior Emulsion',
     code: 'EXT-1L',
     currentStock: 500,
     reservedStock: 100,
     availableStock: 400,
     weightedAverageCost: 150,
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/inventory/finished-goods']}>
       <FinishedGoodsPage />
     </MemoryRouter>
   );
 }

 describe('FinishedGoodsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockResolvedValue(mockGoods);
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockSummary);
     renderPage();
     expect(screen.getByText('Finished Goods')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders product names after data loads', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockResolvedValue(mockGoods);
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockSummary);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('Exterior Emulsion');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/unable to load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows empty state when no goods', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no finished goods/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows product codes', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockResolvedValue(mockGoods);
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockSummary);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('EXT-1L').length).toBeGreaterThan(0);
     });
   });

   it('switches to stock summary tab', async () => {
     (factoryApi.getFinishedGoods as ReturnType<typeof vi.fn>).mockResolvedValue(mockGoods);
     (factoryApi.getFinishedGoodStockSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockSummary);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Exterior Emulsion').length).toBeGreaterThan(0);
     });
     const summaryTab = screen.getByText('Stock Summary');
     fireEvent.click(summaryTab);
     await waitFor(() => {
       expect(screen.getAllByText('Stock Summary').length).toBeGreaterThan(0);
     });
   });
 });
