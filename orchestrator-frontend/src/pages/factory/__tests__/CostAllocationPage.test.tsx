 /**
  * Tests for CostAllocationPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading skeleton initially
  *  - Renders production log rows for cost breakdown
  *  - Shows error state on API failure
  *  - Shows empty state when no production logs
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
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
     getProductionLogs: vi.fn(),
     getCostBreakdown: vi.fn(),
     allocateCosts: vi.fn(),
   },
 }));

 import { CostAllocationPage } from '../CostAllocationPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockLogs = [
   {
     id: 1,
     productionCode: 'PROD-001',
     brandName: 'Shield',
     productName: 'Exterior Emulsion',
     batchSize: 500,
     mixedQuantity: 500,
     laborCost: 5000,
     overheadCost: 2500,
     status: 'READY_TO_PACK',
     producedAt: '2026-03-01T08:00:00Z',
   },
   {
     id: 2,
     productionCode: 'PROD-002',
     brandName: 'Shield',
     productName: 'Interior Emulsion',
     batchSize: 300,
     mixedQuantity: 300,
     laborCost: 3000,
     overheadCost: 1500,
     status: 'FULLY_PACKED',
     producedAt: '2026-03-02T08:00:00Z',
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/cost-allocation']}>
       <CostAllocationPage />
     </MemoryRouter>
   );
 }

 describe('CostAllocationPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     renderPage();
     expect(screen.getByText('Cost Allocation')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders production log rows after data loads', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('PROD-001');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows empty state when no production logs', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no production data/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 });
