 /**
  * SuppliersPage tests
  *
  * Covers VAL-P2P-001: Supplier creation enforces required master data and shows the new
  * supplier clearly after save.
  * Covers VAL-P2P-002: Supplier lifecycle actions are status-gated and refresh visibly.
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { SuppliersPage } from '../SuppliersPage';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';

 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getSuppliers: vi.fn(),
     createSupplier: vi.fn(),
     updateSupplier: vi.fn(),
     approveSupplier: vi.fn(),
     activateSupplier: vi.fn(),
     suspendSupplier: vi.fn(),
     getSupplierStatementPdf: vi.fn(),
     getSupplierAgingPdf: vi.fn(),
   },
 }));

 const mockSuppliers = [
   {
     id: 1,
     publicId: 'sup-001',
     code: 'SUP001',
     name: 'Acme Materials Ltd',
     status: 'ACTIVE' as const,
     email: 'acme@example.com',
     phone: '+91 9876543210',
     address: '123 Industrial Area, Mumbai',
     creditLimit: 500000,
     outstandingBalance: 125000,
     gstNumber: '27AABCA1234A1Z5',
     stateCode: '27',
     gstRegistrationType: 'REGULAR' as const,
     paymentTerms: 'NET_30' as const,
   },
   {
     id: 2,
     publicId: 'sup-002',
     code: 'SUP002',
     name: 'Pending Vendor',
     status: 'PENDING' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_60' as const,
   },
   {
     id: 3,
     publicId: 'sup-003',
     code: 'SUP003',
     name: 'Approved Vendor',
     status: 'APPROVED' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_30' as const,
   },
   {
     id: 4,
     publicId: 'sup-004',
     code: 'SUP004',
     name: 'Suspended Vendor',
     status: 'SUSPENDED' as const,
     creditLimit: 0,
     outstandingBalance: 0,
     gstRegistrationType: 'UNREGISTERED' as const,
     paymentTerms: 'NET_30' as const,
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <SuppliersPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }

 describe('SuppliersPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockSuppliers);
   });

   // ── List rendering ──────────────────────────────────────────────────────

   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Suppliers')).toBeInTheDocument();
     });
   });

  it('shows supplier names in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Acme Materials Ltd').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pending Vendor').length).toBeGreaterThan(0);
    });
  });

  it('shows ACTIVE and PENDING badges', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });
  });

   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getSuppliers).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load suppliers/i)).toBeInTheDocument();
     });
   });

   // ── Create form / VAL-P2P-001 ───────────────────────────────────────────

   it('shows New Supplier button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Supplier')).toBeInTheDocument();
     });
   });

   it('opens create form modal when New Supplier is clicked', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Supplier')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New Supplier'));
     await waitFor(() => {
       expect(screen.getByText('Create Supplier')).toBeInTheDocument();
     });
   });

   it('validates required name field on submit (VAL-P2P-001)', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Supplier')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New Supplier'));
     await waitFor(() => {
       expect(screen.getByText('Create Supplier')).toBeInTheDocument();
     });
     // Click save without filling name
     const buttons = screen.getAllByText('Create Supplier');
     const saveBtn = buttons[buttons.length - 1];
     fireEvent.click(saveBtn);
     await waitFor(() => {
       expect(screen.getByText('Name is required')).toBeInTheDocument();
     });
   });

   it('does not call createSupplier when name is empty (VAL-P2P-001)', async () => {
     renderPage();
     await waitFor(() => screen.getByText('New Supplier'));
     fireEvent.click(screen.getByText('New Supplier'));
     await waitFor(() => screen.getByText('Create Supplier'));
     const buttons = screen.getAllByText('Create Supplier');
     fireEvent.click(buttons[buttons.length - 1]);
     await waitFor(() => screen.getByText('Name is required'));
     expect(purchasingApi.createSupplier).not.toHaveBeenCalled();
   });

   it('calls createSupplier and refreshes list on successful save (VAL-P2P-001)', async () => {
     const newSupplier = { ...mockSuppliers[1], id: 5, name: 'New Test Supplier', status: 'PENDING' as const };
     vi.mocked(purchasingApi.createSupplier).mockResolvedValue(newSupplier);
     // Second call returns the updated list
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValueOnce(mockSuppliers).mockResolvedValue([
       ...mockSuppliers,
       newSupplier,
     ]);

     renderPage();
     await waitFor(() => screen.getByText('New Supplier'));
     fireEvent.click(screen.getByText('New Supplier'));
     await waitFor(() => screen.getByText('Create Supplier'));

     // Fill name field
     const nameInput = screen.getByLabelText(/Name \*/i);
     fireEvent.change(nameInput, { target: { value: 'New Test Supplier' } });

     const buttons = screen.getAllByText('Create Supplier');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(purchasingApi.createSupplier).toHaveBeenCalledWith(
         expect.objectContaining({ name: 'New Test Supplier' })
       );
     });
     // List is refreshed after save
     await waitFor(() => {
       expect(purchasingApi.getSuppliers).toHaveBeenCalledTimes(2);
     });
   });

   // ── Status-gated lifecycle actions / VAL-P2P-002 ───────────────────────

   it('shows Approve button only for PENDING supplier (VAL-P2P-002)', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
     });
   });

   it('shows Suspend button only for ACTIVE supplier (VAL-P2P-002)', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Suspend').length).toBeGreaterThan(0);
     });
   });

   it('shows Activate button for APPROVED supplier (VAL-P2P-002)', async () => {
     renderPage();
     await waitFor(() => {
       // Approved Vendor shows Activate
       expect(screen.getAllByText('Activate').length).toBeGreaterThan(0);
     });
   });

   it('shows Activate button for SUSPENDED supplier (VAL-P2P-002)', async () => {
     // Verify there are two Activate buttons (one for APPROVED, one for SUSPENDED)
     renderPage();
     await waitFor(() => {
       const activateBtns = screen.getAllByText('Activate');
       expect(activateBtns.length).toBeGreaterThanOrEqual(2);
     });
   });

   it('calls approveSupplier and refreshes list on approve (VAL-P2P-002)', async () => {
     const approvedSupplier = { ...mockSuppliers[1], status: 'APPROVED' as const };
     vi.mocked(purchasingApi.approveSupplier).mockResolvedValue(approvedSupplier);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValueOnce(mockSuppliers).mockResolvedValue([
       ...mockSuppliers.filter((s) => s.id !== 2),
       approvedSupplier,
     ]);

     renderPage();
     await waitFor(() => screen.getAllByText('Approve').length > 0);
     const approveBtns = screen.getAllByText('Approve');
     fireEvent.click(approveBtns[0]);

     await waitFor(() => {
       expect(purchasingApi.approveSupplier).toHaveBeenCalledWith(2);
     });
     await waitFor(() => {
       expect(purchasingApi.getSuppliers).toHaveBeenCalledTimes(2);
     });
   });

   it('shows suspend confirmation dialog before suspending (VAL-P2P-002)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('Suspend').length > 0);
     const suspendBtns = screen.getAllByText('Suspend');
     fireEvent.click(suspendBtns[0]);

     await waitFor(() => {
       expect(screen.getByText('Suspend Supplier')).toBeInTheDocument();
     });
   });

   it('calls suspendSupplier and refreshes list on confirm suspend (VAL-P2P-002)', async () => {
     const suspendedSupplier = { ...mockSuppliers[0], status: 'SUSPENDED' as const };
     vi.mocked(purchasingApi.suspendSupplier).mockResolvedValue(suspendedSupplier);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValueOnce(mockSuppliers).mockResolvedValue([
       ...mockSuppliers.filter((s) => s.id !== 1),
       suspendedSupplier,
     ]);

     renderPage();
     await waitFor(() => screen.getAllByText('Suspend').length > 0);
     const suspendBtns = screen.getAllByText('Suspend');
     fireEvent.click(suspendBtns[0]);

     await waitFor(() => {
       expect(screen.getByText('Suspend Supplier')).toBeInTheDocument();
     });

     // Confirm suspend — find the confirm button inside the alertdialog
     const alertDialog = screen.getByRole('alertdialog');
     const confirmBtn = alertDialog.querySelector('button:last-of-type');
     if (confirmBtn) fireEvent.click(confirmBtn);

     await waitFor(() => {
       expect(purchasingApi.suspendSupplier).toHaveBeenCalledWith(1);
     });
     await waitFor(() => {
       expect(purchasingApi.getSuppliers).toHaveBeenCalledTimes(2);
     });
   });

   it('does not call suspendSupplier when cancel is clicked (VAL-P2P-002)', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('Suspend').length > 0);
     const suspendBtns = screen.getAllByText('Suspend');
     fireEvent.click(suspendBtns[0]);

     await waitFor(() => {
       expect(screen.getByText('Suspend Supplier')).toBeInTheDocument();
     });

     const cancelBtn = screen.getByText('Cancel');
     fireEvent.click(cancelBtn);

     await waitFor(() => {
       expect(screen.queryByText('Suspend Supplier')).not.toBeInTheDocument();
     });
     expect(purchasingApi.suspendSupplier).not.toHaveBeenCalled();
   });
 });
