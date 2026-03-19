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

   // ── VAL-O2C-001: Product create enforces all required fields ─────────────

   it('blocks product creation when product name is missing', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     // Fill brand but leave name empty
     const brandSelect = screen.getByLabelText('Brand *');
     fireEvent.change(brandSelect, { target: { value: '1' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('Product name is required')).toBeInTheDocument();
     });
     // API should not be called when validation fails
     expect(inventoryApi.createProduct).not.toHaveBeenCalled();
   });

   it('blocks product creation when HSN code is missing', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     // Fill brand and name but leave HSN empty
     const brandSelect = screen.getByLabelText('Brand *');
     fireEvent.change(brandSelect, { target: { value: '1' } });
     const nameInput = screen.getByPlaceholderText('e.g. Premium Emulsion');
     fireEvent.change(nameInput, { target: { value: 'Test Product' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText('HSN code is required')).toBeInTheDocument();
     });
     expect(inventoryApi.createProduct).not.toHaveBeenCalled();
   });

   it('calls createProduct API with all required fields when form is valid', async () => {
     vi.mocked(inventoryApi.createProduct).mockResolvedValue({
       id: 3,
       publicId: 'prod-003',
       brandId: 1,
       brandName: 'Acme Paints',
       brandCode: 'ACME',
       name: 'New Product',
       sku: 'ACME-NP-1L',
       colors: [],
       sizes: [],
       cartonSizes: [],
       unitOfMeasure: 'LITRE',
       hsnCode: '3209',
       gstRate: 18,
       active: true,
     });

     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     // Fill all required fields
     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'New Product' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. 3209'), { target: { value: '3209' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(inventoryApi.createProduct).toHaveBeenCalledWith(
         expect.objectContaining({
           brandId: 1,
           name: 'New Product',
           hsnCode: '3209',
         })
       );
     });
   });

   // ── VAL-O2C-002: Duplicate SKU conflicts are shown clearly ───────────────

   it('shows specific duplicate SKU error when backend returns BUS_002 on create', async () => {
     vi.mocked(inventoryApi.createProduct).mockRejectedValue({
       response: { data: { message: 'BUS_002: Duplicate SKU detected for the given brand and product name.' } },
     });

     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     // Fill all required fields with a product that has a duplicate SKU
     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'Premium Emulsion White' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. 3209'), { target: { value: '3209' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText(/A product with this SKU already exists/i)).toBeInTheDocument();
     });
     // Catalog should not be reloaded after a failed create (getProducts called once at load only)
     expect(inventoryApi.getProducts).toHaveBeenCalledTimes(1);
   });

   it('shows specific duplicate SKU error when backend returns "Duplicate" keyword on create', async () => {
     vi.mocked(inventoryApi.createProduct).mockRejectedValue({
       response: { data: { message: 'Duplicate product name for this brand.' } },
     });

     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'Premium Emulsion White' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. 3209'), { target: { value: '3209' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       // Should show the specific duplicate SKU message, not the generic error
       expect(screen.getByText(/A product with this SKU already exists/i)).toBeInTheDocument();
       expect(screen.queryByText(/Failed to create product/i)).not.toBeInTheDocument();
     });
   });

   it('shows generic error for non-duplicate failures on create', async () => {
     vi.mocked(inventoryApi.createProduct).mockRejectedValue({
       response: { data: { message: 'Internal server error.' } },
     });

     renderPage();
     await waitFor(() => expect(screen.getByText('New Product')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Product'));
     await waitFor(() => expect(screen.getAllByText('Create Product').length).toBeGreaterThan(0));

     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'Any Product' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. 3209'), { target: { value: '3209' } });

     const buttons = screen.getAllByText('Create Product');
     fireEvent.click(buttons[buttons.length - 1]);

     await waitFor(() => {
       expect(screen.getByText(/Failed to create product/i)).toBeInTheDocument();
       expect(screen.queryByText(/A product with this SKU already exists/i)).not.toBeInTheDocument();
     });
   });

   // ── VAL-O2C-003: Bulk variant generation ────────────────────────────────

   it('validates required fields in bulk variant generator before generating', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('Bulk Variants')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Bulk Variants'));

     await waitFor(() => expect(screen.getByText('Generate Variants')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Generate Variants'));

     await waitFor(() => {
       expect(screen.getByText('Brand is required')).toBeInTheDocument();
     });
     expect(inventoryApi.createBulkVariants).not.toHaveBeenCalled();
   });

   it('validates sizes and colors are required in bulk variant generator', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('Bulk Variants')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Bulk Variants'));

     await waitFor(() => expect(screen.getByText('Generate Variants')).toBeInTheDocument());

     // Fill brand, base name, category but no sizes/colors
     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'Emulsion' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Interior Wall Paint'), { target: { value: 'Interior' } });

     fireEvent.click(screen.getByText('Generate Variants'));

     await waitFor(() => {
       expect(screen.getByText('At least one size required')).toBeInTheDocument();
     });
     expect(inventoryApi.createBulkVariants).not.toHaveBeenCalled();
   });

   it('shows generated variant results clearly after successful bulk generation', async () => {
     const mockVariants = [
       { sku: 'ACME-PE-1L-WHITE', name: 'Premium Emulsion 1L White', size: '1L', color: 'White' },
       { sku: 'ACME-PE-4L-WHITE', name: 'Premium Emulsion 4L White', size: '4L', color: 'White' },
       { sku: 'ACME-PE-1L-GREY', name: 'Premium Emulsion 1L Grey', size: '1L', color: 'Grey' },
       { sku: 'ACME-PE-4L-GREY', name: 'Premium Emulsion 4L Grey', size: '4L', color: 'Grey' },
     ];
     vi.mocked(inventoryApi.createBulkVariants).mockResolvedValue({
       created: mockVariants,
       generated: [],
       conflicts: [],
       wouldCreate: [],
     });

     renderPage();
     await waitFor(() => expect(screen.getByText('Bulk Variants')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Bulk Variants'));

     await waitFor(() => expect(screen.getByText('Generate Variants')).toBeInTheDocument());

     // Fill all required fields
     fireEvent.change(screen.getByLabelText('Brand *'), { target: { value: '1' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Premium Emulsion'), { target: { value: 'Premium Emulsion' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. Interior Wall Paint'), { target: { value: 'Interior' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. 1L, 4L, 20L'), { target: { value: '1L, 4L' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. White, Off-White, Cream'), { target: { value: 'White, Grey' } });

     fireEvent.click(screen.getByText('Generate Variants'));

     await waitFor(() => {
       // Verify the result count is visible
       expect(screen.getByText(/4 variant\(s\) generated successfully/i)).toBeInTheDocument();
     });

     // Verify result table shows SKU, name, size, color columns (use getAllByText because the
     // main product table also has a SKU column header in the background)
     expect(screen.getAllByText('SKU').length).toBeGreaterThan(0);
     expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
     expect(screen.getAllByText('Size').length).toBeGreaterThan(0);
     expect(screen.getAllByText('Color').length).toBeGreaterThan(0);

     // Verify variant data appears in the table (these values are unique to the result table)
     expect(screen.getByText('ACME-PE-1L-WHITE')).toBeInTheDocument();
     expect(screen.getByText('Premium Emulsion 1L White')).toBeInTheDocument();
     expect(screen.getByText('ACME-PE-4L-GREY')).toBeInTheDocument();
     expect(screen.getByText('Premium Emulsion 4L Grey')).toBeInTheDocument();
   });

   it('shows variant preview matrix when sizes and colors are entered', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('Bulk Variants')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Bulk Variants'));

     await waitFor(() => expect(screen.getByText('Generate Variants')).toBeInTheDocument());

     // Enter sizes and colors to trigger the preview matrix
     fireEvent.change(screen.getByPlaceholderText('e.g. 1L, 4L, 20L'), { target: { value: '1L, 4L' } });
     fireEvent.change(screen.getByPlaceholderText('e.g. White, Off-White, Cream'), { target: { value: 'White, Grey' } });

     await waitFor(() => {
       // Preview section shows variant count (2 sizes × 2 colors = 4)
       expect(screen.getByText(/4 variant\(s\)/i)).toBeInTheDocument();
     });

     // Preview chips showing size/color combinations
     expect(screen.getByText('1L / White')).toBeInTheDocument();
     expect(screen.getByText('1L / Grey')).toBeInTheDocument();
     expect(screen.getByText('4L / White')).toBeInTheDocument();
     expect(screen.getByText('4L / Grey')).toBeInTheDocument();
   });
 });
