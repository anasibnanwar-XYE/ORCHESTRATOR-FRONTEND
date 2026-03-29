/**
 * Tests for SalesTargetsPage
 *
 * Covers:
 *   - Page renders with heading
 *   - Shows targets in table (name, period, target, achieved, percentage)
 *   - Progress percentage indicator visible
 *   - Shows loading skeleton
 *   - Shows error state with retry
 *   - Shows empty state when no targets
 *   - "New Target" button is present
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M,
    Pencil: M, Trash2: M, Target: M, TrendingUp: M, ChevronDown: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    listSalesTargets: vi.fn(),
    createSalesTarget: vi.fn(),
    updateSalesTarget: vi.fn(),
    deleteSalesTarget: vi.fn(),
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

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div data-testid="confirm-dialog">{title}</div> : null,
}));

import { SalesTargetsPage } from '../SalesTargetsPage';
import { salesApi } from '@/lib/salesApi';

const mockTargets = [
  {
    id: 1,
    publicId: 'TGT-001',
    name: 'Q1 Target',
    assignee: 'team',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    targetAmount: 1000000,
    achievedAmount: 750000,
  },
  {
    id: 2,
    publicId: 'TGT-002',
    name: 'Annual Target',
    assignee: 'sales_team',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    targetAmount: 5000000,
    achievedAmount: 1200000,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sales/targets']}>
      <SalesTargetsPage />
    </MemoryRouter>
  );
}

describe('SalesTargetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Sales Targets"', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTargets);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Sales Targets')).toBeDefined();
    });
  });

  it('shows loading skeletons while data loads', () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders target names in the table', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTargets);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Q1 Target').length).toBeGreaterThan(0);
    });
  });

  it('shows progress percentage for each target', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTargets);
    renderPage();
    await waitFor(() => {
      // Q1 Target: 750000/1000000 = 75%
      const percentages = screen.queryAllByText(/75%/i);
      expect(percentages.length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry on API failure', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const retries = screen.queryAllByText(/retry/i);
      const errors = screen.queryAllByText(/unable to load|error/i);
      expect(retries.length > 0 || errors.length > 0).toBe(true);
    });
  });

  it('shows empty state when no targets', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const empties = screen.queryAllByText(/no sales targets/i);
      expect(empties.length).toBeGreaterThan(0);
    });
  });

  it('renders "New Target" button', async () => {
    (salesApi.listSalesTargets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTargets);
    renderPage();
    await waitFor(() => {
      const btns = screen.queryAllByText(/new target/i);
      expect(btns.length).toBeGreaterThan(0);
    });
  });
});
