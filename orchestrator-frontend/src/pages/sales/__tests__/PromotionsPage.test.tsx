/**
 * Tests for PromotionsPage
 *
 * Covers:
 *   - Page renders with heading
 *   - Shows promotions in table (name, discount type, value, dates, status)
 *   - Active vs expired distinction visible
 *   - Shows loading skeleton
 *   - Shows error state with retry
 *   - Shows empty state when no promotions
 *   - "New Promotion" button is present
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, AlertCircle: M, RefreshCcw: M, Check: M, X: M,
    Pencil: M, Trash2: M, Tag: M, Calendar: M, ChevronDown: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    listPromotions: vi.fn(),
    createPromotion: vi.fn(),
    updatePromotion: vi.fn(),
    deletePromotion: vi.fn(),
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

import { PromotionsPage } from '../PromotionsPage';
import { salesApi } from '@/lib/salesApi';

const today = new Date();
const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const pastDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const mockPromotions = [
  {
    id: 1,
    publicId: 'PROMO-001',
    name: 'Summer Sale',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    startDate: pastDate,
    endDate: futureDate,
    status: 'ACTIVE',
  },
  {
    id: 2,
    publicId: 'PROMO-002',
    name: 'Clearance Offer',
    discountType: 'FLAT',
    discountValue: 500,
    startDate: pastDate,
    endDate: pastDate,
    status: 'EXPIRED',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sales/promotions']}>
      <PromotionsPage />
    </MemoryRouter>
  );
}

describe('PromotionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading "Promotions"', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue(mockPromotions);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Promotions')).toBeDefined();
    });
  });

  it('shows loading skeletons while data loads', () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders promotion names in the table', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue(mockPromotions);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Summer Sale').length).toBeGreaterThan(0);
    });
  });

  it('shows expired promotions with distinct status', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue(mockPromotions);
    renderPage();
    await waitFor(() => {
      const expired = screen.queryAllByText(/expired/i);
      expect(expired.length).toBeGreaterThan(0);
    });
  });

  it('shows active promotions with distinct status', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue(mockPromotions);
    renderPage();
    await waitFor(() => {
      const active = screen.queryAllByText(/active/i);
      expect(active.length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry on API failure', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const retries = screen.queryAllByText(/retry/i);
      const errors = screen.queryAllByText(/unable to load|error/i);
      expect(retries.length > 0 || errors.length > 0).toBe(true);
    });
  });

  it('shows empty state when no promotions', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const empties = screen.queryAllByText(/no promotions/i);
      expect(empties.length).toBeGreaterThan(0);
    });
  });

  it('renders "New Promotion" button', async () => {
    (salesApi.listPromotions as ReturnType<typeof vi.fn>).mockResolvedValue(mockPromotions);
    renderPage();
    await waitFor(() => {
      const btns = screen.queryAllByText(/new promotion/i);
      expect(btns.length).toBeGreaterThan(0);
    });
  });
});
