 /**
  * Tests for SettingsPage
  *
  * Covers:
  *  - Renders settings page heading
  *  - Skeleton loading state
  *  - Error state on API failure
  *  - Settings values are displayed (read-only)
  *  - Read-only notice is shown (no save button)
  *  - Global settings mutation is blocked (PUT /api/v1/admin/settings requires ROLE_SUPER_ADMIN)
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
    Settings: M, Save: M, AlertCircle: M, RefreshCcw: M, Check: M,
    Mail: M, Lock: M, Globe: M, ToggleLeft: M, ToggleRight: M,
    Bell: M, X: M, ChevronDown: M,
    CheckCircle2: M, AlertTriangle: M, Info: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getSettings: vi.fn(),
     updateSettings: vi.fn(),
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
 
 import { SettingsPage } from '../SettingsPage';
 import { adminApi } from '@/lib/adminApi';
 
 const mockSettings = {
   companyName: 'Orchestrator ERP',
   timezone: 'Asia/Kolkata',
   dateFormat: 'DD/MM/YYYY',
   currency: 'INR',
   emailNotifications: true,
   autoApproveThreshold: 50000,
 };
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/settings']}>
       <SettingsPage />
     </MemoryRouter>
   );
 }
 
 describe('SettingsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('renders page heading', async () => {
     (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('System Settings')).toBeDefined();
     });
   });
 
   it('shows skeleton loading state', () => {
     (adminApi.getSettings as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('displays loaded settings values as read-only text', async () => {
     (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
     renderPage();
     await waitFor(() => {
       // Check company name appears as text (not in an input)
       const matches = screen.queryAllByText(/Orchestrator ERP/i);
       expect(matches.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (adminApi.getSettings as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/failed|error|couldn't/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

  it('shows read-only notice — no save settings button', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => expect(screen.getByText('System Settings')).toBeDefined());
    // No save button should be present (settings mutation is superadmin-only)
    expect(screen.queryByText(/save settings/i)).toBeNull();
    // A read-only notice should be visible
    const notices = screen.queryAllByText(/platform administrators|managed by/i);
    expect(notices.length).toBeGreaterThan(0);
  });

  it('never calls updateSettings (settings are read-only)', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => expect(screen.getByText('System Settings')).toBeDefined());
    // updateSettings should never be called — no save action available
    expect(adminApi.updateSettings).not.toHaveBeenCalled();
  });
 });
