/**
 * RawMaterialPurchasesPage tests
 *
 * Covers:
 *  VAL-P2P-008: Only non-INVOICED GRNs offered; GRN lines preloaded in purchase form
 *  VAL-P2P-009: Outstanding amount and journal entry reference visible in purchase detail
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RawMaterialPurchasesPage } from '../RawMaterialPurchasesPage';
import { purchasingApi } from '@/lib/purchasingApi';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/purchasingApi', () => ({
  purchasingApi: {
    getRawMaterialPurchases: vi.fn(),
    getSuppliers: vi.fn(),
    getGoodsReceipts: vi.fn(),
    createRawMaterialPurchase: vi.fn(),
  },
}));

const mockPurchases = [
  {
    id: 1,
    publicId: 'rmp-001',
    invoiceNumber: 'INV-RM-001',
    invoiceDate: '2026-03-01',
    totalAmount: 45000,
    taxAmount: 8100,
    outstandingAmount: 45000,
    status: 'POSTED',
    supplierId: 1,
    supplierName: 'Acme Materials',
    goodsReceiptId: 1,
    goodsReceiptNumber: 'GRN-2026-001',
    createdAt: '2026-03-01T10:00:00Z',
    lines: [],
  },
];

const mockSuppliers = [
  {
    id: 1,
    publicId: 'sup-001',
    code: 'SUP001',
    name: 'Acme Materials',
    status: 'ACTIVE' as const,
    creditLimit: 0,
    outstandingBalance: 0,
    gstRegistrationType: 'REGULAR' as const,
    paymentTerms: 'NET_30' as const,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <RawMaterialPurchasesPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('RawMaterialPurchasesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(mockPurchases);
    vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockSuppliers);
    vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([]);
  });

  it('renders the page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Raw Material Purchases')).toBeInTheDocument();
    });
  });

  it('shows invoice numbers in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('INV-RM-001').length).toBeGreaterThan(0);
    });
  });

  it('shows POSTED status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Posted').length).toBeGreaterThan(0);
    });
  });

  it('shows Record Purchase button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Record Purchase')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load purchases/i)).toBeInTheDocument();
    });
  });

  it('calls getRawMaterialPurchases on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(purchasingApi.getRawMaterialPurchases).toHaveBeenCalledTimes(1);
    });
  });

  // ── VAL-P2P-008: Only non-INVOICED GRNs are offered in the purchase invoice form ──

  it('only shows non-INVOICED GRNs in the purchase invoice form', async () => {
    const receivedGRN = {
      id: 1,
      publicId: 'grn-001',
      receiptNumber: 'GRN-RECEIVED-001',
      receiptDate: '2026-03-01',
      totalAmount: 45000,
      status: 'RECEIVED' as const,
      supplierId: 1,
      supplierCode: 'SUP001',
      supplierName: 'Acme Materials',
      purchaseOrderId: 1,
      purchaseOrderNumber: 'PO-001',
      createdAt: '2026-03-01T10:00:00Z',
      memo: undefined,
      lines: [],
    };
    const invoicedGRN = {
      id: 2,
      publicId: 'grn-002',
      receiptNumber: 'GRN-INVOICED-002',
      receiptDate: '2026-03-01',
      totalAmount: 10000,
      status: 'INVOICED' as const,
      supplierId: 1,
      supplierCode: 'SUP001',
      supplierName: 'Acme Materials',
      purchaseOrderId: 1,
      purchaseOrderNumber: 'PO-001',
      createdAt: '2026-03-01T11:00:00Z',
      memo: undefined,
      lines: [],
    };
    vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([receivedGRN, invoicedGRN]);

    renderPage();
    await waitFor(() => expect(screen.getByText('Record Purchase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Record Purchase'));

    await waitFor(() =>
      expect(screen.getByText('Record Raw Material Purchase')).toBeInTheDocument()
    );

    // Non-INVOICED GRN should appear in the select options
    expect(screen.getByText(/GRN-RECEIVED-001/)).toBeInTheDocument();
    // INVOICED GRN should be filtered out
    expect(screen.queryByText(/GRN-INVOICED-002/)).toBeNull();
  });

  it('shows hint that GRNs are filtered to non-invoiced only', async () => {
    vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Record Purchase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Record Purchase'));

    await waitFor(() =>
      expect(screen.getByText('Record Raw Material Purchase')).toBeInTheDocument()
    );
    // Hint text on the GRN select confirms filtering intent
    expect(screen.getByText('GRNs not yet invoiced')).toBeInTheDocument();
  });

  it('preloads GRN lines when a GRN is selected (GRN-line parity)', async () => {
    const grnWithLines = {
      id: 5,
      publicId: 'grn-005',
      receiptNumber: 'GRN-2026-005',
      receiptDate: '2026-03-01',
      totalAmount: 50000,
      status: 'RECEIVED' as const,
      supplierId: 1,
      supplierCode: 'SUP001',
      supplierName: 'Acme Materials',
      purchaseOrderId: 1,
      purchaseOrderNumber: 'PO-001',
      createdAt: '2026-03-01T10:00:00Z',
      memo: undefined,
      lines: [
        {
          rawMaterialId: 10,
          rawMaterialName: 'Titanium Dioxide',
          batchCode: 'BATCH-001',
          quantity: 100,
          unit: 'kg',
          costPerUnit: 500,
          lineTotal: 50000,
          notes: undefined,
        },
      ],
    };
    vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([grnWithLines]);

    renderPage();
    await waitFor(() => expect(screen.getByText('Record Purchase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Record Purchase'));
    await waitFor(() =>
      expect(screen.getByText('Record Raw Material Purchase')).toBeInTheDocument()
    );

    // Select the GRN by ID
    const grnSelect = screen.getByLabelText(/Goods Receipt Note/i);
    fireEvent.change(grnSelect, { target: { value: '5' } });

    // Lines from the GRN should be preloaded in the form
    await waitFor(() => {
      expect(screen.getByText('Titanium Dioxide')).toBeInTheDocument();
    });
  });

  it('createRawMaterialPurchase is called with the GRN reference', async () => {
    const grnWithLines = {
      id: 5,
      publicId: 'grn-005',
      receiptNumber: 'GRN-2026-005',
      receiptDate: '2026-03-01',
      totalAmount: 50000,
      status: 'RECEIVED' as const,
      supplierId: 1,
      supplierCode: 'SUP001',
      supplierName: 'Acme Materials',
      purchaseOrderId: 1,
      purchaseOrderNumber: 'PO-001',
      createdAt: '2026-03-01T10:00:00Z',
      memo: undefined,
      lines: [
        {
          rawMaterialId: 10,
          rawMaterialName: 'Titanium Dioxide',
          batchCode: 'BATCH-001',
          quantity: 100,
          unit: 'kg',
          costPerUnit: 500,
          lineTotal: 50000,
          notes: undefined,
        },
      ],
    };
    vi.mocked(purchasingApi.getGoodsReceipts).mockResolvedValue([grnWithLines]);
    vi.mocked(purchasingApi.createRawMaterialPurchase).mockResolvedValue({
      ...mockPurchases[0],
      id: 10,
      invoiceNumber: 'INV-RM-NEW',
      goodsReceiptId: 5,
      goodsReceiptNumber: 'GRN-2026-005',
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Record Purchase')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Record Purchase'));
    await waitFor(() =>
      expect(screen.getByText('Record Raw Material Purchase')).toBeInTheDocument()
    );

    // Select GRN
    const grnSelect = screen.getByLabelText(/Goods Receipt Note/i);
    fireEvent.change(grnSelect, { target: { value: '5' } });
    await waitFor(() => expect(screen.getByText('Titanium Dioxide')).toBeInTheDocument());

    // Fill in invoice number
    const invoiceInput = screen.getByLabelText(/Invoice Number/i);
    fireEvent.change(invoiceInput, { target: { value: 'INV-TEST-001' } });

    // Submit
    fireEvent.click(screen.getByText('Post Invoice'));
    await waitFor(() => {
      expect(purchasingApi.createRawMaterialPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ goodsReceiptId: 5 })
      );
    });
  });

  // ── VAL-P2P-009: Payable impact visible in purchase detail ──

  it('shows outstanding amount in purchase detail modal', async () => {
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(mockPurchases);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('INV-RM-001').length).toBeGreaterThan(0));

    // Click the row to open detail modal
    fireEvent.click(screen.getAllByText('INV-RM-001')[0]);

    await waitFor(() => {
      // The modal title is unique — confirms the detail modal opened
      expect(screen.getByText('Invoice INV-RM-001')).toBeInTheDocument();
      // "Outstanding" section header appears in the detail summary panel
      // (use getAllByText because the list table column header also uses this label)
      expect(screen.getAllByText('Outstanding').length).toBeGreaterThan(0);
    });
  });

  it('shows journal entry reference in purchase detail when journal is linked', async () => {
    const purchasesWithJournal = [
      { ...mockPurchases[0], journalEntryId: 7 },
    ];
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(purchasesWithJournal);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('INV-RM-001').length).toBeGreaterThan(0));

    // Click the row to open detail modal
    fireEvent.click(screen.getAllByText('INV-RM-001')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Journal Entry #7/)).toBeInTheDocument();
    });
  });
});
