 /**
  * Tests for PackagingMappingsPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading skeleton initially
  *  - Renders mapping rows after data loads
  *  - Shows error state on API failure
  *  - Opens create modal on "Add Mapping" button click
  *  - Shows empty state when no mappings
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getPackagingMappings: vi.fn(),
     createPackagingMapping: vi.fn(),
     updatePackagingMapping: vi.fn(),
     deletePackagingMapping: vi.fn(),
     getRawMaterials: vi.fn(),
   },
 }));

 import { PackagingMappingsPage } from '../PackagingMappingsPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockMappings = [
   {
     id: 1,
     packagingSize: '1L',
     rawMaterialId: 10,
     rawMaterialName: 'PET Bottle 1L',
     unitsPerPack: 12,
     cartonSize: 12,
     litersPerUnit: 1,
     active: true,
   },
   {
     id: 2,
     packagingSize: '4L',
     rawMaterialId: 11,
     rawMaterialName: 'PET Bottle 4L',
     unitsPerPack: 6,
     cartonSize: 6,
     litersPerUnit: 4,
     active: true,
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/config/packaging']}>
       <PackagingMappingsPage />
     </MemoryRouter>
   );
 }

 describe('PackagingMappingsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockResolvedValue(mockMappings);
     renderPage();
     expect(screen.getByText('Packaging Mappings')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders mapping rows after data loads', async () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockResolvedValue(mockMappings);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('1L');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('opens create modal when Add Mapping button is clicked', async () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockResolvedValue(mockMappings);
     (factoryApi.getRawMaterials as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Packaging Mappings')).toBeDefined();
     });
     const btn = screen.getByText('Add Mapping');
     fireEvent.click(btn);
     await waitFor(() => {
       expect(screen.getByText('New Packaging Mapping')).toBeDefined();
     });
   });

   it('shows empty state when no mappings exist', async () => {
     (factoryApi.getPackagingMappings as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no packaging mappings/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 });
