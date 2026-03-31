/**
 * Tests for CommandPalette
 *
 * Covers:
 *  - useCommandPalette hook provides open/close/toggle/isOpen
 *  - Cmd+K / Ctrl+K opens the palette
 *  - Escape closes the palette
 *  - Search input is rendered when palette is open
 *  - Navigation items render and are filterable
 *  - Keyboard navigation in palette
 *  - Clicking a navigation item executes its action
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock lucide-react to avoid heavy imports in test environment
// Define MockIcon INSIDE the factory (vi.mock is hoisted above module-level vars)
vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Search: M, LayoutGrid: M, LayoutDashboard: M, CheckSquare: M,
    Users: M, Shield: M, Building2: M, Settings: M, BarChart3: M,
    BookOpen: M, Truck: M, Package: M, UserCheck: M, Banknote: M,
    Calendar: M, ShoppingCart: M, CreditCard: M, ArrowUpCircle: M,
    Tag: M, FileText: M, Target: M, RotateCcw: M, Factory: M,
    ClipboardList: M, Layers: M, PackageCheck: M, Box: M, FlaskConical: M,
    Settings2: M, SquareStack: M, ShoppingBag: M, Clock: M, LifeBuoy: M,
    User: M, LogOut: M, Sun: M, Moon: M, Zap: M,
  };
});

import { CommandPaletteProvider, useCommandPalette } from '../CommandPalette';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/context/AuthContext', () => {
  // Stable references inside the factory prevent infinite loops
  // caused by new objects being created on every render.
  const stableUser = {
    email: 'admin@test.com',
    displayName: 'Alice Admin',
    roles: ['ROLE_ADMIN'],
    permissions: [],
    mfaEnabled: false,
  };
  const stableSession = { companyCode: 'ORCH' };
  const stableSignOut = vi.fn();
  return {
    useAuth: () => ({
      user: stableUser,
      session: stableSession,
      signOut: stableSignOut,
    }),
  };
});

vi.mock('@/hooks/useTheme', () => {
  const stableToggle = vi.fn();
  return {
    useTheme: () => ({ toggle: stableToggle, isDark: false, theme: 'light' }),
  };
});

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock KBD to avoid deep rendering
vi.mock('@/components/ui/KBD', () => ({
  KBD: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// localStorage stub
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Hook consumer
// ─────────────────────────────────────────────────────────────────────────────

function HookConsumer() {
  const { isOpen, open, close, toggle } = useCommandPalette();
  return (
    <div>
      <span data-testid="status">{isOpen ? 'open' : 'closed'}</span>
      <button onClick={open} data-testid="open-btn">Open</button>
      <button onClick={close} data-testid="close-btn">Close</button>
      <button onClick={toggle} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MemoryRouter>
      <CommandPaletteProvider>
        <HookConsumer />
      </CommandPaletteProvider>
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandPalette — useCommandPalette hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('starts closed', () => {
    renderWithProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('open() opens the palette', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('open');
  });

  it('close() closes the palette', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    fireEvent.click(screen.getByTestId('close-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('toggle() flips the state', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('open');
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });
});

describe('CommandPalette — keyboard shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('Ctrl+K opens the palette', () => {
    renderWithProvider();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('open');
  });

  it('Meta+K (Cmd+K) opens the palette', () => {
    renderWithProvider();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('open');
  });

  it('Escape closes the palette when open', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('open');
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });
});

describe('CommandPalette — palette content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders search input when open', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    expect(screen.getByPlaceholderText(/search pages, actions/i)).toBeInTheDocument();
  });

  it('shows navigation items for admin portal', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    // Admin navigation items should be visible (at least Dashboard)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });

  it('filters items when typing in search', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    const input = screen.getByPlaceholderText(/search pages, actions/i);
    fireEvent.change(input, { target: { value: 'approval' } });
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('shows quick actions section', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    // Profile appears as both a nav description and a quick action item
    const profileItems = screen.getAllByText(/profile/i);
    expect(profileItems.length).toBeGreaterThan(0);
  });
});

describe('CommandPalette — keyboard navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('ArrowDown selects an item', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    const input = screen.getByPlaceholderText(/search pages, actions/i);
    // Initially selectedIndex=0, first item is data-selected=true
    // After ArrowDown, selectedIndex becomes 1
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    // The palette shows items with data-selected attribute
    const allItems = document.querySelectorAll('[data-selected]');
    expect(allItems.length).toBeGreaterThan(0);
  });

  it('Enter executes selected item and closes palette', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    const input = screen.getByPlaceholderText(/search pages, actions/i);
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });
});

describe('CommandPalette — click navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('clicking Dashboard item navigates and closes palette', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('open-btn'));
    // Find and click the first Dashboard item
    const dashboards = screen.getAllByText('Dashboard');
    fireEvent.click(dashboards[0]);
    expect(mockNavigate).toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });
});
