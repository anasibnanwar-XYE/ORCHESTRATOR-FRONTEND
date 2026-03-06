/**
 * Tests for DealerProfilePage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return { User: M, KeyRound: M, ArrowRight: M };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Test Dealer',
      email: 'dealer@test.com',
      roles: ['ROLE_DEALER'],
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { DealerProfilePage } from '../DealerProfilePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dealer/profile']}>
      <DealerProfilePage />
    </MemoryRouter>
  );
}

describe('DealerProfilePage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('My Profile')).toBeDefined();
  });

  it('shows dealer display name', () => {
    renderPage();
    expect(screen.getByText('Test Dealer')).toBeDefined();
  });

  it('shows dealer email', () => {
    renderPage();
    expect(screen.getByText('dealer@test.com')).toBeDefined();
  });

  it('shows edit profile button', () => {
    renderPage();
    expect(screen.getByText(/Edit Profile/i)).toBeDefined();
  });
});
