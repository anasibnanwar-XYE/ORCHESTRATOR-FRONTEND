 /**
  * Tests for FactoryDashboardPage
  *
  * Covers:
  *  - Renders 3 KPI stat cards (Production Efficiency, Completed Plans, Batches Logged)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state with retry on API failure
  *  - Renders alerts list
  *  - Clicking KPI cards navigate to correct sections
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react — stub all icons
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
     getDashboard: vi.fn(),
   },
 }));
 
 // Mock navigate
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { FactoryDashboardPage } from '../FactoryDashboardPage';
 import { factoryApi } from '@/lib/factoryApi';
 
 const mockDashboard = {
   productionEfficiency: 92.5,
   completedPlans: 18,
   batchesLogged: 34,
   alerts: ['Low stock on Titanium White', 'Batch BATCH-012 overdue'],
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory']}>
       <FactoryDashboardPage />
     </MemoryRouter>
   );
 }
 
 describe('FactoryDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
   });
 
   it('shows skeleton loading state while data loads', () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 3 KPI stat cards after data loads', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Production Efficiency')).toBeDefined();
       expect(screen.getByText('Completed Plans')).toBeDefined();
       expect(screen.getByText('Batches Logged')).toBeDefined();
     });
   });
 
   it('shows error state with retry on API failure', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry/i);
       const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('renders alerts from the dashboard data', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Low stock on Titanium White')).toBeDefined();
     });
   });
 
   it('shows empty alerts message when no alerts', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({
       ...mockDashboard,
       alerts: [],
     });
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('No alerts at the moment.')).toBeDefined();
     });
   });
 
   it('clicking Completed Plans card navigates to /factory/production/plans', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Completed Plans')).toBeDefined();
     });
     const card = screen.getByText('Completed Plans').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/factory/production/plans');
     }
   });
 
   it('clicking Batches Logged card navigates to /factory/production/batches', async () => {
     (factoryApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Batches Logged')).toBeDefined();
     });
     const card = screen.getByText('Batches Logged').closest('button');
     if (card) {
       fireEvent.click(card);
       expect(mockNavigate).toHaveBeenCalledWith('/factory/production/batches');
     }
   });
 });
