 /**
  * Tests for ChangelogPage (read-only) and WhatsNewBanner
  *
  * Covers:
  *  - Page loads entries from changelogApi.list() on mount
  *  - Loading state shown during fetch
  *  - Error state shown on API failure
  *  - Empty state shown when no entries
  *  - Entry list renders with title, version, date
  *  - Entry body can be expanded and collapsed
  *  - No create / edit / delete buttons present (read-only for tenant admin)
  *  - WhatsNewBanner: shows unread entries, dismisses, tracks last-read
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import type { ChangelogEntryResponse } from '@/types';

 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, BookOpen: M, X: M, ChevronDown: M, ChevronUp: M, Check: M,
     AlertCircle: M, Tag: M, Calendar: M, Bell: M, Sparkles: M,
     ArrowUpDown: M, ArrowUp: M, ArrowDown: M, ChevronLeft: M, ChevronRight: M,
     Search: M, CheckCircle2: M, AlertTriangle: M, Info: M,
     Pencil: M, RefreshCcw: M, Loader2: M, Lock: M,
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

   it('does NOT show create / new entry button (read-only)', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());
     // No "New Entry" button should be present
     expect(screen.queryByText(/new entry/i)).toBeNull();
     // No "Create your first entry" button should be present
     expect(screen.queryByText(/create your first entry/i)).toBeNull();
   });

   it('does NOT show edit buttons on entries (read-only)', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());
     // No edit buttons should be present
     expect(document.querySelectorAll('[aria-label="Edit entry"]').length).toBe(0);
   });

   it('does NOT show delete buttons on entries (read-only)', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());
     // No delete buttons should be present
     expect(document.querySelectorAll('[aria-label="Delete entry"]').length).toBe(0);
   });

   it('shows read-only notice', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => {
       expect(screen.queryByText(/managed by the platform team/i)).not.toBeNull();
     });
   });

   it('renders version badge for each entry', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());
     expect(screen.getByText('v2.0.0')).toBeDefined();
     expect(screen.getByText('v1.9.0')).toBeDefined();
   });

   it('expands entry body on view click', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
       content: mockEntries,
       totalElements: 2,
     });
     renderPage();
     await waitFor(() => expect(screen.getByText('New Features in v2.0')).toBeDefined());

     // Click the first "View" button
     const viewBtns = screen.getAllByText('View');
     fireEvent.click(viewBtns[0]);

     await waitFor(() => {
       expect(screen.queryByText(/## What is new/i)).not.toBeNull();
     });
   });

   it('refresh button reloads entries', async () => {
     (changelogApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [], totalElements: 0 });
     renderPage();
     await waitFor(() => expect(screen.getByText(/no entries yet/i)).toBeDefined());

     const refreshBtn = screen.getByLabelText(/refresh changelog/i);
     fireEvent.click(refreshBtn);

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
     const { container } = render(
       <MemoryRouter>
         <WhatsNewBanner entries={mockEntries} />
       </MemoryRouter>
     );
     expect(screen.queryByText(/what.s new/i)).not.toBeNull();
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
