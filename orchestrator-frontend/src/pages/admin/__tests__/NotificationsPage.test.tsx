 /**
  * Tests for NotificationsPage
  *
  * Covers:
  *  - Renders page heading
  *  - User selector loads users from adminApi.getUsers()
  *  - Subject input is present
  *  - Message textarea is present
  *  - Send button calls adminApi.sendNotification with correct payload
  *  - Handles empty user list gracefully
  *  - Error handling: shows error state when getUsers fails
  *  - Error handling: shows toast on send failure
  *  - Retry button retries loading users
  *  - Send button disabled until recipient AND body filled
  *  - Select component renders labelIcon (Users icon)
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     AlertTriangle: M, Bell: M, Send: M, AlertCircle: M, Users: M, X: M,
     Check: M, ChevronDown: M, Search: M, RefreshCw: M,
     CheckCircle2: M, Info: M, Loader2: M,
   };
 });

 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getUsers: vi.fn(),
     sendNotification: vi.fn(),
   },
 }));

 const mockToastSuccess = vi.fn();
 const mockToastError = vi.fn();

 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({
     toast: vi.fn(),
     success: mockToastSuccess,
     error: mockToastError,
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

   it('shows the compose form heading', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(screen.queryByText(/Compose/i)).not.toBeNull();
     });
   });

   it('shows the send notification button', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       expect(screen.queryAllByText(/send notification/i).length).toBeGreaterThan(0);
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

   it('uses shared Select component for recipient (has placeholder option)', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       const select = document.querySelector('select');
       expect(select).not.toBeNull();
     });
     // The shared Select component renders a placeholder as a disabled option
     const placeholder = document.querySelector('select option[disabled]');
     expect(placeholder).not.toBeNull();
     expect(placeholder?.textContent).toMatch(/select a user/i);
   });

   it('uses shared Input component for subject (has label)', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();
     await waitFor(() => {
       // Shared Input renders a label element with id-based htmlFor
       const label = screen.queryByText('Subject');
       expect(label).not.toBeNull();
       expect(label?.tagName).toBe('LABEL');
     });
   });

   // ── Error handling tests ──────────────────────────────────────────────

   it('shows error state when getUsers fails', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Network error')).not.toBeNull();
     });
     // Should show retry button
     expect(screen.getByText(/retry/i)).not.toBeNull();
   });

   it('shows toast error when getUsers fails', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     renderPage();
     await waitFor(() => {
       expect(mockToastError).toHaveBeenCalledWith('Failed to load users', 'Network error');
     });
   });

   it('retry button re-calls getUsers on click', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>)
       .mockRejectedValueOnce(new Error('Network error'))
       .mockResolvedValueOnce(mockUsers);
     renderPage();

     // Wait for error state
     await waitFor(() => {
       expect(screen.getByText(/retry/i)).not.toBeNull();
     });

     // Click retry
     await act(async () => {
       fireEvent.click(screen.getByText(/retry/i));
     });

     // getUsers should have been called twice
     await waitFor(() => {
       expect(adminApi.getUsers).toHaveBeenCalledTimes(2);
     });
   });

   it('shows toast error when sendNotification fails', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Server error')
     );
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // Fill the form
     fireEvent.change(document.querySelector('select')!, { target: { value: '1' } });
     fireEvent.change(document.querySelector('textarea')!, { target: { value: 'Hello' } });

     // Submit
     await act(async () => {
       fireEvent.submit(document.querySelector('form')!);
     });

     await waitFor(() => {
       expect(mockToastError).toHaveBeenCalledWith('Failed to send', 'Server error');
     });
   });

   // ── Disabled state tests ─────────────────────────────────────────────

   it('send button is disabled when no recipient selected', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // Fill only body (no recipient)
     fireEvent.change(document.querySelector('textarea')!, { target: { value: 'Hello' } });

     const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
     expect(btn.disabled).toBe(true);
   });

   it('send button is disabled when body is empty', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // Select recipient but leave body empty
     fireEvent.change(document.querySelector('select')!, { target: { value: '1' } });

     const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
     expect(btn.disabled).toBe(true);
   });

   it('send button is enabled when recipient AND body are filled', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // Fill both
     fireEvent.change(document.querySelector('select')!, { target: { value: '1' } });
     fireEvent.change(document.querySelector('textarea')!, { target: { value: 'Hello' } });

     const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
     expect(btn.disabled).toBe(false);
   });

   // ── Form reset after send ────────────────────────────────────────────

   it('resets form and shows success toast after successful send', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     (adminApi.sendNotification as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // Fill form
     fireEvent.change(document.querySelector('select')!, { target: { value: '1' } });
     fireEvent.change(document.querySelector('input[type="text"]')!, { target: { value: 'Test' } });
     fireEvent.change(document.querySelector('textarea')!, { target: { value: 'Body' } });

     // Submit
     await act(async () => {
       fireEvent.submit(document.querySelector('form')!);
     });

     await waitFor(() => {
       expect(mockToastSuccess).toHaveBeenCalledWith(
         'Notification sent',
         expect.stringContaining('Alice')
       );
     });

     // Form should be reset
     expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
     expect((document.querySelector('input[type="text"]') as HTMLInputElement).value).toBe('');
   });

   // ── Character counter ────────────────────────────────────────────────

   it('shows character counter for body textarea', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();

     await waitFor(() => {
       expect(screen.getByText('0 characters')).not.toBeNull();
     });

     fireEvent.change(document.querySelector('textarea')!, { target: { value: 'Hello' } });
     expect(screen.getByText('5 characters')).not.toBeNull();
   });

   // ── Select labelIcon ─────────────────────────────────────────────────

   it('Select recipient label has icon prefix from labelIcon prop', async () => {
     (adminApi.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);
     renderPage();

     await waitFor(() => {
       expect(document.querySelector('select')).not.toBeNull();
     });

     // The Select label should have an icon span wrapper
     const recipientLabel = screen.getByText('Recipient');
     expect(recipientLabel).not.toBeNull();
     // Label should use flex layout with gap (the enhanced Select renders icon in a span sibling)
     expect(recipientLabel.className).toContain('flex');
     expect(recipientLabel.className).toContain('items-center');
   });
 });
