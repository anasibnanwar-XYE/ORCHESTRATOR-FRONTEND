 /**
  * RawMaterialsInventoryPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
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
 });
