 /**
  * MonthEndChecklistPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { MonthEndChecklistPage } from '../MonthEndChecklistPage';
 import { accountingApi, monthEndApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getPeriods: vi.fn(),
   },
   monthEndApi: {
     getChecklist: vi.fn(),
     updateChecklist: vi.fn(),
   },
 }));

 const mockPeriod = {
   id: 1,
   name: 'March 2025',
   label: 'March 2025',
   startDate: '2025-03-01',
   endDate: '2025-03-31',
   status: 'OPEN' as const,
   year: 2025,
   month: 3,
   bankReconciled: false,
   inventoryCounted: false,
 };

 const mockChecklist = {
   period: mockPeriod,
   readyToClose: false,
   items: [
     { key: 'trialBalanceBalanced', label: 'Trial balance balanced', status: 'PASS' as const, checked: true },
     { key: 'unbalancedJournals', label: 'No unbalanced journals', status: 'PASS' as const, checked: true },
     { key: 'bankReconciled', label: 'Bank reconciliation confirmed', status: 'MANUAL' as const, checked: false },
     { key: 'inventoryCounted', label: 'Physical inventory count confirmed', status: 'MANUAL' as const, checked: false },
     { key: 'arReconciled', label: 'AR reconciled', status: 'FAIL' as const, checked: false, count: 3 },
   ],
 };

 const mockReadyChecklist = {
   ...mockChecklist,
   readyToClose: true,
   items: mockChecklist.items.map((i) => ({ ...i, status: 'PASS' as const, checked: true })),
 };

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <MonthEndChecklistPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('MonthEndChecklistPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders page heading', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockChecklist);
     renderPage();
     expect(screen.getByText('Month-End Checklist')).toBeInTheDocument();
   });

   it('shows period selector after loading', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockChecklist);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('March 2025').length).toBeGreaterThan(0);
     });
   });

   it('renders checklist items with labels', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockChecklist);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Trial balance is balanced')).toBeInTheDocument();
       expect(screen.getByText('Bank reconciliation confirmed')).toBeInTheDocument();
     });
   });

   it('Close Period button is disabled when not ready', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockChecklist);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Not ready')).toBeInTheDocument();
     });
     const closeBtn = screen.getByRole('button', { name: /close period/i });
     expect(closeBtn).toBeDisabled();
   });

   it('Close Period button is enabled when readyToClose is true', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockReadyChecklist);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Ready to close')).toBeInTheDocument();
     });
     const closeBtn = screen.getByRole('button', { name: /close period/i });
     expect(closeBtn).not.toBeDisabled();
   });

   it('shows empty state when no open periods', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText(/no open periods/i).length).toBeGreaterThan(0);
     });
   });

   it('shows error state on checklist API failure', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/could not load checklist/i)).toBeInTheDocument();
     });
   });

   it('progress bar shows correct proportion', async () => {
     vi.mocked(accountingApi.getPeriods).mockResolvedValue([mockPeriod]);
     vi.mocked(monthEndApi.getChecklist).mockResolvedValue(mockChecklist);
     renderPage();
     await waitFor(() => {
       // 2 of 5 tasks complete
       expect(screen.getByText('2 of 5 tasks complete')).toBeInTheDocument();
     });
   });
 });
