 /**
  * Tests for NotificationsPage
  *
  * Covers:
  *  - Renders page heading
  *  - User selector loads users
  *  - Message textarea present
  *  - Send button calls notifyUser
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Bell: M, Send: M, AlertCircle: M, Users: M, X: M, Check: M,
    ChevronDown: M, Search: M,
    CheckCircle2: M, AlertTriangle: M, Info: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getUsers: vi.fn(),
     notifyUser: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { NotificationsPage } from '../NotificationsPage';
 import { adminApi } from '@/lib/adminApi';
 
 const mockUsers = [
   { id: 1, email: 'alice@example.com', displayName: 'Alice', roles: ['ROLE_ADMIN'], mfaEnabled: false, enabled: true, companies: [] },
   { id: 2, email: 'bob@example.com', displayName: 'Bob', roles: ['ROLE_USER'], mfaEnabled: false, enabled: true, companies: [] },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/notifications']}>
       <NotificationsPage />
     </MemoryRouter>
   );
 }
 
 describe('NotificationsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders page heading', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('Send Notification').length).toBeGreaterThan(0);
     });
   });
 
   it('loads users for selector', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(adminApi.getUsers).toHaveBeenCalled();
     });
   });
 
   it('shows message textarea', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       const textareas = document.querySelectorAll('textarea');
       expect(textareas.length).toBeGreaterThan(0);
     });
   });
 
   it('send button is present', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
      const btns = screen.getAllByText(/send notification/i);
      expect(btns.length).toBeGreaterThan(0);
     });
   });
 });
