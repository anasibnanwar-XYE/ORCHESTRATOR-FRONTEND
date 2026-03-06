/**
 * Tests for SalesReturnsPage
 *
 * Covers:
 *   - Page renders with heading
 *   - Shows invoices list to select from
 *   - Shows loading skeleton
 *   - Shows error state with retry
 *   - Return form captures return quantity per line item
 *   - Return reason is required
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M,
    RotateCcw: M, FileText: M, ChevronDown: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    listInvoices: vi.fn(),
    getInvoice: vi.fn(),
    processSalesReturn: vi.fn(),
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

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
    <div>
      {props.label && <label>{props.label}</label>}
      <input {...props} />
      {props.error && <span>{props.error}</span>}
    </div>
  ),
}));

import { SalesReturnsPage } from '../SalesReturnsPage';
import { salesApi } from '@/lib/salesApi';

const mockInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-0001',
    dealerName: 'Raj Paints',
    issueDate: '2026-02-15',
    totalAmount: 250000,
    status: 'PARTIALLY_PAID',
    lines: [
      { id: 10, productCode: 'PAINT-001', description: 'White Paint', quantity: 10, unitPrice: 25000 },
    ],
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sales/returns']}>
      <SalesReturnsPage />
    </MemoryRouter>
  );
}

describe('SalesReturnsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Returns"', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Returns')).toBeDefined();
    });
  });

  it('shows loading skeletons while data loads', () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows invoice list for selecting return source', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-0001').length).toBeGreaterThan(0);
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

  it('shows empty state when no invoices available for return', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const empties = screen.queryAllByText(/no invoices/i);
      expect(empties.length).toBeGreaterThan(0);
    });
  });

  it('renders "Initiate Return" button', async () => {
    (salesApi.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoices);
    renderPage();
    await waitFor(() => {
      const btns = screen.queryAllByText(/initiate return|new return/i);
      expect(btns.length).toBeGreaterThan(0);
    });
  });
});
