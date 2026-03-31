/**
 * Tests for SettingsPage
 *
 * Covers validation contract assertions:
 *  VAL-SET-001: Settings page loads system configuration
 *    - GET /api/v1/admin/settings is called
 *    - All 4 sections render: General, Approvals, Email, Advanced
 *    - Populated values display in each section
 *
 *  VAL-SET-002: Settings is read-only for admin
 *    - No edit buttons, input fields, or save buttons visible
 *    - Read-only notice with Lock icon displayed
 *    - No PUT/PATCH requests fired (updateSettings never called)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    getCompanies: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    session: { companyCode: 'MOCK' },
    user: null,
    isAuthenticated: true,
    mustChangePassword: false,
    isLoading: false,
    enabledModules: [],
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
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

/** Mock data matching the actual backend SystemSettingsDto response shape */
const mockSettings = {
  allowedOrigins: ['http://localhost:3002', 'https://app.example.com'],
  autoApprovalEnabled: true,
  periodLockEnforced: true,
  exportApprovalRequired: false,
  platformAuthCode: 'PLATFORM',
  mailEnabled: true,
  mailFromAddress: 'noreply@example.com',
  mailBaseUrl: 'http://localhost:3002',
  sendCredentials: true,
  sendPasswordReset: true,
};

/** Mock company data from GET /api/v1/companies */
const mockCompanies = [
  {
    id: 1,
    code: 'MOCK',
    name: 'Mock Training Co',
    timezone: 'UTC',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/settings']}>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VAL-SET-001: Settings page loads system configuration
  // ─────────────────────────────────────────────────────────────────────────

  it('calls GET /admin/settings on mount', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(adminApi.getSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('renders PageHeader with title "System Settings"', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
    });
  });

  it('displays all four sections: General, Approvals, Email, Advanced', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeDefined();
      expect(screen.getByText('Approvals')).toBeDefined();
      expect(screen.getByText('Email')).toBeDefined();
      expect(screen.getByText('Advanced')).toBeDefined();
    });
  });

  it('populates General section with company name, code, timezone from companies API', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mock Training Co')).toBeDefined();
      expect(screen.getByText('MOCK')).toBeDefined();
      expect(screen.getByText('UTC')).toBeDefined();
    });
  });

  it('populates General section with platformAuthCode from settings API', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Platform Auth Code')).toBeDefined();
      expect(screen.getByText('PLATFORM')).toBeDefined();
    });
  });

  it('populates Approvals section with auto-approval, period lock, and export approval', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Auto-Approval')).toBeDefined();
      expect(screen.getByText('Period Lock')).toBeDefined();
      expect(screen.getByText('Export Approval Required')).toBeDefined();
    });
  });

  it('populates Email section with mail from address, base URL, and boolean flags', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('noreply@example.com')).toBeDefined();
      expect(screen.getByText('http://localhost:3002')).toBeDefined();
      expect(screen.getByText('Mail Enabled')).toBeDefined();
      expect(screen.getByText('Send Credentials')).toBeDefined();
      expect(screen.getByText('Send Password Reset')).toBeDefined();
    });
  });

  it('populates Advanced section with allowed origins', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Allowed Origins')).toBeDefined();
      // Joined origins string: "http://localhost:3002, https://app.example.com"
      expect(screen.getByText('http://localhost:3002, https://app.example.com')).toBeDefined();
    });
  });

  it('shows skeleton loading state while fetching', () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state with retry button on API failure', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const msgs = screen.queryAllByText(/couldn't load settings/i);
      expect(msgs.length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('retries loading on Retry button click after error', async () => {
    const user = userEvent.setup();
    (adminApi.getSettings as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeDefined();
    });
    await user.click(screen.getByText('Retry'));
    await waitFor(() => {
      expect(adminApi.getSettings).toHaveBeenCalledTimes(2);
    });
  });

  it('displays dash placeholders for missing optional fields', async () => {
    const minimalSettings = {};
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(minimalSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      // Various fields should show '—' when not provided
      const dashes = screen.queryAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('gracefully handles companies API failure', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Companies API error'));
    renderPage();
    // Should still load settings — General section shows dashes for company fields
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
      expect(screen.getByText('General')).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VAL-SET-002: Settings is read-only for admin
  // ─────────────────────────────────────────────────────────────────────────

  it('has no input fields or textareas', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
    });
    const inputs = document.querySelectorAll('input, textarea, select');
    expect(inputs.length).toBe(0);
  });

  it('has no save or edit buttons', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
    });
    expect(screen.queryByText(/save/i)).toBeNull();
    expect(screen.queryByText(/edit/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
  });

  it('shows read-only notice with Lock icon text', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      const notices = screen.queryAllByText(/platform administrators|managed by/i);
      expect(notices.length).toBeGreaterThan(0);
    });
  });

  it('never calls updateSettings (no PUT/PATCH requests)', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => expect(screen.getByText('System Settings')).toBeDefined());
    expect(adminApi.updateSettings).not.toHaveBeenCalled();
  });

  it('shows boolean settings as read-only text, not toggle switches', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Period Lock')).toBeDefined();
      expect(screen.getByText('Export Approval Required')).toBeDefined();
      expect(screen.getByText('Mail Enabled')).toBeDefined();
    });
    // These should be text "Enabled" / "Disabled", not toggle switches
    const switches = document.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(0);
  });

  it('displays correct Enabled/Disabled labels based on backend boolean values', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (adminApi.getCompanies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCompanies);
    renderPage();
    await waitFor(() => {
      // autoApprovalEnabled=true, periodLockEnforced=true, mailEnabled=true, sendCredentials=true, sendPasswordReset=true → 5 "Enabled"
      // exportApprovalRequired=false → 1 "Disabled"
      const enabledLabels = screen.queryAllByText('Enabled');
      const disabledLabels = screen.queryAllByText('Disabled');
      expect(enabledLabels.length).toBe(5);
      expect(disabledLabels.length).toBe(1);
    });
  });
});
