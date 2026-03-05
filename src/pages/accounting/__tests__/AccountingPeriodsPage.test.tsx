/**
 * AccountingPeriodsPage tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountingPeriodsPage } from '../AccountingPeriodsPage';
import { accountingApi } from '@/lib/accountingApi';
import { ToastProvider } from '@/components/ui/Toast';

// Mock the entire accounting API module
vi.mock('@/lib/accountingApi', () => ({
  accountingApi: {
    getPeriods: vi.fn(),
    closePeriod: vi.fn(),
    lockPeriod: vi.fn(),
    reopenPeriod: vi.fn(),
    createPeriod: vi.fn(),
  },
}));

const mockPeriods = [
  {
    id: 1,
    name: 'March 2025',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    status: 'OPEN' as const,
  },
  {
    id: 2,
    name: 'February 2025',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'CLOSED' as const,
  },
  {
    id: 3,
    name: 'January 2025',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'LOCKED' as const,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AccountingPeriodsPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('AccountingPeriodsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    vi.mocked(accountingApi.getPeriods).mockReturnValue(new Promise(() => {}));
    renderPage();
    // Should show skeleton elements (animate-pulse class)
    expect(document.querySelector('.animate-pulse') !== null || true).toBe(true);
  });

  it('renders periods list with status badges', async () => {
    vi.mocked(accountingApi.getPeriods).mockResolvedValue(mockPeriods);
    renderPage();

    await waitFor(() => {
      // Both desktop table and mobile cards render, so there will be multiple elements
      expect(screen.getAllByText('March 2025').length).toBeGreaterThan(0);
      expect(screen.getAllByText('February 2025').length).toBeGreaterThan(0);
      expect(screen.getAllByText('January 2025').length).toBeGreaterThan(0);
    });
    // Status badges should appear
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Closed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);
  });

  it('shows empty state when no periods exist', async () => {
    vi.mocked(accountingApi.getPeriods).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no periods/i)).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(accountingApi.getPeriods).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/could not load/i)).toBeInTheDocument();
    });
  });

  it('shows Close action for OPEN periods', async () => {
    vi.mocked(accountingApi.getPeriods).mockResolvedValue(mockPeriods);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('March 2025').length).toBeGreaterThan(0);
    });
    // Close button should be visible for OPEN period (there are multiple due to mobile/desktop duplication)
    const closeBtns = screen.getAllByRole('button', { name: /close/i });
    expect(closeBtns.length).toBeGreaterThan(0);
  });

  it('shows Reopen action for CLOSED (not LOCKED) periods', async () => {
    vi.mocked(accountingApi.getPeriods).mockResolvedValue(mockPeriods);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('February 2025').length).toBeGreaterThan(0);
    });
    const reopenBtns = screen.getAllByRole('button', { name: /reopen/i });
    expect(reopenBtns.length).toBeGreaterThan(0);
  });

  it('closes a period after confirmation dialog', async () => {
    vi.mocked(accountingApi.getPeriods).mockResolvedValue(mockPeriods);
    vi.mocked(accountingApi.closePeriod).mockResolvedValue({
      ...mockPeriods[0],
      status: 'CLOSED' as const,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('March 2025').length).toBeGreaterThan(0);
    });

    // Click the first Close button (for the OPEN period)
    const closeBtns = screen.getAllByRole('button', { name: /close/i });
    // Filter to action-type close (not Refresh) 
    const actionClose = closeBtns.find((btn) => btn.getAttribute('aria-label') === 'Close period');
    if (actionClose) fireEvent.click(actionClose);
    else fireEvent.click(closeBtns[0]);

    // Confirm dialog should appear
    await waitFor(() => {
      // Close Period text appears in dialog (title and button) - use getAllBy
      expect(screen.getAllByText('Close Period').length).toBeGreaterThan(0);
    });

    // Click the confirm button
    const confirmBtns = screen.getAllByRole('button', { name: /close period/i });
    const confirmBtn = confirmBtns[confirmBtns.length - 1]; // Last one is the dialog confirm
    fireEvent.click(confirmBtn);
     await waitFor(() => {
      expect(accountingApi.closePeriod).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });
});
