 /**
  * SuppliersPage tests
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
 
   it('shows Approve button for PENDING supplier', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Suspend button for ACTIVE supplier', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Suspend').length).toBeGreaterThan(0);
     });
   });
 
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
 
   it('shows error state on API failure', async () => {
     vi.mocked(purchasingApi.getSuppliers).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load suppliers/i)).toBeInTheDocument();
     });
   });
 
   it('validates required name field on submit', async () => {
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
 });
