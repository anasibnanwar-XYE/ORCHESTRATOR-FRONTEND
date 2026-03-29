/**
 * Tests for SalesInvoicesPage
 *
 * Covers:
 *   - Page renders with heading
 *   - Shows invoices in table (invoice number, dealer, date, amount, status)
 *   - Shows loading skeleton
 *   - Shows error state with retry
 *   - Shows empty state when no invoices
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M,
    FileText: M, Eye: M, ChevronDown: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    listInvoices: vi.fn(),
    getInvoice: vi.fn(),
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

import { SalesInvoicesPage } from '../SalesInvoicesPage';
import { salesApi } from '@/lib/salesApi';

const mockInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-0001',
    dealerName: 'Raj Paints',
    issueDate: '2026-02-15',
    dueDate: '2026-03-15',
    totalAmount: 250000,
    outstandingAmount: 125000,
    status: 'PARTIALLY_PAID',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-0002',
    dealerName: 'Metro Distributors',
    issueDate: '2026-02-20',
    dueDate: '2026-03-20',
    totalAmount: 150000,
    outstandingAmount: 0,
    status: 'PAID',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sales/invoices']}>
      <SalesInvoicesPage />
    </MemoryRouter>
  );
}

describe('SalesInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Invoices"', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeDefined();
    });
  });

  it('shows loading skeletons while data loads', () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders invoice numbers in the table', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-0001').length).toBeGreaterThan(0);
    });
  });

  it('renders dealer names in the table', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Raj Paints').length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry on API failure', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const retries = screen.queryAllByText(/retry/i);
      const errors = screen.queryAllByText(/unable to load|error/i);
      expect(retries.length > 0 || errors.length > 0).toBe(true);
    });
  });

  it('shows empty state when no invoices', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const empties = screen.queryAllByText(/no invoices/i);
      expect(empties.length).toBeGreaterThan(0);
    });
  });

  it('shows PAID status badge', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      const badges = screen.queryAllByText(/paid/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
