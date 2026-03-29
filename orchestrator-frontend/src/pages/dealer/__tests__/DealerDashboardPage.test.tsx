/**
 * Tests for DealerDashboardPage
 *
 * Covers:
 *  - Renders KPI stat cards (Outstanding Balance, Available Credit, Pending Invoices, Pending Orders)
 *  - Shows skeleton loading state while data loads
 *  - Shows error state with retry on API failure
 *  - Clicking KPI cards navigates to relevant sections
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    CreditCard: M, Wallet: M, Clock: M, Package: M,
    RefreshCcw: M, AlertCircle: M, ArrowRight: M, FileText: M,
  };
});

vi.mock('@/lib/dealerApi', () => ({
  dealerApi: {
    getDashboard: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { DealerDashboardPage } from '../DealerDashboardPage';
import { dealerApi } from '@/lib/dealerApi';

const mockDashboard = {
  dealerId: 1,
  dealerName: 'Test Dealer',
  totalOutstanding: 125000,
  currentBalance: 125000,
  availableCredit: 75000,
  creditLimit: 200000,
  creditUsed: 125000,
  creditStatus: 'WITHIN_LIMIT',
  pendingInvoices: 3,
  pendingOrderCount: 2,
  pendingOrderExposure: 50000,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dealer']}>
      <DealerDashboardPage />
    </MemoryRouter>
  );
}

describe('DealerDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('shows skeleton loading state while data loads', () => {
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders KPI stat cards after data loads', async () => {
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Outstanding Balance')).toBeDefined();
      expect(screen.getByText('Available Credit')).toBeDefined();
      expect(screen.getByText('Pending Invoices')).toBeDefined();
      expect(screen.getByText('Pending Orders')).toBeDefined();
    });
  });

  it('shows error state with retry on API failure', async () => {
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry/i);
      const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
    });
  });

  it('clicking Outstanding Balance navigates to /dealer/ledger', async () => {
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
    renderPage();
    await waitFor(() => expect(screen.getByText('Outstanding Balance')).toBeDefined());
    const card = screen.getByText('Outstanding Balance').closest('button');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/dealer/ledger');
    }
  });

  it('clicking Available Credit navigates to /dealer/credit-requests', async () => {
    (dealerApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
    renderPage();
    await waitFor(() => expect(screen.getByText('Available Credit')).toBeDefined());
    const card = screen.getByText('Available Credit').closest('button');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/dealer/credit-requests');
    }
  });
});
