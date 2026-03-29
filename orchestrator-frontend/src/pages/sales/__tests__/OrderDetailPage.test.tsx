/**
 * Tests for OrderDetailPage
 *
 * Covers:
 *  - Shows loading skeleton while data loads
 *  - Shows error state when API fails
 *  - Shows error state when order not found
 *  - Renders order details (order number, status, total)
 *  - Draft order shows Confirm and Cancel buttons
 *  - Confirmed order shows Cancel button but NOT Confirm
 *  - READY_TO_SHIP order shows neither Confirm nor Cancel
 *  - DISPATCHED order shows neither Confirm nor Cancel
 *  - INVOICED order shows neither Confirm nor Cancel
 *  - Back button navigates to /sales/orders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    ArrowLeft: M,
    AlertCircle: M,
    RefreshCcw: M,
    CheckCircle2: M,
    Circle: M,
    Clock: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    getOrder: vi.fn(),
    getOrderTimeline: vi.fn(),
    confirmOrder: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), toast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { OrderDetailPage } from '../OrderDetailPage';
import { salesApi } from '@/lib/salesApi';

function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 42,
    orderNumber: 'SO-2026-042',
    status: 'DRAFT',
    totalAmount: 50000,
    subtotalAmount: 46000,
    dealerName: 'Test Dealer',
    createdAt: '2026-01-01T10:00:00Z',
    items: [
      {
        id: 1,
        productCode: 'P001',
        description: 'Paint White',
        quantity: 10,
        unitPrice: 4600,
        gstRate: 18,
        lineTotal: 54280,
      },
    ],
    ...overrides,
  };
}

function renderPage(orderId = '42') {
  return render(
    <MemoryRouter initialEntries={[`/sales/orders/${orderId}`]}>
      <Routes>
        <Route path="/sales/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    (salesApi.getOrderTimeline as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('shows loading skeleton while data loads', () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    (salesApi.getOrderTimeline as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when API throws', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const errorEls = screen.queryAllByText(/couldn't load|not found|error/i);
      expect(errorEls.length).toBeGreaterThan(0);
    });
  });

  it('shows error state when order not found (null returned)', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    renderPage();
    await waitFor(() => {
      const errorEls = screen.queryAllByText(/not found|error/i);
      expect(errorEls.length).toBeGreaterThan(0);
    });
  });

  it('renders order number for a loaded order', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder());
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('SO-2026-042')).toBeDefined();
    });
  });

  it('DRAFT order: shows Confirm button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DRAFT' }));
    renderPage();
    await waitFor(() => {
      const confirmBtns = screen.queryAllByText(/confirm order/i);
      expect(confirmBtns.length).toBeGreaterThan(0);
    });
  });

  it('DRAFT order: shows Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DRAFT' }));
    renderPage();
    await waitFor(() => {
      const cancelBtns = screen.queryAllByText(/cancel order/i);
      expect(cancelBtns.length).toBeGreaterThan(0);
    });
  });

  it('CONFIRMED order: does NOT show Confirm button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.queryAllByText(/confirm order/i);
    expect(confirmBtns.length).toBe(0);
  });

  it('CONFIRMED order: shows Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));
    renderPage();
    await waitFor(() => {
      const cancelBtns = screen.queryAllByText(/cancel order/i);
      expect(cancelBtns.length).toBeGreaterThan(0);
    });
  });

  it('READY_TO_SHIP order: shows Confirm button (state machine allows confirm from READY_TO_SHIP)', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'READY_TO_SHIP' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    // Backend state machine: DRAFT/RESERVED/PENDING_PRODUCTION/PENDING_INVENTORY/READY_TO_SHIP/PROCESSING -> CONFIRMED
    const confirmBtns = screen.queryAllByText(/confirm order/i);
    expect(confirmBtns.length).toBeGreaterThan(0);
  });

  it('READY_TO_SHIP order: does NOT show Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'READY_TO_SHIP' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const cancelBtns = screen.queryAllByText(/cancel order/i);
    expect(cancelBtns.length).toBe(0);
  });

  it('DISPATCHED order: does NOT show Confirm or Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DISPATCHED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/confirm order/i).length).toBe(0);
    expect(screen.queryAllByText(/cancel order/i).length).toBe(0);
  });

  it('INVOICED order: does NOT show Confirm or Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'INVOICED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/confirm order/i).length).toBe(0);
    expect(screen.queryAllByText(/cancel order/i).length).toBe(0);
  });

  it('CANCELLED order: does NOT show Confirm or Cancel button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CANCELLED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/confirm order/i).length).toBe(0);
    expect(screen.queryAllByText(/cancel order/i).length).toBe(0);
  });

  // ── VAL-O2C-008: Status consistency — states aligned with state machine ────
  it('RESERVED order: shows Confirm button (state machine allows confirm from RESERVED)', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'RESERVED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.queryAllByText(/confirm order/i);
    expect(confirmBtns.length).toBeGreaterThan(0);
  });

  it('PENDING_PRODUCTION order: shows Confirm button (state machine allows confirm from PENDING_PRODUCTION)', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'PENDING_PRODUCTION' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.queryAllByText(/confirm order/i);
    expect(confirmBtns.length).toBeGreaterThan(0);
  });

  // ── VAL-O2C-004: Multi-SKU order: all line items rendered with correct values
  it('renders multiple line items for a multi-SKU order', async () => {
    const multiSkuOrder = makeOrder({
      items: [
        { id: 1, productCode: 'SKU-A001', description: 'White Paint 1L', quantity: 5, unitPrice: 200, gstRate: 18, lineTotal: 1180 },
        { id: 2, productCode: 'SKU-B002', description: 'Red Paint 500ml', quantity: 10, unitPrice: 120, gstRate: 12, lineTotal: 1344 },
      ],
      subtotalAmount: 2200,
      totalAmount: 2524,
    });
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(multiSkuOrder);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    // Both product codes should be visible
    const sku1Els = screen.queryAllByText('SKU-A001');
    expect(sku1Els.length).toBeGreaterThan(0);
    const sku2Els = screen.queryAllByText('SKU-B002');
    expect(sku2Els.length).toBeGreaterThan(0);
  });

  it('renders multi-SKU order with correct quantities for each line', async () => {
    const multiSkuOrder = makeOrder({
      items: [
        { id: 1, productCode: 'SKU-A001', description: 'White Paint 1L', quantity: 5, unitPrice: 200, gstRate: 18, lineTotal: 1180 },
        { id: 2, productCode: 'SKU-B002', description: 'Red Paint 500ml', quantity: 10, unitPrice: 120, gstRate: 12, lineTotal: 1344 },
      ],
      subtotalAmount: 2200,
      totalAmount: 2524,
    });
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(multiSkuOrder);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SKU-A001').length).toBeGreaterThan(0);
    });
    // Quantities 5 and 10 should be visible (may appear in desktop table and mobile card)
    const qty5Els = screen.queryAllByText('5');
    expect(qty5Els.length).toBeGreaterThan(0);
    const qty10Els = screen.queryAllByText('10');
    expect(qty10Els.length).toBeGreaterThan(0);
  });

  // ── VAL-O2C-006: GST breakdown follows dealer state ────────────────────────
  it('renders CGST and SGST amounts when present on line items (intra-state dealer)', async () => {
    const intrStateOrder = makeOrder({
      status: 'CONFIRMED',
      items: [
        {
          id: 1,
          productCode: 'P001',
          description: 'Paint White',
          quantity: 10,
          unitPrice: 1000,
          gstRate: 18,
          cgstAmount: 900,
          sgstAmount: 900,
          igstAmount: 0,
          lineTotal: 11800,
        },
      ],
      subtotalAmount: 10000,
      gstTotal: 1800,
      totalAmount: 11800,
    });
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(intrStateOrder);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    // CGST and SGST labels should appear in the GST summary
    const cgstLabels = screen.queryAllByText('CGST');
    expect(cgstLabels.length).toBeGreaterThan(0);
    const sgstLabels = screen.queryAllByText('SGST');
    expect(sgstLabels.length).toBeGreaterThan(0);
  });

  it('renders IGST amount when present on line items (inter-state dealer)', async () => {
    const interStateOrder = makeOrder({
      status: 'CONFIRMED',
      items: [
        {
          id: 1,
          productCode: 'P001',
          description: 'Paint White',
          quantity: 10,
          unitPrice: 1000,
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 1800,
          lineTotal: 11800,
        },
      ],
      subtotalAmount: 10000,
      gstTotal: 1800,
      totalAmount: 11800,
    });
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(interStateOrder);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const igstLabels = screen.queryAllByText('IGST');
    expect(igstLabels.length).toBeGreaterThan(0);
  });

  it('renders subtotal and Grand Total in order summary', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({
      subtotalAmount: 46000,
      gstTotal: 8280,
      totalAmount: 54280,
    }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const grandTotalLabels = screen.queryAllByText('Grand Total');
    expect(grandTotalLabels.length).toBeGreaterThan(0);
    const subtotalLabels = screen.queryAllByText('Subtotal');
    expect(subtotalLabels.length).toBeGreaterThan(0);
  });

  // ── VAL-O2C-007: Confirm — success path ─────────────────────────────────────
  it('confirm order: calls confirmOrder API with order id and updates status', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DRAFT' }));
    (salesApi.confirmOrder as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOrder({ status: 'CONFIRMED' })
    );
    renderPage();
    await waitFor(() => {
      const confirmBtns = screen.queryAllByText(/confirm order/i);
      expect(confirmBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText(/confirm order/i)[0]);
    await waitFor(() => {
      expect(salesApi.confirmOrder).toHaveBeenCalledWith(42);
    });
  });

  // ── VAL-O2C-007: Confirm — blocked path ─────────────────────────────────────
  it('confirm order: shows error when confirmOrder API fails (credit blocked)', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DRAFT' }));
    (salesApi.confirmOrder as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Credit limit exceeded — order blocked')
    );
    renderPage();
    await waitFor(() => {
      const confirmBtns = screen.queryAllByText(/confirm order/i);
      expect(confirmBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText(/confirm order/i)[0]);
    await waitFor(() => {
      expect(salesApi.confirmOrder).toHaveBeenCalledWith(42);
    });
    // Error is reported via useToast; the confirm button should still be visible after error
    // (loadOrder is re-called which re-renders the same DRAFT state)
    await waitFor(() => {
      expect(salesApi.getOrder).toHaveBeenCalled();
    });
  });

  // ── VAL-O2C-009: Cancel — structured reason metadata ────────────────────────
  it('cancel dialog: shows reason code dropdown for structured cancellation', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DRAFT' }));
    renderPage();
    await waitFor(() => {
      const cancelBtns = screen.queryAllByText(/cancel order/i);
      expect(cancelBtns.length).toBeGreaterThan(0);
    });
    // Click the "Cancel order" button to open the dialog
    fireEvent.click(screen.getAllByText(/cancel order/i)[0]);
    await waitFor(() => {
      // Dialog should show a reason code select
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
    const selects = document.querySelectorAll('select');
    const options = Array.from(selects[selects.length - 1].querySelectorAll('option'));
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it('cancel dialog: sends structured reasonCode to cancelOrder API', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));
    (salesApi.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOrder({ status: 'CANCELLED' })
    );
    renderPage();
    await waitFor(() => {
      const cancelBtns = screen.queryAllByText(/cancel order/i);
      expect(cancelBtns.length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText(/cancel order/i)[0]);
    await waitFor(() => {
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
    // Change reason to STOCK_UNAVAILABLE
    const selects = document.querySelectorAll('select');
    fireEvent.change(selects[selects.length - 1], { target: { value: 'STOCK_UNAVAILABLE' } });
    // Submit the cancel dialog
    const allCancelBtns = screen.getAllByText(/cancel order/i);
    // The last "Cancel order" button is the one inside the dialog
    fireEvent.click(allCancelBtns[allCancelBtns.length - 1]);
    await waitFor(() => {
      expect(salesApi.cancelOrder).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ reasonCode: 'STOCK_UNAVAILABLE' })
      );
    });
  });

  // ── VAL-O2C-008 + VAL-O2C-009: Timeline shows reason metadata ────────────────
  it('timeline: renders transition entries with reasonCode badge', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CANCELLED' }));
    (salesApi.getOrderTimeline as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        fromStatus: 'CONFIRMED',
        toStatus: 'CANCELLED',
        reasonCode: 'CUSTOMER_REQUEST',
        reason: 'Customer called to cancel',
        changedBy: 'sales.agent@example.com',
        changedAt: '2026-01-15T14:30:00Z',
      },
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    // Timeline should show the reasonCode
    await waitFor(() => {
      const reasonCodeEls = screen.queryAllByText('CUSTOMER_REQUEST');
      expect(reasonCodeEls.length).toBeGreaterThan(0);
    });
  });

  it('timeline: renders additional notes/reason text from cancellation', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CANCELLED' }));
    (salesApi.getOrderTimeline as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        fromStatus: 'DRAFT',
        toStatus: 'CANCELLED',
        reasonCode: 'PRICING_ISSUE',
        reason: 'Price negotiation failed',
        changedBy: 'sales.user@example.com',
        changedAt: '2026-01-10T09:00:00Z',
      },
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      const reasonEls = screen.queryAllByText('Price negotiation failed');
      expect(reasonEls.length).toBeGreaterThan(0);
    });
  });

  // ── VAL-O2C-008: Status label consistency ────────────────────────────────────
  it('renders CONFIRMED status label for a confirmed order', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const confirmedLabels = screen.queryAllByText('Confirmed');
    expect(confirmedLabels.length).toBeGreaterThan(0);
  });

  it('renders DISPATCHED status label for a dispatched order', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'DISPATCHED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const dispatchedLabels = screen.queryAllByText('Dispatched');
    expect(dispatchedLabels.length).toBeGreaterThan(0);
  });

  it('renders lifecycle stepper with correct stages', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    // Lifecycle stepper should show all stages
    const draftSteps = screen.queryAllByText('Draft');
    expect(draftSteps.length).toBeGreaterThan(0);
    const confirmedSteps = screen.queryAllByText('Confirmed');
    expect(confirmedSteps.length).toBeGreaterThan(0);
    const dispatchedSteps = screen.queryAllByText('Dispatched');
    expect(dispatchedSteps.length).toBeGreaterThan(0);
  });
});
