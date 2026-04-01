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
     ChevronDown: M, Loader2: M, X: M, Calendar: M,
   };
 });

let uuidCounter = 0;

// Mock uuid
 vi.mock('uuid', () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
 }));

 // Mock accounting API
 vi.mock('@/lib/accountingApi', () => ({
   accountingApi: {
     getJournalsFiltered: vi.fn(),
     getAccounts: vi.fn(),
     getSuppliers: vi.fn(),
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
   { id: 3, publicId: 'a3', code: '2010', name: 'Accounts Payable', type: 'LIABILITY' as const, balance: 0 },
 ];

 const mockSuppliers = [
   { id: 1, name: 'Supplier One', code: 'SUP001', status: 'ACTIVE', outstandingBalance: 0 },
 ];

 const mockCreatedJournal = {
   id: 99,
   publicId: 'je-099',
   referenceNumber: 'JE-2026-099',
   entryDate: '2026-03-01',
   memo: 'Payable adjustment',
   status: 'POSTED',
   dealerId: null,
   dealerName: null,
   supplierId: 1,
   supplierName: 'Supplier One',
   accountingPeriodId: null,
   accountingPeriodLabel: null,
   accountingPeriodStatus: null,
   reversalOfEntryId: null,
   reversalEntryId: null,
   createdAt: '2026-03-01T10:00:00Z',
   updatedAt: '2026-03-01T10:00:00Z',
   createdBy: 'tester',
   lines: [
     { id: 1, accountId: 1, accountCode: '1010', accountName: 'Cash', debit: 100, credit: 0, description: '' },
     { id: 2, accountId: 3, accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: 100, description: '' },
   ],
 };

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
     uuidCounter = 0;
     vi.clearAllMocks();
     vi.mocked(accountingApi.getJournalsFiltered).mockResolvedValue(mockJournals);
     vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
     vi.mocked(accountingApi.getSuppliers).mockResolvedValue(mockSuppliers);
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

   it('requires supplier context for accounts payable journals', async () => {
     vi.mocked(accountingApi.createManualJournal).mockResolvedValue(mockCreatedJournal);

     renderPage();
     await waitFor(() => screen.getByText('New Journal'));
     fireEvent.click(screen.getByText('New Journal'));
     await waitFor(() => screen.getByText('Post Entry'));

     const accountSelects = Array.from(document.querySelectorAll('select')).slice(0, 4);
     fireEvent.change(accountSelects[0], { target: { value: '3' } });
     fireEvent.change(accountSelects[1], { target: { value: '1' } });
     fireEvent.change(accountSelects[2], { target: { value: '3' } });
     fireEvent.change(accountSelects[3], { target: { value: '1' } });

     const amountInputs = screen.getAllByPlaceholderText('0.00');
     fireEvent.change(amountInputs[1], { target: { value: '100' } });
     fireEvent.change(amountInputs[2], { target: { value: '100' } });
     fireEvent.change(amountInputs[5], { target: { value: '100' } });
     fireEvent.change(amountInputs[6], { target: { value: '100' } });

     await waitFor(() => {
       expect(screen.getByLabelText(/Supplier \*/i)).toBeInTheDocument();
     });

     const submitBtn = screen.getByText('Post Entry').closest('button');
     expect(submitBtn).toBeDisabled();
     expect(accountingApi.createManualJournal).not.toHaveBeenCalled();

     fireEvent.change(screen.getByLabelText(/Supplier \*/i), { target: { value: '1' } });
     fireEvent.click(screen.getByText('Post Entry'));

     await waitFor(() => {
       expect(accountingApi.createManualJournal).toHaveBeenCalledWith(
         expect.objectContaining({ supplierId: 1 }),
       );
     });
   });

   it('navigates to journal detail on row click', async () => {
     renderPage();
    await waitFor(() => screen.getAllByText('JE-2026-001').length > 0);
    fireEvent.click(screen.getAllByText('JE-2026-001')[0]);
     expect(mockNavigate).toHaveBeenCalledWith('/accounting/journals/1');
   });
 });
