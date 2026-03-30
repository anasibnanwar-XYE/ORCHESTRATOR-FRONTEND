/**
 * Tests for AdminDashboardPage
 *
 * No tabs — page shows highlights stat cards + quick-access links.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    AlertCircle: M, RefreshCcw: M, ArrowRight: M,
  };
});

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => null,
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
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);
  });

  it('shows loading skeletons while data loads', () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders stat cards from highlights', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeDefined();
      expect(screen.getByText('Total Companies')).toBeDefined();
      expect(screen.getByText('Pending Approvals')).toBeDefined();
      expect(screen.getByText('Revenue Summary')).toBeDefined();
    });
  });

  it('shows stat card values', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  it('shows quick access section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Quick access')).toBeDefined();
    });
  });

  it('shows all quick access links', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeDefined();
      expect(screen.getByText('Roles')).toBeDefined();
      expect(screen.getByText('Approvals')).toBeDefined();
      expect(screen.getByText('Audit Trail')).toBeDefined();
      expect(screen.getByText('Changelog')).toBeDefined();
      expect(screen.getByText('Settings')).toBeDefined();
    });
  });

  it('shows error state with retry on API failure', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByText(/failed/i).length).toBeGreaterThan(0);
    });
  });

  it('shows no stat cards when highlights is empty', async () => {
    (portalInsightsApi.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({
      highlights: [], pipeline: [], hrPulse: [],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Quick access')).toBeDefined();
      expect(screen.queryByText('Total Users')).toBeNull();
    });
  });

  it('renders greeting', async () => {
    renderPage();
    await waitFor(() => {
      const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
      const found = greetings.some((g) => screen.queryByText(g));
      expect(found).toBe(true);
    });
  });

  it('has no Operations or Workforce tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Operations')).toBeNull();
      expect(screen.queryByText('Workforce')).toBeNull();
    });
  });
});
