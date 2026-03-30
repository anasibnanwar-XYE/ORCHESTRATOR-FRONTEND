/**
 * Tests for AdminDashboardPage
 *
 * Covers: stat cards, greeting/date, quick-access links, error/retry, loading states.
 * Maps to VAL-DASH-001 through VAL-DASH-007.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    AlertCircle: M, RefreshCcw: M, ArrowRight: M,
  };
});

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <svg data-testid="sparkline" />,
}));

vi.mock('@/lib/adminApi', () => ({
  portalInsightsApi: {
    getDashboard: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { AdminDashboardPage } from '../AdminDashboardPage';
import { portalInsightsApi } from '@/lib/adminApi';

const mockGetDashboard = portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>;

const mockDashboard = {
  highlights: [
    { label: 'Total Users', value: '42', detail: '38 active' },
    { label: 'Total Companies', value: '5', detail: '5 active' },
    { label: 'Pending Approvals', value: '3', detail: 'Requires attention' },
    { label: 'Revenue Summary', value: '₹12.5L', detail: 'This month' },
  ],
  pipeline: [],
  hrPulse: [],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboardPage />
    </MemoryRouter>
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboard.mockResolvedValue(mockDashboard);
  });

  // ── Loading State (VAL-DASH-001) ──────────────────────────────────────
  it('shows loading skeletons while data loads', () => {
    mockGetDashboard.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows exactly 4 skeleton cards during loading', () => {
    mockGetDashboard.mockImplementation(() => new Promise(() => {}));
    const { container } = renderPage();
    const skeletonCards = container.querySelectorAll('[data-testid="stat-skeleton"]');
    expect(skeletonCards).toHaveLength(4);
  });

  // ── Stat Cards (VAL-DASH-001, VAL-DASH-002) ──────────────────────────
  it('renders exactly 4 stat cards from highlights', async () => {
    const { container } = renderPage();
    await waitFor(() => {
      const statCards = container.querySelectorAll('[data-testid="stat-card"]');
      expect(statCards).toHaveLength(4);
    });
  });

  it('renders stat card labels and values', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Total Companies')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('Pending Approvals')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
      expect(screen.getByText('Revenue Summary')).toBeDefined();
      expect(screen.getByText('₹12.5L')).toBeDefined();
    });
  });

  it('renders stat card detail text', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('38 active')).toBeDefined();
      expect(screen.getByText('5 active')).toBeDefined();
    });
  });

  it('renders sparklines in stat cards', async () => {
    renderPage();
    await waitFor(() => {
      const sparklines = screen.getAllByTestId('sparkline');
      expect(sparklines).toHaveLength(4);
    });
  });

  it('renders at most 4 stat cards even with more highlights', async () => {
    mockGetDashboard.mockResolvedValue({
      ...mockDashboard,
      highlights: [
        ...mockDashboard.highlights,
        { label: 'Extra', value: '99', detail: 'Extra detail' },
        { label: 'Extra2', value: '100', detail: 'Extra2 detail' },
      ],
    });
    const { container } = renderPage();
    await waitFor(() => {
      const statCards = container.querySelectorAll('[data-testid="stat-card"]');
      expect(statCards).toHaveLength(4);
    });
  });

  // ── Greeting & Date (VAL-DASH-003) ────────────────────────────────────
  it('renders time-of-day greeting', async () => {
    renderPage();
    await waitFor(() => {
      const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
      const found = greetings.some((g) => screen.queryByText(g));
      expect(found).toBe(true);
    });
  });

  it('displays today\'s date', async () => {
    renderPage();
    const today = new Date();
    const year = today.getFullYear().toString();
    await waitFor(() => {
      // Date should contain the current year at minimum
      const dateText = screen.getByTestId('dashboard-date');
      expect(dateText.textContent).toContain(year);
    });
  });

  it('shows platform overview subtitle', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Platform overview and operational status.')).toBeDefined();
    });
  });

  // ── Quick Access (VAL-DASH-004) ───────────────────────────────────────
  it('shows quick access section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Quick access')).toBeDefined();
    });
  });

  it('shows all 6 quick access links with correct hrefs', async () => {
    renderPage();
    await waitFor(() => {
      const links = [
        { label: 'Users', to: '/admin/users' },
        { label: 'Roles', to: '/admin/roles' },
        { label: 'Approvals', to: '/admin/approvals' },
        { label: 'Audit Trail', to: '/admin/audit-trail' },
        { label: 'Changelog', to: '/admin/changelog' },
        { label: 'Settings', to: '/admin/settings' },
      ];
      for (const link of links) {
        const el = screen.getByText(link.label);
        expect(el).toBeDefined();
        // The NavLink wraps the text; find the closest anchor
        const anchor = el.closest('a');
        expect(anchor).not.toBeNull();
        expect(anchor!.getAttribute('href')).toBe(link.to);
      }
    });
  });

  it('shows quick access descriptions', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Manage accounts and access')).toBeDefined();
      expect(screen.getByText('Review role permissions')).toBeDefined();
      expect(screen.getByText('Review pending items')).toBeDefined();
      expect(screen.getByText('Review system activity')).toBeDefined();
      expect(screen.getByText('Latest platform updates')).toBeDefined();
      expect(screen.getByText('Platform configuration')).toBeDefined();
    });
  });

  // ── Error State (VAL-DASH-005) ────────────────────────────────────────
  it('shows error banner with message on API failure', async () => {
    mockGetDashboard.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data.')).toBeDefined();
    });
  });

  it('shows retry button in error state', async () => {
    mockGetDashboard.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeDefined();
    });
  });

  it('retry button re-issues API call', async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data.')).toBeDefined();
    });
    expect(mockGetDashboard).toHaveBeenCalledTimes(1);

    // Now make retry succeed
    mockGetDashboard.mockResolvedValueOnce(mockDashboard);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(mockGetDashboard).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Total Users')).toBeDefined();
    });
  });

  it('error state has alert role for accessibility', async () => {
    mockGetDashboard.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  // ── Empty State ───────────────────────────────────────────────────────
  it('shows no stat cards when highlights is empty', async () => {
    mockGetDashboard.mockResolvedValue({ highlights: [], pipeline: [], hrPulse: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Quick access')).toBeDefined();
      expect(screen.queryByText('Total Users')).toBeNull();
    });
  });

  // ── Negative Cases ────────────────────────────────────────────────────
  it('has no Operations or Workforce tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Operations')).toBeNull();
      expect(screen.queryByText('Workforce')).toBeNull();
    });
  });

  it('calls getDashboard on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockGetDashboard).toHaveBeenCalledTimes(1);
    });
  });
});
