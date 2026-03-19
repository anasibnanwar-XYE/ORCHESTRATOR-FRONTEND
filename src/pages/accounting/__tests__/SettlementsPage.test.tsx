/**
 * SettlementsPage tests
 *
 * Covers:
 *  VAL-P2P-011: Supplier payment and settlement both allocate only against outstanding
 *               purchases and show clear result references after success.
 *  Also covers basic smoke checks for all tab types.
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
    getDealerInvoices: vi.fn(),
    getSupplierPurchases: vi.fn(),
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

/** A purchase with a positive outstanding balance — should appear in allocation dropdowns */
const outstandingPurchase = {
  id: 10,
  invoiceNumber: 'PUR-OUT-010',
  outstandingAmount: 18000,
  totalAmount: 18000,
  invoiceDate: '2026-03-01',
  status: 'POSTED',
};

/** A purchase that is fully paid — must NOT appear in allocation dropdowns */
const paidPurchase = {
  id: 11,
  invoiceNumber: 'PUR-PAID-011',
  outstandingAmount: 0,
  totalAmount: 10000,
  invoiceDate: '2026-02-01',
  status: 'PAID',
};

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
    vi.mocked(accountingApi.getDealerInvoices).mockResolvedValue([]);
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([]);
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

  // ── VAL-P2P-011: Supplier payment allocates only against outstanding purchases ──

  it('supplier payment form shows only outstanding purchases when supplier is selected', async () => {
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([
      outstandingPurchase,
      paidPurchase,
    ]);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Payment' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Payment' }));

    await waitFor(() =>
      expect(
        screen.getByText('Record a payment to a supplier against a specific purchase invoice.')
      ).toBeInTheDocument()
    );

    // Select a supplier — triggers getSupplierPurchases
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(accountingApi.getSupplierPurchases).toHaveBeenCalledWith(1);
      // Outstanding purchase should appear in the dropdown label
      expect(screen.getByText(/PUR-OUT-010.*Outstanding/)).toBeInTheDocument();
    });
    // Fully-paid purchase must NOT appear
    expect(screen.queryByText(/PUR-PAID-011/)).toBeNull();
  });

  it('supplier payment form requires purchase invoice selection before submit', async () => {
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([outstandingPurchase]);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Payment' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Payment' }));
    await waitFor(() =>
      expect(
        screen.getByText('Record a payment to a supplier against a specific purchase invoice.')
      ).toBeInTheDocument()
    );

    // Leave all fields empty and attempt to submit
    fireEvent.click(screen.getByRole('button', { name: /record supplier payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select a purchase invoice to allocate/i)).toBeInTheDocument();
    });
    expect(accountingApi.recordSupplierPayment).not.toHaveBeenCalled();
  });

  it('supplier payment shows result reference after success', async () => {
    const mockJournalEntry = {
      id: 99,
      publicId: 'jrnl-099',
      referenceNumber: 'PAY-SUP-099',
      entryDate: '2026-03-01',
      memo: 'Supplier payment',
      status: 'POSTED',
      dealerId: null,
      dealerName: null,
      supplierId: 1,
      supplierName: 'Supplier One',
      accountingPeriodId: null,
      accountingPeriodLabel: null,
      accountingPeriodStatus: null,
      reversalOfEntryId: null,
      reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
      createdBy: 'test',
      lines: [],
    };
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([outstandingPurchase]);
    vi.mocked(accountingApi.recordSupplierPayment).mockResolvedValue(mockJournalEntry);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Payment' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Payment' }));
    await waitFor(() =>
      expect(
        screen.getByText('Record a payment to a supplier against a specific purchase invoice.')
      ).toBeInTheDocument()
    );

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    await waitFor(() =>
      expect(screen.getByText(/PUR-OUT-010.*Outstanding/)).toBeInTheDocument()
    );

    // Select account
    const accountSelect = screen.getByLabelText(/Payment Account/i);
    fireEvent.change(accountSelect, { target: { value: '1' } });

    // Enter amount
    const amountInput = screen.getByLabelText(/^Amount/i);
    fireEvent.change(amountInput, { target: { value: '18000' } });

    // Select purchase
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice to Allocate/i);
    fireEvent.change(purchaseSelect, { target: { value: '10' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /record supplier payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Supplier payment recorded successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/PAY-SUP-099/)).toBeInTheDocument();
    });
  });

  // ── VAL-P2P-011: Supplier settlement allocates only against outstanding purchases ──

  it('supplier settlement form shows only outstanding purchases when supplier is selected', async () => {
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([
      outstandingPurchase,
      paidPurchase,
    ]);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Settlement' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Settlement' }));

    await waitFor(() =>
      expect(
        screen.getByText('Settle outstanding supplier invoices with a payment allocation.')
      ).toBeInTheDocument()
    );

    // Select a supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(accountingApi.getSupplierPurchases).toHaveBeenCalledWith(1);
      // Outstanding purchase in dropdown
      expect(screen.getByText(/PUR-OUT-010.*Outstanding/)).toBeInTheDocument();
    });
    // Paid purchase must not appear
    expect(screen.queryByText(/PUR-PAID-011/)).toBeNull();
  });

  it('supplier settlement shows result reference after success', async () => {
    const mockSettlementResponse = {
      totalApplied: 18000,
      cashAmount: 18000,
      totalDiscount: 0,
      totalWriteOff: 0,
      totalFxGain: 0,
      totalFxLoss: 0,
      journalEntry: {
        id: 101,
        publicId: 'jrnl-101',
        referenceNumber: 'SETTLE-SUP-101',
        entryDate: '2026-03-01',
        memo: 'Supplier settlement',
        status: 'POSTED',
        dealerId: null,
        dealerName: null,
        supplierId: 1,
        supplierName: 'Supplier One',
        accountingPeriodId: null,
        accountingPeriodLabel: null,
        accountingPeriodStatus: null,
        reversalOfEntryId: null,
        reversalEntryId: null,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        createdBy: 'test',
        lines: [],
      },
    };
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([outstandingPurchase]);
    vi.mocked(accountingApi.createSupplierSettlement).mockResolvedValue(mockSettlementResponse);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Settlement' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Settlement' }));
    await waitFor(() =>
      expect(
        screen.getByText('Settle outstanding supplier invoices with a payment allocation.')
      ).toBeInTheDocument()
    );

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    await waitFor(() =>
      expect(screen.getByText(/PUR-OUT-010.*Outstanding/)).toBeInTheDocument()
    );

    // Select account
    const accountSelect = screen.getByLabelText(/Payment Account/i);
    fireEvent.change(accountSelect, { target: { value: '1' } });

    // Select purchase
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '10' } });

    // Enter allocation amount
    const allocInput = screen.getByLabelText(/Allocation Amount/i);
    fireEvent.change(allocInput, { target: { value: '18000' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create supplier settlement/i }));

    await waitFor(() => {
      // The result banner and the success toast both show this message —
      // use getAllByText to handle both occurrences gracefully.
      expect(screen.getAllByText(/Supplier settlement created/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/SETTLE-SUP-101/)).toBeInTheDocument();
    });
  });
});
