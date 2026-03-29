 /**
  * PurchaseOrdersPage tests
  *
  * Covers VAL-P2P-003: Purchase order create is limited to active suppliers and valid unique
  * positive lines.
  * Covers VAL-P2P-004: Purchase order approve, void, and close actions follow the documented
  * state machine and keep timeline metadata intact.
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { PurchaseOrdersPage } from '../PurchaseOrdersPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getPurchaseOrders: vi.fn(),
     getSuppliers: vi.fn(),
     getRawMaterials: vi.fn(),
     createPurchaseOrder: vi.fn(),
     approvePurchaseOrder: vi.fn(),
     voidPurchaseOrder: vi.fn(),
     closePurchaseOrder: vi.fn(),
     getPurchaseOrderTimeline: vi.fn(),
   },
 }));

 const mockOrders = [
   {
     id: 1,
     publicId: 'po-001',
     orderNumber: 'PO-2026-001',
     orderDate: '2026-03-01',
     totalAmount: 50000,
     status: 'DRAFT' as const,
     supplierName: 'Acme Materials',
     supplierId: 1,
     createdAt: '2026-03-01T10:00:00Z',
     lines: [
       {
         rawMaterialId: 1,
         rawMaterialName: 'Steel Rod',
         quantity: 100,
         unit: 'KG',
         costPerUnit: 500,
         lineTotal: 50000,
       },
     ],
   },
   {
     id: 2,
     publicId: 'po-002',
     orderNumber: 'PO-2026-002',
     orderDate: '2026-03-05',
     totalAmount: 80000,
     status: 'APPROVED' as const,
     supplierName: 'Beta Chemicals',
     supplierId: 2,
     createdAt: '2026-03-05T10:00:00Z',
     lines: [],
   },
   {
     id: 3,
     publicId: 'po-003',
     orderNumber: 'PO-2026-003',
     orderDate: '2026-03-10',
     totalAmount: 30000,
     status: 'INVOICED' as const,
     supplierName: 'Gamma Supplies',
     supplierId: 3,
     createdAt: '2026-03-10T10:00:00Z',
     lines: [],
   },
 ];

 const mockActiveSuppliers = [
   {
     id: 1,
     publicId: 'sup-001',
     code: 'SUP001',
     name: 'Active Supplier A',
     status: 'ACTIVE' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_30' as const,
   },
 ];

 const mockAllSuppliers = [
   ...mockActiveSuppliers,
   {
     id: 2,
     publicId: 'sup-002',
     code: 'SUP002',
     name: 'Pending Supplier B',
     status: 'PENDING' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_30' as const,
   },
   {
     id: 3,
     publicId: 'sup-003',
     code: 'SUP003',
     name: 'Suspended Supplier C',
     status: 'SUSPENDED' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_30' as const,
   },
 ];

 const mockMaterials = [
   { id: 1, name: 'Steel Rod', code: 'MAT001', unit: 'KG', onHandQty: 200 },
   { id: 2, name: 'Copper Wire', code: 'MAT002', unit: 'M', onHandQty: 500 },
 ];

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <PurchaseOrdersPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('PurchaseOrdersPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getPurchaseOrders).mockResolvedValue(mockOrders);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockAllSuppliers);
     vi.mocked(purchasingApi.getRawMaterials).mockResolvedValue(mockMaterials);
   });

   // ── List rendering ──────────────────────────────────────────────────────

   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
     });
   });

  it('shows PO order numbers in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('PO-2026-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('PO-2026-002').length).toBeGreaterThan(0);
    });
  });

  it('shows DRAFT and APPROVED status badges', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    });
  });

   it('shows New PO button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New PO')).toBeInTheDocument();
     });
   });

   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getPurchaseOrders).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load purchase orders/i)).toBeInTheDocument();
     });
   });

   it('calls getPurchaseOrders on mount', async () => {
     renderPage();
     await waitFor(() => {
       expect(purchasingApi.getPurchaseOrders).toHaveBeenCalledTimes(1);
     });
   });

   // ── Create PO modal / VAL-P2P-003 ─────────────────────────────────────

   it('opens create PO modal when New PO is clicked', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New PO')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => {
       expect(screen.getByText('New Purchase Order')).toBeInTheDocument();
     });
   });

   it('supplier dropdown only shows ACTIVE suppliers (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     // Active supplier should be present
     expect(screen.getByText('Active Supplier A')).toBeInTheDocument();
     // Pending and Suspended suppliers must NOT appear in the dropdown
     expect(screen.queryByText('Pending Supplier B')).not.toBeInTheDocument();
     expect(screen.queryByText('Suspended Supplier C')).not.toBeInTheDocument();
   });

   it('blocks submit when supplier is not selected (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     const buttons = screen.getAllByText('Create Draft PO');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('Select a supplier')).toBeInTheDocument();
     });
     expect(purchasingApi.createPurchaseOrder).not.toHaveBeenCalled();
   });

   it('blocks submit when order number is empty (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     // Select supplier
     const supplierSelect = screen.getByLabelText(/Supplier \*/i);
     fireEvent.change(supplierSelect, { target: { value: '1' } });

     // Clear order number if pre-filled (just leave blank)
     const orderNumberInput = screen.getByLabelText(/Order Number \*/i);
     fireEvent.change(orderNumberInput, { target: { value: '' } });

     const buttons = screen.getAllByText('Create Draft PO');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('Order number is required')).toBeInTheDocument();
     });
   });

   it('blocks line with non-positive quantity (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     // Select supplier
     const supplierSelect = screen.getByLabelText(/Supplier \*/i);
     fireEvent.change(supplierSelect, { target: { value: '1' } });

     const orderNumberInput = screen.getByLabelText(/Order Number \*/i);
     fireEvent.change(orderNumberInput, { target: { value: 'PO-TEST-001' } });

     // Set quantity to 0 (non-positive)
     const qtyInputs = screen.getAllByLabelText(/Qty \*/i);
     fireEvent.change(qtyInputs[0], { target: { value: '0' } });

     const buttons = screen.getAllByText('Create Draft PO');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('Qty must be > 0')).toBeInTheDocument();
     });
     expect(purchasingApi.createPurchaseOrder).not.toHaveBeenCalled();
   });

   it('blocks line with non-positive cost per unit (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     const supplierSelect = screen.getByLabelText(/Supplier \*/i);
     fireEvent.change(supplierSelect, { target: { value: '1' } });

     const orderNumberInput = screen.getByLabelText(/Order Number \*/i);
     fireEvent.change(orderNumberInput, { target: { value: 'PO-TEST-001' } });

     const qtyInputs = screen.getAllByLabelText(/Qty \*/i);
     fireEvent.change(qtyInputs[0], { target: { value: '10' } });

     const costInputs = screen.getAllByLabelText(/Cost\/Unit \*/i);
     fireEvent.change(costInputs[0], { target: { value: '0' } });

     const buttons = screen.getAllByText('Create Draft PO');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('Cost must be > 0')).toBeInTheDocument();
     });
     expect(purchasingApi.createPurchaseOrder).not.toHaveBeenCalled();
   });

   it('blocks duplicate material lines (VAL-P2P-003)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New PO'));
     fireEvent.click(screen.getByText('New PO'));
     await waitFor(() => screen.getByText('New Purchase Order'));

     const supplierSelect = screen.getByLabelText(/Supplier \*/i);
     fireEvent.change(supplierSelect, { target: { value: '1' } });

     const orderNumberInput = screen.getByLabelText(/Order Number \*/i);
     fireEvent.change(orderNumberInput, { target: { value: 'PO-TEST-DUP' } });

     // Add a second line
     const addLineBtn = screen.getByText('Add Line');
     fireEvent.click(addLineBtn);

     await waitFor(() => {
       // Two material selects should now be present
       const materialSelects = screen.getAllByLabelText(/Material \*/i);
       expect(materialSelects.length).toBeGreaterThanOrEqual(1);
     });

     // Select the same material in both lines
     const allSelects = screen.getAllByDisplayValue('Select material…');
     if (allSelects.length >= 2) {
       fireEvent.change(allSelects[0], { target: { value: '1' } });
       fireEvent.change(allSelects[1], { target: { value: '1' } });
     }

     const buttons = screen.getAllByText('Create Draft PO');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText(/Duplicate material/i)).toBeInTheDocument();
     });
     expect(purchasingApi.createPurchaseOrder).not.toHaveBeenCalled();
   });

   // ── PO lifecycle actions / VAL-P2P-004 ────────────────────────────────

   it('shows Approve and Void actions in detail modal for DRAFT PO (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     // Click on the DRAFT order row to open detail
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => {
       // Approve and Void buttons should be visible for DRAFT
       expect(screen.getByText('Approve')).toBeInTheDocument();
       expect(screen.getByText('Void')).toBeInTheDocument();
     });
   });

   it('shows only Void action for APPROVED PO (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-002').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-002')[0]);

     await waitFor(() => {
       // For APPROVED, only Void is valid (no Approve, no Close)
       expect(screen.getByText('Void')).toBeInTheDocument();
       // Approve should not appear for APPROVED status
       expect(screen.queryByText('Approve')).not.toBeInTheDocument();
       // Close Order should not appear for APPROVED (only valid from INVOICED)
       expect(screen.queryByText('Close Order')).not.toBeInTheDocument();
     });
   });

   it('shows only Close Order action for INVOICED PO (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-003').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-003')[0]);

     await waitFor(() => {
       expect(screen.getByText('Close Order')).toBeInTheDocument();
       expect(screen.queryByText('Approve')).not.toBeInTheDocument();
       expect(screen.queryByText('Void')).not.toBeInTheDocument();
     });
   });

   it('calls approvePurchaseOrder and refreshes list on approve (VAL-P2P-004)', async () => {
     const approvedOrder = { ...mockOrders[0], status: 'APPROVED' as const };
     vi.mocked(purchasingApi.approvePurchaseOrder).mockResolvedValue(approvedOrder);
     vi.mocked(purchasingApi.getPurchaseOrders)
       .mockResolvedValueOnce(mockOrders)
       .mockResolvedValue([...mockOrders.filter((o) => o.id !== 1), approvedOrder]);

     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => screen.getByText('Approve'));
     fireEvent.click(screen.getByText('Approve'));

     await waitFor(() => {
       expect(purchasingApi.approvePurchaseOrder).toHaveBeenCalledWith(1);
     });
     await waitFor(() => {
       expect(purchasingApi.getPurchaseOrders).toHaveBeenCalledTimes(2);
     });
   });

   it('opens void reason modal on Void click (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => screen.getByText('Void'));
     fireEvent.click(screen.getByText('Void'));

     await waitFor(() => {
       expect(screen.getByText('Void Purchase Order')).toBeInTheDocument();
       expect(screen.getByText('Void Order')).toBeInTheDocument();
     });
   });

   it('void modal captures structured reason code (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => screen.getByText('Void'));
     fireEvent.click(screen.getByText('Void'));

     await waitFor(() => screen.getByText('Void Purchase Order'));

     // Reason Code select should be present
     expect(screen.getByLabelText(/Reason Code \*/i)).toBeInTheDocument();
   });

   it('calls voidPurchaseOrder with reason data and refreshes list (VAL-P2P-004)', async () => {
     const voidedOrder = { ...mockOrders[0], status: 'VOID' as const };
     vi.mocked(purchasingApi.voidPurchaseOrder).mockResolvedValue(voidedOrder);
     vi.mocked(purchasingApi.getPurchaseOrders)
       .mockResolvedValueOnce(mockOrders)
       .mockResolvedValue([...mockOrders.filter((o) => o.id !== 1), voidedOrder]);

     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => screen.getByText('Void'));
     fireEvent.click(screen.getByText('Void'));

     await waitFor(() => screen.getByText('Void Purchase Order'));
     fireEvent.click(screen.getByText('Void Order'));

     await waitFor(() => {
       expect(purchasingApi.voidPurchaseOrder).toHaveBeenCalledWith(
         1,
         expect.objectContaining({ reasonCode: expect.any(String) })
       );
     });
     await waitFor(() => {
       expect(purchasingApi.getPurchaseOrders).toHaveBeenCalledTimes(2);
     });
   });

   it('shows timeline button in detail modal (VAL-P2P-004)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => {
       expect(screen.getByText('View Timeline')).toBeInTheDocument();
     });
   });

   it('loads and shows timeline entries when View Timeline is clicked (VAL-P2P-004)', async () => {
     const mockTimeline = [
       {
         id: 1,
         fromStatus: undefined,
         toStatus: 'DRAFT',
         changedBy: 'user@example.com',
         changedAt: '2026-03-01T10:00:00Z',
       },
       {
         id: 2,
         fromStatus: 'DRAFT',
         toStatus: 'APPROVED',
         changedBy: 'user@example.com',
         changedAt: '2026-03-02T10:00:00Z',
       },
     ];
     vi.mocked(purchasingApi.getPurchaseOrderTimeline).mockResolvedValue(mockTimeline);

     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-001').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-001')[0]);

     await waitFor(() => screen.getByText('View Timeline'));
     fireEvent.click(screen.getByText('View Timeline'));

     await waitFor(() => {
       expect(screen.getByText('Order Timeline')).toBeInTheDocument();
       expect(purchasingApi.getPurchaseOrderTimeline).toHaveBeenCalledWith(1);
     });
   });

   it('calls closePurchaseOrder and refreshes list on close (VAL-P2P-004)', async () => {
     const closedOrder = { ...mockOrders[2], status: 'CLOSED' as const };
     vi.mocked(purchasingApi.closePurchaseOrder).mockResolvedValue(closedOrder);
     vi.mocked(purchasingApi.getPurchaseOrders)
       .mockResolvedValueOnce(mockOrders)
       .mockResolvedValue([...mockOrders.filter((o) => o.id !== 3), closedOrder]);

     renderPage();
     await waitFor(() => screen.getAllByText('PO-2026-003').length > 0);
     fireEvent.click(screen.getAllByText('PO-2026-003')[0]);

     await waitFor(() => screen.getByText('Close Order'));
     fireEvent.click(screen.getByText('Close Order'));

     await waitFor(() => {
       expect(purchasingApi.closePurchaseOrder).toHaveBeenCalledWith(3);
     });
     await waitFor(() => {
       expect(purchasingApi.getPurchaseOrders).toHaveBeenCalledTimes(2);
     });
   });
 });
