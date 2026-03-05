import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Plus } from 'lucide-react';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[var(--color-neutral-900)]');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-[var(--color-error)]');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole('button');
    // There should be an SVG spinner (animate-spin)
    expect(btn.querySelector('.animate-spin')).toBeTruthy();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders leftIcon', () => {
    render(<Button leftIcon={<Plus data-testid="icon" />}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('h-8');
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('h-11');
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement>;
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
