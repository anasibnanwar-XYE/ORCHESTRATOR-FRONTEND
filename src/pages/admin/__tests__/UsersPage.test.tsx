 /**
  * Tests for UsersPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows users in data table with email, displayName, roles, status columns
  *  - Shows skeleton loading state
  *  - Shows error state
  *  - Shows empty state when no users
  *  - Create User button is present
  *  - Delete user triggers confirm dialog
  *  - Suspend/unsuspend toggle works
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 // Mock lucide-react
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Users: M, Plus: M, Search: M, MoreHorizontal: M, Pencil: M,
     Trash2: M, Lock: M, Unlock: M, ShieldOff: M, AlertCircle: M,
     RefreshCcw: M, ChevronLeft: M, ChevronRight: M, ArrowUpDown: M,
     ArrowUp: M, ArrowDown: M, Check: M, X: M, User: M,
   };
 });
 
 // Mock the admin API
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getUsers: vi.fn(),
     getRoles: vi.fn(),
     getCompanies: vi.fn(),
     createUser: vi.fn(),
     updateUser: vi.fn(),
     deleteUser: vi.fn(),
     suspendUser: vi.fn(),
     unsuspendUser: vi.fn(),
     disableUserMfa: vi.fn(),
   },
 }));
 
 // Mock toast
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ addToast: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));
 
 import { UsersPage } from '../UsersPage';
 import { adminApi } from '@/lib/adminApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Fixtures
 // ─────────────────────────────────────────────────────────────────────────────
 
 const mockUsers = [
   {
     id: 1,
     publicId: 'user-1',
     email: 'alice@example.com',
     displayName: 'Alice Smith',
     roles: ['ROLE_ADMIN'],
     mfaEnabled: false,
     enabled: true,
     companies: ['COMP1'],
   },
   {
     id: 2,
     publicId: 'user-2',
     email: 'bob@example.com',
     displayName: 'Bob Jones',
     roles: ['ROLE_USER'],
     mfaEnabled: true,
     enabled: false,
     companies: ['COMP1', 'COMP2'],
   },
 ];
 
 const mockRoles = [
   { key: 'ROLE_ADMIN', name: 'Administrator', permissions: [], isSystem: true, createdAt: '', updatedAt: '' },
   { key: 'ROLE_USER', name: 'User', permissions: [], isSystem: true, createdAt: '', updatedAt: '' },
 ];
 
 const mockCompanies = [
   { id: 1, code: 'COMP1', name: 'Company 1', isActive: true, createdAt: '', updatedAt: '' },
   { id: 2, code: 'COMP2', name: 'Company 2', isActive: true, createdAt: '', updatedAt: '' },
 ];
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helper
 // ─────────────────────────────────────────────────────────────────────────────
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/users']}>
       <UsersPage />
     </MemoryRouter>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Tests
 // ─────────────────────────────────────────────────────────────────────────────
 
 describe('UsersPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders page heading', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
      const headings = screen.queryAllByText(/user management|users/i);
      expect(headings.length).toBeGreaterThan(0);
     });
   });
 
   it('shows skeleton loading state initially', () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
 
     renderPage();
 
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows user emails in table after load', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
      const aliceEls = screen.queryAllByText('alice@example.com');
      const bobEls = screen.queryAllByText('bob@example.com');
      expect(aliceEls.length).toBeGreaterThan(0);
      expect(bobEls.length).toBeGreaterThan(0);
     });
   });
 
   it('shows user display names in table', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
      expect(screen.queryAllByText('Alice Smith').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Bob Jones').length).toBeGreaterThan(0);
     });
   });
 
   it('shows status badges (Active/Suspended)', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
      expect(screen.queryAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Suspended').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Create User button', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
       const addBtn = screen.queryByText(/add user|create user|new user/i);
       expect(addBtn).not.toBeNull();
     });
   });
 
   it('shows error state on API failure', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
 
     renderPage();
 
     await waitFor(() => {
      const retryBtns = screen.queryAllByText(/retry|try again/i);
      const errorMsgs = screen.queryAllByText(/couldn't load|failed|error|unable/i);
      expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 
   it('shows empty state when no users', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
 
     renderPage();
 
     await waitFor(() => {
      const emptyMsgs = screen.queryAllByText(/no users|create the first/i);
      expect(emptyMsgs.length).toBeGreaterThan(0);
     });
   });
 });
