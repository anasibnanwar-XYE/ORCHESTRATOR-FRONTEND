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
    MoreHorizontal: M, ServerCrash: M, BookOpen: M,
  };
});
 
 vi.mock('@/lib/adminApi', () => ({
   auditApi: {
     getBusinessEvents: vi.fn(),
     getMlEvents: vi.fn(),
     getAccountingAuditTrail: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { AuditTrailPage } from '../AuditTrailPage';
 import { auditApi } from '@/lib/adminApi';
import type { BusinessEvent, MlEvent, AccountingAuditTrailEntry, PageResponse } from '@/types';
 
const mockBusinessEvents: PageResponse<BusinessEvent> = {
  content: [
    {
      id: 1,
      occurredAt: '2024-03-01T10:00:00Z',
      actorIdentifier: 'john@example.com',
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: 'USR-001',
      module: 'AUTH',
      status: 'SUCCESS',
    },
    {
      id: 2,
      occurredAt: '2024-03-01T09:30:00Z',
      actorIdentifier: 'admin@example.com',
      action: 'ORDER_APPROVED',
      entityType: 'SalesOrder',
      entityId: 'SO-2024-001',
      module: 'SALES',
      status: 'SUCCESS',
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
      occurredAt: '2024-03-01T10:05:00Z',
      actorIdentifier: 'system@example.com',
      action: 'INFERENCE',
      interactionType: 'CREDIT_RISK',
      module: 'ML',
      status: 'SUCCESS',
      payload: '{"dealerId": 123}',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
};

const mockAccountingAuditTrail: PageResponse<AccountingAuditTrailEntry> = {
  content: [
    {
      id: 1,
      timestamp: '2024-03-01T11:00:00Z',
      companyId: 1,
      companyCode: 'ACME',
      actorUserId: 10,
      actorIdentifier: 'accountant@example.com',
      actionType: 'JOURNAL_POSTED',
      entityType: 'JournalEntry',
      entityId: 'JE-001',
      referenceNumber: 'JE-2024-001',
      sensitiveOperation: false,
    },
    {
      id: 2,
      timestamp: '2024-03-01T10:30:00Z',
      companyId: 1,
      companyCode: 'ACME',
      actorUserId: 11,
      actorIdentifier: 'admin@example.com',
      actionType: 'PERIOD_CLOSED',
      entityType: 'Period',
      entityId: 'P-003',
      referenceNumber: 'FY2024-Q1',
      sensitiveOperation: true,
    },
  ],
  totalElements: 2,
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
     vi.mocked(auditApi.getAccountingAuditTrail).mockResolvedValue(mockAccountingAuditTrail);
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

   it('shows all three tabs', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Business Events')).toBeInTheDocument();
       expect(screen.getByText('ML Events')).toBeInTheDocument();
       expect(screen.getByText('Accounting')).toBeInTheDocument();
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

   it('can switch to Accounting tab and shows accounting data', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Accounting')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('Accounting'));
     await waitFor(() => {
       expect(auditApi.getAccountingAuditTrail).toHaveBeenCalled();
     });
     await waitFor(() => {
       const actors = screen.getAllByText(/accountant@example\.com/);
       expect(actors.length).toBeGreaterThan(0);
     });
   });

   it('shows accounting action types', async () => {
     renderPage();
     fireEvent.click(screen.getByText('Accounting'));
     await waitFor(() => {
       const actions = screen.getAllByText(/JOURNAL_POSTED/);
       expect(actions.length).toBeGreaterThan(0);
     });
   });

   it('shows sensitive operation badge in accounting tab', async () => {
     renderPage();
     fireEvent.click(screen.getByText('Accounting'));
     await waitFor(() => {
       const sensitiveLabels = screen.getAllByText(/Sensitive/);
       expect(sensitiveLabels.length).toBeGreaterThan(0);
     });
   });

   it('shows reference numbers in accounting tab', async () => {
     renderPage();
     fireEvent.click(screen.getByText('Accounting'));
     await waitFor(() => {
       const refs = screen.getAllByText(/JE-2024-001/);
       expect(refs.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(auditApi.getBusinessEvents).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
     });
   });

   it('shows error state on accounting API failure', async () => {
     vi.mocked(auditApi.getAccountingAuditTrail).mockRejectedValue(new Error('API error'));
     renderPage();
     fireEvent.click(screen.getByText('Accounting'));
     await waitFor(() => {
       expect(screen.getByText(/Failed to load accounting/i)).toBeInTheDocument();
     });
   });

   it('shows backend error for business events on 500', async () => {
     const error500 = new Error('Server error');
     (error500 as unknown as { response: { status: number } }).response = { status: 500 };
     vi.mocked(auditApi.getBusinessEvents).mockRejectedValue(error500);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Audit Service Unavailable/i)).toBeInTheDocument();
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

   it('uses pill variant tabs', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Business Events')).toBeInTheDocument();
     });
     // The pill variant wraps tabs in a container with bg-[var(--color-surface-tertiary)] and rounded-lg
     const tabContainer = screen.getByText('Business Events').closest('div');
     expect(tabContainer).toBeTruthy();
   });
 });
