 /**
  * Tests for DealerLedgerPage (My Ledger)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { BookOpen: M, RefreshCcw: M, AlertCircle: M };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getLedger: vi.fn(),
   },
 }));
 
 import { DealerLedgerPage } from '../DealerLedgerPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockLedger = [
   {
     date: '2026-01-05T00:00:00Z',
     reference: 'INV-001',
     description: 'Invoice',
     type: 'INVOICE',
     debit: 53100,
     credit: 0,
     balance: 53100,
   },
   {
     date: '2026-01-15T00:00:00Z',
     reference: 'PAY-001',
     description: 'Payment received',
     type: 'PAYMENT',
     debit: 0,
     credit: 30000,
     balance: 23100,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/ledger']}>
       <DealerLedgerPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerLedgerPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', async () => {
     (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockResolvedValue(mockLedger);
     renderPage();
     await waitFor(() => expect(screen.getByText('My Ledger')).toBeDefined());
   });
 
   it('shows transaction references in ledger', async () => {
     (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockResolvedValue(mockLedger);
     renderPage();
     await waitFor(() => {
       const els = screen.getAllByText('INV-001');
       expect(els.length).toBeGreaterThan(0);
     });
   });
 
   it('shows skeleton loading state', () => {
     (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const errorEls = screen.queryAllByText(/couldn't load|error|failed/i);
       expect(errorEls.length).toBeGreaterThan(0);
     });
   });
 
   it('shows debit and credit columns', async () => {
     (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockResolvedValue(mockLedger);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Debit')).toBeDefined();
       expect(screen.getByText('Credit')).toBeDefined();
       expect(screen.getByText('Balance')).toBeDefined();
     });
   });
 });
