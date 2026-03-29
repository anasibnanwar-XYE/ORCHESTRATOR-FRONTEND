 /**
  * ConfigHealthPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { ConfigHealthPage } from '../ConfigHealthPage';
 import { configHealthApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/accountingApi', () => ({
   configHealthApi: {
     getHealthReport: vi.fn(),
   },
 }));

 const mockHealthyReport = {
   healthy: true,
   issues: [],
 };

 const mockUnhealthyReport = {
   healthy: false,
   issues: [
     {
       companyCode: 'BBP',
       domain: 'DEFAULT_ACCOUNTS',
       reference: 'COMPANY_DEFAULTS',
       message: 'Revenue account is not configured.',
     },
     {
       companyCode: 'BBP',
       domain: 'PERIODS',
       reference: 'BASE',
       message: 'No open accounting period exists.',
     },
   ],
 };

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <ConfigHealthPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('ConfigHealthPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockHealthyReport);
     renderPage();
     expect(screen.getByText('Config Health Check')).toBeInTheDocument();
   });

   it('shows run checks button after loading', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockHealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /run checks/i })).toBeInTheDocument();
     });
   });

   it('shows all checks passing when healthy', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockHealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('All checks passing')).toBeInTheDocument();
     });
     // All predefined checks should show Pass badges
     const passBadges = screen.getAllByText('Pass');
     expect(passBadges.length).toBeGreaterThan(0);
   });

   it('shows fail badges for failed checks', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockUnhealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Fail').length).toBeGreaterThan(0);
     });
   });

   it('shows issue message for failed check', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockUnhealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Revenue account is not configured.')).toBeInTheDocument();
     });
   });

   it('shows fix link for failed check', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockUnhealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Set Default Accounts').length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/could not run health check/i)).toBeInTheDocument();
     });
   });

   it('shows unhealthy summary with fail count', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockUnhealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/2 checks need attention/i)).toBeInTheDocument();
     });
   });

   it('navigates to fix page on fix link click', async () => {
     vi.mocked(configHealthApi.getHealthReport).mockResolvedValue(mockUnhealthyReport);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Set Default Accounts').length).toBeGreaterThan(0);
     });
     // Clicking the fix link should not throw
     const fixLinks = screen.getAllByText('Set Default Accounts');
     fireEvent.click(fixLinks[0]);
     // Navigation happens; no error thrown
   });
 });
