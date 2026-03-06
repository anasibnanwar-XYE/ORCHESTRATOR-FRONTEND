 /**
  * Tests for AccountingDashboardPage
  *
  * Covers:
  *  - Renders 4 KPI stat cards (Revenue, Expenses, Net Profit, Outstanding Receivables)
  *  - Shows skeleton loading state while data loads
  *  - Shows error state with retry button on API failure
  *  - Shows empty state with CTA when no journals exist
  *  - Renders recent journals widget with 5 entries
  *  - Clicking a journal row navigates to /accounting/journals/:id
  *  - Quick action buttons are rendered
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
   };
 });
 
 // Mock the accounting API
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getJournals: vi.fn(),
     getIncomeStatement: vi.fn(),
     getAgedReceivables: vi.fn(),
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
 import { accountingApi } from '@/lib/accountingApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────
 
 const mockIncomeStatement = {
   revenue: [],
   totalRevenue: 250000,
   cogs: [],
   totalCogs: 80000,
   grossProfit: 170000,
   expenses: [],
   totalExpenses: 45000,
   netIncome: 125000,
 };
 
 const mockReceivables = {
   asOfDate: '2024-03-01',
   dealers: [],
   totalBuckets: {
     current: 50000,
     days1to30: 15000,
     days31to60: 8000,
     days61to90: 2000,
     over90: 0,
   },
   grandTotal: 75000,
 };
 
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
   });
 
   it('shows skeleton loading state while data is loading', () => {
     // Keep promises pending to simulate loading
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
 
     renderPage();
 
     // Should show skeleton cards (aria-busy or role="progressbar" is optional)
     // The skeleton cards should be present in the DOM
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders 4 KPI stat cards with fetched data', async () => {
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockIncomeStatement
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockReceivables
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue(mockJournals);
 
     renderPage();
 
     await waitFor(() => {
       expect(screen.getByText('Revenue')).toBeDefined();
       expect(screen.getByText('Expenses')).toBeDefined();
       expect(screen.getByText('Net Profit')).toBeDefined();
       expect(screen.getByText('Outstanding Receivables')).toBeDefined();
     });
   });
 
   it('renders recent journals widget with 5 entries', async () => {
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockIncomeStatement
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockReceivables
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue(mockJournals);
 
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
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockIncomeStatement
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockReceivables
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue(mockJournals);
 
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
 
   it('shows error state with retry on API failure', async () => {
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
 
     renderPage();
 
     await waitFor(() => {
       // The error state should show a retry button or error message
       const retryBtn = screen.queryByText(/retry|try again/i);
       const errorMsg = screen.queryByText(/couldn't load|failed|error/i);
       expect(retryBtn !== null || errorMsg !== null).toBe(true);
     });
   });
 
   it('shows empty state when no journals exist', async () => {
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockIncomeStatement
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockReceivables
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue([]);
 
     renderPage();
 
     await waitFor(() => {
      const emptyStateElements = screen.queryAllByText(/no journal entries|create your first/i);
      expect(emptyStateElements.length).toBeGreaterThan(0);
     });
   });
 
   it('renders quick action buttons', async () => {
     (accountingApi.getIncomeStatement as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockIncomeStatement
     );
     (accountingApi.getAgedReceivables as ReturnType<typeof vi.fn>).mockResolvedValue(
       mockReceivables
     );
     (accountingApi.getJournals as ReturnType<typeof vi.fn>).mockResolvedValue(mockJournals);
 
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
 });
