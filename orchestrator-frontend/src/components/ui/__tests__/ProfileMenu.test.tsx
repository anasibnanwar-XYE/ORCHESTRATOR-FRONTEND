/**
 * ProfileMenu.test.tsx
 *
 * Tests for ProfileMenu component covering:
 *  - Renders user avatar and display name
 *  - Opens dropdown on click
 *  - Shows user name, email, and role in dropdown
 *  - Profile link triggers onProfile callback
 *  - Sign out triggers onLogout callback
 *  - Closes dropdown on outside click
 *  - Closes dropdown after action click
 *  - Has proper aria attributes for accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileMenu } from '../ProfileMenu';

const mockUser = {
  displayName: 'Alice Admin',
  email: 'alice@example.com',
  role: 'ROLE_ADMIN',
};

describe('ProfileMenu', () => {
  let onLogout: ReturnType<typeof vi.fn>;
  let onProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onLogout = vi.fn();
    onProfile = vi.fn();
  });

  function renderMenu(props = {}) {
    return render(
      <ProfileMenu
        user={mockUser}
        onLogout={onLogout}
        onProfile={onProfile}
        {...props}
      />,
    );
  }

  it('renders user display name', () => {
    renderMenu();
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
  });

  it('renders trigger button with aria-label', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /profile menu/i });
    expect(trigger).toBeInTheDocument();
  });

  it('starts with dropdown closed (aria-expanded=false)', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /profile menu/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens dropdown on click and sets aria-expanded=true', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /profile menu/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows user name, email, and role in dropdown', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /profile menu/i });
    fireEvent.click(trigger);

    // The dropdown should show the user's info
    // Name appears in both trigger and dropdown header
    const names = screen.getAllByText('Alice Admin');
    expect(names.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('ROLE_ADMIN')).toBeInTheDocument();
  });

  it('calls onProfile and closes dropdown when Profile is clicked', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
    fireEvent.click(screen.getByText('Profile'));

    expect(onProfile).toHaveBeenCalledOnce();
    // Dropdown should close
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('calls onLogout and closes dropdown when Sign out is clicked', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
    fireEvent.click(screen.getByText('Sign out'));

    expect(onLogout).toHaveBeenCalledOnce();
    // Dropdown should close
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('closes dropdown on outside click', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('does not show Profile link if onProfile is not provided', () => {
    render(
      <ProfileMenu user={mockUser} onLogout={onLogout} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));

    // Profile link should not be rendered
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    // Sign out should still be there
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('dropdown has role="menu"', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
