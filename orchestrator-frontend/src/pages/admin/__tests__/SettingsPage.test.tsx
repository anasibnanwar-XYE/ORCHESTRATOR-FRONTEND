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
  periodLockEnabled: true,
  exportApprovalRequired: false,
  corsAllowedOrigins: 'https://example.com,https://app.example.com',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: 'noreply@example.com',
  smtpFromEmail: 'noreply@example.com',
  smtpFromName: 'Orchestrator ERP',
};

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
    renderPage();
    await waitFor(() => {
      expect(adminApi.getSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('renders PageHeader with title "System Settings"', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
    });
  });

  it('displays all four sections: General, Approvals, Email, Advanced', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('General')).toBeDefined();
      expect(screen.getByText('Approvals')).toBeDefined();
      expect(screen.getByText('Email')).toBeDefined();
      expect(screen.getByText('Advanced')).toBeDefined();
    });
  });

  it('populates General section with company name, timezone, date format, currency', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      // Company name may appear in multiple places (General + smtpFromName)
      const companyNames = screen.getAllByText('Orchestrator ERP');
      expect(companyNames.length).toBeGreaterThan(0);
      expect(screen.getByText('Asia/Kolkata')).toBeDefined();
      expect(screen.getByText('DD/MM/YYYY')).toBeDefined();
      expect(screen.getByText('Currency')).toBeDefined();
    });
  });

  it('populates Approvals section with auto-approval threshold and period lock status', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Auto-Approval Threshold')).toBeDefined();
      expect(screen.getByText(/50000/)).toBeDefined();
      expect(screen.getByText('Period Lock')).toBeDefined();
    });
  });

  it('populates Email section with SMTP host, port, from email, from name', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('smtp.example.com')).toBeDefined();
      expect(screen.getByText('587')).toBeDefined();
      expect(screen.getByText('noreply@example.com')).toBeDefined();
    });
  });

  it('populates Advanced section with CORS allowed origins', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('CORS Allowed Origins')).toBeDefined();
      expect(screen.getByText(/https:\/\/example\.com/)).toBeDefined();
    });
  });

  it('shows skeleton loading state while fetching', () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state with retry button on API failure', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));
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
    const minimalSettings = {
      companyName: 'Test Co',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      emailNotifications: false,
    };
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(minimalSettings);
    renderPage();
    await waitFor(() => {
      // SMTP fields should show '—' when not provided
      const dashes = screen.queryAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VAL-SET-002: Settings is read-only for admin
  // ─────────────────────────────────────────────────────────────────────────

  it('has no input fields or textareas', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeDefined();
    });
    const inputs = document.querySelectorAll('input, textarea, select');
    expect(inputs.length).toBe(0);
  });

  it('has no save or edit buttons', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
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
    renderPage();
    await waitFor(() => {
      const notices = screen.queryAllByText(/platform administrators|managed by/i);
      expect(notices.length).toBeGreaterThan(0);
    });
  });

  it('never calls updateSettings (no PUT/PATCH requests)', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => expect(screen.getByText('System Settings')).toBeDefined());
    expect(adminApi.updateSettings).not.toHaveBeenCalled();
  });

  it('shows period lock and export approval toggles as read-only text', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Period Lock')).toBeDefined();
      expect(screen.getByText('Export Approval Required')).toBeDefined();
    });
    // These should be text "Enabled" / "Disabled", not toggle switches
    const switches = document.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(0);
  });

  it('shows email notifications status as read-only text', async () => {
    (adminApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeDefined();
    });
  });
});
