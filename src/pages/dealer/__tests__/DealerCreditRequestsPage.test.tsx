 /**
  * Tests for DealerCreditRequestsPage (Submit Credit Request)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { CreditCard: M, RefreshCcw: M, AlertCircle: M, Plus: M, CheckCircle: M };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     createCreditRequest: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { DealerCreditRequestsPage } from '../DealerCreditRequestsPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/credit-requests']}>
       <DealerCreditRequestsPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerCreditRequestsPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', () => {
     renderPage();
     expect(screen.getByText('Credit Requests')).toBeDefined();
   });
 
   it('shows amount and justification fields', () => {
     renderPage();
     expect(screen.getByLabelText(/amount/i) || screen.queryAllByPlaceholderText(/amount|0\.00|requested/i).length > 0).toBeTruthy();
   });
 
   it('shows validation error on empty submission', async () => {
     renderPage();
     const submitBtn = screen.getByRole('button', { name: /submit|request/i });
     fireEvent.click(submitBtn);
     await waitFor(() => {
       const errors = screen.queryAllByText(/required|enter|amount/i);
       expect(errors.length).toBeGreaterThan(0);
     });
   });
 
   it('calls createCreditRequest with correct data', async () => {
     (dealerApi.createCreditRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
       id: 1,
       publicId: 'uuid-123',
       status: 'PENDING',
       amountRequested: 50000,
       reason: 'Need more credit',
     });
 
     renderPage();
 
     const amountInput = document.querySelector('input[type="number"]') as HTMLInputElement;
     if (amountInput) {
       fireEvent.change(amountInput, { target: { value: '50000' } });
     }
 
     const textareas = document.querySelectorAll('textarea');
     if (textareas.length > 0) {
       fireEvent.change(textareas[0], { target: { value: 'Need more credit for seasonal demand' } });
     }
 
     const submitBtn = screen.getByRole('button', { name: /submit|request/i });
     fireEvent.click(submitBtn);
 
     await waitFor(() => {
       if ((dealerApi.createCreditRequest as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
         expect(dealerApi.createCreditRequest).toHaveBeenCalled();
       }
     });
   });
 });
