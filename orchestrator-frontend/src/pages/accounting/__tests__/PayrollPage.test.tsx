 /**
  * PayrollPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { PayrollPage } from '../PayrollPage';
 import { hrApi } from '@/lib/hrApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/hrApi', () => ({
   hrApi: {
     getPayrollRuns: vi.fn(),
     getMonthlyPayrollRuns: vi.fn(),
     getWeeklyPayrollRuns: vi.fn(),
     getPayrollRun: vi.fn(),
     getPayrollRunLines: vi.fn(),
     createPayrollRun: vi.fn(),
     createMonthlyPayrollRun: vi.fn(),
     createWeeklyPayrollRun: vi.fn(),
     calculatePayrollRun: vi.fn(),
     approvePayrollRun: vi.fn(),
     postPayrollRun: vi.fn(),
     markPayrollRunPaid: vi.fn(),
     getCurrentWeekSummary: vi.fn(),
     getCurrentMonthSummary: vi.fn(),
   },
 }));
 
 const mockPayrollRuns = [
   {
     id: 1,
     runNumber: 'PR-2024-001',
     runType: 'MONTHLY' as const,
     periodStart: '2024-01-01',
     periodEnd: '2024-01-31',
     status: 'DRAFT' as const,
     totalBasePay: 100000,
     totalOvertimePay: 5000,
     totalDeductions: 15000,
     totalNetPay: 90000,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     id: 2,
     runNumber: 'PR-2024-002',
     runType: 'WEEKLY' as const,
     periodStart: '2024-01-08',
     periodEnd: '2024-01-14',
     status: 'CALCULATED' as const,
     totalBasePay: 50000,
     totalOvertimePay: 2000,
     totalDeductions: 7000,
     totalNetPay: 45000,
     createdAt: '2024-01-08T00:00:00Z',
     updatedAt: '2024-01-08T00:00:00Z',
   },
 ];
 
 const mockMonthlySummary = {
   year: 2024,
   month: 1,
   totalGrossPay: 150000,
   totalDeductions: 22000,
   totalNetPay: 128000,
   employeeCount: 5,
 };
 
 const mockWeeklySummary = {
   weekStart: '2024-01-08',
   weekEnd: '2024-01-14',
   totalGrossPay: 50000,
   totalDeductions: 7000,
   totalNetPay: 43000,
   employeeCount: 3,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <PayrollPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('PayrollPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(hrApi.getPayrollRuns).mockResolvedValue(mockPayrollRuns);
     vi.mocked(hrApi.getCurrentMonthSummary).mockResolvedValue(mockMonthlySummary);
     vi.mocked(hrApi.getCurrentWeekSummary).mockResolvedValue(mockWeeklySummary);
   });
 
   it('renders the Payroll page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Payroll')).toBeInTheDocument();
     });
   });
 
   it('shows payroll run numbers in list', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('PR-2024-001')).toBeInTheDocument();
       expect(screen.getByText('PR-2024-002')).toBeInTheDocument();
     });
   });
 
   it('shows Draft and Calculated status badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Draft')).toBeInTheDocument();
       expect(screen.getByText('Calculated')).toBeInTheDocument();
     });
   });
 
   it('shows run type badges (MONTHLY, WEEKLY)', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('MONTHLY')).toBeInTheDocument();
       expect(screen.getByText('WEEKLY')).toBeInTheDocument();
     });
   });
 
   it('shows New Run button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Run')).toBeInTheDocument();
     });
   });
 
   it('opens create run modal when New Run is clicked', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Run')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Run'));
     await waitFor(() => {
       expect(screen.getByText('New Payroll Run')).toBeInTheDocument();
     });
   });
 
   it('shows filter tabs for Monthly and Weekly', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Monthly')).toBeInTheDocument();
       expect(screen.getByText('Weekly')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(hrApi.getPayrollRuns).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load payroll runs/i)).toBeInTheDocument();
     });
   });
 
   it('shows empty state when no runs exist', async () => {
     vi.mocked(hrApi.getPayrollRuns).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(
         screen.getByText(/No payroll runs found/i)
       ).toBeInTheDocument();
     });
   });
 });
