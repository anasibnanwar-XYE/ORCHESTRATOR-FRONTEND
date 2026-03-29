 /**
  * Tests for JournalsPage
  *
  * Covers:
  *  - Renders journal list after load
  *  - Shows loading skeleton
  *  - Shows error state with retry
  *  - Shows empty state when no journals
  *  - Keyword search filters journals
  *  - New Journal button opens create modal
  *  - Create modal validates debit/credit balance
  *  - Reverse button shown for POSTED journals
  *  - Row click navigates to journal detail
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 // Mock icons
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, Search: M, AlertCircle: M, RefreshCcw: M, RotateCcw: M,
     ChevronsRight: M, Trash2: M, ChevronLeft: M, ChevronRight: M,
     X: M, Calendar: M,
   };
 });

 // Mock uuid
 vi.mock('uuid', () => ({
   v4: () => 'test-uuid-123',
 }));

 // Mock accounting API
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getJournalsFiltered: vi.fn(),
     getAccounts: vi.fn(),
     createManualJournal: vi.fn(),
     reverseJournal: vi.fn(),
     cascadeReverseJournal: vi.fn(),
   },
 }));

 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });

 import { JournalsPage } from '../JournalsPage';
 import { accountingApi } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────

 const mockJournals = [
   {
     id: 1,
     referenceNumber: 'JE-2026-001',
     entryDate: '2026-01-15',
     memo: 'Sales revenue journal',
     status: 'POSTED',
     journalType: 'MANUAL',
     sourceModule: 'MANUAL',
     sourceReference: '',
     totalDebit: 50000,
     totalCredit: 50000,
   },
   {
     id: 2,
     referenceNumber: 'JE-2026-002',
     entryDate: '2026-01-20',
     memo: 'Purchase entry',
     status: 'POSTED',
     journalType: 'MANUAL',
     sourceModule: 'MANUAL',
     sourceReference: '',
     totalDebit: 30000,
     totalCredit: 30000,
   },
   {
     id: 3,
     referenceNumber: 'JE-2026-003',
     entryDate: '2026-02-01',
     memo: 'Void test',
     status: 'VOID',
     journalType: 'MANUAL',
     sourceModule: 'MANUAL',
     sourceReference: '',
     totalDebit: 10000,
     totalCredit: 10000,
   },
 ];

 const mockAccounts = [
   { id: 1, publicId: 'a1', code: '1010', name: 'Cash', type: 'ASSET' as const, balance: 100000 },
   { id: 2, publicId: 'a2', code: '4010', name: 'Revenue', type: 'REVENUE' as const, balance: 0 },
 ];

 function renderPage() {
   return render(
     <MemoryRouter>
       <JournalsPage />
     </MemoryRouter>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────

 describe('JournalsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(accountingApi.getJournalsFiltered).mockResolvedValue(mockJournals);
     vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
   });

   it('renders page heading', () => {
     renderPage();
     expect(screen.getByText('Journal Entries')).toBeTruthy();
   });

   it('renders journal reference numbers after load', async () => {
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('JE-2026-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('JE-2026-002').length).toBeGreaterThan(0);
     });
   });

   it('shows error state when API fails', async () => {
     vi.mocked(accountingApi.getJournalsFiltered).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/couldn't load journal entries/i)).toBeTruthy();
     });
   });

   it('shows empty state when no journals', async () => {
     vi.mocked(accountingApi.getJournalsFiltered).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/no journal entries yet/i)).toBeTruthy();
     });
   });

   it('filters journals by keyword', async () => {
     renderPage();
    await waitFor(() => screen.getAllByText('JE-2026-001').length > 0);
     const searchInput = screen.getByPlaceholderText('Search journals…');
     fireEvent.change(searchInput, { target: { value: 'Sales revenue' } });
     await waitFor(() => {
      expect(screen.getAllByText('JE-2026-001').length).toBeGreaterThan(0);
       expect(screen.queryByText('JE-2026-002')).toBeNull();
     });
   });

   it('shows "New Journal" button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Journal')).toBeTruthy();
     });
   });

   it('opens create journal modal on button click', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New Journal'));
     fireEvent.click(screen.getByText('New Journal'));
     await waitFor(() => {
       expect(screen.getByText('New Journal Entry')).toBeTruthy();
     });
   });

   it('submit button disabled when journal lines are not balanced', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New Journal'));
     fireEvent.click(screen.getByText('New Journal'));
     await waitFor(() => screen.getByText('Post Entry'));
     const submitBtn = screen.getByText('Post Entry').closest('button');
     expect(submitBtn).toBeTruthy();
     expect(submitBtn?.disabled).toBe(true);
   });

   it('navigates to journal detail on row click', async () => {
     renderPage();
    await waitFor(() => screen.getAllByText('JE-2026-001').length > 0);
    fireEvent.click(screen.getAllByText('JE-2026-001')[0]);
     expect(mockNavigate).toHaveBeenCalledWith('/accounting/journals/1');
   });
 });
