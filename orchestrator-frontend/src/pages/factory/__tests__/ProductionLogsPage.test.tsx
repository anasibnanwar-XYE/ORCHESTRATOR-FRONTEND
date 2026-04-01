 /**
  * Tests for ProductionLogsPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading state
  *  - Renders log rows after load
  *  - Shows error state on API failure
  *  - Opens create modal on "Log Production" click
  *  - Detail panel shows empty state initially
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});
 
 // Mock factoryApi
 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getProductionLogs: vi.fn(),
     createProductionLog: vi.fn(),
     getProductionLogDetail: vi.fn(),
     getProductionBrands: vi.fn(),
     getBrandProducts: vi.fn(),
     getRawMaterials: vi.fn(),
   },
 }));
 
 import { ProductionLogsPage } from '../ProductionLogsPage';
 import { factoryApi } from '@/lib/factoryApi';
 
 const mockLogs = [
   {
     id: 1,
     productionCode: 'PL-2026-001',
     brandName: 'ColorMaster',
     productName: 'Exterior Emulsion 20L',
     mixedQuantity: 1000,
     unitOfMeasure: 'L',
     status: 'READY_TO_PACK' as const,
     producedAt: '2026-03-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/production/logs']}>
       <ProductionLogsPage />
     </MemoryRouter>
   );
 }
 
 describe('ProductionLogsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     renderPage();
     expect(screen.getByText('Production Logs')).toBeDefined();
   });
 
   it('shows loading skeleton initially', () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders log rows after data loads', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     renderPage();
     await waitFor(() => {
      const items = screen.getAllByText('PL-2026-001');
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
 
   it('opens create modal when Log Production button is clicked', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     (factoryApi.getProductionBrands as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Production Logs')).toBeDefined();
     });
     const btn = screen.getByText('Log Production');
     fireEvent.click(btn);
     await waitFor(() => {
       expect(screen.getByText('Log Production Batch')).toBeDefined();
     });
   });
 
   it('shows detail panel empty state initially', async () => {
     (factoryApi.getProductionLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockLogs);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Select a log to view details.')).toBeDefined();
     });
   });
 });
