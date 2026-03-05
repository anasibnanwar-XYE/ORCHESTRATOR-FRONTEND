 /**
  * Report pages tests
  * Covers: TrialBalance, ProfitLoss, BalanceSheet, CashFlow, AgedDebtors, GST, InventoryValuation, ReconciliationDashboard
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { TrialBalancePage } from '../TrialBalancePage';
 import { ProfitLossPage } from '../ProfitLossPage';
 import { BalanceSheetPage } from '../BalanceSheetPage';
 import { CashFlowPage } from '../CashFlowPage';
 import { AgedDebtorsPage } from '../AgedDebtorsPage';
 import { GSTReturnPage } from '../GSTReturnPage';
 import { InventoryValuationPage } from '../InventoryValuationPage';
 import { ReconciliationDashboardPage } from '../ReconciliationDashboardPage';
 import { reportsApi } from '@/lib/reportsApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/reportsApi', () => ({
   invoicesApi: {
     getInvoices: vi.fn(),
     getInvoice: vi.fn(),
     downloadInvoicePdf: vi.fn(),
     sendInvoiceEmail: vi.fn(),
   },
   reportsApi: {
     getTrialBalance: vi.fn(),
     getProfitLoss: vi.fn(),
     getBalanceSheet: vi.fn(),
     getCashFlow: vi.fn(),
     getAgedDebtors: vi.fn(),
     getGstReturn: vi.fn(),
     getInventoryValuation: vi.fn(),
     getReconciliationDashboard: vi.fn(),
   },
 }));

 vi.mock('@/lib/api', () => ({
   apiRequest: {
     get: vi.fn().mockResolvedValue({ data: { data: null } }),
   },
 }));

 function wrap(component: React.ReactElement) {
   return render(
     <MemoryRouter>
       <ToastProvider>
         {component}
       </ToastProvider>
     </MemoryRouter>
   );
 }

 const mockTrialBalance = {
   rows: [
     { accountId: 1, code: '1000', name: 'Cash', type: 'ASSET', debit: 50000, credit: 0, net: 50000 },
     { accountId: 2, code: '2000', name: 'Accounts Payable', type: 'LIABILITY', debit: 0, credit: 50000, net: -50000 },
   ],
   totalDebit: 50000,
   totalCredit: 50000,
   balanced: true,
  metadata: { source: 'LIVE' as const, pdfReady: true, csvReady: true },
 };

 const mockProfitLoss = {
   revenue: 200000,
   costOfGoodsSold: 120000,
   grossProfit: 80000,
   operatingExpenses: 30000,
   operatingExpenseCategories: [{ category: 'Salaries', amount: 20000 }, { category: 'Rent', amount: 10000 }],
   netIncome: 50000,
  metadata: { source: 'LIVE' as const },
 };

 const mockBalanceSheet = {
   totalAssets: 500000,
   totalLiabilities: 300000,
   totalEquity: 200000,
   balanced: true,
   currentAssets: [{ accountId: 1, accountCode: '1000', accountName: 'Cash', amount: 500000 }],
   fixedAssets: [],
   currentLiabilities: [{ accountId: 2, accountCode: '2000', accountName: 'AP', amount: 300000 }],
   longTermLiabilities: [],
   equityLines: [{ accountId: 3, accountCode: '3000', accountName: 'Equity', amount: 200000 }],
  metadata: { source: 'LIVE' as const },
 };

 const mockCashFlow = {
   operating: 80000,
   investing: -20000,
   financing: -10000,
   netChange: 50000,
  metadata: { source: 'LIVE' as const },
 };

 const mockAgedDebtors = [
   {
     dealerId: 1,
     dealerCode: 'D001',
     dealerName: 'ABC Dealers',
     current: 10000,
     oneToThirtyDays: 5000,
     thirtyOneToSixtyDays: 0,
     sixtyOneToNinetyDays: 0,
     ninetyPlusDays: 0,
     totalOutstanding: 15000,
   },
 ];

 const mockGstReturn = {
   periodLabel: 'January 2026',
   periodStart: '2026-01-01',
   periodEnd: '2026-01-31',
   outputTax: { cgst: 5000, sgst: 5000, igst: 0, total: 10000 },
   inputTaxCredit: { cgst: 2000, sgst: 2000, igst: 0, total: 4000 },
   netLiability: { cgst: 3000, sgst: 3000, igst: 0, total: 6000 },
   rateSummaries: [],
   transactionDetails: [],
  metadata: { source: 'LIVE' as const },
 };

 const mockInventoryValuation = {
   totalValue: 500000,
   lowStockItems: 3,
   costingMethod: 'WEIGHTED_AVERAGE',
   items: [
     {
       inventoryItemId: 1,
       inventoryType: 'FINISHED_GOOD' as const,
       code: 'FG-001',
       name: 'White Paint 20L',
       category: 'Paints',
       brand: 'OrchestratorBrand',
       quantityOnHand: 100,
       reservedQuantity: 20,
       availableQuantity: 80,
       unitCost: 5000,
       totalValue: 500000,
       lowStock: false,
     },
   ],
   groupByCategory: [],
   groupByBrand: [],
  metadata: { source: 'LIVE' as const },
 };

 describe('TrialBalancePage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getTrialBalance).mockResolvedValue(mockTrialBalance);
   });

   it('renders Trial Balance heading', async () => {
     wrap(<TrialBalancePage />);
     await waitFor(() => {
       expect(screen.getByText('Trial Balance')).toBeInTheDocument();
     });
   });

   it('shows balanced badge when debits equal credits', async () => {
     wrap(<TrialBalancePage />);
     await waitFor(() => {
       expect(screen.getByText('Balanced')).toBeInTheDocument();
     });
   });

   it('shows account rows from API', async () => {
     wrap(<TrialBalancePage />);
     await waitFor(() => {
       expect(screen.getAllByText('Cash').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Accounts Payable').length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     vi.mocked(reportsApi.getTrialBalance).mockRejectedValue(new Error('API error'));
     wrap(<TrialBalancePage />);
     await waitFor(() => {
       expect(screen.getByText(/Failed to load trial balance/i)).toBeInTheDocument();
     });
   });
 });

 describe('ProfitLossPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getProfitLoss).mockResolvedValue(mockProfitLoss);
   });

   it('renders P&L heading', async () => {
     wrap(<ProfitLossPage />);
     await waitFor(() => {
       expect(screen.getByText('Profit & Loss')).toBeInTheDocument();
     });
   });

   it('shows Net Profit when income is positive', async () => {
     wrap(<ProfitLossPage />);
     await waitFor(() => {
       expect(screen.getByText('Net Profit')).toBeInTheDocument();
     });
   });

   it('shows expense categories', async () => {
     wrap(<ProfitLossPage />);
     await waitFor(() => {
       expect(screen.getByText('Salaries')).toBeInTheDocument();
       expect(screen.getByText('Rent')).toBeInTheDocument();
     });
   });
 });

 describe('BalanceSheetPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getBalanceSheet).mockResolvedValue(mockBalanceSheet);
   });

   it('renders Balance Sheet heading', async () => {
     wrap(<BalanceSheetPage />);
     await waitFor(() => {
       expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
     });
   });

   it('shows equation balanced indicator', async () => {
     wrap(<BalanceSheetPage />);
     await waitFor(() => {
       expect(screen.getByText('Equation balanced')).toBeInTheDocument();
     });
   });

   it('shows Total Assets', async () => {
     wrap(<BalanceSheetPage />);
     await waitFor(() => {
       expect(screen.getAllByText('Total Assets').length).toBeGreaterThan(0);
     });
   });
 });

 describe('CashFlowPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getCashFlow).mockResolvedValue(mockCashFlow);
   });

   it('renders Cash Flow heading', async () => {
     wrap(<CashFlowPage />);
     await waitFor(() => {
       expect(screen.getByText('Cash Flow Statement')).toBeInTheDocument();
     });
   });

   it('shows Operating Activities section', async () => {
     wrap(<CashFlowPage />);
     await waitFor(() => {
       expect(screen.getByText('Operating Activities')).toBeInTheDocument();
     });
   });

   it('shows Net Change in Cash', async () => {
     wrap(<CashFlowPage />);
     await waitFor(() => {
       expect(screen.getByText('Net Change in Cash')).toBeInTheDocument();
     });
   });
 });

 describe('AgedDebtorsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getAgedDebtors).mockResolvedValue(mockAgedDebtors);
   });

   it('renders Aged Debtors heading', async () => {
     wrap(<AgedDebtorsPage />);
     await waitFor(() => {
       expect(screen.getByText('Aged Debtors')).toBeInTheDocument();
     });
   });

   it('shows dealer rows', async () => {
     wrap(<AgedDebtorsPage />);
     await waitFor(() => {
       expect(screen.getAllByText('ABC Dealers').length).toBeGreaterThan(0);
     });
   });

   it('shows error on API failure', async () => {
     vi.mocked(reportsApi.getAgedDebtors).mockRejectedValue(new Error('error'));
     wrap(<AgedDebtorsPage />);
     await waitFor(() => {
       expect(screen.getByText(/Failed to load aged debtors/i)).toBeInTheDocument();
     });
   });
 });

 describe('GSTReturnPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getGstReturn).mockResolvedValue(mockGstReturn);
   });

   it('renders GST Return heading', async () => {
     wrap(<GSTReturnPage />);
     await waitFor(() => {
       expect(screen.getByText('GST Return')).toBeInTheDocument();
     });
   });

   it('shows Output Tax card', async () => {
     wrap(<GSTReturnPage />);
     await waitFor(() => {
       expect(screen.getByText('Output Tax')).toBeInTheDocument();
     });
   });

   it('shows Input Tax Credit card', async () => {
     wrap(<GSTReturnPage />);
     await waitFor(() => {
       expect(screen.getByText('Input Tax Credit')).toBeInTheDocument();
     });
   });

   it('shows Net Liability card', async () => {
     wrap(<GSTReturnPage />);
     await waitFor(() => {
       expect(screen.getByText('Net Liability')).toBeInTheDocument();
     });
   });
 });

 describe('InventoryValuationPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(reportsApi.getInventoryValuation).mockResolvedValue(mockInventoryValuation);
   });

   it('renders Inventory Valuation heading', async () => {
     wrap(<InventoryValuationPage />);
     await waitFor(() => {
       expect(screen.getByText('Inventory Valuation')).toBeInTheDocument();
     });
   });

   it('shows total value tile', async () => {
     wrap(<InventoryValuationPage />);
     await waitFor(() => {
       expect(screen.getAllByText('Total Value').length).toBeGreaterThan(0);
     });
   });

   it('shows inventory item name', async () => {
     wrap(<InventoryValuationPage />);
     await waitFor(() => {
       expect(screen.getAllByText('White Paint 20L').length).toBeGreaterThan(0);
     });
   });
 });

 describe('ReconciliationDashboardPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders Reconciliation Dashboard heading', async () => {
     wrap(<ReconciliationDashboardPage />);
     await waitFor(() => {
       expect(screen.getByText('Reconciliation Dashboard')).toBeInTheDocument();
     });
   });

   it('shows Export button', async () => {
     wrap(<ReconciliationDashboardPage />);
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
     });
   });
 });
