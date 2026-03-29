 /**
  * DealersAccountingPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { DealersAccountingPage } from '../DealersAccountingPage';
 import { accountingApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getDealers: vi.fn(),
   },
 }));
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getDealerStatementPdf: vi.fn(),
     getDealerAgingPdf: vi.fn(),
   },
 }));
 
 const mockDealers = [
   {
     id: 1,
     name: 'Metro Traders',
     code: 'MT001',
     city: 'Mumbai',
     region: 'Maharashtra',
     status: 'ACTIVE',
     outstandingBalance: 75000,
   },
   {
     id: 2,
     name: 'City Dealers',
     code: 'CD002',
     status: 'ACTIVE',
     outstandingBalance: 0,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <DealersAccountingPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('DealersAccountingPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(accountingApi.getDealers).mockResolvedValue(mockDealers);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Dealers')).toBeInTheDocument();
     });
   });
 
  it('shows dealer names in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Metro Traders').length).toBeGreaterThan(0);
      expect(screen.getAllByText('City Dealers').length).toBeGreaterThan(0);
    });
  });
 
   it('shows Documents buttons for each dealer', async () => {
     renderPage();
     await waitFor(() => {
       const docButtons = screen.getAllByText('Documents');
       expect(docButtons.length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(accountingApi.getDealers).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load dealers/i)).toBeInTheDocument();
     });
   });
 
   it('calls getDealers on mount', async () => {
     renderPage();
     await waitFor(() => {
       expect(accountingApi.getDealers).toHaveBeenCalledTimes(1);
     });
   });
 });
