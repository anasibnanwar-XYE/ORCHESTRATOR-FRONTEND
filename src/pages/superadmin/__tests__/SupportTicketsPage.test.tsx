/**
 * Tests for SupportTicketsPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    LifeBuoy: M, Search: M, RefreshCw: M, AlertCircle: M,
    ChevronLeft: M, ChevronRight: M,
  };
});

vi.mock('@/lib/superadminApi', () => ({
  superadminTicketsApi: {
    listTickets: vi.fn(),
  },
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onChange, options }: { value: string; onChange: (e: { target: { value: string } }) => void; options: { value: string; label: string }[] }) => (
    <select value={value} onChange={onChange}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));

import { SupportTicketsPage } from '../SupportTicketsPage';
import { superadminTicketsApi } from '@/lib/superadminApi';

const mockTickets = [
  {
    id: 'TKT-001',
    tenantName: 'Acme Corp',
    tenantCode: 'ACME',
    subject: 'Cannot access payroll module',
    priority: 'HIGH' as const,
    status: 'OPEN' as const,
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'TKT-002',
    tenantName: 'Beta Ltd',
    tenantCode: 'BETA',
    subject: 'Login issue for admin user',
    priority: 'CRITICAL' as const,
    status: 'IN_PROGRESS' as const,
    createdAt: '2024-03-02T14:30:00Z',
  },
];

const mockPageResponse = {
  content: mockTickets,
  totalElements: 2,
  totalPages: 1,
  page: 0,
  size: 20,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/superadmin/tickets']}>
      <SupportTicketsPage />
    </MemoryRouter>
  );
}

describe('SupportTicketsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page heading', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Support Tickets')).toBeDefined();
    });
  });

  it('renders ticket subjects in table', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Cannot access payroll module').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Login issue for admin user').length).toBeGreaterThan(0);
    });
  });

  it('renders tenant names', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Beta Ltd').length).toBeGreaterThan(0);
    });
  });

  it('renders priority and status badges', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const highBadges = screen.queryAllByText('HIGH');
      const criticalBadges = screen.queryAllByText('CRITICAL');
      expect(highBadges.length + criticalBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows loading skeleton', () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state on API failure', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );
    renderPage();
    await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry/i);
      const errorMsgs = screen.queryAllByText(/couldn.*t load|failed|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
    });
  });

  it('shows empty state when no tickets', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [], totalElements: 0, totalPages: 0, page: 0, size: 20,
    });
    renderPage();
    await waitFor(() => {
      const emptyMsg = screen.queryAllByText(/no support tickets/i);
      expect(emptyMsg.length).toBeGreaterThan(0);
    });
  });

  it('shows search input and status/priority filters', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const searchInput = document.querySelector('input[placeholder="Search tickets…"]');
      expect(searchInput).toBeDefined();
    });
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('calls listTickets on mount', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(superadminTicketsApi.listTickets).toHaveBeenCalledTimes(1);
    });
  });

  it('renders ticket IDs with hash prefix', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const ticketIdElements = screen.queryAllByText(/#TKT-001/);
      expect(ticketIdElements.length).toBeGreaterThan(0);
    });
  });
});
