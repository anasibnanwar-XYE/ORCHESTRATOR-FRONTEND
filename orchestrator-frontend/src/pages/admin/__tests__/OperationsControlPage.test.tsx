 /**
  * Tests for OperationsControlPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Flag: M, Wrench: M, Trash2: M, RefreshCcw: M, AlertCircle: M, CheckCircle: M,
     AlertTriangle: M, Shield: M, Zap: M, ToggleLeft: M, ToggleRight: M,
     ChevronDown: M, X: M, Database: M, Settings: M,
   };
 });
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { OperationsControlPage } from '../OperationsControlPage';
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <OperationsControlPage />
     </MemoryRouter>
   );
 }
 
 // NOTE: OperationsControlPage has been removed from routing (not in backend spec).
 // The page file is kept but uses inline stubs. Tests verify basic rendering only.
 describe('OperationsControlPage', () => {
   beforeEach(() => {
     vi.resetAllMocks();
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Operations Control')).toBeInTheDocument();
     });
   });

   it('shows maintenance mode section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Maintenance Mode/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });

   it('shows cache purge section', async () => {
     renderPage();
     await waitFor(() => {
       const allMatches = screen.getAllByText(/Purge Cache|Cache/i);
       expect(allMatches.length).toBeGreaterThan(0);
     });
   });
 });
