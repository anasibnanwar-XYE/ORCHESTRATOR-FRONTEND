import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total" value={42} />);
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders with data-testid', () => {
    const { container } = render(<StatCard label="Count" value={10} />);
    expect(container.querySelector('[data-testid="stat-card"]')).not.toBeNull();
  });

  it('renders detail text when provided', () => {
    render(<StatCard label="Revenue" value="$1000" detail="Last updated 3h ago" />);
    expect(screen.getByText('Last updated 3h ago')).toBeDefined();
  });

  it('renders change indicator', () => {
    render(<StatCard label="Sales" value={100} change={{ value: 12, label: 'vs last week' }} />);
    expect(screen.getByText('+12%')).toBeDefined();
    expect(screen.getByText('vs last week')).toBeDefined();
  });

  it('applies default variant (tertiary text color) for label', () => {
    const { container } = render(<StatCard label="Default" value={0} />);
    const label = container.querySelector('p');
    expect(label?.className).toContain('text-[var(--color-text-tertiary)]');
  });

  it('applies info variant color to label via inline style', () => {
    const { container } = render(<StatCard label="Open" value={5} variant="info" />);
    const label = container.querySelector('p');
    // info variant applies inline style, not the default class
    expect(label?.className).not.toContain('text-[var(--color-text-tertiary)]');
    expect(label?.style.color).toBe('var(--color-info)');
  });

  it('applies warning variant color to label via inline style', () => {
    const { container } = render(<StatCard label="In Progress" value={3} variant="warning" />);
    const label = container.querySelector('p');
    expect(label?.style.color).toBe('var(--color-warning)');
  });

  it('applies success variant color to label via inline style', () => {
    const { container } = render(<StatCard label="Resolved" value={7} variant="success" />);
    const label = container.querySelector('p');
    expect(label?.style.color).toBe('var(--color-success)');
  });

  it('applies error variant color to label via inline style', () => {
    const { container } = render(<StatCard label="Errors" value={2} variant="error" />);
    const label = container.querySelector('p');
    expect(label?.style.color).toBe('var(--color-error)');
  });

  it('labelColor overrides variant', () => {
    const { container } = render(
      <StatCard label="Custom" value={1} variant="info" labelColor="var(--color-warning)" />
    );
    const label = container.querySelector('p');
    expect(label?.style.color).toBe('var(--color-warning)');
  });

  it('applies custom className', () => {
    const { container } = render(<StatCard label="Test" value={0} className="my-custom-class" />);
    const card = container.querySelector('[data-testid="stat-card"]');
    expect(card?.className).toContain('my-custom-class');
  });
});
