 /**
  * AuditDigestPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { AuditDigestPage } from '../AuditDigestPage';
 import { auditApi } from '@/lib/accountingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 const mockDownloadBlob = vi.fn();

 vi.mock('@/lib/accountingApi', () => ({
   auditApi: {
     getAuditDigest: vi.fn(),
     getAuditDigestCsv: vi.fn(),
     getAuditTrail: vi.fn(),
   },
 }));

 vi.mock('@/utils/mobileUtils', () => ({
   downloadBlob: (...args: unknown[]) => mockDownloadBlob(...args),
 }));

 const mockDigest = {
   periodLabel: 'March 2025',
   entries: [
     '42 journal entries posted',
     '8 invoices raised',
     '5 receipts recorded',
   ],
 };

 const mockTrail = {
   content: [
     {
       id: 1,
       timestamp: '2025-03-15T10:00:00Z',
       companyId: 1,
       companyCode: 'BBP',
       actorUserId: 2,
       actorIdentifier: 'admin@example.com',
       actionType: 'CREATE_JOURNAL',
       entityType: 'JournalEntry',
       entityId: '123',
       referenceNumber: 'JE-001',
       traceId: 'abc',
       ipAddress: '127.0.0.1',
       beforeState: '',
       afterState: '',
       sensitiveOperation: false,
       metadata: {},
     },
   ],
   totalElements: 1,
   totalPages: 1,
   page: 0,
   size: 20,
 };

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <AuditDigestPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('AuditDigestPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     renderPage();
     expect(screen.getByText('Audit Digest')).toBeInTheDocument();
   });

   it('shows Export CSV button', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     renderPage();
     expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
   });

   it('shows digest entries after loading', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('42 journal entries posted')).toBeInTheDocument();
       expect(screen.getByText('March 2025')).toBeInTheDocument();
     });
   });

   it('shows audit trail table with entries', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('admin@example.com').length).toBeGreaterThan(0);
       expect(screen.getAllByText('CREATE_JOURNAL').length).toBeGreaterThan(0);
     });
   });

   it('shows error state on digest API failure', async () => {
     vi.mocked(auditApi.getAuditDigest).mockRejectedValue(new Error('API error'));
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/could not load audit digest/i)).toBeInTheDocument();
     });
   });

   it('shows error state on trail API failure', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/could not load audit trail/i)).toBeInTheDocument();
     });
   });

   it('triggers CSV download on Export CSV click', async () => {
     vi.mocked(auditApi.getAuditDigest).mockResolvedValue(mockDigest);
     vi.mocked(auditApi.getAuditTrail).mockResolvedValue(mockTrail);
     vi.mocked(auditApi.getAuditDigestCsv).mockResolvedValue(
       'Timestamp,User,Action,Entity,Details\n2025-03-15,admin,CREATE,JournalEntry,JE-001'
     );

     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('42 journal entries posted').length).toBeGreaterThan(0);
     });

     const exportBtn = screen.getByRole('button', { name: /export csv/i });
     fireEvent.click(exportBtn);

     await waitFor(() => {
       expect(auditApi.getAuditDigestCsv).toHaveBeenCalled();
       expect(mockDownloadBlob).toHaveBeenCalledWith(
         expect.any(Blob),
         expect.stringMatching(/^audit-trail-\d{4}-\d{2}-\d{2}\.csv$/)
       );
     });
   });
 });
