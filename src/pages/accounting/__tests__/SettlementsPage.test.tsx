/**
 * SettlementsPage tests
 *
 * Covers:
 *  VAL-ACCT-007: Named receipt, note, bad-debt, and accrual flows each block invalid input
 *                and show success references after successful submission.
 *  VAL-ACCT-008: Dealer and supplier auto-settle actions are discoverable and show applied results.
 *  VAL-P2P-011:  Supplier payment and settlement both allocate only against outstanding
 *                purchases and show clear result references after success.
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
    autoSettleDealer: vi.fn(),
    autoSettleSupplier: vi.fn(),
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

  // ── Hybrid Receipt tab smoke test ──────────────────────────────────────────

  it('switches to Hybrid Receipt tab and shows the form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hybrid Receipt' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid Receipt' }));
    await waitFor(() => {
      // The Hybrid Receipt form description text is unique to this tab
      expect(
        screen.getByText('Split a dealer payment across multiple cash and bank accounts.')
      ).toBeInTheDocument();
      // The submit button is rendered
      expect(screen.getByRole('button', { name: /record hybrid receipt/i })).toBeInTheDocument();
    });
  });

  it('hybrid receipt tab shows Add payment line button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hybrid Receipt' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid Receipt' }));
    await waitFor(() => {
      expect(screen.getByText('Add payment line')).toBeInTheDocument();
    });
  });

  // ── Dealer Settlement tab smoke test ──────────────────────────────────────

  it('switches to Dealer Settlement tab and shows the form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dealer Settlement' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dealer Settlement' }));
    await waitFor(() => {
      // The Dealer Settlement form description text is unique to this tab
      expect(
        screen.getByText('Net unsettled invoices and receipts into a settlement document with journal posting.')
      ).toBeInTheDocument();
      // The submit button is rendered
      expect(screen.getByRole('button', { name: /create dealer settlement/i })).toBeInTheDocument();
    });
  });

  it('dealer settlement blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dealer Settlement' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dealer Settlement' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create dealer settlement/i })).toBeInTheDocument()
    );

    // Attempt submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /create dealer settlement/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a dealer/i)).toBeInTheDocument();
    });
    expect(accountingApi.createDealerSettlement).not.toHaveBeenCalled();
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

  // ── VAL-ACCT-007: Named receipt flows block invalid input and show success references ──

  it('dealer receipt blocks submit when required fields are empty and shows error messages', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument()
    );
    // Dealer Receipt is the default tab — attempt submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a dealer/i)).toBeInTheDocument();
      expect(screen.getByText(/Select a payment account/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
      expect(screen.getByText(/Select an invoice to allocate/i)).toBeInTheDocument();
    });
    expect(accountingApi.recordDealerReceipt).not.toHaveBeenCalled();
  });

  it('dealer receipt shows success reference after valid submission', async () => {
    const mockInvoice = { id: 5, invoiceNumber: 'INV-005', outstandingAmount: 5000, totalAmount: 5000, dueDate: '2026-04-01', status: 'POSTED' };
    const mockEntry = {
      id: 20, publicId: 'jrnl-020', referenceNumber: 'RCP-DEALER-020',
      entryDate: '2026-03-01', memo: '', status: 'POSTED',
      dealerId: 1, dealerName: 'ABC Paints', supplierId: null, supplierName: null,
      accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
      reversalOfEntryId: null, reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
    };
    vi.mocked(accountingApi.getDealerInvoices).mockResolvedValue([mockInvoice]);
    vi.mocked(accountingApi.recordDealerReceipt).mockResolvedValue(mockEntry);

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument());

    // Select dealer
    fireEvent.change(screen.getByLabelText(/Dealer/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText(/INV-005/)).toBeInTheDocument());

    // Select account
    fireEvent.change(screen.getByLabelText(/Payment Account/i), { target: { value: '1' } });
    // Enter amount
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '5000' } });
    // Select invoice
    fireEvent.change(screen.getByLabelText(/Invoice to Allocate/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dealer receipt recorded successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/RCP-DEALER-020/)).toBeInTheDocument();
    });
  });

  it('credit note blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Credit Note' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Credit Note' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /create credit note/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /create credit note/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a dealer/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.createCreditNote).not.toHaveBeenCalled();
  });

  it('credit note shows success reference after valid submission', async () => {
    const mockInvoice = { id: 7, invoiceNumber: 'INV-007', outstandingAmount: 3000, totalAmount: 3000, dueDate: '2026-04-01', status: 'POSTED' };
    const mockEntry = {
      id: 30, publicId: 'jrnl-030', referenceNumber: 'CN-030',
      entryDate: '2026-03-01', memo: '', status: 'POSTED',
      dealerId: 1, dealerName: 'ABC Paints', supplierId: null, supplierName: null,
      accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
      reversalOfEntryId: null, reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
    };
    vi.mocked(accountingApi.getDealerInvoices).mockResolvedValue([mockInvoice]);
    vi.mocked(accountingApi.createCreditNote).mockResolvedValue(mockEntry);

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Credit Note' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Credit Note' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /create credit note/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Dealer/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText(/INV-007/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Invoice/i), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '1000' } });

    fireEvent.click(screen.getByRole('button', { name: /create credit note/i }));
    await waitFor(() => {
      expect(screen.getByText(/Credit note created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/CN-030/)).toBeInTheDocument();
    });
  });

  it('debit note blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Debit Note' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Debit Note' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /create debit note/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /create debit note/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a supplier/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.createDebitNote).not.toHaveBeenCalled();
  });

  it('debit note shows success reference after valid submission', async () => {
    const mockPurchase = { id: 12, invoiceNumber: 'PUR-012', outstandingAmount: 2000, totalAmount: 2000, invoiceDate: '2026-03-01', status: 'POSTED' };
    const mockEntry = {
      id: 40, publicId: 'jrnl-040', referenceNumber: 'DN-040',
      entryDate: '2026-03-01', memo: '', status: 'POSTED',
      dealerId: null, dealerName: null, supplierId: 1, supplierName: 'Supplier One',
      accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
      reversalOfEntryId: null, reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
    };
    vi.mocked(accountingApi.getSupplierPurchases).mockResolvedValue([mockPurchase]);
    vi.mocked(accountingApi.createDebitNote).mockResolvedValue(mockEntry);

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Debit Note' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Debit Note' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /create debit note/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Supplier/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText(/PUR-012/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Purchase Invoice/i), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '500' } });

    fireEvent.click(screen.getByRole('button', { name: /create debit note/i }));
    await waitFor(() => {
      expect(screen.getByText(/Debit note created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/DN-040/)).toBeInTheDocument();
    });
  });

  it('bad debt write-off blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bad Debt Write-off' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Bad Debt Write-off' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /write off bad debt/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /write off bad debt/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a dealer/i)).toBeInTheDocument();
      expect(screen.getByText(/Select bad debt expense account/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.writeBadDebt).not.toHaveBeenCalled();
  });

  it('bad debt write-off shows success reference after valid submission', async () => {
    const mockInvoice = { id: 8, invoiceNumber: 'INV-008', outstandingAmount: 1500, totalAmount: 1500, dueDate: '2026-04-01', status: 'POSTED' };
    const mockEntry = {
      id: 50, publicId: 'jrnl-050', referenceNumber: 'BD-050',
      entryDate: '2026-03-01', memo: '', status: 'POSTED',
      dealerId: 1, dealerName: 'ABC Paints', supplierId: null, supplierName: null,
      accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
      reversalOfEntryId: null, reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
    };
    vi.mocked(accountingApi.getDealerInvoices).mockResolvedValue([mockInvoice]);
    vi.mocked(accountingApi.writeBadDebt).mockResolvedValue(mockEntry);

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bad Debt Write-off' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Bad Debt Write-off' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /write off bad debt/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Dealer/i), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText(/INV-008/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Invoice/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Bad Debt Expense Account/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Amount to Write Off/i), { target: { value: '1500' } });

    fireEvent.click(screen.getByRole('button', { name: /write off bad debt/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bad debt written off successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/BD-050/)).toBeInTheDocument();
    });
  });

  it('accrual blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Accrual' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Accrual' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /record accrual/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /record accrual/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select debit account/i)).toBeInTheDocument();
      expect(screen.getByText(/Select credit account/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.recordAccrual).not.toHaveBeenCalled();
  });

  it('accrual shows success reference after valid submission', async () => {
    const mockEntry = {
      id: 60, publicId: 'jrnl-060', referenceNumber: 'ACC-060',
      entryDate: '2026-03-01', memo: '', status: 'POSTED',
      dealerId: null, dealerName: null, supplierId: null, supplierName: null,
      accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
      reversalOfEntryId: null, reversalEntryId: null,
      createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
    };
    vi.mocked(accountingApi.recordAccrual).mockResolvedValue(mockEntry);

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Accrual' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Accrual' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /record accrual/i })).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    // Debit account is first select, credit account is second
    fireEvent.change(selects[0], { target: { value: '1' } });
    fireEvent.change(selects[1], { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /record accrual/i }));
    await waitFor(() => {
      expect(screen.getByText(/Accrual entry posted successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/ACC-060/)).toBeInTheDocument();
    });
  });

  // ── VAL-ACCT-008: Dealer and supplier auto-settle actions are discoverable and show applied results ──

  it('dealer auto-settle tab is visible and renders the form', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dealer Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dealer Auto-Settle' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply dealer auto-settle/i })).toBeInTheDocument();
      expect(screen.getByText(/automatically net and settle/i)).toBeInTheDocument();
    });
  });

  it('dealer auto-settle blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dealer Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dealer Auto-Settle' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /apply dealer auto-settle/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /apply dealer auto-settle/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a dealer/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.autoSettleDealer).not.toHaveBeenCalled();
  });

  it('dealer auto-settle shows applied result reference after success', async () => {
    const mockAutoSettleResponse = {
      totalApplied: 12000,
      cashAmount: 12000,
      totalDiscount: 0,
      totalWriteOff: 0,
      totalFxGain: 0,
      totalFxLoss: 0,
      journalEntry: {
        id: 70, publicId: 'jrnl-070', referenceNumber: 'AUTO-DEALER-070',
        entryDate: '2026-03-01', memo: '', status: 'POSTED',
        dealerId: 1, dealerName: 'ABC Paints', supplierId: null, supplierName: null,
        accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
        reversalOfEntryId: null, reversalEntryId: null,
        createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
      },
    };
    vi.mocked(accountingApi.autoSettleDealer).mockResolvedValue(mockAutoSettleResponse);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dealer Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dealer Auto-Settle' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /apply dealer auto-settle/i })).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/Dealer/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '12000' } });

    fireEvent.click(screen.getByRole('button', { name: /apply dealer auto-settle/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Dealer auto-settle applied/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/AUTO-DEALER-070/)).toBeInTheDocument();
    });
    expect(accountingApi.autoSettleDealer).toHaveBeenCalledWith(1, expect.objectContaining({
      amount: 12000,
    }));
  });

  it('supplier auto-settle tab is visible and renders the form', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Auto-Settle' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply supplier auto-settle/i })).toBeInTheDocument();
      expect(screen.getByText(/automatically net and settle all outstanding purchase invoices/i)).toBeInTheDocument();
    });
  });

  it('supplier auto-settle blocks submit when required fields are empty', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Auto-Settle' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /apply supplier auto-settle/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /apply supplier auto-settle/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a supplier/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });
    expect(accountingApi.autoSettleSupplier).not.toHaveBeenCalled();
  });

  it('supplier auto-settle shows applied result reference after success', async () => {
    const mockAutoSettleResponse = {
      totalApplied: 9500,
      cashAmount: 9500,
      totalDiscount: 0,
      totalWriteOff: 0,
      totalFxGain: 0,
      totalFxLoss: 0,
      journalEntry: {
        id: 80, publicId: 'jrnl-080', referenceNumber: 'AUTO-SUP-080',
        entryDate: '2026-03-01', memo: '', status: 'POSTED',
        dealerId: null, dealerName: null, supplierId: 1, supplierName: 'Supplier One',
        accountingPeriodId: null, accountingPeriodLabel: null, accountingPeriodStatus: null,
        reversalOfEntryId: null, reversalEntryId: null,
        createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', createdBy: 'test', lines: [],
      },
    };
    vi.mocked(accountingApi.autoSettleSupplier).mockResolvedValue(mockAutoSettleResponse);

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Supplier Auto-Settle' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supplier Auto-Settle' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /apply supplier auto-settle/i })).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/Supplier/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/^Amount/i), { target: { value: '9500' } });

    fireEvent.click(screen.getByRole('button', { name: /apply supplier auto-settle/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Supplier auto-settle applied/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/AUTO-SUP-080/)).toBeInTheDocument();
    });
    expect(accountingApi.autoSettleSupplier).toHaveBeenCalledWith(1, expect.objectContaining({
      amount: 9500,
    }));
  });
});
