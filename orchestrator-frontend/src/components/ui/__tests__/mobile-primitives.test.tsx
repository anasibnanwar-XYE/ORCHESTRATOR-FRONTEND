/**
 * Tests for mobile design-system primitives:
 *   BottomSheet, ActionSheet, BottomNav, MobileAppShell,
 *   FAB, SwipeableCard, ResponsiveContainer, ResponsiveGrid, Stack
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Home, ShoppingCart, Plus } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import { ActionSheet, type ActionSheetItem } from '../ActionSheet';
import { BottomNav, type BottomNavItem } from '../BottomNav';
import { MobileAppShell } from '../MobileAppShell';
import { FAB } from '../FAB';
import { SwipeableCard } from '../SwipeableCard';
import { ResponsiveContainer, ResponsiveGrid, Stack } from '../ResponsiveContainer';

/* ─── BottomSheet ─── */
// BottomSheet renders two sections (desktop modal + mobile sheet) simultaneously,
// so elements appear twice in the DOM. We use getAllByText where needed.
describe('BottomSheet', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not render when isOpen is false', () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('renders children when isOpen is true', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Sheet content</p>
      </BottomSheet>,
    );
    // Both desktop and mobile sections render — at least one must be present
    expect(screen.getAllByText('Sheet content').length).toBeGreaterThan(0);
  });

  it('renders title and description', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} title="Create entry" description="Fill the form below.">
        <p>Body</p>
      </BottomSheet>,
    );
    expect(screen.getAllByText('Create entry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fill the form below.').length).toBeGreaterThan(0);
  });

  it('renders footer when provided', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} footer={<button>Save</button>}>
        <p>Body</p>
      </BottomSheet>,
    );
    expect(screen.getAllByText('Save').length).toBeGreaterThan(0);
  });

  it('calls onClose when backdrop is clicked (dismissible=true)', () => {
    const onClose = vi.fn();
    const { container } = render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <p>Body</p>
      </BottomSheet>,
    );
    // The backdrop is the first .absolute.inset-0 inside the fixed container
    const backdrop = container.querySelector('.absolute.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    // handleClose uses a 250ms timeout; advance timers to complete
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <p>Body</p>
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    // Escape calls onClose directly (no animation delay)
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button calls onClose after animation', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="My sheet">
        <p>Body</p>
      </BottomSheet>,
    );
    // Find a close button by aria-label (may appear twice — pick first)
    const closeBtn = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('aria-label') === 'Close',
    );
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn!);
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalled();
  });
});

/* ─── ActionSheet ─── */
// ActionSheet renders both desktop and mobile variants simultaneously.
describe('ActionSheet', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const items: ActionSheetItem[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', variant: 'danger' },
  ];

  it('does not render when isOpen is false', () => {
    render(
      <ActionSheet isOpen={false} onClose={vi.fn()} items={items} onSelect={vi.fn()} />,
    );
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('renders items when isOpen is true', () => {
    render(
      <ActionSheet isOpen={true} onClose={vi.fn()} items={items} onSelect={vi.fn()} />,
    );
    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('renders title when provided', () => {
    render(
      <ActionSheet isOpen={true} onClose={vi.fn()} title="Actions" items={items} onSelect={vi.fn()} />,
    );
    expect(screen.getAllByText('Actions').length).toBeGreaterThan(0);
  });

  it('calls onSelect with the correct item id', () => {
    const onSelect = vi.fn();
    render(
      <ActionSheet isOpen={true} onClose={vi.fn()} items={items} onSelect={onSelect} />,
    );
    // Click the first "Edit" button found
    const editBtns = screen.getAllByText('Edit');
    fireEvent.click(editBtns[0]);
    expect(onSelect).toHaveBeenCalledWith('edit');
  });

  it('renders Cancel button', () => {
    render(
      <ActionSheet isOpen={true} onClose={vi.fn()} items={items} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('respects custom cancelLabel', () => {
    render(
      <ActionSheet
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        onSelect={vi.fn()}
        cancelLabel="Dismiss"
      />,
    );
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('calls onClose after animation when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <ActionSheet isOpen={true} onClose={onClose} items={items} onSelect={vi.fn()} />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    // handleClose uses a 200ms timeout
    act(() => vi.advanceTimersByTime(250));
    expect(onClose).toHaveBeenCalled();
  });
});

/* ─── BottomNav ─── */
describe('BottomNav', () => {
  const navItems: BottomNavItem[] = [
    { id: 'home', label: 'Home', icon: <Home /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart />, badge: 3 },
  ];

  it('renders all nav items', () => {
    render(
      <BottomNav items={navItems} activeId="home" onNavigate={vi.fn()} />,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('calls onNavigate with correct id when item is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <BottomNav items={navItems} activeId="home" onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText('Orders'));
    expect(onNavigate).toHaveBeenCalledWith('orders', undefined);
  });

  it('renders badge when provided', () => {
    render(
      <BottomNav items={navItems} activeId="home" onNavigate={vi.fn()} />,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

/* ─── MobileAppShell ─── */
describe('MobileAppShell', () => {
  it('renders children', () => {
    render(
      <MobileAppShell>
        <p>Page content</p>
      </MobileAppShell>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders title in top bar', () => {
    render(
      <MobileAppShell title="Dashboard">
        <p>Content</p>
      </MobileAppShell>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders topBarRight slot', () => {
    render(
      <MobileAppShell topBarRight={<button>Profile</button>}>
        <p>Content</p>
      </MobileAppShell>,
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows mobile menu button when sidebar is provided', () => {
    render(
      <MobileAppShell sidebar={<div>Nav</div>}>
        <p>Content</p>
      </MobileAppShell>,
    );
    const menuBtn = screen.getByRole('button', { name: /open menu/i });
    expect(menuBtn).toBeInTheDocument();
  });

  it('opens sidebar overlay when menu button is clicked', () => {
    render(
      <MobileAppShell sidebar={<div>Sidebar nav</div>}>
        <p>Content</p>
      </MobileAppShell>,
    );
    const menuBtn = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuBtn);
    expect(screen.getByText('Sidebar nav')).toBeInTheDocument();
  });

  it('closes sidebar when close button is clicked', () => {
    render(
      <MobileAppShell sidebar={<div>Sidebar nav</div>}>
        <p>Content</p>
      </MobileAppShell>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByText('Sidebar nav')).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: /close menu/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Sidebar nav')).not.toBeInTheDocument();
  });
});

/* ─── FAB ─── */
describe('FAB', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<FAB icon={<Plus />} onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders label when provided', () => {
    render(<FAB icon={<Plus />} onClick={vi.fn()} label="New order" />);
    expect(screen.getByText('New order')).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<FAB icon={<Plus />} onClick={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[var(--color-neutral-900)]');
  });
});

/* ─── SwipeableCard ─── */
describe('SwipeableCard', () => {
  it('renders children', () => {
    render(
      <SwipeableCard>
        <p>Card content</p>
      </SwipeableCard>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked and not swiped', () => {
    const onClick = vi.fn();
    render(
      <SwipeableCard onClick={onClick}>
        <p>Card</p>
      </SwipeableCard>,
    );
    fireEvent.click(screen.getByText('Card'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

/* ─── ResponsiveContainer ─── */
describe('ResponsiveContainer', () => {
  it('renders children', () => {
    render(
      <ResponsiveContainer>
        <p>Container content</p>
      </ResponsiveContainer>,
    );
    expect(screen.getByText('Container content')).toBeInTheDocument();
  });

  it('applies max-w-5xl by default (lg)', () => {
    const { container } = render(
      <ResponsiveContainer>
        <p>Content</p>
      </ResponsiveContainer>,
    );
    expect(container.firstChild).toHaveClass('max-w-5xl');
  });

  it('applies max-w-7xl for xl', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="xl">
        <p>Content</p>
      </ResponsiveContainer>,
    );
    expect(container.firstChild).toHaveClass('max-w-7xl');
  });
});

/* ─── ResponsiveGrid ─── */
describe('ResponsiveGrid', () => {
  it('renders children in a grid', () => {
    render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies grid class', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item</div>
      </ResponsiveGrid>,
    );
    expect(container.firstChild).toHaveClass('grid');
  });
});

/* ─── Stack ─── */
describe('Stack', () => {
  it('renders children', () => {
    render(
      <Stack>
        <span>A</span>
        <span>B</span>
      </Stack>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies flex-col by default', () => {
    const { container } = render(
      <Stack>
        <span>A</span>
      </Stack>,
    );
    expect(container.firstChild).toHaveClass('flex-col');
  });

  it('applies flex-row for horizontal direction', () => {
    const { container } = render(
      <Stack direction="horizontal">
        <span>A</span>
      </Stack>,
    );
    expect(container.firstChild).toHaveClass('flex-row');
  });

  it('applies responsive classes when responsive=true', () => {
    const { container } = render(
      <Stack responsive>
        <span>A</span>
      </Stack>,
    );
    expect(container.firstChild).toHaveClass('flex-col');
    expect((container.firstChild as HTMLElement).className).toContain('sm:flex-row');
  });
});
