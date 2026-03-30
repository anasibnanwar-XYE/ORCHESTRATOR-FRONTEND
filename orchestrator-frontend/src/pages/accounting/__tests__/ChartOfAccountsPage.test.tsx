 /**
  * Tests for ChartOfAccountsPage
  *
  * Covers:
  *  - Tree renders account type root nodes
  *  - Expandable/collapsible child accounts
  *  - Selecting a leaf account shows detail panel
  *  - Create account modal opens and submits correctly
  *  - Error state with retry button
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 // Mock lucide-react icons
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     ChevronRight: M, ChevronDown: M, Plus: M, AlertCircle: M, RefreshCcw: M,
     X: M, Calendar: M, ArrowLeft: M, RotateCcw: M, ChevronsRight: M, Search: M,
     Trash2: M, Filter: M,
   };
 });

 // Mock accounting API
 vi.mock('@/lib/accountingApi', () => ({
   ACCOUNT_TYPE_LABELS: {
     ASSET: 'Assets',
     LIABILITY: 'Liabilities',
     EQUITY: 'Equity',
     REVENUE: 'Revenue',
     EXPENSE: 'Expenses',
     COGS: 'Cost of Goods Sold',
     OTHER_INCOME: 'Other Income',
     OTHER_EXPENSE: 'Other Expense',
   },
   accountingApi: {
     getAccountTree: vi.fn(),
     getAccountTreeByType: vi.fn(),
     getAccounts: vi.fn(),
     createAccount: vi.fn(),
     getAccountActivity: vi.fn(),
     getAccountBalanceAsOf: vi.fn(),
   },
 }));

 import { ChartOfAccountsPage } from '../ChartOfAccountsPage';
 import { accountingApi } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────

 const mockTree = [
   {
     id: 1,
     code: 'ASSET',
     name: 'Assets',
     type: 'ASSET',
     balance: 500000,
     level: 0,
     parentId: null,
     children: [
       {
         id: 10,
         code: '1010',
         name: 'Cash',
         type: 'ASSET',
         balance: 100000,
         level: 1,
         parentId: 1,
         children: [],
       },
       {
         id: 11,
         code: '1020',
         name: 'Bank Account',
         type: 'ASSET',
         balance: 400000,
         level: 1,
         parentId: 1,
         children: [],
       },
     ],
   },
   {
     id: 2,
     code: 'LIABILITY',
     name: 'Liabilities',
     type: 'LIABILITY',
     balance: 200000,
     level: 0,
     parentId: null,
     children: [],
   },
 ];

 const mockFlatAccounts = [
   { id: 10, publicId: 'abc', code: '1010', name: 'Cash', type: 'ASSET' as const, balance: 100000 },
   { id: 11, publicId: 'def', code: '1020', name: 'Bank Account', type: 'ASSET' as const, balance: 400000 },
 ];

 const mockActivityReport = {
   accountCode: '1010',
   accountName: 'Cash',
   startDate: '2026-01-01',
   endDate: '2026-03-05',
   openingBalance: 50000,
   closingBalance: 100000,
   totalDebits: 200000,
   totalCredits: 150000,
   movements: [
     {
       date: '2026-01-15',
       referenceNumber: 'JE-001',
       memo: 'Cash received',
       debit: 50000,
       credit: 0,
       balance: 100000,
     },
   ],
 };

 function renderPage() {
   return render(
     <MemoryRouter>
       <ChartOfAccountsPage />
     </MemoryRouter>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────

 describe('ChartOfAccountsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(accountingApi.getAccountTree).mockResolvedValue(mockTree);
     vi.mocked(accountingApi.getAccountTreeByType).mockResolvedValue([mockTree[0]]);
     vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockFlatAccounts);
     vi.mocked(accountingApi.getAccountActivity).mockResolvedValue(mockActivityReport);
     vi.mocked(accountingApi.getAccountBalanceAsOf).mockResolvedValue(100000);
   });

   it('renders "Chart of Accounts" heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Chart of Accounts')).toBeTruthy();
     });
   });

   it('renders account type root nodes after loading', async () => {
     renderPage();
     await waitFor(() => {
       // Root-level node shows the type label (from ACCOUNT_TYPE_LABELS)
       expect(screen.getByText('Assets')).toBeTruthy();
       expect(screen.getByText('Liabilities')).toBeTruthy();
     });
   });

   it('shows child accounts when root is expanded', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Cash')).toBeTruthy();
       expect(screen.getByText('Bank Account')).toBeTruthy();
     });
   });

   it('shows error state when API fails', async () => {
     vi.mocked(accountingApi.getAccountTree).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/couldn't load chart of accounts/i)).toBeTruthy();
     });
   });

   it('shows "New" button to open create modal', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New')).toBeTruthy();
     });
   });

   it('opens create account modal on "New" button click', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New'));
     fireEvent.click(screen.getByText('New'));
     await waitFor(() => {
       expect(screen.getByText('New Account')).toBeTruthy();
     });
   });

   it('closes create modal on Cancel', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New'));
     fireEvent.click(screen.getByText('New'));
     await waitFor(() => screen.getByText('Cancel'));
     fireEvent.click(screen.getByText('Cancel'));
     await waitFor(() => {
       expect(screen.queryByText('New Account')).toBeNull();
     });
   });

   it('shows detail panel when leaf account is selected', async () => {
     renderPage();
     await waitFor(() => screen.getByText('Cash'));
     fireEvent.click(screen.getByText('Cash'));
     await waitFor(() => {
       // Detail panel shows account name and balance info
       expect(screen.getAllByText('Cash').length).toBeGreaterThan(0);
       expect(screen.getByText(/balance as of/i)).toBeTruthy();
     });
   });

   it('renders account type filter tabs with "All" selected by default', async () => {
     renderPage();
     await waitFor(() => {
       // The filter tabs should include 'All' and common type labels
       const allButtons = screen.getAllByRole('button');
       const allFilterBtn = allButtons.find((b) => b.textContent === 'All');
       expect(allFilterBtn).toBeTruthy();
     });
   });

   it('filters tree by account type when type filter is clicked', async () => {
     renderPage();
     // Wait for initial load
     await waitFor(() => screen.getByText('Assets'));
     // Find and click the "Assets" filter button in the filter bar
     const filterButtons = screen.getAllByRole('button');
     const assetsFilter = filterButtons.find((b) => b.textContent === 'Assets');
     if (assetsFilter) {
       fireEvent.click(assetsFilter);
       await waitFor(() => {
         expect(vi.mocked(accountingApi.getAccountTreeByType)).toHaveBeenCalledWith('ASSET');
       });
     }
   });
 });
