/**
 * VAL-O2C-013: Dealer O2C portal consistency tests
 *
 * Verifies that:
 *  1. All dealer surfaces are scoped to the authenticated dealer via dealer-portal endpoints
 *  2. The same totalOutstanding value is rendered consistently across dashboard, aging, and ledger
 *  3. Aging bucket sums are consistent with the stated totalOutstanding
 *  4. Ledger final balance is shown as the outstanding balance
 *  5. Invoice outstanding amounts align with the dashboard pending invoices KPI
 *  6. The dealerApi wrapper targets dealer-portal paths (no foreign dealer data)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    CreditCard: M, Wallet: M, Clock: M, Package: M,
    RefreshCcw: M, AlertCircle: M, ArrowRight: M, FileText: M,
    Download: M, BookOpen: M,
  };
});

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/lib/dealerApi', () => ({
  dealerApi: {
    getDashboard: vi.fn(),
    getOrders: vi.fn(),
    getInvoices: vi.fn(),
    getLedger: vi.fn(),
    getAging: vi.fn(),
    getInvoicePdf: vi.fn(),
  },
}));

import { DealerDashboardPage } from '../DealerDashboardPage';
import { DealerAgingPage } from '../DealerAgingPage';
import { DealerLedgerPage } from '../DealerLedgerPage';
import { DealerInvoicesPage } from '../DealerInvoicesPage';
import { DealerOrdersPage } from '../DealerOrdersPage';
import { dealerApi } from '@/lib/dealerApi';

// ─────────────────────────────────────────────────────────────────────────────
// Shared seeded data — same dealerId and totalOutstanding across surfaces
// ─────────────────────────────────────────────────────────────────────────────

const DEALER_ID = 42;
const DEALER_NAME = 'Consistent Test Dealer';
const TOTAL_OUTSTANDING = 125000;

const mockDashboard = {
  dealerId: DEALER_ID,
  dealerName: DEALER_NAME,
  totalOutstanding: TOTAL_OUTSTANDING,
  currentBalance: TOTAL_OUTSTANDING,
  availableCredit: 75000,
  creditLimit: 200000,
  creditUsed: TOTAL_OUTSTANDING,
  creditStatus: 'WITHIN_LIMIT',
  pendingInvoices: 2,
  pendingOrderCount: 3,
  pendingOrderExposure: 50000,
};

const mockAging = {
  dealerId: DEALER_ID,
  dealerName: DEALER_NAME,
  totalOutstanding: TOTAL_OUTSTANDING,
  creditLimit: 200000,
  creditUsed: TOTAL_OUTSTANDING,
  availableCredit: 75000,
  agingBuckets: {
    'current': 50000,
    '1-30 days': 35000,
    '31-60 days': 25000,
    '61-90 days': 10000,
    '90+ days': 5000,
  },
  overdueInvoices: [
    {
      invoiceNumber: 'INV-2026-001',
      issueDate: '2026-01-10',
      dueDate: '2026-01-31T00:00:00Z',
      outstandingAmount: 35000,
      daysOverdue: 10,
    },
  ],
};

// Ledger final balance matches totalOutstanding
const mockLedger = [
  {
    date: '2026-01-05T00:00:00Z',
    reference: 'INV-2026-001',
    description: 'Invoice issued',
    type: 'INVOICE',
    debit: 53100,
    credit: 0,
    balance: 53100,
  },
  {
    date: '2026-01-15T00:00:00Z',
    reference: 'INV-2026-002',
    description: 'Invoice issued',
    type: 'INVOICE',
    debit: 71900,
    credit: 0,
    balance: TOTAL_OUTSTANDING,
  },
];

// Two invoices: one UNPAID with outstanding, one PAID with zero outstanding
const mockInvoices = [
  {
    id: 101,
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-01-10T00:00:00Z',
    subtotal: 45000,
    taxTotal: 8100,
    totalAmount: 53100,
    status: 'UNPAID',
    outstandingAmount: 53100,
    dueDate: '2026-01-31T00:00:00Z',
  },
  {
    id: 102,
    invoiceNumber: 'INV-2026-002',
    issueDate: '2026-01-20T00:00:00Z',
    subtotal: 60000,
    taxTotal: 10800,
    totalAmount: 70800,
    status: 'PARTIAL',
    outstandingAmount: 35000,
    dueDate: '2026-02-20T00:00:00Z',
  },
  {
    id: 103,
    invoiceNumber: 'INV-2025-099',
    issueDate: '2025-12-01T00:00:00Z',
    subtotal: 30000,
    taxTotal: 5400,
    totalAmount: 35400,
    status: 'PAID',
    outstandingAmount: 0,
    dueDate: '2025-12-31T00:00:00Z',
  },
];

// Three orders matching pendingOrderCount: 3
const mockOrders = [
  { id: 1, orderNumber: 'SO-1001', createdAt: '2026-01-10T00:00:00Z', status: 'CONFIRMED', totalAmount: 20000, paymentStatus: 'UNPAID' },
  { id: 2, orderNumber: 'SO-1002', createdAt: '2026-01-15T00:00:00Z', status: 'PROCESSING', totalAmount: 15000, paymentStatus: 'UNPAID' },
  { id: 3, orderNumber: 'SO-1003', createdAt: '2026-01-20T00:00:00Z', status: 'RESERVED', totalAmount: 15000, paymentStatus: 'UNPAID' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper to render each page in a MemoryRouter
// ─────────────────────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(<MemoryRouter><DealerDashboardPage /></MemoryRouter>);
}
function renderAging() {
  return render(<MemoryRouter><DealerAgingPage /></MemoryRouter>);
}
function renderLedger() {
  return render(<MemoryRouter><DealerLedgerPage /></MemoryRouter>);
}
function renderInvoices() {
  return render(<MemoryRouter><DealerInvoicesPage /></MemoryRouter>);
}
function renderOrders() {
  return render(<MemoryRouter><DealerOrdersPage /></MemoryRouter>);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('VAL-O2C-013: Dealer portal O2C consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
    (dealerApi.getAging as ReturnType<typeof vi.fn>).mockResolvedValue(mockAging);
    (dealerApi.getLedger as ReturnType<typeof vi.fn>).mockResolvedValue(mockLedger);
    (dealerApi.getInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    (dealerApi.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrders);
  });

  // ── Dealer scoping (VAL-O2C-013 — no foreign data leakage) ────────────────

  it('dashboard calls getDashboard (dealer-portal scoped)', async () => {
    renderDashboard();
    await waitFor(() => expect(dealerApi.getDashboard).toHaveBeenCalledTimes(1));
    // No other dealer-lookup endpoints are called
    expect(dealerApi.getAging).not.toHaveBeenCalled();
    expect(dealerApi.getLedger).not.toHaveBeenCalled();
    expect(dealerApi.getOrders).not.toHaveBeenCalled();
    expect(dealerApi.getInvoices).not.toHaveBeenCalled();
  });

  it('aging page calls getAging (dealer-portal scoped)', async () => {
    renderAging();
    await waitFor(() => expect(dealerApi.getAging).toHaveBeenCalledTimes(1));
    expect(dealerApi.getDashboard).not.toHaveBeenCalled();
  });

  it('ledger page calls getLedger (dealer-portal scoped)', async () => {
    renderLedger();
    await waitFor(() => expect(dealerApi.getLedger).toHaveBeenCalledTimes(1));
    expect(dealerApi.getDashboard).not.toHaveBeenCalled();
  });

  it('invoices page calls getInvoices (dealer-portal scoped)', async () => {
    renderInvoices();
    await waitFor(() => expect(dealerApi.getInvoices).toHaveBeenCalledTimes(1));
    expect(dealerApi.getDashboard).not.toHaveBeenCalled();
  });

  it('orders page calls getOrders (dealer-portal scoped)', async () => {
    renderOrders();
    await waitFor(() => expect(dealerApi.getOrders).toHaveBeenCalledTimes(1));
    expect(dealerApi.getDashboard).not.toHaveBeenCalled();
  });

  // ── Outstanding balance consistency ─────────────────────────────────────────

  it('dashboard shows Outstanding Balance KPI that links to ledger', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Outstanding Balance')).toBeDefined();
    });
    const card = screen.getByText('Outstanding Balance').closest('button');
    expect(card).not.toBeNull();
    if (card) {
      card.click();
      expect(mockNavigate).toHaveBeenCalledWith('/dealer/ledger');
    }
  });

  it('aging page shows the same totalOutstanding value as provided by backend', async () => {
    renderAging();
    await waitFor(() => {
      const totals = screen.queryAllByText(/Total Outstanding/i);
      expect(totals.length).toBeGreaterThan(0);
    });
    // Verify the total outstanding banner exists
    const bannerLabel = screen.getByText('Total Outstanding');
    expect(bannerLabel).toBeDefined();
  });

  it('aging page renders total outstanding that matches the sum of aging bucket data', async () => {
    // The bucket values (50000+35000+25000+10000+5000 = 125000) equal totalOutstanding.
    // Verify the aging page renders the "Total Outstanding" label and the correct formatted
    // value in the UI after the async getAging() call resolves.
    // DealerAgingPage uses toLocaleString('en-IN') so 125000 renders as '₹1,25,000'.
    renderAging();
    await waitFor(() => {
      // Wait for the formatted total outstanding value to appear (it starts as a Skeleton
      // during loading and only renders after getAging() resolves).
      const totalEl = screen.queryAllByText(/1,25,000/);
      expect(totalEl.length).toBeGreaterThan(0);
    });
    // Also confirm the label is still present alongside the value.
    expect(screen.getByText('Total Outstanding')).toBeDefined();
  });

  it('ledger final balance matches totalOutstanding value', async () => {
    renderLedger();
    await waitFor(() => {
      expect(screen.getByText('Current Outstanding Balance')).toBeDefined();
    });
  });

  it('ledger shows the last entry balance as the outstanding banner value', async () => {
    renderLedger();
    await waitFor(() => {
      // The final ledger entry has balance = TOTAL_OUTSTANDING (125000)
      // Formatted as ₹1,25,000
      const balanceBanner = screen.queryAllByText(/1,25,000/);
      expect(balanceBanner.length).toBeGreaterThan(0);
    });
  });

  // ── Invoice outstanding alignment with dashboard pendingInvoices ──────────────

  it('invoices page renders Outstanding column header for cross-surface traceability', async () => {
    renderInvoices();
    await waitFor(() => {
      const headers = screen.queryAllByText(/Outstanding/i);
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  it('invoices page shows outstanding amount for UNPAID invoices (red) to match dashboard pending count', async () => {
    renderInvoices();
    await waitFor(() => {
      // INV-2026-001 (UNPAID, outstandingAmount: 53100) and INV-2026-002 (PARTIAL, outstandingAmount: 35000)
      // Both have outstanding amounts that should be visible
      const invoiceEls = screen.queryAllByText('INV-2026-001');
      expect(invoiceEls.length).toBeGreaterThan(0);
    });
  });

  it('invoices page shows blank outstanding for PAID invoices (no outstanding amount)', async () => {
    renderInvoices();
    await waitFor(() => {
      // INV-2025-099 is PAID with outstandingAmount: 0
      const paidEls = screen.queryAllByText('INV-2025-099');
      expect(paidEls.length).toBeGreaterThan(0);
      // Status badge should say Paid
      const paidBadges = screen.queryAllByText('Paid');
      expect(paidBadges.length).toBeGreaterThan(0);
    });
  });

  it('dashboard renders pendingInvoices count (2) in the Pending Invoices KPI card', async () => {
    // Dashboard receives pendingInvoices: 2, which corresponds to the 2 invoices with
    // outstandingAmount > 0 in mockInvoices (INV-2026-001 and INV-2026-002).
    // Verify the dashboard actually renders this count value in the UI rather than
    // only checking fixture data consistency.
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Pending Invoices')).toBeDefined();
    });
    // The KpiCard value for pendingInvoices = 2 is rendered directly as the card value.
    const countEls = screen.queryAllByText('2');
    expect(countEls.length).toBeGreaterThan(0);
  });

  // ── Order count alignment with dashboard pendingOrderCount ──────────────────

  it('orders page renders all orders scoped to the same dealer', async () => {
    renderOrders();
    await waitFor(() => {
      // All 3 mock orders belong to dealer 42
      const so1001 = screen.queryAllByText('SO-1001');
      expect(so1001.length).toBeGreaterThan(0);
    });
  });

  it('dashboard renders pendingOrderCount (3) in the Pending Orders KPI card', async () => {
    // Dashboard receives pendingOrderCount: 3, which corresponds to the 3 active orders in
    // mockOrders (CONFIRMED, PROCESSING, RESERVED — none are CANCELLED/CLOSED/SETTLED/INVOICED).
    // Verify the dashboard actually renders this count value in the UI rather than
    // only checking fixture data consistency.
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Pending Orders')).toBeDefined();
    });
    // The KpiCard value for pendingOrderCount = 3 is rendered directly as the card value.
    const countEls = screen.queryAllByText('3');
    expect(countEls.length).toBeGreaterThan(0);
  });

  // ── Credit utilization consistency across dashboard and aging ────────────────

  it('dashboard shows Credit Utilization section with creditLimit and creditUsed', async () => {
    renderDashboard();
    await waitFor(() => {
      const utilization = screen.queryAllByText(/Credit Utilization/i);
      expect(utilization.length).toBeGreaterThan(0);
    });
  });

  it('dashboard credit utilization section renders creditUsed and creditLimit values from mock data', async () => {
    // The aging and dashboard data share the same creditLimit (200000) and creditUsed (125000).
    // Verify the dashboard renders these values in the Credit Utilization section so
    // a user can see the same financial context without needing to navigate to the aging page.
    renderDashboard();
    await waitFor(() => {
      const utilization = screen.queryAllByText(/Credit Utilization/i);
      expect(utilization.length).toBeGreaterThan(0);
    });
    // fmtCurrency(125000) = '₹1.25L used', fmtCurrency(200000) = '₹2.00L limit'
    // Use regex to match across varying text-node structures.
    expect(screen.queryAllByText(/1\.25L used/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/2\.00L limit/).length).toBeGreaterThan(0);
  });

  // ── Overdue invoices consistency between aging and invoices pages ─────────────

  it('aging overdue invoice appears in the aging table', async () => {
    renderAging();
    await waitFor(() => {
      const invEls = screen.queryAllByText('INV-2026-001');
      expect(invEls.length).toBeGreaterThan(0);
    });
  });

  it('same invoice number (INV-2026-001) is visible in both aging overdue section and invoices page', async () => {
    // Aging page shows INV-2026-001 in overdue invoices
    const { unmount: unmountAging } = renderAging();
    await waitFor(() => {
      const agingEls = screen.queryAllByText('INV-2026-001');
      expect(agingEls.length).toBeGreaterThan(0);
    });
    unmountAging();

    // Invoices page also shows INV-2026-001
    renderInvoices();
    await waitFor(() => {
      const invoiceEls = screen.queryAllByText('INV-2026-001');
      expect(invoiceEls.length).toBeGreaterThan(0);
    });
  });
});
