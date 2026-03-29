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
    TrendingUp: M, TrendingDown: M, Activity: M, RefreshCcw: M, AlertCircle: M,
    CheckCircle: M, BarChart2: M, Cpu: M, Boxes: M, CreditCard: M, Receipt: M,
    ArrowRight: M, ArrowRightLeft: M, AlertTriangle: M, ChevronDown: M, X: M,
    Users: M, BookOpen: M, Layers: M, Clock: M,
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
  dealers: { active: 12, total: 15, creditUtilization: 450000 },
  orders: { total: 1245, pending: 12, approved: 987 },
  accounting: { accounts: 16, ledgerBalance: 5000000 },
};

const mockFactoryData = {
  production: { efficiency: 87.3, completed: 156, batchesLogged: 200 },
  inventory: { value: 1200000, lowStock: 3 },
  tasks: 8,
};

const mockFinanceData = {
  ledger: { accounts: 16, ledgerBalance: 5000000 },
  cashflow: { net: 1680000, operating: 2100000, investing: -200000, financing: -220000 },
  agedDebtors: [],
  reconciliation: { physicalInventoryValue: 1200000, ledgerInventoryBalance: 1150000, variance: 50000 },
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
 
  it('shows orders total in admin tab', async () => {
    renderPage();
    await waitFor(() => {
      const allMatches = screen.getAllByText(/1[,.]245|1245/);
      expect(allMatches.length).toBeGreaterThan(0);
    });
  });

  it('shows dealers in admin tab', async () => {
    renderPage();
    await waitFor(() => {
      // Active Dealers value is 12
      const allMatches = screen.getAllByText(/Active Dealers|Dealers/i);
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
      const allMatches = screen.getAllByText(/Production|Efficiency|Batches/i);
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
      const allMatches = screen.getAllByText(/Ledger|Cash Flow|Reconciliation/i);
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
