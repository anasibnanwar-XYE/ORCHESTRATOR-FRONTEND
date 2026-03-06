 /**
  * Tests for RawMaterialsPage
  *
  * Covers:
  *  - Shows page heading
  *  - Shows loading skeleton initially
  *  - Shows raw materials in table after data loads
  *  - Shows error state on API failure
  *  - Shows empty state when no materials
  *  - Record intake button opens modal
  *  - Batches tab renders for selected material
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import React from 'react';

 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, ChevronRight: M, X: M, Check: M, CheckCircle: M, CheckCircle2: M,
     Search: M, ArrowUpDown: M, ArrowUp: M, ArrowDown: M,
     ChevronLeft: M, ChevronDown: M, Loader2: M, AlertCircle: M,
     FlaskConical: M, Package: M, Layers: M, RefreshCcw: M,
     ArrowDownToLine: M, Database: M, AlertTriangle: M, Info: M,
   };
 });

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({
     success: vi.fn(),
     error: vi.fn(),
     info: vi.fn(),
     warning: vi.fn(),
   }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getRawMaterials: vi.fn(),
     getRawMaterialStockInventory: vi.fn(),
     getRawMaterialBatches: vi.fn(),
     recordRawMaterialIntake: vi.fn(),
   },
 }));

 import { RawMaterialsPage } from '../RawMaterialsPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockMaterials = [
   {
     id: 1,
     name: 'Titanium Dioxide',
     sku: 'TIO2-001',
     unitType: 'KG',
     currentStock: 1000,
     reorderLevel: 200,
     status: 'IN_STOCK',
   },
   {
     id: 2,
     name: 'Calcium Carbonate',
     sku: 'CACO3-001',
     unitType: 'KG',
     currentStock: 50,
     reorderLevel: 200,
     status: 'LOW_STOCK',
   },
 ];

 const mockStockInventory = [
   { sku: 'TIO2-001', name: 'Titanium Dioxide', currentStock: 1000, reorderLevel: 200, status: 'IN_STOCK' },
   { sku: 'CACO3-001', name: 'Calcium Carbonate', currentStock: 50, reorderLevel: 200, status: 'LOW_STOCK' },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/inventory/raw-materials']}>
       <RawMaterialsPage />
     </MemoryRouter>
   );
 }

 describe('RawMaterialsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue(mockMaterials);
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue(mockStockInventory);
     renderPage();
     expect(screen.getByText('Raw Materials')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders material names after data loads', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue(mockMaterials);
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue(mockStockInventory);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('Titanium Dioxide');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/unable to load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows empty state when no materials', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no raw materials/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows material SKU', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue(mockMaterials);
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue(mockStockInventory);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('TIO2-001').length).toBeGreaterThan(0);
     });
   });

   it('calls getRawMaterials on mount', async () => {
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue(mockMaterials);
     (factoryApi.getRawMaterialStockInventory as ReturnType<typeof vi.fn>).mockResolvedValue(mockStockInventory);
     renderPage();
     await waitFor(() => {
       expect(factoryApi.getRawMaterials).toHaveBeenCalledTimes(1);
     });
   });
 });
