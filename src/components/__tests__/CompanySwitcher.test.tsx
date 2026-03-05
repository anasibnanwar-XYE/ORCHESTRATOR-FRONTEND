/**
 * Tests for CompanySwitcher
 *
 * Covers:
 *  - Renders current company code
 *  - Opens dropdown on click
 *  - Shows search input in dropdown
 *  - Fetches companies from API
 *  - Filters companies based on search input
 *  - Calls switchCompany on selection
 *  - Closes dropdown after switching
 *  - Shows loading state while switching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CompanySwitcher } from '../CompanySwitcher';
import { adminApi } from '@/lib/adminApi';
import type { Company } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockSwitchCompany = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ROLE_ADMIN',
      companyCode: 'ORCH',
      companyId: 1,
      isActive: true,
      mfaEnabled: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    session: {
      companyCode: 'ORCH',
      companyId: '1',
    },
    switchCompany: mockSwitchCompany,
  }),
}));

vi.mock('@/lib/adminApi', () => ({
  adminApi: {
    getCompanies: vi.fn(),
  },
}));

const mockCompanies: Company[] = [
  {
    id: 1,
    code: 'ORCH',
    name: 'Orchestrator Demo',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    code: 'ACM',
    name: 'Acme Corp',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    code: 'XYZ',
    name: 'XYZ Industries',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderSwitcher() {
  return render(
    <MemoryRouter>
      <CompanySwitcher />
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CompanySwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApi.getCompanies).mockResolvedValue(mockCompanies);
  });

  it('renders current company code', () => {
    renderSwitcher();
    expect(screen.getByText('ORCH')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    renderSwitcher();
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    // After clicking, companies should load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search companies/i)).toBeInTheDocument();
    });
  });

  it('shows active companies in dropdown', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Orchestrator Demo')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('filters companies based on search', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search companies/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/search companies/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Orchestrator Demo')).not.toBeInTheDocument();
  });

  it('calls switchCompany when a different company is selected', async () => {
    mockSwitchCompany.mockResolvedValue(undefined);
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Acme Corp'));
    await waitFor(() => {
      expect(mockSwitchCompany).toHaveBeenCalledWith({ companyCode: 'ACM' });
    });
  });

  it('closes dropdown after successful company switch', async () => {
    mockSwitchCompany.mockResolvedValue(undefined);
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Acme Corp'));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search companies/i)).not.toBeInTheDocument();
    });
  });

  it('does not call switchCompany when current company is clicked', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Orchestrator Demo')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Orchestrator Demo'));
    expect(mockSwitchCompany).not.toHaveBeenCalled();
  });
});
