 /**
  * Tests for AuditTrailPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     List: M, Cpu: M, Search: M, Filter: M, RefreshCcw: M, AlertCircle: M,
     ChevronLeft: M, ChevronRight: M, ChevronDown: M, X: M, ArrowUpDown: M,
     ArrowUp: M, ArrowDown: M, Clock: M, User: M, Activity: M, FileText: M,
     MoreHorizontal: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   auditApi: {
     getBusinessEvents: vi.fn(),
     getMlEvents: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { AuditTrailPage } from '../AuditTrailPage';
 import { auditApi } from '@/lib/adminApi';
import type { BusinessEvent, MlEvent, PageResponse } from '@/types';
 
const mockBusinessEvents: PageResponse<BusinessEvent> = {
   content: [
     {
       id: 1,
       timestamp: '2024-03-01T10:00:00Z',
       actor: 'john@example.com',
       action: 'USER_LOGIN',
       resource: 'User',
       resourceId: 'USR-001',
       details: 'Login from 192.168.1.1',
      severity: 'INFO' as const,
     },
     {
       id: 2,
       timestamp: '2024-03-01T09:30:00Z',
       actor: 'admin@example.com',
       action: 'ORDER_APPROVED',
       resource: 'SalesOrder',
       resourceId: 'SO-2024-001',
       details: 'Order approved manually',
      severity: 'INFO' as const,
     },
   ],
   totalElements: 2,
   totalPages: 1,
   page: 0,
   size: 20,
 };
 
const mockMlEvents: PageResponse<MlEvent> = {
   content: [
     {
       id: 1,
       timestamp: '2024-03-01T10:05:00Z',
       model: 'credit-risk-v2',
       action: 'INFERENCE',
       input: '{"dealerId": 123}',
       output: '{"risk": "LOW", "score": 0.12}',
       confidence: 0.94,
       latencyMs: 145,
      status: 'SUCCESS' as const,
     },
   ],
   totalElements: 1,
   totalPages: 1,
   page: 0,
   size: 20,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <AuditTrailPage />
     </MemoryRouter>
   );
 }
 
 describe('AuditTrailPage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
     vi.mocked(auditApi.getBusinessEvents).mockResolvedValue(mockBusinessEvents);
     vi.mocked(auditApi.getMlEvents).mockResolvedValue(mockMlEvents);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Audit Trail')).toBeInTheDocument();
     });
   });
 
   it('shows business events tab by default', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Business Events')).toBeInTheDocument();
     });
   });
 
   it('shows actor in events list', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/john@example\.com/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows action in events list', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/USER_LOGIN/);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('has search filter input', async () => {
     renderPage();
     await waitFor(() => {
       const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
       expect(inputs.length).toBeGreaterThan(0);
     });
   });
 
   it('can switch to ML Events tab', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('ML Events')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('ML Events'));
     await waitFor(() => {
       const allMatches = screen.getAllByText(/credit-risk-v2|INFERENCE/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(auditApi.getBusinessEvents).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });
 
   it('shows loading skeleton initially', () => {
     vi.mocked(auditApi.getBusinessEvents).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 });
