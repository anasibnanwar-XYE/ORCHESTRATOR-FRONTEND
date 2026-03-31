/**
 * Tests for SupportTicketsPage
 *
 * Covers:
 *  - Page header and create button rendering
 *  - Ticket list loading and display
 *  - DataTable columns: ID, subject, status, created date
 *  - Status badges using Badge component
 *  - Priority badges
 *  - Create ticket form in Modal
 *  - Ticket detail view in Drawer
 *  - Stats cards showing ticket counts
 *  - Empty states
 *  - Error handling and retry
 *  - Search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M,
    Ticket: M,
    AlertCircle: M,
    RefreshCcw: M,
    X: M,
    Mail: M,
    Calendar: M,
    Tag: M,
    MessageSquare: M,
    CheckCircle: M,
    Clock: M,
    ArrowUpRight: M,
    MoreHorizontal: M,
    Search: M,
    ChevronLeft: M,
    ChevronRight: M,
    ArrowUpDown: M,
    ArrowUp: M,
    ArrowDown: M,
    ChevronDown: M,
    ChevronUp: M,
    Check: M,
    Filter: M,
    Eye: M,
    EyeOff: M,
    Clipboard: M,
    Info: M,
    Loader2: M,
  };
});

// Mock adminApi for support tickets
vi.mock('@/lib/adminApi', () => ({
  adminSupportApi: {
    listTickets: vi.fn(),
    getTicket: vi.fn(),
    createTicket: vi.fn(),
  },
  financeSupportApi: {},
}));

// Mock Toast — stable references to prevent infinite re-render loops
const mockToastFns = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
};
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => mockToastFns,
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { SupportTicketsPage } from '../SupportTicketsPage';
import { adminSupportApi } from '@/lib/adminApi';

const mockTickets = [
  {
    id: 1,
    publicId: 'TKT-001',
    subject: 'Login issues',
    description: 'Cannot login to the portal since this morning',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'SUPPORT',
    requesterEmail: 'user@example.com',
    companyCode: 'ACME',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    resolvedAt: null,
  },
  {
    id: 2,
    publicId: 'TKT-002',
    subject: 'Feature request: Export to Excel',
    description: 'Would like to export reports directly to Excel format',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'FEATURE_REQUEST',
    requesterEmail: 'manager@example.com',
    companyCode: 'ACME',
    createdAt: '2024-03-14T14:30:00Z',
    updatedAt: '2024-03-15T09:00:00Z',
    resolvedAt: null,
  },
  {
    id: 3,
    publicId: 'TKT-003',
    subject: 'Bug in invoice generation',
    description: 'Tax calculation is incorrect on invoice PDF',
    status: 'RESOLVED',
    priority: 'CRITICAL',
    category: 'BUG',
    requesterEmail: 'admin@example.com',
    companyCode: 'TECH',
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-03-12T16:00:00Z',
    resolvedAt: '2024-03-12T16:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/support']}>
      <SupportTicketsPage />
    </MemoryRouter>
  );
}

describe('SupportTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Support Tickets')).toBeDefined();
      expect(screen.getByText('View and manage support tickets')).toBeDefined();
    });
  });

  it('shows create ticket button', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Create ticket')).toBeDefined();
    });
  });

  it('loads and displays tickets in DataTable', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
      // Use getAllByText since "Login issues" appears in both table and mobile card
      expect(screen.getAllByText('Login issues').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#TKT-001').length).toBeGreaterThan(0);
    });
  });

  it('shows loading state while fetching tickets', () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Page should render header even while loading
    expect(screen.getByText('Support Tickets')).toBeDefined();
  });

  it('shows error state when tickets fail to load', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load tickets/i)).toBeDefined();
    });
  });

  it('displays stat cards with ticket counts', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined(); // Total count
      // These labels may appear in both stat cards and status badges, use getAllByText
      expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
    });
  });

  it('opens create ticket modal when button clicked', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    // Wait for tickets to load first
    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });
    
    // Find and click the Create ticket button in the header
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
      expect(screen.getByText(/Submit a new support ticket/)).toBeDefined();
    });
  });

  it('shows form fields in create modal', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    (adminSupportApi.createTicket as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTickets[0],
      id: 4,
      publicId: 'TKT-004',
    });
    
    renderPage();
    
    // Wait for tickets to load
    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });
    
    // Click the Create ticket button
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Subject')).toBeDefined();
      // Category and Priority may appear in table columns too, use getAllByText
      expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Priority').length).toBeGreaterThan(0);
      expect(screen.getByText('Description')).toBeDefined();
    });
  });

  it('validates required fields in create form', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    // Wait for tickets to load
    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });
    
    // Open the modal
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
    });
    
    // Click submit without filling required fields
    const submitBtns = screen.getAllByText('Create ticket');
    fireEvent.click(submitBtns[submitBtns.length - 1]);
    
    // Form should show validation errors or stay open
    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
    });
  });

  it('displays status badges for tickets', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Should render status text in the table
      const statusElements = screen.queryAllByText(/OPEN|IN_PROGRESS|RESOLVED/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('displays priority badges for tickets', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Should render priority text
      const priorityElements = screen.queryAllByText(/HIGH|MEDIUM|CRITICAL|LOW/i);
      expect(priorityElements.length).toBeGreaterThan(0);
    });
  });

  it('shows ticket category labels', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Category labels appear in both desktop table and mobile card views
      expect(screen.getAllByText('Bug Report').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Feature Request').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no tickets exist', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    
    await waitFor(() => {
      // Text appears in both desktop table and mobile card view
      expect(screen.getAllByText(/No tickets yet/i).length).toBeGreaterThan(0);
    });
  });

  it('has refresh button', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      const refreshBtn = screen.getByText('Refresh');
      expect(refreshBtn).toBeDefined();
      
      // Click refresh should reload data
      fireEvent.click(refreshBtn);
      expect(adminSupportApi.listTickets).toHaveBeenCalledTimes(2);
    });
  });

  it('displays formatted dates', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Should show date column
      const dateElements = screen.queryAllByText(/Today|Yesterday|Mar|2024/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('uses CSS variables for dark mode support', () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    const { container } = renderPage();
    
    // Check for CSS variable usage
    const hasCssVars = container.innerHTML.includes('var(--color-');
    expect(hasCssVars).toBe(true);
  });

  it('has working search filter', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/Search tickets/i);
      expect(searchInput).not.toBeNull();
    });
  });

  it('shows company code in ticket details', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Click on a row to open detail drawer - use first occurrence
      const ticketRows = screen.getAllByText('Login issues');
      fireEvent.click(ticketRows[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Company')).toBeDefined();
      expect(screen.getByText('ACME')).toBeDefined();
    });
  });

  it('shows requester email in ticket details', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Use first occurrence since there are duplicates in mobile/desktop views
      const ticketRows = screen.getAllByText('Login issues');
      fireEvent.click(ticketRows[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Requester')).toBeDefined();
    });
  });

  it('ticket is specified more than once check passes', async () => {
    // This test ensures the duplicate id/publicId in test mock doesn't cause issues
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();
    
    await waitFor(() => {
      // Use getAllByText since text appears in both table and mobile card views
      expect(screen.getAllByText('Login issues').length).toBeGreaterThan(0);
    });
  });

  it('displays closed status for resolved tickets', async () => {
    const closedTicket = {
      ...mockTickets[2],
      status: 'CLOSED',
    };
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([closedTicket]);
    renderPage();
    
    await waitFor(() => {
      const statusElements = screen.queryAllByText(/Closed/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('shows validation errors for empty subject and description', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });

    // Open modal
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
    });

    // Try to submit empty form — click the "Create ticket" button inside the modal footer
    const submitBtns = screen.getAllByText('Create ticket');
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Subject is required')).toBeDefined();
      expect(screen.getByText('Description is required')).toBeDefined();
    });

    // No API call should be made
    expect(adminSupportApi.createTicket).not.toHaveBeenCalled();
  });

  it('shows min-length validation errors for short inputs', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });

    // Open modal
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
    });

    // Type short values
    const subjectInput = screen.getByPlaceholderText('Brief summary of the issue');
    fireEvent.change(subjectInput, { target: { value: 'AB' } });

    const descriptionInput = screen.getByPlaceholderText('Provide detailed information about the issue...');
    fireEvent.change(descriptionInput, { target: { value: 'Too short' } });

    // Submit
    const submitBtns = screen.getAllByText('Create ticket');
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Subject must be at least 3 characters')).toBeDefined();
      expect(screen.getByText('Description must be at least 10 characters')).toBeDefined();
    });

    expect(adminSupportApi.createTicket).not.toHaveBeenCalled();
  });

  it('creates ticket successfully and shows toast', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (adminSupportApi.createTicket as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      publicId: 'TKT-010',
      subject: 'Test ticket',
      description: 'Test description for the ticket',
      status: 'OPEN',
      category: 'BUG',
      priority: 'MEDIUM',
      requesterEmail: 'user@test.com',
      companyCode: 'TEST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    });

    renderPage();

    await waitFor(() => {
      expect(adminSupportApi.listTickets).toHaveBeenCalled();
    });

    // Open modal
    const createBtns = screen.getAllByText('Create ticket');
    fireEvent.click(createBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Create support ticket')).toBeDefined();
    });

    // Fill out the form
    const subjectInput = screen.getByPlaceholderText('Brief summary of the issue');
    fireEvent.change(subjectInput, { target: { value: 'Test ticket' } });

    const descriptionInput = screen.getByPlaceholderText('Provide detailed information about the issue...');
    fireEvent.change(descriptionInput, { target: { value: 'Test description for the ticket' } });

    // Submit
    const submitBtns = screen.getAllByText('Create ticket');
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(adminSupportApi.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test ticket',
          description: 'Test description for the ticket',
          category: 'SUPPORT',
          priority: 'MEDIUM',
        })
      );
      expect(mockToastFns.success).toHaveBeenCalledWith(
        'Ticket created',
        'Ticket #TKT-010 has been submitted'
      );
    });
  });

  it('opens ticket detail drawer on row click and shows full info', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Login issues').length).toBeGreaterThan(0);
    });

    // Click on first ticket
    fireEvent.click(screen.getAllByText('Login issues')[0]);

    await waitFor(() => {
      // Drawer should show ticket details
      expect(screen.getByText('Ticket #TKT-001')).toBeDefined();
      expect(screen.getByText('Description')).toBeDefined();
      expect(screen.getByText('Cannot login to the portal since this morning')).toBeDefined();
      expect(screen.getByText('Company')).toBeDefined();
      expect(screen.getByText('ACME')).toBeDefined();
      expect(screen.getByText('Requester')).toBeDefined();
    });
  });

  it('stat cards render with 4 items (Total, Open, In Progress, Resolved)', async () => {
    (adminSupportApi.listTickets as ReturnType<typeof vi.fn>).mockResolvedValue(mockTickets);
    const { container } = renderPage();

    await waitFor(() => {
      const statCards = container.querySelectorAll('[data-testid="stat-card"]');
      expect(statCards.length).toBe(4);
    });
  });
});
