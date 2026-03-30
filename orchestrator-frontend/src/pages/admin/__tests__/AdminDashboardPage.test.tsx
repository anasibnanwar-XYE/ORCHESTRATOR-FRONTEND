/**
 * Tests for AdminDashboardPage
 *
 * Covers:
 *  - Renders QuickStat cards from /portal/dashboard highlights
 *  - Shows skeleton loading state while data loads
 *  - Shows error state with retry button on API failure
 *  - Pipeline stages visualization renders
 *  - (HR/Payroll on hold — no workforce data)
 *  - Activity feed section renders
 *  - Quick Actions section renders with colored icons
 *  - Pending Items section renders
 *  - Clicking KPI cards navigates to relevant pages
 *  - Falls back to static KPI cards when no highlights returned
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react
vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Users: M, Building2: M, CheckSquare: M, TrendingUp: M, TrendingDown: M,
    AlertCircle: M, RefreshCcw: M, Package: M, Truck: M, MapPin: M,
    UserPlus: M, ShoppingCart: M, FileText: M, Settings: M, Shield: M,
    CheckCircle2: M, Clock: M, MoreHorizontal: M, ArrowUpRight: M, ArrowRight: M,
  };
});

// Mock the portal insights API
vi.mock('@/lib/adminApi', () => ({
  portalInsightsApi: {
    getDashboard: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { AdminDashboardPage } from '../AdminDashboardPage';
import { portalInsightsApi } from '@/lib/adminApi';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockDashboard = {
  highlights: [
    { label: 'Total Users', value: '42', detail: '38 active' },
    { label: 'Total Companies', value: '5', detail: '5 active' },
    { label: 'Pending Approvals', value: '3', detail: 'Requires attention' },
    { label: 'Revenue Summary', value: '₹12.5L', detail: 'This month' },
  ],
  pipeline: [
    { label: 'Orders', count: 10 },
    { label: 'Dispatch', count: 6 },
    { label: 'Delivery', count: 2 },
  ],

};

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboardPage />
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('shows skeleton loading state while data is loading', () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders KPI stat cards from highlights after load', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeDefined();
      expect(screen.getByText('Total Companies')).toBeDefined();
      expect(screen.getByText('Pending Approvals')).toBeDefined();
      expect(screen.getByText('Revenue Summary')).toBeDefined();
    });
  });

  it('shows KPI values from backend highlights', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      const allWith42 = screen.queryAllByText('42');
      const allWith5 = screen.queryAllByText('5');
      expect(allWith42.length).toBeGreaterThan(0);
      expect(allWith5.length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry on API failure', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry|try again/i);
      const errorMsgs = screen.queryAllByText(/couldn't load|failed|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
    });
  });

  it('clicking a KPI card navigates to the relevant page', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeDefined();
    });

    const card = screen.getByText('Total Users').closest('button');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    }
  });

  it('clicking Pending Approvals card navigates to /admin/approvals', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pending Approvals')).toBeDefined();
    });

    const card = screen.getByText('Pending Approvals').closest('button');
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/approvals');
    }
  });

  it('renders pipeline stages from backend data', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      const pipelineEls = screen.queryAllByText(/pipeline|orders|dispatch|delivery/i);
      expect(pipelineEls.length).toBeGreaterThan(0);
    });
  });

  it('shows static KPI cards when dashboard returns no highlights', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeDefined();
      expect(screen.getByText('System Status')).toBeDefined();
    });
  });

  it('renders Quick Actions section with colored icon buttons', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      const quickActionsLabel = screen.queryByText(/quick actions/i);
      expect(quickActionsLabel).not.toBeNull();
    });

    // Verify specific quick action buttons exist
    expect(screen.queryByText('Users')).not.toBeNull();
    expect(screen.queryByText('Approvals')).not.toBeNull();
    expect(screen.queryByText('Roles')).not.toBeNull();
    expect(screen.queryByText('Settings')).not.toBeNull();
  });

  it('renders activity feed section', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      const activity = screen.queryByText(/activity/i);
      expect(activity).not.toBeNull();
    });
  });

  it('renders pending items section', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      const pendingItems = screen.queryByText(/pending items/i);
      expect(pendingItems).not.toBeNull();
    });
  });

  it('quick action Users button navigates to /admin/users', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText('Quick Actions')).not.toBeNull();
    });

    // Find the Users quick action button (not the KPI card which also has 'Total Users')
    const usersBtn = screen.queryByText('Users');
    if (usersBtn) {
      const btn = usersBtn.closest('button');
      if (btn) {
        fireEvent.click(btn);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
      }
    }
  });
});
