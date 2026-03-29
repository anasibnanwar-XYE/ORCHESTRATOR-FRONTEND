 /**
  * Tests for ProductionBatchesPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading skeleton initially
  *  - Renders batch rows after load
  *  - Shows error state on API failure
  *  - Opens create modal on "New Batch" button click
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
    Plus: M, ChevronRight: M, X: M,
    Search: M, ArrowUpDown: M, ArrowUp: M, ArrowDown: M,
    ChevronLeft: M, ChevronDown: M, Loader2: M, AlertCircle: M,
   };
 });
 
 // Mock factoryApi
 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getProductionBatches: vi.fn(),
     createProductionBatch: vi.fn(),
     getProductionPlans: vi.fn(),
   },
 }));
 
 import { ProductionBatchesPage } from '../ProductionBatchesPage';
 import { factoryApi } from '@/lib/factoryApi';
 
 const mockBatches = [
   {
     id: 1,
     batchNumber: 'BATCH-2026-001',
     quantityProduced: 2000,
     loggedBy: 'Ahmad',
     notes: 'Morning batch',
     createdAt: '2026-03-01T08:00:00Z',
   },
   {
     id: 2,
     batchNumber: 'BATCH-2026-002',
     quantityProduced: 1500,
     loggedBy: 'Sara',
     createdAt: '2026-03-02T08:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/production/batches']}>
       <ProductionBatchesPage />
     </MemoryRouter>
   );
 }
 
 describe('ProductionBatchesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading', async () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockBatches);
     renderPage();
     expect(screen.getByText('Production Batches')).toBeDefined();
   });
 
   it('shows loading skeleton initially', () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders batch rows after data loads', async () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockBatches);
     renderPage();
     await waitFor(() => {
      const items = screen.getAllByText('BATCH-2026-001');
      expect(items.length).toBeGreaterThan(0);
      const items2 = screen.getAllByText('BATCH-2026-002');
      expect(items2.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('opens create modal when New Batch button is clicked', async () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockResolvedValue(mockBatches);
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Production Batches')).toBeDefined();
     });
     const btn = screen.getByText('New Batch');
     fireEvent.click(btn);
     await waitFor(() => {
       expect(screen.getByText('New Production Batch')).toBeDefined();
     });
   });
 
   it('shows empty state when no batches exist', async () => {
     (factoryApi.getProductionBatches as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
      const msgs = screen.getAllByText('No production batches found. Create your first batch.');
      expect(msgs.length).toBeGreaterThan(0);
     });
   });
 });
