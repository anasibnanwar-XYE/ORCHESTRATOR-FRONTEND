 /**
  * ProductCatalogPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { ProductCatalogPage } from '../ProductCatalogPage';
 import { inventoryApi } from '@/lib/inventoryApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/inventoryApi', () => ({
   inventoryApi: {
     getProducts: vi.fn(),
     getBrands: vi.fn(),
     createProduct: vi.fn(),
     updateProduct: vi.fn(),
     archiveProduct: vi.fn(),
     createBulkVariants: vi.fn(),
   },
 }));
 
 const mockProducts = {
   content: [
     {
       id: 1,
       publicId: 'prod-001',
       brandId: 1,
       brandName: 'Acme Paints',
       brandCode: 'ACME',
       name: 'Premium Emulsion White',
       sku: 'ACME-PEW-4L',
       colors: ['White'],
       sizes: ['4L'],
       cartonSizes: [],
       unitOfMeasure: 'LITRE',
       hsnCode: '3209',
       gstRate: 18,
       active: true,
     },
     {
       id: 2,
       publicId: 'prod-002',
       brandId: 1,
       brandName: 'Acme Paints',
       brandCode: 'ACME',
       name: 'Roof Shield',
       sku: 'ACME-RS-20L',
       colors: ['White', 'Grey'],
       sizes: ['20L'],
       cartonSizes: [],
       unitOfMeasure: 'LITRE',
       hsnCode: '3209',
       gstRate: 18,
       active: false,
     },
   ],
   totalElements: 2,
   totalPages: 1,
   page: 0,
   size: 100,
 };
 
 const mockBrands = [
   { id: 1, publicId: 'brand-001', name: 'Acme Paints', code: 'ACME', active: true },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <ProductCatalogPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('ProductCatalogPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(inventoryApi.getProducts).mockResolvedValue(mockProducts);
     vi.mocked(inventoryApi.getBrands).mockResolvedValue(mockBrands);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Product Catalog')).toBeInTheDocument();
     });
   });
 
   it('shows product names in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Premium Emulsion White').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Roof Shield').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Active and Archived badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Archived').length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Product button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Product')).toBeInTheDocument();
     });
   });
 
   it('opens create modal when New Product is clicked', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Product')).toBeInTheDocument();
     });
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => {
       expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0);
     });
   });
 
   it('validates required fields on submit', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));
     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);
     await waitFor(() => {
       expect(screen.getByText('Brand is required')).toBeInTheDocument();
     });
   });
 
   it('shows Bulk Variants button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Bulk Variants')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(inventoryApi.getProducts).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load product catalog/i)).toBeInTheDocument();
     });
   });
 
   it('shows SKU in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('ACME-PEW-4L').length).toBeGreaterThan(0);
     });
   });
 });
