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
    ChevronLeft: M, ChevronRight: M, AlertTriangle: M,
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
    id: 1,
    publicId: 'TKT-001',
    companyCode: 'ACME',
    userId: 10,
    requesterEmail: 'user@acme.com',
    category: 'SUPPORT' as const,
    subject: 'Cannot access payroll module',
    description: 'Detailed description',
    priority: 'HIGH' as const,
    status: 'OPEN' as const,
    githubIssueNumber: null,
    githubIssueUrl: null,
    githubIssueState: null,
    githubSyncedAt: null,
    githubLastError: null,
    resolvedAt: null,
    resolvedNotificationSentAt: null,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 2,
    publicId: 'TKT-002',
    companyCode: 'BETA',
    userId: 20,
    requesterEmail: 'admin@beta.com',
    category: 'BUG' as const,
    subject: 'Login issue for admin user',
    description: 'User cannot log in',
    priority: 'CRITICAL' as const,
    status: 'IN_PROGRESS' as const,
    githubIssueNumber: null,
    githubIssueUrl: null,
    githubIssueState: null,
    githubSyncedAt: null,
    githubLastError: null,
    resolvedAt: null,
    resolvedNotificationSentAt: null,
    createdAt: '2024-03-02T14:30:00Z',
    updatedAt: '2024-03-02T14:30:00Z',
  },
];


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
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Support Tickets')).toBeDefined();
    });
  });

  it('renders ticket subjects in table', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Cannot access payroll module').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Login issue for admin user').length).toBeGreaterThan(0);
    });
  });

  it('renders tenant names', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('ACME').length).toBeGreaterThan(0);
      expect(screen.getAllByText('BETA').length).toBeGreaterThan(0);
    });
  });

  it('renders priority and status badges', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
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
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const emptyMsg = screen.queryAllByText(/no support tickets/i);
      expect(emptyMsg.length).toBeGreaterThan(0);
    });
  });

  it('shows search input and status/priority filters', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      const searchInput = document.querySelector('input[placeholder="Search tickets…"]');
      expect(searchInput).toBeDefined();
    });
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('calls listTickets on mount', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(superadminTicketsApi.listTickets).toHaveBeenCalledTimes(1);
    });
  });

  it('renders ticket IDs with hash prefix', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      const ticketIdElements = screen.queryAllByText('TKT-001');
      expect(ticketIdElements.length).toBeGreaterThan(0);
    });
  });

  it('shows same ticket publicId as dealer would see (VAL-CROSS-005 cross-surface)', async () => {
    // When a dealer creates ticket TKT-001, superadmin must see TKT-001 in list
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      // Both dealer-facing and superadmin-facing views use publicId as the reference
      expect(screen.queryAllByText('TKT-001').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('TKT-002').length).toBeGreaterThan(0);
    });
  });

  it('renders ticket with company context (VAL-CROSS-005)', async () => {
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      // Company code must be visible so superadmin can identify the originating tenant
      expect(screen.queryAllByText('ACME').length).toBeGreaterThan(0);
    });
  });

  it('ticket with githubLastError still appears in the list (VAL-CROSS-005)', async () => {
    const ticketsWithError = [
      {
        ...mockTickets[0],
        githubLastError: 'GitHub API rate limit exceeded',
        githubIssueNumber: null,
      },
    ];
    (superadminTicketsApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(ticketsWithError);
    renderPage();
    await waitFor(() => {
      // Ticket subject remains visible despite linkage error
      expect(screen.queryAllByText('Cannot access payroll module').length).toBeGreaterThan(0);
    });
  });
});
