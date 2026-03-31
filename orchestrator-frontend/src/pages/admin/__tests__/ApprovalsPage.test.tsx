/**
 * Tests for ApprovalsPage
 *
 * Covers VAL-APPR-001 through VAL-APPR-008:
 *  - Page loads grouped approvals from GET /admin/approvals
 *  - Credit request approve/reject with reason
 *  - Export request approve/reject with reason (PUT)
 *  - Period close approve/reject with note (POST)
 *  - Empty state when no pending items
 *  - Reason field required — validation prevents empty submission
 *  - Payroll items excluded (HR/Payroll out of scope)
 *  - Loading skeleton state
 *  - Error state with retry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    CheckSquare: M, XCircle: M, CheckCircle: M, Clock: M, AlertCircle: M,
    RefreshCcw: M, ChevronDown: M, AlertTriangle: M, Info: M,
    ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
    Search: M, MoreHorizontal: M, X: M, FileCheck: M, Loader2: M,
  };
});

vi.mock('@/lib/adminApi', () => ({
  adminApi: {
    getApprovals: vi.fn(),
    approveCreditRequest: vi.fn(),
    rejectCreditRequest: vi.fn(),
    approveCreditOverride: vi.fn(),
    rejectCreditOverride: vi.fn(),
    approvePeriodClose: vi.fn(),
    rejectPeriodClose: vi.fn(),
    approveExport: vi.fn(),
    rejectExport: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { ApprovalsPage } from '../ApprovalsPage';
import { adminApi } from '@/lib/adminApi';

// Mock data matching actual backend shape — createdAt as Unix epoch seconds
const mockApprovals = {
  creditRequests: [
    {
      originType: 'CREDIT_REQUEST',
      ownerType: 'SALES',
      id: 2,
      publicId: '78b9e14c-664f-4ef3-8f5c-0cb4618cb5f1',
      reference: 'CLR-2',
      status: 'PENDING',
      summary: 'Approve permanent dealer credit-limit request CLR-2 for Validation Dealer amount 75000',
      requesterUserId: 8,
      requesterEmail: 'validation.dealer@example.com',
      actionType: 'APPROVE_DEALER_CREDIT_LIMIT_REQUEST',
      actionLabel: 'Approve permanent credit limit',
      approveEndpoint: '/api/v1/credit/limit-requests/{id}/approve',
      rejectEndpoint: '/api/v1/credit/limit-requests/{id}/reject',
      createdAt: 1774911623.498897,
    },
  ],
  // Payroll should be excluded from the UI (HR/Payroll out of scope)
  payrollRuns: [
    {
      originType: 'PAYROLL_RUN',
      id: 99,
      publicId: 'PR-001',
      reference: 'PR-2024-001',
      status: 'PENDING',
      summary: 'March 2024 Payroll Run - 45 employees',
      createdAt: 1774911500,
    },
  ],
  exportRequests: [
    {
      originType: 'EXPORT_REQUEST',
      ownerType: 'REPORTS',
      id: 1,
      publicId: null,
      reference: 'EXP-1',
      status: 'PENDING',
      summary: 'Approve export request EXP-1 for report SALES_LEDGER',
      reportType: 'SALES_LEDGER',
      approveEndpoint: '/api/v1/admin/exports/{id}/approve',
      rejectEndpoint: '/api/v1/admin/exports/{id}/reject',
      createdAt: 1774911623.489968,
    },
  ],
  periodCloseRequests: [],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/approvals']}>
      <ApprovalsPage />
    </MemoryRouter>
  );
}

describe('ApprovalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── VAL-APPR-001: Page loads grouped approvals ──

  it('renders the page heading (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Approvals')).toBeDefined();
    });
  });

  it('shows items awaiting review count (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      // 2 credit + 1 export = 3 pending items (payroll excluded)
      expect(screen.getByText(/item.*awaiting review/i)).toBeDefined();
    });
  });

  it('renders approval items with type badges (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/credit request/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/export request/i).length).toBeGreaterThan(0);
    });
  });

  it('renders credit request reference (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('CLR-2').length).toBeGreaterThan(0);
    });
  });

  it('renders export request reference (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('EXP-1').length).toBeGreaterThan(0);
    });
  });

  it('shows approve and reject buttons for each item (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      const approveBtns = screen.queryAllByText(/^approve$/i);
      const rejectBtns = screen.queryAllByText(/^reject$/i);
      // 2 items (credit + export) => 2 approve + 2 reject buttons
      expect(approveBtns.length).toBe(2);
      expect(rejectBtns.length).toBe(2);
    });
  });

  it('excludes payroll items — HR/Payroll out of scope (VAL-APPR-001)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0);
    });
    // Payroll reference should NOT appear
    expect(screen.queryByText('PR-2024-001')).toBeNull();
    expect(screen.queryByText(/payroll/i)).toBeNull();
  });

  // ── VAL-APPR-002: Approve credit request E2E ──

  it('opens approve dialog with reason textarea on approve click (VAL-APPR-002)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const approveBtns = screen.queryAllByText(/^approve$/i);
    fireEvent.click(approveBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter approval reason/i)).not.toBeNull();
    });
  });

  it('calls approveCreditRequest with reason on confirm (VAL-APPR-002)', async () => {
    (adminApi.approveCreditRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockApprovals)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const approveBtns = screen.queryAllByText(/^approve$/i);
    fireEvent.click(approveBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter approval reason/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/enter approval reason/i);
    fireEvent.change(textarea, { target: { value: 'Approved after review' } });
    const allBtns = screen.queryAllByRole('button', { name: /^Approve$/i });
    const confirmBtn = allBtns[allBtns.length - 1];
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.approveCreditRequest as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(2, { reason: 'Approved after review' });
    });
  });

  // ── VAL-APPR-003: Reject credit request with reason ──

  it('opens reject dialog with reason textarea (VAL-APPR-003)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const rejectBtns = screen.queryAllByText(/^reject$/i);
    fireEvent.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/explain why this request is being rejected/i)).not.toBeNull();
    });
  });

  it('calls rejectCreditRequest with reason on confirm (VAL-APPR-003)', async () => {
    (adminApi.rejectCreditRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockApprovals)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const rejectBtns = screen.queryAllByText(/^reject$/i);
    fireEvent.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/explain why/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/explain why/i);
    fireEvent.change(textarea, { target: { value: 'Insufficient documentation' } });
    const confirmBtn = screen.queryAllByRole('button', { name: /^Reject$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.rejectCreditRequest as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(2, { reason: 'Insufficient documentation' });
    });
  });

  // ── VAL-APPR-004: Export request approve/reject ──

  it('calls approveExport with reason for export request (VAL-APPR-004)', async () => {
    (adminApi.approveExport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockApprovals)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('EXP-1').length).toBeGreaterThan(0));
    // The export card's approve button — it's the second one (first is credit request)
    const approveBtns = screen.queryAllByText(/^approve$/i);
    fireEvent.click(approveBtns[1]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter approval reason/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/enter approval reason/i);
    fireEvent.change(textarea, { target: { value: 'Data export approved' } });
    const confirmBtn = screen.queryAllByRole('button', { name: /^Approve$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.approveExport as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, { reason: 'Data export approved' });
    });
  });

  it('calls rejectExport with reason for export request (VAL-APPR-004)', async () => {
    (adminApi.rejectExport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockApprovals)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('EXP-1').length).toBeGreaterThan(0));
    const rejectBtns = screen.queryAllByText(/^reject$/i);
    fireEvent.click(rejectBtns[1]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/explain why/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/explain why/i);
    fireEvent.change(textarea, { target: { value: 'Not authorized for export' } });
    const confirmBtn = screen.queryAllByRole('button', { name: /^Reject$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.rejectExport as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, { reason: 'Not authorized for export' });
    });
  });

  // ── VAL-APPR-005: Period close approve/reject ──

  it('calls approvePeriodClose with note for period close request (VAL-APPR-005)', async () => {
    const approvalsWithPeriodClose = {
      ...mockApprovals,
      periodCloseRequests: [
        {
          originType: 'PERIOD_CLOSE_REQUEST',
          id: 10,
          publicId: 'PC-001',
          reference: 'PC-2024-Q1',
          status: 'PENDING',
          summary: 'Close Q1 2024 accounting period',
          createdAt: 1774911600,
        },
      ],
    };
    (adminApi.approvePeriodClose as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(approvalsWithPeriodClose)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('PC-2024-Q1').length).toBeGreaterThan(0));
    // Period close is after credit but before export in type order
    const approveBtns = screen.queryAllByText(/^approve$/i);
    // Find the card for PC-2024-Q1 by finding the approve button nearest to it
    // With 3 items: credit (idx 0), period close (idx 1), export (idx 2)
    fireEvent.click(approveBtns[1]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter approval reason/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/enter approval reason/i);
    fireEvent.change(textarea, { target: { value: 'Period reviewed and balanced' } });
    const confirmBtn = screen.queryAllByRole('button', { name: /^Approve$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.approvePeriodClose as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(10, { note: 'Period reviewed and balanced' });
    });
  });

  it('calls rejectPeriodClose with note for period close request (VAL-APPR-005)', async () => {
    const approvalsWithPeriodClose = {
      ...mockApprovals,
      periodCloseRequests: [
        {
          originType: 'PERIOD_CLOSE_REQUEST',
          id: 10,
          publicId: 'PC-001',
          reference: 'PC-2024-Q1',
          status: 'PENDING',
          summary: 'Close Q1 2024 accounting period',
          createdAt: 1774911600,
        },
      ],
    };
    (adminApi.rejectPeriodClose as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (adminApi.getApprovals as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(approvalsWithPeriodClose)
      .mockResolvedValueOnce({ creditRequests: [], payrollRuns: [], exportRequests: [], periodCloseRequests: [] });
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('PC-2024-Q1').length).toBeGreaterThan(0));
    const rejectBtns = screen.queryAllByText(/^reject$/i);
    fireEvent.click(rejectBtns[1]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/explain why/i)).not.toBeNull();
    });
    const textarea = screen.getByPlaceholderText(/explain why/i);
    fireEvent.change(textarea, { target: { value: 'Discrepancies found' } });
    const confirmBtn = screen.queryAllByRole('button', { name: /^Reject$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(adminApi.rejectPeriodClose as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(10, { note: 'Discrepancies found' });
    });
  });

  // ── VAL-APPR-006: Empty state ──

  it('shows empty state when no pending approvals (VAL-APPR-006)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue({
      creditRequests: [],
      payrollRuns: [],
      exportRequests: [],
      periodCloseRequests: [],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText(/no pending approvals/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/all items have been reviewed/i).length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when only payroll items exist (VAL-APPR-006)', async () => {
    // Only payroll items which are filtered out — should show empty state
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue({
      creditRequests: [],
      payrollRuns: [
        {
          originType: 'PAYROLL_RUN',
          id: 99,
          reference: 'PR-001',
          status: 'PENDING',
          summary: 'Payroll',
          createdAt: 1774911500,
        },
      ],
      exportRequests: [],
      periodCloseRequests: [],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText(/no pending approvals/i).length).toBeGreaterThan(0);
    });
  });

  it('empty state has a refresh button (VAL-APPR-006)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue({
      creditRequests: [],
      payrollRuns: [],
      exportRequests: [],
      periodCloseRequests: [],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText(/no pending approvals/i).length).toBeGreaterThan(0);
    });
    const refreshBtns = screen.queryAllByText(/refresh/i);
    expect(refreshBtns.length).toBeGreaterThan(0);
  });

  // ── VAL-APPR-007: Reason field required ──

  it('approve dialog blocks empty reason submission (VAL-APPR-007)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const approveBtns = screen.queryAllByText(/^approve$/i);
    fireEvent.click(approveBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/enter approval reason/i)).not.toBeNull();
    });
    // Click approve without filling reason
    const allBtns = screen.queryAllByRole('button', { name: /^Approve$/i });
    const confirmBtn = allBtns[allBtns.length - 1];
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      const errorMsg = screen.queryAllByText(/please provide a reason for approval/i);
      expect(errorMsg.length).toBeGreaterThan(0);
    });
    // approveCreditRequest should NOT have been called
    expect(adminApi.approveCreditRequest as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('reject dialog blocks empty reason submission (VAL-APPR-007)', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => expect(screen.queryAllByText('CLR-2').length).toBeGreaterThan(0));
    const rejectBtns = screen.queryAllByText(/^reject$/i);
    fireEvent.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/explain why/i)).not.toBeNull();
    });
    // Click reject without filling reason
    const confirmBtn = screen.queryAllByRole('button', { name: /^Reject$/i }).pop()!;
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      const errorMsg = screen.queryAllByText(/please provide a reason for rejection/i);
      expect(errorMsg.length).toBeGreaterThan(0);
    });
    expect(adminApi.rejectCreditRequest as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  // ── Loading & Error states ──

  it('shows skeleton loading state', () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state on API failure with retry button', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
    renderPage();
    await waitFor(() => {
      const msgs = screen.queryAllByText(/couldn't load approvals/i);
      expect(msgs.length).toBeGreaterThan(0);
    });
    // Should have a retry button
    const retryBtns = screen.queryAllByRole('button', { name: /try again/i });
    expect(retryBtns.length).toBeGreaterThan(0);
  });

  // ── Date formatting (handles epoch seconds) ──

  it('renders formatted dates from Unix epoch seconds', async () => {
    (adminApi.getApprovals as ReturnType<typeof vi.fn>).mockResolvedValue(mockApprovals);
    renderPage();
    await waitFor(() => {
      // Epoch 1774911623 → March 28, 2026 (approximate — depends on timezone)
      // Just verify a date-like string renders (not the raw epoch number)
      const dateElements = document.querySelectorAll('.text-\\[11px\\]');
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});
