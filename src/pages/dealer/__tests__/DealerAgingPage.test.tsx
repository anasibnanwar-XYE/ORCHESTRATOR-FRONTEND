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
   current: 50000,
   days1to30: 35000,
   days31to60: 25000,
   days61to90: 10000,
   over90: 5000,
   lineItems: [
     {
       invoiceNumber: 'INV-001',
       issueDate: '2026-01-01T00:00:00Z',
       dueDate: '2026-01-31T00:00:00Z',
       amount: 50000,
       outstanding: 50000,
       daysOverdue: 0,
       bucket: 'CURRENT',
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
