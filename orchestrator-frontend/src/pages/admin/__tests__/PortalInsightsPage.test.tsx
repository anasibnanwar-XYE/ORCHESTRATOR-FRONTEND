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
     Building2: M, ChevronDown: M, X: M,
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
   sessions: 1234,
   pageViews: 45678,
   errors: 23,
   activeUsers: 89,
   avgSessionDuration: 324,
   bounceRate: 32.5,
 };
 
 const mockOperations = {
   apiLatencyP50: 45,
   apiLatencyP95: 180,
   apiLatencyP99: 420,
   queueDepths: [
     { queue: 'email', depth: 12 },
     { queue: 'notifications', depth: 5 },
   ],
   errorRate: 0.8,
   uptime: 99.97,
 };
 
 const mockWorkforce = {
   attendanceRate: 96.2,
   overtime: 14,
   departmentHeadcount: [
     { department: 'Engineering', count: 24 },
     { department: 'Sales', count: 18 },
   ],
   leaveUtilisation: 42.5,
   totalHeadcount: 87,
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
 
   it('shows sessions metric in dashboard tab', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/1[,.]234|1234/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows page views in dashboard tab', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/45[,.]678|45678/);
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
       const allMatches = screen.getAllByText(/API Latency|p50|P50/i);
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
       const allMatches = screen.getAllByText(/Attendance|attendance/i);
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
