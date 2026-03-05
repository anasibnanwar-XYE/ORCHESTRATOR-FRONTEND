/**
 * SettlementsPage tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettlementsPage } from '../SettlementsPage';
import { accountingApi } from '@/lib/accountingApi';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/accountingApi', () => ({
  accountingApi: {
    getDealers: vi.fn(),
    getSuppliers: vi.fn(),
    getAccounts: vi.fn(),
    recordDealerReceipt: vi.fn(),
    recordHybridReceipt: vi.fn(),
    recordSupplierPayment: vi.fn(),
    createDealerSettlement: vi.fn(),
    createSupplierSettlement: vi.fn(),
    createCreditNote: vi.fn(),
    createDebitNote: vi.fn(),
    writeBadDebt: vi.fn(),
    recordAccrual: vi.fn(),
  },
}));

const mockDealers = [
  { id: 1, name: 'ABC Paints', code: 'D001', status: 'ACTIVE' },
];

const mockSuppliers = [
  { id: 1, name: 'Supplier One', code: 'S001', status: 'ACTIVE' },
];

const mockAccounts = [
  { id: 1, code: '1100', name: 'Cash', type: 'ASSET' as const, balance: 0, publicId: 'u1', parentId: null },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SettlementsPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('SettlementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountingApi.getDealers).mockResolvedValue(mockDealers);
    vi.mocked(accountingApi.getSuppliers).mockResolvedValue(mockSuppliers);
    vi.mocked(accountingApi.getAccounts).mockResolvedValue(mockAccounts);
  });

  it('renders the settlements page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Settlements')).toBeInTheDocument();
    });
  });

  it('renders Dealer Receipt tab button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dealer Receipt' })).toBeInTheDocument();
    });
  });

  it('renders Supplier Payment tab button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Supplier Payment' })).toBeInTheDocument();
    });
  });

  it('shows Record Payment button on dealer receipt tab (default)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
    });
  });

  it('switches to Credit Note tab and shows form button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Credit Note' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Credit Note' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create credit note/i })).toBeInTheDocument();
    });
  });

  it('switches to Accrual tab and shows Record Accrual button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accrual' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Accrual' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record accrual/i })).toBeInTheDocument();
    });
  });

  it('does not call recordDealerReceipt when form fields empty', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
    expect(accountingApi.recordDealerReceipt).not.toHaveBeenCalled();
  });
});
