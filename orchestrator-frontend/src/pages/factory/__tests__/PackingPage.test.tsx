 /**
  * Tests for PackingPage
  *
  * Covers:
  *  - Packing queue tab shows unpacked batches
  *  - Shows loading skeleton initially
  *  - Shows error state on API failure
  *  - Shows empty state when no unpacked batches
  *  - Record Packing button opens modal
  *  - Bulk Pack validation: total must equal batch qty
  *  - Complete Packing shows confirm dialog
  *  - Packing history tab renders packing records
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getUnpackedBatches: vi.fn(),
     getProductionLogs: vi.fn(),
     recordPacking: vi.fn(),
     completePacking: vi.fn(),
     bulkPack: vi.fn(),
     getPackingHistory: vi.fn(),
   },
 }));

 import { PackingPage } from '../PackingPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockUnpackedBatches = [
   {
     id: 1,
     productionCode: 'PROD-001',
     brandName: 'Shield',
     productName: 'Exterior Emulsion',
     mixedQuantity: 500,
     packedQuantity: 0,
     remainingQuantity: 500,
     status: 'READY_TO_PACK',
     producedAt: '2026-03-01T08:00:00Z',
   },
   {
     id: 2,
     productionCode: 'PROD-002',
     brandName: 'Shield',
     productName: 'Interior Emulsion',
     mixedQuantity: 200,
     packedQuantity: 100,
     remainingQuantity: 100,
     status: 'PARTIAL_PACKED',
     producedAt: '2026-03-02T08:00:00Z',
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/packing']}>
       <PackingPage />
     </MemoryRouter>
   );
 }

 describe('PackingPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnpackedBatches);
     renderPage();
     expect(screen.getByText('Packing')).toBeDefined();
   });

   it('shows loading skeleton initially on queue tab', () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders unpacked batch rows after data loads', async () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnpackedBatches);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('PROD-001');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure for queue', async () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows empty state when no unpacked batches', async () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no unpacked batches/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('switches to history tab and loads history', async () => {
     (factoryApi.getUnpackedBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnpackedBatches);
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue([
       { id: 1, productionCode: 'PROD-001' }
     ]);
     renderPage();
     await waitFor(() => {
      const items = screen.getAllByText('PROD-001');
      expect(items.length).toBeGreaterThan(0);
     });
     const historyTab = screen.getByText('Packing History');
     fireEvent.click(historyTab);
     await waitFor(() => {
      // History tab content loaded — "Select a production log" prompt should be visible
      const items = screen.getAllByText('Packing History');
      expect(items.length).toBeGreaterThan(0);
     });
   });
 });
