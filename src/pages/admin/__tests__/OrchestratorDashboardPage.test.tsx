 /**
  * Tests for OrchestratorDashboardPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     LayoutGrid: M, Factory: M, DollarSign: M, ShoppingCart: M, Truck: M, Package: M,
     TrendingUp: M, Activity: M, RefreshCcw: M, AlertCircle: M, CheckCircle: M,
     BarChart2: M, Cpu: M, Boxes: M, CreditCard: M, Receipt: M, ArrowRight: M,
     AlertTriangle: M, ChevronDown: M, X: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   orchestratorApi: {
     getAdminDashboard: vi.fn(),
     getFactoryDashboard: vi.fn(),
     getFinanceDashboard: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { OrchestratorDashboardPage } from '../OrchestratorDashboardPage';
 import { orchestratorApi } from '@/lib/adminApi';
 
 const mockAdminData = {
   totalOrders: 1245,
   totalDispatches: 987,
   totalFulfilments: 843,
   pendingApprovals: 12,
   revenueThisMonth: 1500000,
   activeUsers: 45,
 };
 
 const mockFactoryData = {
   activeJobs: 8,
   throughput: 94.5,
   packingQueue: 23,
   completedToday: 156,
   efficiencyRate: 87.3,
 };
 
 const mockFinanceData = {
   revenue: 5200000,
   cogs: 3100000,
   grossProfit: 2100000,
   receivables: 890000,
   payables: 420000,
   netCashFlow: 1680000,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <OrchestratorDashboardPage />
     </MemoryRouter>
   );
 }
 
 describe('OrchestratorDashboardPage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
     vi.mocked(orchestratorApi.getAdminDashboard).mockResolvedValue(mockAdminData);
     vi.mocked(orchestratorApi.getFactoryDashboard).mockResolvedValue(mockFactoryData);
     vi.mocked(orchestratorApi.getFinanceDashboard).mockResolvedValue(mockFinanceData);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Orchestrator')).toBeInTheDocument();
     });
   });
 
   it('renders admin dashboard tab by default', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Admin')).toBeInTheDocument();
     });
   });
 
   it('shows total orders in admin tab', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/1[,.]245|1245/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows total dispatches in admin tab', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/987/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('can switch to Factory tab', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Factory')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('Factory'));
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Active Jobs/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('can switch to Finance tab', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Finance')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('Finance'));
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Revenue|COGS|Receivables/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows loading skeleton initially', () => {
     vi.mocked(orchestratorApi.getAdminDashboard).mockImplementation(
       () => new Promise(() => {}) // never resolves
     );
     renderPage();
     // The skeleton pulses should be in the DOM during loading
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(orchestratorApi.getAdminDashboard).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });
 });
