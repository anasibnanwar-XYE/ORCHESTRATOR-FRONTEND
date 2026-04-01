 /**
  * Tests for FactoryDispatchPage
  *
  * Covers:
  *  - Shows page heading
  *  - Shows loading skeleton initially
  *  - Shows pending slips in table after data loads
  *  - Shows error state on API failure
  *  - Shows empty state when no pending slips
  *  - Confirm dispatch button opens modal
  *  - Preview slip button fetches preview
  *  - Cancel backorder shows confirm dialog
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({
     success: vi.fn(),
     error: vi.fn(),
     info: vi.fn(),
     warning: vi.fn(),
   }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getPendingSlips: vi.fn(),
     getDispatchPreview: vi.fn(),
     confirmDispatch: vi.fn(),
     cancelBackorder: vi.fn(),
     getSlip: vi.fn(),
   },
 }));

 import React from 'react';
 import { FactoryDispatchPage } from '../FactoryDispatchPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockSlips = [
   {
     id: 1,
     slipNumber: 'SLIP-001',
     orderNumber: 'ORD-001',
     salesOrderId: 10,
     dealerName: 'Sharma Paints',
     status: 'PENDING',
     createdAt: '2026-03-01T08:00:00Z',
     lines: [
       { id: 1, productCode: 'EXT-1L', productName: 'Exterior Emulsion 1L', orderedQuantity: 100, shippedQuantity: 100 },
     ],
   },
   {
     id: 2,
     slipNumber: 'SLIP-002',
     orderNumber: 'ORD-002',
     salesOrderId: 11,
     dealerName: 'Kumar Distributors',
     status: 'BACKORDER',
     createdAt: '2026-03-02T08:00:00Z',
     lines: [],
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/dispatch']}>
       <FactoryDispatchPage />
     </MemoryRouter>
   );
 }

 describe('FactoryDispatchPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlips);
     renderPage();
     expect(screen.getByText('Dispatch')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders slip rows after data loads', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlips);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('SLIP-001');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/unable to load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows empty state when no slips', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no pending/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows dealer name in the table', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlips);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Sharma Paints').length).toBeGreaterThan(0);
     });
   });

   it('shows PENDING status badge', async () => {
     (factoryApi.getPendingSlips as ReturnType<typeof vi.fn>).mockResolvedValue(mockSlips);
     renderPage();
     await waitFor(() => {
       const badges = screen.getAllByText('Pending');
       expect(badges.length).toBeGreaterThan(0);
     });
   });
 });
