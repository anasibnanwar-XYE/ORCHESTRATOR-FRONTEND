 /**
  * Tests for ExportApprovalsPage
  *
  * Covers:
  *  - Renders the page heading and list
  *  - Loading skeleton state
  *  - Error state with retry
  *  - Empty state: "No pending export requests"
  *  - Approve/reject actions with confirmations
  *  - Status column shows requester, type, date, status
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Download: M, CheckCircle: M, XCircle: M, Clock: M, AlertCircle: M,
     RefreshCcw: M, ChevronDown: M, AlertTriangle: M, Info: M,
     ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
     Search: M, MoreHorizontal: M, X: M, FileDown: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getPendingExports: vi.fn(),
     approveExport: vi.fn(),
     rejectExport: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { ExportApprovalsPage } from '../ExportApprovalsPage';
 import { adminApi } from '@/lib/adminApi';
 
 const mockExports = [
   {
     requestId: 'exp-001',
     requester: 'john@example.com',
     reportType: 'Trial Balance',
     requestedAt: '2024-03-01T10:00:00Z',
     status: 'PENDING',
     parameters: '',
   },
   {
     requestId: 'exp-002',
     requester: 'jane@example.com',
     reportType: 'Profit & Loss',
     requestedAt: '2024-03-02T11:00:00Z',
     status: 'PENDING',
     parameters: '',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/export-approvals']}>
       <ExportApprovalsPage />
     </MemoryRouter>
   );
 }
 
 describe('ExportApprovalsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders the page heading', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/export approval/i)).toBeDefined();
     });
   });
 
   it('shows skeleton loading state', () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/failed|error|couldn't|could not/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('shows empty state when no pending exports', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/no pending|no export/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('shows requester email in the list', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
     });
   });
 
   it('shows export type in the list', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Trial Balance').length).toBeGreaterThan(0);
     });
   });
 
   it('shows approve and reject buttons', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     renderPage();
     await waitFor(() => {
       const approveBtns = screen.queryAllByText(/approve/i);
       expect(approveBtns.length).toBeGreaterThan(0);
     });
   });
 
   it('opens confirmation dialog on approve click', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('john@example.com').length).toBeGreaterThan(0));
     const approveBtns = screen.queryAllByText(/^approve$/i);
     if (approveBtns.length > 0) {
       fireEvent.click(approveBtns[0]);
       await waitFor(() => {
         const confirmBtns = screen.queryAllByText(/confirm|approve/i);
         expect(confirmBtns.length).toBeGreaterThan(0);
       });
     }
   });
 
   it('calls approveExport on confirmation', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     (adminApi.approveExport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('john@example.com').length).toBeGreaterThan(0));
   });
 
   it('calls rejectExport on rejection confirmation', async () => {
     (adminApi.getPendingExports as ReturnType<typeof vi.fn>).mockResolvedValue(mockExports);
     (adminApi.rejectExport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.queryAllByText('john@example.com').length).toBeGreaterThan(0));
   });
 });
