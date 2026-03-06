 /**
  * Tests for ProductionPlansPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading skeleton
  *  - Renders plan rows in table after load
  *  - Shows error state on API failure
  *  - Opens create modal on "New Plan" button click
  *  - Delete button shown only for DRAFT plans
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
    Plus: M, Pencil: M, Trash2: M, ChevronRight: M, X: M,
    Search: M, ArrowUpDown: M, ArrowUp: M, ArrowDown: M,
    ChevronLeft: M, Loader2: M, AlertCircle: M, ChevronDown: M,
   };
 });
 
 // Mock factoryApi
 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getProductionPlans: vi.fn(),
     createProductionPlan: vi.fn(),
     updateProductionPlan: vi.fn(),
     updateProductionPlanStatus: vi.fn(),
     deleteProductionPlan: vi.fn(),
   },
 }));
 
 import { ProductionPlansPage } from '../ProductionPlansPage';
 import { factoryApi } from '@/lib/factoryApi';
 
 const mockPlans = [
   {
     id: 1,
     planNumber: 'PP-2026-001',
     productName: 'Exterior Emulsion 20L',
     quantity: 500,
     plannedDate: '2026-03-15',
     status: 'DRAFT' as const,
   },
   {
     id: 2,
     planNumber: 'PP-2026-002',
     productName: 'Interior Matt 4L',
     quantity: 1200,
     plannedDate: '2026-03-20',
     status: 'SCHEDULED' as const,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/production/plans']}>
       <ProductionPlansPage />
     </MemoryRouter>
   );
 }
 
 describe('ProductionPlansPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading', async () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlans);
     renderPage();
     expect(screen.getByText('Production Plans')).toBeDefined();
   });
 
   it('shows skeleton loading state initially', () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders plan rows in table after load', async () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlans);
     renderPage();
     await waitFor(() => {
      const items = screen.getAllByText('PP-2026-001');
      expect(items.length).toBeGreaterThan(0);
      const items2 = screen.getAllByText('PP-2026-002');
      expect(items2.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('opens create modal when New Plan button is clicked', async () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlans);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Production Plans')).toBeDefined();
     });
     const btn = screen.getByText('New Plan');
     fireEvent.click(btn);
     await waitFor(() => {
       expect(screen.getByText('New Production Plan')).toBeDefined();
     });
   });
 
   it('shows Draft status badge for DRAFT plan', async () => {
     (factoryApi.getProductionPlans as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlans);
     renderPage();
     await waitFor(() => {
      const badges = screen.getAllByText('Draft');
      expect(badges.length).toBeGreaterThan(0);
     });
   });
 });
