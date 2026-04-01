/**
 * Tests for SuperadminAuditTrailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

vi.mock('@/lib/superadminApi', () => ({
  superadminAuditApi: {
    getBusinessEvents: vi.fn(),
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

import { SuperadminAuditTrailPage } from '../SuperadminAuditTrailPage';
import { superadminAuditApi } from '@/lib/superadminApi';

const mockEvents = [
  {
    id: 'evt-1',
    occurredAt: '2024-03-01T10:00:00Z',
    actorIdentifier: 'admin@platform.com',
    action: 'TENANT_CREATED',
    entityType: 'Company',
    entityId: '42',
    status: 'SUCCESS',
  },
  {
    id: 'evt-2',
    occurredAt: '2024-03-02T14:30:00Z',
    actorIdentifier: 'superadmin@platform.com',
    action: 'TENANT_SUSPENDED',
    entityType: 'Company',
    entityId: '15',
    status: 'WARNING',
  },
];

const mockPageResponse = {
  content: mockEvents,
  totalElements: 2,
  totalPages: 1,
  page: 0,
  size: 25,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/superadmin/audit']}>
      <SuperadminAuditTrailPage />
    </MemoryRouter>
  );
}

describe('SuperadminAuditTrailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page heading', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeDefined();
    });
  });

  it('renders event actions in table', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('TENANT_CREATED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TENANT_SUSPENDED').length).toBeGreaterThan(0);
    });
  });

  it('renders actor names', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('admin@platform.com').length).toBeGreaterThan(0);
    });
  });

  it('shows loading skeleton', () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state on API failure', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );
    renderPage();
    await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry/i);
      const errorMsgs = screen.queryAllByText(/couldn.*t load|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
    });
  });

  it('shows empty state when no events', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [], totalElements: 0, totalPages: 0, page: 0, size: 25,
    });
    renderPage();
    await waitFor(() => {
      const emptyMsg = screen.queryAllByText(/no audit events/i);
      expect(emptyMsg.length).toBeGreaterThan(0);
    });
  });

  it('renders actor filter input', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const actorFilter = document.querySelector('input[placeholder="Filter by actor…"]');
      expect(actorFilter).toBeDefined();
    });
  });

  it('renders date range inputs', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders action type filter select', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls getBusinessEvents on mount', async () => {
    (superadminAuditApi.getBusinessEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockPageResponse);
    renderPage();
    await waitFor(() => {
      expect(superadminAuditApi.getBusinessEvents).toHaveBeenCalledTimes(1);
    });
  });
});
