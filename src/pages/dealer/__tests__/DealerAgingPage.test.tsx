 /**
  * Tests for DealerAgingPage (My Aging)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return { Clock: M, RefreshCcw: M, AlertCircle: M };
 });
 
 vi.mock('@/lib/dealerApi', () => ({
   dealerApi: {
     getAging: vi.fn(),
   },
 }));
 
 import { DealerAgingPage } from '../DealerAgingPage';
 import { dealerApi } from '@/lib/dealerApi';
 
 const mockAging = {
   totalOutstanding: 125000,
  dealerId: 1,
  dealerName: 'Test Dealer',
  agingBuckets: {
    'current': 50000,
    '1-30 days': 35000,
    '31-60 days': 25000,
    '61-90 days': 10000,
    '90+ days': 5000,
  },
  overdueInvoices: [
     {
       invoiceNumber: 'INV-001',
      issueDate: '2026-01-01',
       dueDate: '2026-01-31T00:00:00Z',
      outstandingAmount: 50000,
      daysOverdue: 5,
     },
   ],
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/dealer/aging']}>
       <DealerAgingPage />
     </MemoryRouter>
   );
 }
 
 describe('DealerAgingPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders the page heading', async () => {
     (dealerApi.getAging as ReturnType<typeof vi.fn>).mockResolvedValue(mockAging);
     renderPage();
     await waitFor(() => expect(screen.getByText('My Aging')).toBeDefined());
   });
 
   it('shows aging buckets', async () => {
     (dealerApi.getAging as ReturnType<typeof vi.fn>).mockResolvedValue(mockAging);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Current')).toBeDefined();
     });
   });
 
   it('shows skeleton loading state', () => {
     (dealerApi.getAging as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (dealerApi.getAging as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const errorEls = screen.queryAllByText(/couldn't load|error|failed/i);
       expect(errorEls.length).toBeGreaterThan(0);
     });
   });
 
   it('shows total outstanding', async () => {
     (dealerApi.getAging as ReturnType<typeof vi.fn>).mockResolvedValue(mockAging);
     renderPage();
     await waitFor(() => {
       const totals = screen.queryAllByText(/Total Outstanding/i);
       expect(totals.length).toBeGreaterThan(0);
     });
   });
 });
