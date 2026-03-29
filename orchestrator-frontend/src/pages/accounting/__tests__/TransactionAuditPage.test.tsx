 /**
  * TransactionAuditPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { TransactionAuditPage } from '../TransactionAuditPage';
 import { auditApi, dateContextApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/accountingApi', () => ({
   auditApi: {
     getTransactionAudit: vi.fn(),
     getTransactionAuditDetail: vi.fn(),
   },
   dateContextApi: {
     getDateContext: vi.fn(),
   },
 }));

 const mockDateContext = {
   serverDate: '2025-03-15',
   openPeriod: 'March 2025',
   fiscalYear: '2025',
   timezone: 'Asia/Kolkata',
 };

 const mockTxList = {
   content: [
     {
       journalEntryId: 101,
       referenceNumber: 'JE-2025-0101',
       entryDate: '2025-03-10',
       status: 'POSTED',
       module: 'MANUAL',
       transactionType: 'MANUAL_JOURNAL',
       memo: 'Salary accrual March',
       dealerId: null,
       dealerName: null,
       supplierId: null,
       supplierName: null,
       totalDebit: 50000,
       totalCredit: 50000,
       reversalOfId: null,
       reversalEntryId: null,
       correctionType: null,
       consistencyStatus: 'OK',
       postedAt: '2025-03-10T14:00:00Z',
     },
   ],
   totalElements: 1,
   totalPages: 1,
   page: 0,
   size: 20,
 };

 const mockDetail = {
   journalEntryId: 101,
   journalPublicId: 'abc-123',
   referenceNumber: 'JE-2025-0101',
   entryDate: '2025-03-10',
   status: 'POSTED',
   module: 'MANUAL',
   transactionType: 'MANUAL_JOURNAL',
   memo: 'Salary accrual March',
   dealerId: null,
   dealerName: null,
   supplierId: null,
   supplierName: null,
   accountingPeriodId: 1,
   accountingPeriodLabel: 'March 2025',
   accountingPeriodStatus: 'OPEN',
   reversalOfId: null,
   reversalEntryId: null,
   correctionType: null,
   correctionReason: null,
   voidReason: null,
   totalDebit: 50000,
   totalCredit: 50000,
   consistencyStatus: 'OK',
   consistencyNotes: [],
   lines: [
     { accountId: 1, accountCode: '6001', accountName: 'Salary Expense', debit: 50000, credit: 0, description: '' },
     { accountId: 2, accountCode: '2001', accountName: 'Salaries Payable', debit: 0, credit: 50000, description: '' },
   ],
   linkedDocuments: [],
   eventTrail: [],
   createdAt: '2025-03-10T14:00:00Z',
   updatedAt: '2025-03-10T14:00:00Z',
   postedAt: '2025-03-10T14:00:00Z',
   createdBy: 'admin',
   postedBy: 'admin',
   lastModifiedBy: null,
 };

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <TransactionAuditPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('TransactionAuditPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     renderPage();
     expect(screen.getByText('Transaction Audit')).toBeInTheDocument();
   });

   it('shows date context values', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Date Context')).toBeInTheDocument();
       expect(screen.getAllByText('2025-03-15').length).toBeGreaterThan(0);
     });
   });

   it('shows transaction list with reference numbers', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('JE-2025-0101').length).toBeGreaterThan(0);
     });
   });

   it('shows POSTED status badge', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Posted').length).toBeGreaterThan(0);
     });
   });

   it('shows error state on transaction list failure', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/could not load transaction audit/i)).toBeInTheDocument();
     });
   });

   it('shows detail view on row click', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     vi.mocked(auditApi.getTransactionAuditDetail).mockResolvedValue(mockDetail);
     renderPage();

     await waitFor(() => {
       expect(screen.getAllByText('JE-2025-0101').length).toBeGreaterThan(0);
     });

     // Click the row
     const rows = screen.getAllByText('JE-2025-0101');
     fireEvent.click(rows[0]);

     await waitFor(() => {
       expect(auditApi.getTransactionAuditDetail).toHaveBeenCalledWith(101);
     });
   });

   it('shows journal lines in detail view', async () => {
     vi.mocked(dateContextApi.getDateContext).mockResolvedValue(mockDateContext);
     vi.mocked(auditApi.getTransactionAudit).mockResolvedValue(mockTxList);
     vi.mocked(auditApi.getTransactionAuditDetail).mockResolvedValue(mockDetail);
     renderPage();

     await waitFor(() => {
       expect(screen.getAllByText('JE-2025-0101').length).toBeGreaterThan(0);
     });

     fireEvent.click(screen.getAllByText('JE-2025-0101')[0]);

     await waitFor(() => {
       expect(screen.getByText('Salary Expense')).toBeInTheDocument();
       expect(screen.getByText('Salaries Payable')).toBeInTheDocument();
     });
   });
 });
