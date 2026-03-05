 /**
  * OpeningStockPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { OpeningStockPage } from '../OpeningStockPage';
 import { inventoryApi } from '@/lib/inventoryApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/inventoryApi', () => ({
   inventoryApi: {
     getOpeningStockHistory: vi.fn(),
     importOpeningStock: vi.fn(),
   },
 }));
 
 const mockHistory = {
   content: [
     {
       id: 1,
       referenceNumber: 'OS-2026-001',
       fileName: 'opening_stock_jan.csv',
       journalEntryId: 10,
       errorCount: 0,
       createdAt: '2026-01-01T10:00:00Z',
     },
     {
       id: 2,
       referenceNumber: 'OS-2026-002',
       fileName: 'opening_stock_feb.csv',
       journalEntryId: 20,
       errorCount: 2,
       createdAt: '2026-02-01T10:00:00Z',
     },
   ],
   totalElements: 2,
   totalPages: 1,
   page: 0,
   size: 20,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <OpeningStockPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('OpeningStockPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(inventoryApi.getOpeningStockHistory).mockResolvedValue(mockHistory);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Opening Stock')).toBeInTheDocument();
     });
   });
 
   it('shows CSV upload section', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Upload CSV')).toBeInTheDocument();
     });
   });
 
   it('shows import history section', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Import History')).toBeInTheDocument();
     });
   });
 
   it('shows history entries in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('OS-2026-001').length).toBeGreaterThan(0);
       expect(screen.getAllByText('opening_stock_jan.csv').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error count badges', async () => {
     renderPage();
     await waitFor(() => {
       // One entry has 2 errors
       expect(screen.getAllByText('2').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Import button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Import')).toBeInTheDocument();
     });
   });
 });
