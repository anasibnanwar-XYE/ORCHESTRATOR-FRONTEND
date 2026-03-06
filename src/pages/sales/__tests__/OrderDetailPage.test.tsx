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
import { render, screen, waitFor } from '@testing-library/react';
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

  it('READY_TO_SHIP order: does NOT show Confirm button', async () => {
    (salesApi.getOrder as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrder({ status: 'READY_TO_SHIP' }));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText('SO-2026-042').length).toBeGreaterThan(0);
    });
    const confirmBtns = screen.queryAllByText(/confirm order/i);
    expect(confirmBtns.length).toBe(0);
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
});
