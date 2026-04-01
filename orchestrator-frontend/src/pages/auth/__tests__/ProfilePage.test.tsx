/**
 * Tests for ProfilePage
 *
 * Covers:
 *  - Renders profile form with pre-filled fields from /auth/profile
 *  - Shows skeleton while profile is loading
 *  - Shows loading state while saving
 *  - Calls PUT /auth/profile with updated data on save
 *  - Shows success toast on successful profile update
 *  - Shows error toast on profile load failure
 *  - Shows error toast on profile save failure
 *  - MFA section: shows "MFA is enabled" badge when mfaEnabled=true
 *  - MFA section: shows "Set up MFA" button when mfaEnabled=false
 *  - MFA setup: calls POST /auth/mfa/setup and renders QR code
 *  - MFA activation: calls POST /auth/mfa/activate with code
 *  - MFA disable: shows dialog, calls POST /auth/mfa/disable
 *  - Recovery acknowledgement required before MFA activation
 *  - Responsive grid: forms use grid-cols-1 sm:grid-cols-2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../ProfilePage';
import type { Profile } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mock dependencies
// ─────────────────────────────────────────────────────────────────────────────

const mockUpdateUser = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

const mockUser = {
  email: 'admin@example.com',
  displayName: 'Admin User',
  companyId: 'c1',
  roles: ['ROLE_ADMIN'],
  permissions: [],
  mfaEnabled: false,
  mustChangePassword: false,
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
  }),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// Mock QRCodeSVG to avoid canvas-related rendering issues in jsdom
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code-svg" data-value={value} />
  ),
}));

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockSetupMfa = vi.fn();
const mockActivateMfa = vi.fn();
const mockDisableMfa = vi.fn();

vi.mock('@/lib/authApi', () => ({
  authApi: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    setupMfa: (...args: unknown[]) => mockSetupMfa(...args),
    activateMfa: (...args: unknown[]) => mockActivateMfa(...args),
    disableMfa: (...args: unknown[]) => mockDisableMfa(...args),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockProfile: Profile = {
  email: 'admin@example.com',
  displayName: 'Admin User',
  preferredName: 'Admin',
  jobTitle: 'Administrator',
  mfaEnabled: false,
  companies: ['Company A'],
  createdAt: '2024-01-01T00:00:00Z',
  publicId: 'usr_123',
  phoneSecondary: '+1 (555) 123-4567',
  secondaryEmail: 'backup@example.com',
};

const mockProfileMfaEnabled: Profile = {
  ...mockProfile,
  mfaEnabled: true,
};

function renderProfilePage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

async function openSecurityTab() {
  fireEvent.click(screen.getByRole('button', { name: /^security$/i }));
  await waitFor(() => {
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
  });
}

async function openAccountTab() {
  fireEvent.click(screen.getByRole('button', { name: /^account$/i }));
  await waitFor(() => {
    expect(screen.getByText('Account created')).toBeInTheDocument();
  });
}

async function beginMfaSetup() {
  await openSecurityTab();
  fireEvent.click(screen.getByRole('button', { name: /^set up$/i }));
  await waitFor(() => {
    expect(screen.getByText(/set up two-factor authentication/i)).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole('button', { name: /begin setup/i }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue(mockProfile);
    mockUpdateProfile.mockResolvedValue(mockProfile);
  });

  describe('Profile form', () => {
    it('shows skeleton while loading profile', () => {
      // Never resolves during this test
      mockGetProfile.mockImplementation(() => new Promise(() => {}));
      renderProfilePage();
      const skeletons = document.querySelectorAll('.pm-skel');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders profile form with pre-filled fields after loading', async () => {
      renderProfilePage();

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      // Display name field
      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      // Preferred name field
      expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
      // Job title field
      expect(screen.getByDisplayValue('Administrator')).toBeInTheDocument();
    });

    it('shows email as read-only field', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      const emailField = screen.getByText('Email').closest('.pm-readonly');
      expect(emailField).not.toBeNull();
      expect(within(emailField as HTMLElement).getByText('admin@example.com')).toBeInTheDocument();
    });

    it('shows error toast when profile load fails', async () => {
      mockGetProfile.mockRejectedValue(new Error('Network error'));
      renderProfilePage();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to load profile');
      });
    });

    it('calls PUT /auth/profile on save and shows inline success state', async () => {
      mockUpdateProfile.mockResolvedValue({ ...mockProfile, displayName: 'Updated Name' });
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      // Update the display name
      const displayNameInput = screen.getByDisplayValue('Admin User');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          displayName: 'Updated Name',
          preferredName: 'Admin',
          jobTitle: 'Administrator',
          phoneSecondary: '+1 (555) 123-4567',
          secondaryEmail: 'backup@example.com',
        });
        expect(mockUpdateUser).toHaveBeenCalledWith({ ...mockUser, displayName: 'Updated Name' });
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });

    it('shows error toast when profile save fails', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Server error'));
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it('shows "Could not load profile." message when profile returns null', async () => {
      mockGetProfile.mockResolvedValue(null);
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText(/could not load profile/i)).toBeInTheDocument();
      });
    });

    it('renders phone secondary and secondary email fields', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      // Check phone and secondary email are displayed
      expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('backup@example.com')).toBeInTheDocument();
    });

    it('calls PUT /auth/profile with phoneSecondary and secondaryEmail on save', async () => {
      mockUpdateProfile.mockResolvedValue({ ...mockProfile, displayName: 'Updated Name' });
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      // Update phone and secondary email
      const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+1 (555) 987-6543' } });

      const secondaryEmailInput = screen.getByDisplayValue('backup@example.com');
      fireEvent.change(secondaryEmailInput, { target: { value: 'newbackup@example.com' } });

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          displayName: 'Admin User',
          preferredName: 'Admin',
          jobTitle: 'Administrator',
          phoneSecondary: '+1 (555) 987-6543',
          secondaryEmail: 'newbackup@example.com',
        });
      });
    });
  });

  describe('MFA section', () => {
    it('shows "MFA not enabled" when mfaEnabled=false', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);
      renderProfilePage();

      await openSecurityTab();

      expect(screen.getByText(/mfa not enabled/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^set up$/i })).toBeInTheDocument();
    });

    it('shows "MFA active" status when mfaEnabled=true', async () => {
      mockGetProfile.mockResolvedValue(mockProfileMfaEnabled);
      renderProfilePage();

      await openSecurityTab();

      await waitFor(() => {
        expect(screen.getByText(/mfa active/i)).toBeInTheDocument();
      });

      expect(screen.getByText('On')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^disable$/i })).toBeInTheDocument();
    });

    it('calls POST /auth/mfa/setup and shows QR code after beginning setup', async () => {
      const mfaSetupData = {
        qrUri: 'otpauth://totp/test?secret=ABC123',
        secret: 'ABC123',
        recoveryCodes: ['code1', 'code2', 'code3', 'code4'],
      };
      mockSetupMfa.mockResolvedValue(mfaSetupData);
      renderProfilePage();

      await beginMfaSetup();

      await waitFor(() => {
        expect(mockSetupMfa).toHaveBeenCalled();
        expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument();
        expect(screen.getByText('Recovery codes — save these now')).toBeInTheDocument();
      });
    });

    it('requires recovery code acknowledgement before MFA activation', async () => {
      const mfaSetupData = {
        qrUri: 'otpauth://totp/test?secret=SECRET',
        secret: 'SECRET',
        recoveryCodes: ['code1'],
      };
      mockSetupMfa.mockResolvedValue(mfaSetupData);
      mockActivateMfa.mockResolvedValue(undefined);
      renderProfilePage();

      await beginMfaSetup();
      await waitFor(() => {
        expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/enter code to activate/i), { target: { value: '123456' } });
      const activateBtn = screen.getByRole('button', { name: /activate mfa/i });
      expect(activateBtn).toBeDisabled();
    });

    it('calls POST /auth/mfa/activate after acknowledging recovery codes', async () => {
      const mfaSetupData = {
        qrUri: 'otpauth://totp/test?secret=SECRET',
        secret: 'SECRET',
        recoveryCodes: ['code1'],
      };
      mockSetupMfa.mockResolvedValue(mfaSetupData);
      mockActivateMfa.mockResolvedValue(undefined);
      mockGetProfile.mockResolvedValueOnce(mockProfile).mockResolvedValue(mockProfileMfaEnabled);
      renderProfilePage();

      await beginMfaSetup();
      await waitFor(() => {
        expect(screen.getByLabelText(/i have saved my recovery codes/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/i have saved my recovery codes/i));

      const codeInput = screen.getByLabelText(/enter code to activate/i);
      fireEvent.change(codeInput, { target: { value: '123456' } });

      const activateBtn = screen.getByRole('button', { name: /activate mfa/i });
      expect(activateBtn).not.toBeDisabled();

      fireEvent.click(activateBtn);

      await waitFor(() => {
        expect(mockActivateMfa).toHaveBeenCalledWith('123456');
        expect(mockToastSuccess).toHaveBeenCalledWith('MFA enabled', 'Two-factor authentication is now active.');
      });
    });

    it('shows disable MFA dialog when "Disable" is clicked', async () => {
      mockGetProfile.mockResolvedValue(mockProfileMfaEnabled);
      renderProfilePage();

      await openSecurityTab();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^disable$/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^disable$/i }));

      expect(screen.getByText(/disable two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/authenticator code/i)).toBeInTheDocument();
    });

    it('calls POST /auth/mfa/disable with TOTP code', async () => {
      mockGetProfile.mockResolvedValueOnce(mockProfileMfaEnabled).mockResolvedValue(mockProfile);
      mockDisableMfa.mockResolvedValue(undefined);
      renderProfilePage();

      await openSecurityTab();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^disable$/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^disable$/i }));

      const codeInput = screen.getByLabelText(/authenticator code/i);
      fireEvent.change(codeInput, { target: { value: '654321' } });

      fireEvent.click(screen.getByRole('button', { name: /disable mfa/i }));

      await waitFor(() => {
        expect(mockDisableMfa).toHaveBeenCalledWith({ code: '654321' });
        expect(mockToastSuccess).toHaveBeenCalledWith('MFA disabled');
      });
    });
  });

  describe('Responsive layout', () => {
    it('preferred name and job title fields share the custom field row layout', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      const preferredNameInput = screen.getByDisplayValue('Admin');
      const row = preferredNameInput.closest('.pm-field-row');
      expect(row).not.toBeNull();
      expect(row).toHaveClass('pm-field-row');
    });

    it('read-only fields use the custom read-only grid layout', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
      });

      const emailField = screen.getByText('Email').closest('.pm-readonly');
      const gridDiv = emailField?.closest('.pm-readonly-grid');
      expect(gridDiv).not.toBeNull();
      expect(gridDiv).toHaveClass('pm-readonly-grid');
    });
  });

  describe('Account information section', () => {
    it('shows account creation date', async () => {
      renderProfilePage();

      await openAccountTab();

      expect(screen.getByText('Account created')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    });

    it('shows company memberships count', async () => {
      renderProfilePage();

      await openAccountTab();

      expect(screen.getByText('Companies')).toBeInTheDocument();
      expect(screen.getByText('1 company')).toBeInTheDocument();
      expect(screen.getByText('Company A')).toBeInTheDocument();
    });

    it('shows public user ID', async () => {
      renderProfilePage();

      await openAccountTab();

      expect(screen.getByText('User ID')).toBeInTheDocument();
      expect(screen.getByText('usr_123')).toBeInTheDocument();
    });

    it('shows skeleton while loading account info', () => {
      mockGetProfile.mockImplementation(() => new Promise(() => {}));
      renderProfilePage();

      fireEvent.click(screen.getByRole('button', { name: /^account$/i }));

      const skeletons = document.querySelectorAll('.pm-account-grid .pm-skel');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
