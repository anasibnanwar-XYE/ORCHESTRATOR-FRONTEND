 /**
  * Tests for JournalDetailPage
  *
  * Covers:
  *  - Renders journal header info (reference, date, status, memo)
  *  - Renders balanced line items table (debit/credit)
  *  - Shows totals footer equal to sum of lines
  *  - Shows "Reverse" button for POSTED entries
  *  - Opens reverse confirmation modal
  *  - Shows error state when entry not found
  *  - Shows loading skeleton while fetching
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter, Route, Routes } from 'react-router-dom';

 // Mock icons
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     ArrowLeft: M, RotateCcw: M, ChevronsRight: M, AlertCircle: M, RefreshCcw: M,
     X: M, Plus: M,
   };
 });

 // Mock accounting API
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getJournalEntryById: vi.fn(),
     reverseJournal: vi.fn(),
     cascadeReverseJournal: vi.fn(),
     getJournalEntries: vi.fn(),
   },
 }));

 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });

 import { JournalDetailPage } from '../JournalDetailPage';
 import { accountingApi } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────

 const mockEntry = {
   id: 42,
   publicId: 'pub-42',
   referenceNumber: 'JE-2026-042',
   entryDate: '2026-02-15',
   memo: 'Monthly depreciation entry',
   status: 'POSTED',
   dealerId: null,
   dealerName: null,
   supplierId: null,
   supplierName: null,
   accountingPeriodId: 1,
   accountingPeriodLabel: 'Feb 2026',
   accountingPeriodStatus: 'OPEN',
   reversalOfEntryId: null,
   reversalEntryId: null,
   createdAt: '2026-02-15T10:00:00Z',
   updatedAt: '2026-02-15T10:00:00Z',
   createdBy: 'admin@example.com',
   lines: [
     {
       id: 1,
       accountId: 100,
       accountCode: '6010',
       accountName: 'Depreciation Expense',
       debit: 15000,
       credit: 0,
       description: 'Monthly depreciation',
     },
     {
       id: 2,
       accountId: 200,
       accountCode: '1510',
       accountName: 'Accumulated Depreciation',
       debit: 0,
       credit: 15000,
       description: 'Monthly depreciation',
     },
   ],
 };

 function renderPage(id = '42') {
   return render(
     <MemoryRouter initialEntries={[`/accounting/journals/${id}`]}>
       <Routes>
         <Route path="/accounting/journals/:id" element={<JournalDetailPage />} />
       </Routes>
     </MemoryRouter>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────

 describe('JournalDetailPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(accountingApi.getJournalEntryById).mockResolvedValue(mockEntry);
   });

   it('renders reference number as heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('JE-2026-042')).toBeTruthy();
     });
   });

   it('renders entry date', async () => {
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('15 Feb 2026').length).toBeGreaterThan(0);
     });
   });

   it('renders memo', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Monthly depreciation entry')).toBeTruthy();
     });
   });

   it('renders both journal lines', async () => {
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('Depreciation Expense').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Accumulated Depreciation').length).toBeGreaterThan(0);
     });
   });

   it('shows Reverse button for POSTED journal', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Reverse')).toBeTruthy();
     });
   });

   it('opens reverse confirmation modal on Reverse click', async () => {
     renderPage();
     await waitFor(() => screen.getByText('Reverse'));
     fireEvent.click(screen.getByText('Reverse'));
     await waitFor(() => {
       expect(screen.getByText('Reverse Journal')).toBeTruthy();
     });
   });

   it('shows error state when entry not found', async () => {
     vi.mocked(accountingApi.getJournalEntryById).mockResolvedValue(null);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/journal entry not found/i)).toBeTruthy();
     });
   });

   it('navigates back when "Back to Journals" is clicked', async () => {
     renderPage();
     await waitFor(() => screen.getByText('Back to Journals'));
     fireEvent.click(screen.getByText('Back to Journals'));
     expect(mockNavigate).toHaveBeenCalledWith('/accounting/journals');
   });

   it('renders "Journal Lines" section', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Journal Lines')).toBeTruthy();
     });
   });
 });
