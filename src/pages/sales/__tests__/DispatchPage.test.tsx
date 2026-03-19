/**
 * Tests for DispatchPage
 *
 * Covers:
 *   - Page renders with heading
 *   - Shows confirmed orders in dispatch queue
 *   - Shows loading skeleton
 *   - Shows error state with retry
 *   - Shows empty state when no pending dispatches
 *   - Confirm Dispatch button is present
 *   - Reconcile markers button is present
 *   - Dispatch result shows finalInvoiceId and GST breakdown (VAL-O2C-010)
 *   - Partial or zero-shipment outcomes are shown clearly (VAL-O2C-010)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M,
    Truck: M, CheckCircle: M, ChevronDown: M, Eye: M, PackageX: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    searchOrders: vi.fn(),
    confirmDispatch: vi.fn(),
    reconcileOrderMarkers: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div className={`animate-pulse ${className ?? ''}`} data-testid="skeleton" />
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div data-testid="confirm-dialog">{title}</div> : null,
}));

import { DispatchPage } from '../DispatchPage';
import { salesApi } from '@/lib/salesApi';

const mockConfirmedOrders = {
  content: [
    {
      id: 101,
      orderNumber: 'ORD-2026-0101',
      status: 'CONFIRMED',
      dealerName: 'Raj Paints',
      totalAmount: 250000,
      createdAt: '2026-03-01T10:00:00Z',
      items: [
        { id: 1, productCode: 'PAINT-001', quantity: 10, unitPrice: 25000 },
      ],
    },
    {
      id: 102,
      orderNumber: 'ORD-2026-0102',
      status: 'CONFIRMED',
      dealerName: 'Metro Distributors',
      totalAmount: 150000,
      createdAt: '2026-03-02T10:00:00Z',
      items: [
        { id: 2, productCode: 'PAINT-002', quantity: 5, unitPrice: 30000 },
      ],
    },
  ],
  totalElements: 2,
  totalPages: 1,
  page: 0,
  size: 20,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sales/dispatch']}>
      <DispatchPage />
    </MemoryRouter>
  );
}

describe('DispatchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Dispatch"', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Dispatch')).toBeDefined();
    });
  });

  it('shows loading skeletons while data loads', () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders order numbers in the table', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('ORD-2026-0101').length).toBeGreaterThan(0);
    });
  });

  it('renders dealer names in the table', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Raj Paints').length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry on API failure', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const retries = screen.queryAllByText(/retry/i);
      const errors = screen.queryAllByText(/unable to load|error/i);
      expect(retries.length > 0 || errors.length > 0).toBe(true);
    });
  });

  it('shows empty state when no pending dispatches', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 20,
    });
    renderPage();
    await waitFor(() => {
      const empties = screen.queryAllByText(/no orders/i);
      expect(empties.length).toBeGreaterThan(0);
    });
  });

  it('renders "Confirm Dispatch" action button', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    renderPage();
    await waitFor(() => {
      const btns = screen.queryAllByText(/confirm dispatch/i);
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  it('renders "Reconcile Markers" button', async () => {
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    renderPage();
    await waitFor(() => {
      const btns = screen.queryAllByText(/reconcile/i);
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  // ── VAL-O2C-010: dispatch outcomes and GST breakdown ─────────────────────

  it('shows finalInvoiceId reference after successful dispatch confirm', async () => {
    const user = userEvent.setup();
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    (salesApi.confirmDispatch as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesOrderId: 101,
      packingSlipId: 201,
      dispatched: true,
      finalInvoiceId: 301,
      gstBreakdown: null,
    });
    renderPage();
    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('ORD-2026-0101').length).toBeGreaterThan(0);
    });
    // Open dispatch modal by clicking the first button role
    const confirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(confirmBtns[0]);
    // Wait for modal form to open - Cancel button becomes visible
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^cancel$/i }).length).toBeGreaterThan(0);
    });
    // Click Confirm Dispatch button inside the modal form (last one)
    const allConfirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(allConfirmBtns[allConfirmBtns.length - 1]);
    // Wait for API to be called
    await waitFor(() => {
      expect(salesApi.confirmDispatch).toHaveBeenCalled();
    });
    // Verify the invoice reference appears in the result
    await waitFor(() => {
      const refs = screen.queryAllByText(/invoice.*#?301|#?301.*generated/i);
      expect(refs.length).toBeGreaterThan(0);
    });
  });

  it('shows GST breakdown in dispatch result when gstBreakdown is present', async () => {
    const user = userEvent.setup();
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    (salesApi.confirmDispatch as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesOrderId: 101,
      packingSlipId: 201,
      dispatched: true,
      finalInvoiceId: 301,
      gstBreakdown: {
        taxableAmount: 100000,
        cgst: 9000,
        sgst: 9000,
        igst: 0,
        totalTax: 18000,
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('ORD-2026-0101').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(confirmBtns[0]);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^cancel$/i }).length).toBeGreaterThan(0);
    });
    const allConfirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(allConfirmBtns[allConfirmBtns.length - 1]);
    await waitFor(() => {
      expect(salesApi.confirmDispatch).toHaveBeenCalled();
    });
    // GST breakdown section should be visible in the result
    await waitFor(() => {
      expect(screen.queryAllByText(/gst breakdown/i).length).toBeGreaterThan(0);
    });
  });

  it('shows partial or zero-shipment outcome when dispatched is false', async () => {
    const user = userEvent.setup();
    (salesApi.searchOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfirmedOrders);
    (salesApi.confirmDispatch as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesOrderId: 101,
      packingSlipId: 201,
      dispatched: false,
      finalInvoiceId: null,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('ORD-2026-0101').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(confirmBtns[0]);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^cancel$/i }).length).toBeGreaterThan(0);
    });
    const allConfirmBtns = screen.getAllByRole('button', { name: /confirm dispatch/i });
    await user.click(allConfirmBtns[allConfirmBtns.length - 1]);
    await waitFor(() => {
      expect(salesApi.confirmDispatch).toHaveBeenCalled();
    });
    // Partial/zero-shipment outcome message should appear
    await waitFor(() => {
      const partials = screen.queryAllByText(/partial or zero shipment/i);
      expect(partials.length).toBeGreaterThan(0);
    });
  });
});
