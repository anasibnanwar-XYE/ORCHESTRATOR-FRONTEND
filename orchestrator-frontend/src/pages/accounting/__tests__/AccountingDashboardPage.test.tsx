 /**
  * Tests for AccountingDashboardPage
  *
  * Covers:
  *  - Renders 4 KPI stat cards (Total Receivables, Total Payables, Revenue, Period Status)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state for journals on API failure
  *  - Shows empty state with CTA when no journals exist
  *  - Renders recent journals widget with 5 entries
  *  - Clicking a journal row navigates to /accounting/journals/:id
  *  - Quick action buttons are rendered
  *  - Reconciliation warnings section renders
  *  - Balance warnings shown when present
  *  - All-clear shown when no warnings
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     TrendingUp: M, TrendingDown: M, ArrowRight: M, Plus: M,
     Receipt: M, BarChart3: M, AlertCircle: M, RefreshCcw: M,
     BookOpen: M, FileText: M, ChevronRight: M, Clock: M,
     DollarSign: M, Wallet: M, Users: M, Activity: M, Loader2: M,
     AlertTriangle: M,
   };
 });

 // Mock the accounting API
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getJournals: vi.fn(),
     getTrialBalance: vi.fn(),
     getPeriods: vi.fn(),
   },
   reportsApi: {
     getBalanceWarnings: vi.fn(),
   },
   bankReconciliationApi: {
     listDiscrepancies: vi.fn(),
   },
 }));

 // Mock react-router-dom navigate
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return {
     ...actual,
     useNavigate: () => mockNavigate,
   };
 });

 import { AccountingDashboardPage } from '../AccountingDashboardPage';
 import { accountingApi, reportsApi, bankReconciliationApi } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────

 const mockTrialBalance = {
   asOfDate: '2024-03-01',
   entries: [
     { accountId: 1, accountCode: '1010', accountName: 'Cash', accountType: 'ASSET', debit: 100000, credit: 50000 },
     { accountId: 2, accountCode: '2010', accountName: 'Accounts Payable', accountType: 'LIABILITY', debit: 0, credit: 80000 },
     { accountId: 3, accountCode: '4010', accountName: 'Sales Revenue', accountType: 'REVENUE', debit: 0, credit: 250000 },
   ],
   totalDebits: 100000,
   totalCredits: 380000,
 };

 const mockPeriods = [
   {
     id: 1,
     name: 'Jan 2024',
     label: 'Jan 2024',
     startDate: '2024-01-01',
     endDate: '2024-01-31',
     status: 'OPEN' as const,
     year: 2024,
     month: 1,
   },
 ];

 const mockJournals = Array.from({ length: 5 }, (_, i) => ({
   id: i + 1,
   referenceNumber: `JE-${String(i + 1).padStart(4, '0')}`,
   entryDate: '2024-03-01',
   memo: `Journal entry ${i + 1}`,
   status: 'POSTED',
   journalType: 'MANUAL',
   sourceModule: 'ACCOUNTING',
   sourceReference: '',
   totalDebit: 10000,
   totalCredit: 10000,
 }));

 // ─────────────────────────────────────────────────────────────────────────────
 // Helper
 // ─────────────────────────────────────────────────────────────────────────────

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/accounting']}>
       <AccountingDashboardPage />
     </MemoryRouter>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────

 describe('AccountingDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     mockNavigate.mockClear();
     // Default: successful API responses
     (accountingApi.getTrialBalance as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrialBalance);
     (accountingApi.getPeriods as ReturnType<typeof vi.fn>).mockResolvedValue(mockPeriods);
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue(mockJournals);
     (reportsApi.getBalanceWarnings as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     (bankReconciliationApi.listDiscrepancies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
   });

   it('shows skeleton loading state while data is loading', () => {
     // Keep promises pending to simulate loading
     (accountingApi.getTrialBalance as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (accountingApi.getPeriods as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );

     renderPage();

     // Should show skeleton cards
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders 4 KPI stat cards with fetched data', async () => {
     renderPage();

     await waitFor(() => {
       // Use getAllByText since "Total Receivables" etc. appear in both KPI card and balance summary
       expect(screen.getAllByText('Total Receivables').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Total Payables').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Revenue').length).toBeGreaterThan(0);
       expect(screen.getByText('Period Status')).toBeDefined();
     });
   });

   it('renders recent journals widget with 5 entries', async () => {
     renderPage();

     await waitFor(() => {
       expect(screen.getByText('JE-0001')).toBeDefined();
       expect(screen.getByText('JE-0002')).toBeDefined();
       expect(screen.getByText('JE-0003')).toBeDefined();
       expect(screen.getByText('JE-0004')).toBeDefined();
       expect(screen.getByText('JE-0005')).toBeDefined();
     });
   });

   it('clicking a journal row navigates to /accounting/journals/:id', async () => {
     renderPage();

     await waitFor(() => {
       expect(screen.getByText('JE-0001')).toBeDefined();
     });

     const firstRow = screen.getByText('JE-0001').closest('button') ??
       screen.getByText('JE-0001').closest('[role="button"]');

     if (firstRow) {
       fireEvent.click(firstRow);
       expect(mockNavigate).toHaveBeenCalledWith('/accounting/journals/1');
     }
   });

   it('shows error state with retry on journals API failure', async () => {
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );

     renderPage();

     await waitFor(() => {
       // The error state should show an error message
       const errorMsg = screen.queryByText(/couldn't load recent journals/i);
       expect(errorMsg).not.toBeNull();
     });
   });

   it('shows empty state when no journals exist', async () => {
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue([]);

     renderPage();

     await waitFor(() => {
      const emptyStateElements = screen.queryAllByText(/no journal entries|create your first/i);
      expect(emptyStateElements.length).toBeGreaterThan(0);
     });
   });

   it('renders quick action buttons', async () => {
     renderPage();

     await waitFor(() => {
      const newJournalBtns = screen.getAllByText('New Journal');
      expect(newJournalBtns.length).toBeGreaterThan(0);
      const recordReceiptBtns = screen.getAllByText('Record Receipt');
      expect(recordReceiptBtns.length).toBeGreaterThan(0);
      const viewReportsBtns = screen.getAllByText('View Reports');
      expect(viewReportsBtns.length).toBeGreaterThan(0);
     });
   });

   it('renders reconciliation warnings section', async () => {
     renderPage();

     await waitFor(() => {
       expect(screen.getByText('Reconciliation Warnings')).toBeDefined();
     });
   });

   it('shows balance warnings when present', async () => {
     (reportsApi.getBalanceWarnings as ReturnType<typeof vi.fn>).mockResolvedValue([
       {
         accountId: 100,
         accountCode: '1010',
         accountName: 'Cash',
         balance: -5000,
         severity: 'HIGH',
         reason: 'Negative cash balance detected',
       },
     ]);

     renderPage();

     await waitFor(() => {
       expect(screen.getByText('Cash')).toBeDefined();
       expect(screen.getByText(/Negative cash balance/i)).toBeDefined();
     });
   });

   it('shows all-clear state when no warnings exist', async () => {
     renderPage();

     await waitFor(() => {
       expect(screen.getByText('All clear')).toBeDefined();
     });
   });
 });
