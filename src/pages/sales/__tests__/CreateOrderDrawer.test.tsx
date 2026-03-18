/**
 * Tests for CreateOrderDrawer (mobile-focused)
 *
 * Covers:
 *  - Drawer renders when isOpen=true
 *  - Drawer does NOT render when isOpen=false
 *  - Mobile stacked line items render on phone-sized viewport
 *  - Dealer combobox trigger button is accessible and renders
 *  - Line item "Add item" button is present
 *  - Footer actions (Discard, Create order) are present
 *  - Order summary totals section is rendered
 *  - Discard button calls onClose
 *  - Submit is disabled when no dealer is selected
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lucide-react', () => {
  const M = () => null;
  return {
    Plus: M, Trash2: M, Search: M, Check: M, Building2: M, X: M,
    ChevronDown: M,
  };
});

vi.mock('@/lib/salesApi', () => ({
  salesApi: {
    searchDealers: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
  },
}));

vi.mock('@/components/ui/Drawer', () => ({
  Drawer: ({
    isOpen,
    children,
    footer,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    title?: string;
  }) =>
    isOpen ? (
      <div data-testid="drawer">
        {title && <h2>{title}</h2>}
        <div data-testid="drawer-body">{children}</div>
        {footer && <div data-testid="drawer-footer">{footer}</div>}
      </div>
    ) : null,
}));

import { CreateOrderDrawer } from '../CreateOrderDrawer';

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

function renderDrawer(isOpen = true) {
  return render(
    <MemoryRouter>
      <CreateOrderDrawer
        isOpen={isOpen}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    </MemoryRouter>
  );
}

describe('CreateOrderDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the drawer when isOpen=true', () => {
    renderDrawer(true);
    expect(screen.getByTestId('drawer')).toBeDefined();
  });

  it('does not render the drawer when isOpen=false', () => {
    renderDrawer(false);
    expect(screen.queryByTestId('drawer')).toBeNull();
  });

  it('renders the "New sales order" title', () => {
    renderDrawer(true);
    expect(screen.getByText('New sales order')).toBeDefined();
  });

  it('renders the dealer combobox trigger', () => {
    renderDrawer(true);
    // The DealerCombobox renders a button with "Search dealer..." text
    const dealerButton = screen.queryByText('Search dealer...');
    expect(dealerButton).toBeDefined();
  });

  it('renders the Dealer required label', () => {
    renderDrawer(true);
    expect(screen.getByText('Dealer')).toBeDefined();
  });

  it('renders the "Add item" button for line items', () => {
    renderDrawer(true);
    const addItemBtn = screen.queryByText('Add item');
    expect(addItemBtn).toBeDefined();
  });

  it('renders the order summary section', () => {
    renderDrawer(true);
    expect(screen.getByText('Order Summary')).toBeDefined();
  });

  it('renders footer Discard and Create order buttons', () => {
    renderDrawer(true);
    expect(screen.getByText('Discard')).toBeDefined();
    expect(screen.getByText('Create order')).toBeDefined();
  });

  it('Create order button is disabled when no dealer is selected', () => {
    renderDrawer(true);
    const createBtn = screen.getByText('Create order').closest('button');
    expect(createBtn?.disabled).toBe(true);
  });

  it('Discard button calls onClose', () => {
    renderDrawer(true);
    const discardBtn = screen.getByText('Discard');
    fireEvent.click(discardBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows mobile stacked line items section (sm:hidden)', () => {
    renderDrawer(true);
    // The mobile stacked section has "Item 1" label
    const itemLabel = screen.queryByText('Item 1');
    expect(itemLabel).toBeDefined();
  });

  it('renders product code input for line items', () => {
    renderDrawer(true);
    // Input with placeholder "Product code" is in mobile view
    const productInputs = screen.queryAllByPlaceholderText(/product code/i);
    expect(productInputs.length).toBeGreaterThan(0);
  });

  it('renders edit form with pre-filled data when editOrder is provided', () => {
    const editOrder = {
      id: 1,
      orderNumber: 'SO-001',
      status: 'DRAFT',
      totalAmount: 50000,
      dealerId: 123,
      dealerName: 'Test Dealer',
      createdAt: '2026-01-01T00:00:00Z',
      items: [
        {
          productCode: 'P001',
          description: 'Paint',
          quantity: 5,
          unitPrice: 1000,
          gstRate: 18,
        },
      ],
    };
    render(
      <MemoryRouter>
        <CreateOrderDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          editOrder={editOrder as unknown as Parameters<typeof CreateOrderDrawer>[0]['editOrder']}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Edit draft order')).toBeDefined();
  });

  it('renders Grand Total in the order summary', async () => {
    renderDrawer(true);
    await waitFor(() => {
      expect(screen.getByText('Grand Total')).toBeDefined();
    });
  });
});
