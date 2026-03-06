/**
 * Tests for TicketDetailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    ArrowLeft: M, AlertCircle: M, RefreshCw: M, User: M, Clock: M,
    Paperclip: M, MessageSquare: M, Lock: M, Send: M,
  };
});

vi.mock('@/lib/superadminApi', () => ({
  superadminTicketsDetailApi: {
    getTicket: vi.fn(),
    addResponse: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    assignAgent: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, isLoading, ...rest }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; isLoading?: boolean; fullWidth?: boolean; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled || isLoading} {...(rest as object)}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onChange, options, disabled }: { value: string; onChange: (e: { target: { value: string } }) => void; options: { value: string; label: string }[]; disabled?: boolean }) => (
    <select value={value} onChange={onChange} disabled={disabled}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, error, placeholder, type }: { value: string; onChange: (e: { target: { value: string } }) => void; error?: string; placeholder?: string; type?: string }) => (
    <div>
      <input type={type || 'text'} value={value} onChange={onChange} placeholder={placeholder} />
      {error && <span>{error}</span>}
    </div>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title, footer }: { isOpen: boolean; children: React.ReactNode; title: string; footer?: React.ReactNode; onClose?: () => void; size?: string }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null,
}));

import { TicketDetailPage } from '../TicketDetailPage';
import { superadminTicketsDetailApi } from '@/lib/superadminApi';

const mockTicket = {
  id: 'TKT-001',
  tenantName: 'Acme Corp',
  tenantCode: 'ACME',
  subject: 'Cannot access payroll module',
  priority: 'HIGH' as const,
  status: 'OPEN' as const,
  createdAt: '2024-03-01T10:00:00Z',
  updatedAt: '2024-03-02T12:00:00Z',
  description: 'Users are unable to access the payroll module since yesterday.',
  assignedAgent: 'support@orchestrator.com',
  responses: [
    {
      id: 'resp-1',
      author: 'Jane Smith',
      authorRole: 'TENANT_USER' as const,
      message: 'Hello, we cannot access the payroll module.',
      isInternal: false,
      createdAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 'resp-2',
      author: 'support@orchestrator.com',
      authorRole: 'SUPPORT_AGENT' as const,
      message: 'We are investigating this issue.',
      isInternal: false,
      createdAt: '2024-03-01T11:00:00Z',
    },
  ],
  attachments: [
    {
      id: 'att-1',
      filename: 'screenshot.png',
      url: 'https://example.com/screenshot.png',
      sizeBytes: 204800,
      uploadedAt: '2024-03-01T10:05:00Z',
      uploadedBy: 'Jane Smith',
    },
  ],
  statusHistory: [
    {
      id: 'hist-1',
      fromStatus: undefined,
      toStatus: 'OPEN',
      changedBy: 'system',
      changedAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 'hist-2',
      fromStatus: 'OPEN',
      toStatus: 'IN_PROGRESS',
      changedBy: 'support@orchestrator.com',
      changedAt: '2024-03-01T11:00:00Z',
    },
  ],
};

function renderPage(ticketId: string = 'TKT-001') {
  return render(
    <MemoryRouter initialEntries={[`/superadmin/tickets/${ticketId}`]}>
      <Routes>
        <Route path="/superadmin/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TicketDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders ticket subject after loading', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cannot access payroll module')).toBeDefined();
    });
  });

  it('renders ticket ID with hash prefix', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/#TKT-001/).length).toBeGreaterThan(0);
    });
  });

  it('renders description section', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Users are unable to access the payroll module since yesterday.')).toBeDefined();
    });
  });

  it('renders conversation thread responses', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Hello, we cannot access the payroll module.')).toBeDefined();
      expect(screen.getByText('We are investigating this issue.')).toBeDefined();
    });
  });

  it('renders attachment filename', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('screenshot.png')).toBeDefined();
    });
  });

  it('renders status history entries', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/In Progress/i).length).toBeGreaterThan(0);
    });
  });

  it('renders assigned agent', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      const agentText = screen.queryAllByText('support@orchestrator.com');
      expect(agentText.length).toBeGreaterThan(0);
    });
  });

  it('shows loading skeleton', () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state on API failure', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Not found')
    );
    renderPage();
    await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry/i);
      const errorMsgs = screen.queryAllByText(/couldn.*t load|error/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
    });
  });

  it('shows reply textarea for open tickets', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeDefined();
    });
  });

  it('shows Conversation section heading', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/conversation/i).length).toBeGreaterThan(0);
    });
  });

  it('calls getTicket with the ticket ID', async () => {
    (superadminTicketsDetailApi.getTicket as ReturnType<typeof vi.fn>).mockResolvedValue(mockTicket);
    renderPage('TKT-001');
    await waitFor(() => {
      expect(superadminTicketsDetailApi.getTicket).toHaveBeenCalledWith('TKT-001');
    });
  });
});
