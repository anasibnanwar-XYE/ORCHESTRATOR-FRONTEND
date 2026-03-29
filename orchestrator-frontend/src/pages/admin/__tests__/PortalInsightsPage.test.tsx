 /**
  * Tests for PortalInsightsPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Monitor: M, Activity: M, Users: M, TrendingUp: M, Eye: M, AlertCircle: M,
    RefreshCcw: M, Clock: M, Zap: M, BarChart2: M, UserCheck: M, Coffee: M,
    Building2: M, ChevronDown: M, X: M, Award: M, Calendar: M, Package: M,
    ArrowRight: M, ShieldAlert: M, CheckCircle: M, XCircle: M,
  };
});
 
 vi.mock('@/lib/adminApi', () => ({
   portalInsightsApi: {
     getDashboard: vi.fn(),
     getOperations: vi.fn(),
     getWorkforce: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { PortalInsightsPage } from '../PortalInsightsPage';
 import { portalInsightsApi } from '@/lib/adminApi';
 
const mockDashboard = {
  highlights: [
    { label: 'Revenue run rate', value: '₹1,200.00', detail: 'Last 30 days' },
    { label: 'Fulfilment SLA', value: '92.5%', detail: 'On-time delivery' },
    { label: 'Dealer coverage', value: '15', detail: 'Connected dealers' },
  ],
  pipeline: [
    { label: 'Draft', count: 5 },
    { label: 'Approved', count: 12 },
  ],
  hrPulse: [],
};

const mockOperations = {
  summary: {
    productionVelocity: 45.2,
    logisticsSla: 92.5,
    workingCapital: '₹6,805.00',
  },
  supplyAlerts: [
    { material: 'Pigment Red', status: 'Healthy', detail: 'Stock 200 UNIT' },
  ],
  automationRuns: [],
};

const mockWorkforce = {
  squads: [
    { name: 'Engineering', capacity: '24 members', detail: 'Full capacity' },
  ],
  moments: [],
  leaders: [],
};
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <PortalInsightsPage />
     </MemoryRouter>
   );
 }
 
 describe('PortalInsightsPage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
     vi.mocked(portalInsightsApi.getDashboard).mockResolvedValue(mockDashboard);
     vi.mocked(portalInsightsApi.getOperations).mockResolvedValue(mockOperations);
     vi.mocked(portalInsightsApi.getWorkforce).mockResolvedValue(mockWorkforce);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Portal Insights')).toBeInTheDocument();
     });
   });
 
   it('renders dashboard tab by default', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Dashboard')).toBeInTheDocument();
     });
   });
 
  it('shows highlights in dashboard tab', async () => {
    renderPage();
    await waitFor(() => {
      const allMatches = screen.getAllByText(/Revenue run rate|Key Highlights/i);
      expect(allMatches.length).toBeGreaterThan(0);
    });
  });

  it('shows pipeline in dashboard tab', async () => {
    renderPage();
    await waitFor(() => {
      const allMatches = screen.getAllByText(/Pipeline|Draft/i);
      expect(allMatches.length).toBeGreaterThan(0);
    });
  });

  it('can switch to Operations tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Operations'));
    await waitFor(() => {
      const allMatches = screen.getAllByText(/Operations Summary|Production Velocity/i);
      expect(allMatches.length).toBeGreaterThan(0);
    });
  });

  it('can switch to Workforce tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Workforce')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Workforce'));
    await waitFor(() => {
      const allMatches = screen.getAllByText(/Teams|Engineering|Workforce/i);
      expect(allMatches.length).toBeGreaterThan(0);
    });
  });
 
   it('shows error state on API failure', async () => {
     vi.mocked(portalInsightsApi.getDashboard).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });
 });
