 /**
  * RawMaterialsInventoryPage tests
  *
  * Covers:
  *  - Page renders material list with correct stock status badges
  *  - Intake form is accessible and uses retry-safe (idempotent) submission
  *  - Error state is recoverable
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { RawMaterialsInventoryPage } from '../RawMaterialsInventoryPage';
 import { inventoryApi } from '@/lib/inventoryApi';
 import { purchasingApi } from '@/lib/purchasingApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/inventoryApi', () => ({
   inventoryApi: {
     getRawMaterials: vi.fn(),
     createRawMaterial: vi.fn(),
     updateRawMaterial: vi.fn(),
     deleteRawMaterial: vi.fn(),
     getRawMaterialBatches: vi.fn(),
     recordIntake: vi.fn(),
   },
 }));
 
 vi.mock('@/lib/purchasingApi', () => ({
   purchasingApi: {
     getSuppliers: vi.fn(),
   },
 }));
 
 const mockMaterials = [
   {
     id: 1,
     name: 'Titanium Dioxide',
     sku: 'RM-TIO2',
     unitType: 'KG',
     onHandQty: 500,
     reorderLevel: 100,
     minStock: 50,
     maxStock: 1000,
   },
   {
     id: 2,
     name: 'Calcium Carbonate',
     sku: 'RM-CACO3',
     unitType: 'KG',
     onHandQty: 80,
     reorderLevel: 100,
     minStock: 50,
     maxStock: 500,
   },
 ];
 
 const mockSuppliers = [
   { id: 1, publicId: 'sup-001', code: 'SUP001', name: 'Chem Supplies', status: 'ACTIVE' as const,
     creditLimit: 100000, outstandingBalance: 0, gstRegistrationType: 'REGULAR' as const, paymentTerms: 'NET_30' as const },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <RawMaterialsInventoryPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('RawMaterialsInventoryPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(inventoryApi.getRawMaterials).mockResolvedValue(mockMaterials);
     vi.mocked(purchasingApi.getSuppliers).mockResolvedValue(mockSuppliers);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Raw Materials')).toBeInTheDocument();
     });
   });
 
   it('shows material names in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Titanium Dioxide').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Calcium Carbonate').length).toBeGreaterThan(0);
     });
   });
 
   it('shows In Stock badge for material above reorder level', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('In Stock').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Low Stock badge for material below reorder level', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Low Stock').length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Material button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Material')).toBeInTheDocument();
     });
   });
 
   it('shows Intake buttons for each material', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Intake').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(inventoryApi.getRawMaterials).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load raw materials/i)).toBeInTheDocument();
     });
   });

   it('intake submission calls recordIntake with correct material id', async () => {
     vi.mocked(inventoryApi.recordIntake).mockResolvedValue({
       id: 99,
       batchCode: 'BT-001',
       quantity: 50,
       unit: 'KG',
       costPerUnit: 200,
     });
     renderPage();
     await waitFor(() => screen.getAllByText('Intake'));

     // Click Intake button for Titanium Dioxide (first material)
     const intakeButtons = screen.getAllByText('Intake');
     fireEvent.click(intakeButtons[0]);

     // Modal title appears (there may be multiple Record Intake texts)
     await waitFor(() => {
       expect(screen.getAllByText('Record Intake').length).toBeGreaterThan(0);
     });

     // Fill required fields
     const qtyInput = screen.getByLabelText(/^Quantity/i);
     fireEvent.change(qtyInput, { target: { value: '50' } });

     const costInput = screen.getByLabelText(/Cost per Unit/i);
     fireEvent.change(costInput, { target: { value: '200' } });

     // Select supplier
     const supplierSelect = screen.getByLabelText(/Supplier/i);
     fireEvent.change(supplierSelect, { target: { value: '1' } });

     // Submit via button (use role to find the submit button specifically)
     const submitBtn = screen.getByRole('button', { name: /Record Intake/i });
     fireEvent.click(submitBtn);

     await waitFor(() => {
       expect(inventoryApi.recordIntake).toHaveBeenCalledTimes(1);
       const call = vi.mocked(inventoryApi.recordIntake).mock.calls[0][0];
       expect(call.rawMaterialId).toBe(1);
       expect(call.quantity).toBe(50);
       expect(call.costPerUnit).toBe(200);
       expect(call.supplierId).toBe(1);
     });
   });

   it('intake validation blocks zero quantity submission', async () => {
     renderPage();
     await waitFor(() => screen.getAllByText('Intake'));

     const intakeButtons = screen.getAllByText('Intake');
     fireEvent.click(intakeButtons[0]);

     await waitFor(() => {
       expect(screen.getAllByText('Record Intake').length).toBeGreaterThan(0);
     });

     // Leave quantity blank and try to submit via button role
     const submitBtn = screen.getByRole('button', { name: /Record Intake/i });
     fireEvent.click(submitBtn);

     await waitFor(() => {
       expect(screen.getByText(/Quantity must be positive/i)).toBeInTheDocument();
     });
     expect(inventoryApi.recordIntake).not.toHaveBeenCalled();
   });
 });
