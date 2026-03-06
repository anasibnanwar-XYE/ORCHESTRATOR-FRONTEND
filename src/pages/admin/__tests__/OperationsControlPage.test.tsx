 /**
  * Tests for OperationsControlPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Flag: M, Wrench: M, Trash2: M, RefreshCcw: M, AlertCircle: M, CheckCircle: M,
     AlertTriangle: M, Shield: M, Zap: M, ToggleLeft: M, ToggleRight: M,
     ChevronDown: M, X: M, Database: M, Settings: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   operationsControlApi: {
     getStatus: vi.fn(),
     setMaintenanceMode: vi.fn(),
     toggleFeatureFlag: vi.fn(),
     purgeCache: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { OperationsControlPage } from '../OperationsControlPage';
 import { operationsControlApi } from '@/lib/adminApi';
 
 const mockStatus = {
   maintenanceMode: false,
   featureFlags: [
     { key: 'NEW_DASHBOARD', label: 'New Dashboard', description: 'Enable new dashboard layout', enabled: true },
     { key: 'BULK_UPLOAD', label: 'Bulk Upload', description: 'Allow bulk CSV uploads', enabled: false },
     { key: 'ADVANCED_REPORTS', label: 'Advanced Reports', description: 'Enable advanced reporting suite', enabled: true },
   ],
   cacheLastPurged: '2024-03-01T08:00:00Z',
 };
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <OperationsControlPage />
     </MemoryRouter>
   );
 }
 
 describe('OperationsControlPage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
     vi.mocked(operationsControlApi.getStatus).mockResolvedValue(mockStatus);
     vi.mocked(operationsControlApi.setMaintenanceMode).mockResolvedValue(mockStatus);
     vi.mocked(operationsControlApi.toggleFeatureFlag).mockResolvedValue(mockStatus);
     vi.mocked(operationsControlApi.purgeCache).mockResolvedValue(mockStatus);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Operations Control')).toBeInTheDocument();
     });
   });
 
   it('shows maintenance mode section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Maintenance Mode/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows feature flags', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/New Dashboard/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows cache purge section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Purge Cache|Cache/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows all three feature flags', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Dashboard')).toBeInTheDocument();
       expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
       expect(screen.getByText('Advanced Reports')).toBeInTheDocument();
     });
   });
 
   it('shows purge cache button', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Purge|purge/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(operationsControlApi.getStatus).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });
 
   it('shows loading skeleton initially', () => {
     vi.mocked(operationsControlApi.getStatus).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 });
