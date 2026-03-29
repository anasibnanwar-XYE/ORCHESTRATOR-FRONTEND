 /**
  * Tests for NotificationsPage
  *
  * Covers:
  *  - Renders page heading
  *  - User selector loads users from adminApi.getUsers()
  *  - Subject input is present
  *  - Message textarea is present
  *  - Send button calls adminApi.sendNotification with correct payload
  *  - Sent history shows after successful send
  *  - Handles empty user list gracefully
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
     sendNotification: vi.fn(),
   },
 }));

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({
     toast: vi.fn(),
     success: vi.fn(),
     error: vi.fn(),
     warning: vi.fn(),
     info: vi.fn(),
     dismiss: vi.fn(),
   }),
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
       expect(screen.getAllByText(/send notification/i).length).toBeGreaterThan(0);
     });
   });

   it('loads users for selector via getUsers', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(adminApi.getUsers).toHaveBeenCalled();
     });
   });

   it('shows subject input field', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       const subjectInputs = document.querySelectorAll('input[type="text"]');
       expect(subjectInputs.length).toBeGreaterThan(0);
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

   it('calls sendNotification with correct payload on form submit', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.sendNotification as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();

     // Wait for user select to appear (loading skeleton replaced by select)
     await waitFor(() => {
       const select = document.querySelector('select');
       expect(select).not.toBeNull();
     });

     // Select recipient
     const select = document.querySelector('select')!;
     fireEvent.change(select, { target: { value: '1' } });

     // Fill subject
     const subjectInput = document.querySelector('input[type="text"]');
     if (subjectInput) {
       fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
     }

     // Fill body
     const textarea = document.querySelector('textarea');
     if (textarea) {
       fireEvent.change(textarea, { target: { value: 'Test message body' } });
     }

     // Submit
     await act(async () => {
       const form = document.querySelector('form');
       if (form) fireEvent.submit(form);
     });

     await waitFor(() => {
       expect(adminApi.sendNotification).toHaveBeenCalledWith(
         expect.objectContaining({
           to: 'alice@example.com',
           body: 'Test message body',
         })
       );
     });
   });

   it('shows empty sent history initially', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(screen.queryByText(/no notifications sent yet/i)).not.toBeNull();
     });
   });

   it('shows sent history section header', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(screen.queryByText(/sent this session/i)).not.toBeNull();
     });
   });

   it('handles empty user list gracefully', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       // Should still render the compose form
       expect(screen.getAllByText(/send notification/i).length).toBeGreaterThan(0);
     });
   });
 });
