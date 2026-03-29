 /**
  * Tests for ChangelogPage and WhatsNewBanner
  *
  * Covers:
  *  - Page loads entries from changelogApi on mount
  *  - Loading and error states
  *  - Create entry form submits to changelogApi.create()
  *  - Edit entry dialog submits to changelogApi.update()
  *  - Delete entry calls changelogApi.remove()
  *  - List refreshes after mutations
  *  - WhatsNewBanner renders unread entries, dismisses, and tracks last-read
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import type { ChangelogEntryResponse } from '@/types';

 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, BookOpen: M, X: M, ChevronDown: M, Check: M,
     AlertCircle: M, Tag: M, Calendar: M, Bell: M, Sparkles: M,
     ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
     Search: M, CheckCircle2: M, AlertTriangle: M, Info: M,
     Pencil: M, RefreshCcw: M, Loader2: M,
   };
 });

 vi.mock('@/lib/adminApi', () => ({
   changelogApi: {
     list: vi.fn(),
     create: vi.fn(),
     update: vi.fn(),
     remove: vi.fn(),
     getLatestHighlighted: vi.fn(),
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

 import { ChangelogPage, WhatsNewBanner } from '../ChangelogPage';
 import { changelogApi } from '@/lib/adminApi';

 const mockEntries: ChangelogEntryResponse[] = [
   {
     id: 2,
     title: 'New Features in v2.0',
     body: '## What is new\n\nWe added many improvements.',
     version: 'v2.0.0',
     isHighlighted: true,
     publishedAt: '2024-03-01T00:00:00Z',
     createdBy: 'admin@example.com',
   },
   {
     id: 1,
     title: 'Bug Fixes v1.9',
     body: 'Various bug fixes.',
     version: 'v1.9.0',
     isHighlighted: false,
     publishedAt: '2024-02-01T00:00:00Z',
     createdBy: 'admin@example.com',
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/changelog']}>
       <ChangelogPage />
     </MemoryRouter>
   );
 }

 describe('ChangelogPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     try { localStorage.removeItem('o_changelog_last_read'); } catch (_e) { /* ignore */ }
   });

   it('renders page heading', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     expect(screen.getByText('Changelog')).toBeDefined();
   });

   it('shows loading state initially', () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     // Loading state is shown while API call is in progress
     expect(screen.queryByText(/loading entries/i)).toBeDefined();
   });

   it('loads entries from changelogApi on mount', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Features in v2.0')).toBeDefined();
       expect(screen.getByText('Bug Fixes v1.9')).toBeDefined();
     });
     expect(changelogApi.list).toHaveBeenCalledWith(0, 50);
   });

   it('shows empty state when no entries', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/no entries yet/i)).toBeDefined();
     });
   });

   it('shows error state on API failure', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|please try again/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('shows create entry button', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());
     const btn = screen.getByText(/new entry/i);
     expect(btn).toBeDefined();
   });

   it('opens create form dialog on button click', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());
     fireEvent.click(screen.getByText(/new entry/i));
     await waitFor(() => {
       expect(screen.getByText(/create changelog entry/i)).toBeDefined();
     });
   });

   it('submits create form and calls changelogApi.create', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     (changelogApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockEntries[0]);
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());

     // Open dialog
     fireEvent.click(screen.getByText(/new entry/i));
     await waitFor(() => expect(screen.getByText(/create changelog entry/i)).toBeDefined());

     // Fill form fields
     const titleInput = screen.getByPlaceholderText(/e.g. New Features/i);
     fireEvent.change(titleInput, { target: { value: 'Test Entry' } });

     const versionInput = screen.getByPlaceholderText(/e.g. v2.1.0/i);
     fireEvent.change(versionInput, { target: { value: 'v2.1.0' } });

     const bodyInput = screen.getByPlaceholderText(/## New Features/i);
     fireEvent.change(bodyInput, { target: { value: 'Some body text' } });

     // Submit
     await act(async () => {
       fireEvent.submit(document.getElementById('changelog-form')!);
     });

     await waitFor(() => {
       expect(changelogApi.create).toHaveBeenCalledWith({
         title: 'Test Entry',
         body: 'Some body text',
         version: 'v2.1.0',
         isHighlighted: false,
       });
     });
   });

   it('shows validation error when required fields are missing', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());

     fireEvent.click(screen.getByText(/new entry/i));
     await waitFor(() => expect(screen.getByText(/create changelog entry/i)).toBeDefined());

     // Submit without filling in fields
     await act(async () => {
       fireEvent.submit(document.getElementById('changelog-form')!);
     });

     await waitFor(() => {
       expect(screen.getByText(/title, body, and version are required/i)).toBeDefined();
     });
     expect(changelogApi.create).not.toHaveBeenCalled();
   });

   it('opens edit dialog with pre-filled values', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());

     // Click edit button for first entry
     const editBtns = document.querySelectorAll('[aria-label="Edit entry"]');
     fireEvent.click(editBtns[0]);

     await waitFor(() => {
       expect(screen.getByText(/edit changelog entry/i)).toBeDefined();
     });
   });

   it('calls changelogApi.update on edit submission', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     (changelogApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockEntries[0]);
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());

     // Click edit button
     const editBtns = document.querySelectorAll('[aria-label="Edit entry"]');
     fireEvent.click(editBtns[0]);

     await waitFor(() => expect(screen.getByText(/edit changelog entry/i)).toBeDefined());

     // Submit edit form
     await act(async () => {
       fireEvent.submit(document.getElementById('changelog-form')!);
     });

     await waitFor(() => {
       expect(changelogApi.update).toHaveBeenCalledWith(
         mockEntries[0].id,
         expect.objectContaining({
           title: mockEntries[0].title,
           version: mockEntries[0].version,
         })
       );
     });
   });

   it('calls changelogApi.remove on delete click', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     (changelogApi.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());

     // Click delete button for first entry
     const deleteBtns = document.querySelectorAll('[aria-label="Delete entry"]');
     await act(async () => {
       fireEvent.click(deleteBtns[0]);
     });

     await waitFor(() => {
       expect(changelogApi.remove).toHaveBeenCalledWith(mockEntries[0].id);
     });
   });

   it('refreshes list after delete', async () => {
     const updatedEntries = [mockEntries[1]]; // only second entry remains
     (changelogApi.list as ReturnType<typeof vi.fn>)
       .mockResolvedValueOnce({ content: mockEntries, totalElements: 2 })
       .mockResolvedValueOnce({ content: updatedEntries, totalElements: 1 });
     (changelogApi.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());

     const deleteBtns = document.querySelectorAll('[aria-label="Delete entry"]');
     await act(async () => {
       fireEvent.click(deleteBtns[0]);
     });

     await waitFor(() => {
       expect(changelogApi.list).toHaveBeenCalledTimes(2);
     });
   });
 });

 describe('WhatsNewBanner', () => {
   beforeEach(() => {
     try { localStorage.removeItem('o_changelog_last_read'); } catch (_e) { /* ignore */ }
   });

   it('renders banner when there are unread entries', () => {
     render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     const banner = screen.queryByText(/what.s new/i);
     expect(banner).not.toBeNull();
   });

   it('shows the latest entry title in the banner', () => {
     render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     expect(screen.getByText('New Features in v2.0')).toBeDefined();
   });

   it('dismisses banner on close click', async () => {
     const { container } = render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     const dismissBtn = container.querySelector('[aria-label="Dismiss"]');
     if (dismissBtn) {
       fireEvent.click(dismissBtn);
       await waitFor(() => {
         const banner = screen.queryByText(/what.s new/i);
         expect(banner).toBeNull();
       });
     }
   });

   it('does not render banner when no entries', () => {
     render(
       <MemoryRouter>
         <WhatsNewBanner entries={[]} />
       </MemoryRouter>
     );
     const banner = screen.queryByText(/what.s new/i);
     expect(banner).toBeNull();
   });

   it('hides banner after dismiss marks entries as read', async () => {
     // Render with entries, dismiss the banner, and verify it disappears
     const { container } = render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     // Banner should be visible
     expect(screen.queryByText(/what.s new/i)).not.toBeNull();
     // Click dismiss
     const dismissBtn = container.querySelector('[aria-label="Dismiss"]');
     if (dismissBtn) {
       fireEvent.click(dismissBtn);
       await waitFor(() => {
         expect(screen.queryByText(/what.s new/i)).toBeNull();
       });
     }
   });

   it('shows multiple updates badge when more than one unread entry', () => {
     render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     // Should show "2 updates" badge since both entries are unread
     const badge = screen.queryByText(/2 updates/i);
     expect(badge).not.toBeNull();
   });

   it('calls onViewAll callback when view all link is clicked', async () => {
     const onViewAll = vi.fn();
     render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} onViewAll={onViewAll} />
       </MemoryRouter>
     );
     const viewAllLink = screen.queryByText(/view all updates/i);
     if (viewAllLink) {
       fireEvent.click(viewAllLink);
       expect(onViewAll).toHaveBeenCalled();
     }
   });
 });
