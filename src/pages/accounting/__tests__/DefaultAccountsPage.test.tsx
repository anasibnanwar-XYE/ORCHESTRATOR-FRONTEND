/**
 * DefaultAccountsPage tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DefaultAccountsPage } from '../DefaultAccountsPage';
import { accountingApi } from '@/lib/accountingApi';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/accountingApi', () => ({
  accountingApi: {
    getDefaultAccounts: vi.fn(),
    updateDefaultAccounts: vi.fn(),
    getAccounts: vi.fn(),
  },
}));

const mockDefaultAccounts = {
  inventoryAccountId: 10,
  cogsAccountId: 11,
  revenueAccountId: 12,
  discountAccountId: 13,
  taxAccountId: 14,
};

const mockAccounts = [
  { id: 10, code: '1200', name: 'Inventory Asset', type: 'ASSET' as const, balance: 0, publicId: 'u1', parentId: null },
  { id: 11, code: '5000', name: 'COGS Expense', type: 'EXPENSE' as const, balance: 0, publicId: 'u2', parentId: null },
  { id: 12, code: '4000', name: 'Revenue Account', type: 'REVENUE' as const, balance: 0, publicId: 'u3', parentId: null },
  { id: 13, code: '4900', name: 'Discount Expense', type: 'EXPENSE' as const, balance: 0, publicId: 'u4', parentId: null },
  { id: 14, code: '2300', name: 'Tax Payable', type: 'LIABILITY' as const, balance: 0, publicId: 'u5', parentId: null },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <DefaultAccountsPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('DefaultAccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    vi.mocked(accountingApi.getDefaultAccounts).mockReturnValue(new Promise(() => {}));
    vi.mocked(accountingApi.getAccounts).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Default Accounts')).toBeInTheDocument();
  });

  it('renders Inventory Account label after loading', async () => {
    vi.mocked(accountingApi.getDefaultAccounts).mockResolvedValue(mockDefaultAccounts);
    vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Inventory Account')).toBeInTheDocument();
    });
  });

  it('shows save button after loading', async () => {
    vi.mocked(accountingApi.getDefaultAccounts).mockResolvedValue(mockDefaultAccounts);
    vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
    renderPage();

    await waitFor(() => {
      const saveBtn = screen.getByRole('button', { name: /save/i });
      expect(saveBtn).toBeInTheDocument();
    });
  });

  it('calls updateDefaultAccounts on save click', async () => {
    vi.mocked(accountingApi.getDefaultAccounts).mockResolvedValue(mockDefaultAccounts);
    vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(accountingApi.updateDefaultAccounts).mockResolvedValue(mockDefaultAccounts);
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(accountingApi.updateDefaultAccounts).toHaveBeenCalled();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(accountingApi.getDefaultAccounts).mockRejectedValue(new Error('fail'));
    vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/could not load/i)).toBeInTheDocument();
    });
  });
});
