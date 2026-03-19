/**
 * PurchaseReturnsPage tests
 *
 * Covers:
 *  VAL-P2P-010: Return quantities are capped at the original GRN line quantity;
 *               outstanding balance context is visible and updates after a return.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseReturnsPage } from '../PurchaseReturnsPage';
import { purchasingApi } from '@/lib/purchasingApi';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/purchasingApi', () => ({
  purchasingApi: {
    getRawMaterialPurchases: vi.fn(),
    getSuppliers: vi.fn(),
    createPurchaseReturn: vi.fn(),
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
    lines: [
      {
        rawMaterialId: 10,
        rawMaterialName: 'Titanium Dioxide',
        quantity: 100,
        unit: 'kg',
        costPerUnit: 450,
        lineTotal: 45000,
      },
    ],
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
        <PurchaseReturnsPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('PurchaseReturnsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockResolvedValue(mockPurchases);
    vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockSuppliers);
  });

  it('renders the page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Purchase Returns')).toBeInTheDocument();
    });
  });

  it('renders the return form with supplier select', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Supplier *')).toBeInTheDocument();
    });
  });

  it('renders the Process Return button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Process Return')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(purchasingApi.getRawMaterialPurchases).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    });
  });

  // ── VAL-P2P-010: Return cap and outstanding balance visibility ──

  it('shows max-quantity hint when a material is selected', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Supplier *')).toBeInTheDocument());

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    // Select purchase invoice
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '1' } });

    // Select material — triggers unit cost auto-fill and max hint
    const materialSelect = screen.getByLabelText(/Material/i);
    fireEvent.change(materialSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText(/Max: 100/)).toBeInTheDocument();
    });
  });

  it('blocks over-quantity return and keeps form open (VAL-P2P-010)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Supplier *')).toBeInTheDocument());

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    // Select purchase invoice
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '1' } });

    // Select material
    const materialSelect = screen.getByLabelText(/Material/i);
    fireEvent.change(materialSelect, { target: { value: '10' } });

    // Enter quantity over the maximum (100)
    const qtyInput = screen.getByLabelText(/Return Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '999' } });

    // Attempt to submit
    fireEvent.click(screen.getByText('Process Return'));

    await waitFor(() => {
      expect(screen.getByText(/Max returnable: 100/i)).toBeInTheDocument();
    });
    // The API must NOT have been called — form stays open
    expect(purchasingApi.createPurchaseReturn).not.toHaveBeenCalled();
    // Form is still present
    expect(screen.getByText('Process Return')).toBeInTheDocument();
  });

  it('shows outstanding balance context for the selected purchase invoice', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Supplier *')).toBeInTheDocument());

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    // Select purchase invoice
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '1' } });

    await waitFor(() => {
      // Outstanding context section should appear
      expect(screen.getByText(/Current outstanding on invoice/i)).toBeInTheDocument();
    });
  });

  it('refreshes purchases list after a successful return', async () => {
    const mockJournal = {
      id: 42,
      publicId: 'jrnl-042',
      referenceNumber: 'JE-REV-042',
      entryDate: '2026-03-01',
      memo: 'Purchase return',
      status: 'POSTED',
      dealerId: null,
      dealerName: null,
      supplierId: 1,
      supplierName: 'Acme Materials',
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
    vi.mocked(purchasingApi.createPurchaseReturn).mockResolvedValue(mockJournal);

    renderPage();
    await waitFor(() => expect(screen.getByText('Supplier *')).toBeInTheDocument());

    // Select supplier
    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });

    // Select purchase invoice
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '1' } });

    // Select material
    const materialSelect = screen.getByLabelText(/Material/i);
    fireEvent.change(materialSelect, { target: { value: '10' } });

    // Enter a valid return quantity (within the max of 100)
    const qtyInput = screen.getByLabelText(/Return Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '10' } });

    // Submit
    fireEvent.click(screen.getByText('Process Return'));

    await waitFor(() => {
      expect(purchasingApi.createPurchaseReturn).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 10, rawMaterialId: 10, purchaseId: 1 })
      );
      // List is refreshed after success — getRawMaterialPurchases called again
      expect(purchasingApi.getRawMaterialPurchases).toHaveBeenCalledTimes(2);
    });
  });

  it('shows return result banner with journal reference after success', async () => {
    const mockJournal = {
      id: 42,
      publicId: 'jrnl-042',
      referenceNumber: 'JE-REV-042',
      entryDate: '2026-03-01',
      memo: 'Purchase return',
      status: 'POSTED',
      dealerId: null,
      dealerName: null,
      supplierId: 1,
      supplierName: 'Acme Materials',
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
    vi.mocked(purchasingApi.createPurchaseReturn).mockResolvedValue(mockJournal);

    renderPage();
    await waitFor(() => expect(screen.getByText('Supplier *')).toBeInTheDocument());

    const supplierSelect = screen.getByLabelText(/Supplier/i);
    fireEvent.change(supplierSelect, { target: { value: '1' } });
    const purchaseSelect = screen.getByLabelText(/Purchase Invoice/i);
    fireEvent.change(purchaseSelect, { target: { value: '1' } });
    const materialSelect = screen.getByLabelText(/Material/i);
    fireEvent.change(materialSelect, { target: { value: '10' } });
    const qtyInput = screen.getByLabelText(/Return Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '5' } });

    fireEvent.click(screen.getByText('Process Return'));

    await waitFor(() => {
      // Result banner shows success message with journal reference
      expect(screen.getByText(/Return processed/i)).toBeInTheDocument();
      expect(screen.getByText(/Journal entry #42 created/i)).toBeInTheDocument();
    });
  });
});
