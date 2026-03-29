import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';
import { Search } from 'lucide-react';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="email@example.com" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('displays hint when no error', () => {
    render(<Input hint="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('does not show hint when error is present', () => {
    render(<Input error="Error!" hint="Some hint" />);
    expect(screen.queryByText('Some hint')).not.toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('shows error icon when error is set', () => {
    render(<Input error="Required" />);
    // AlertCircle icon is rendered in the error state
    const input = screen.getByRole('textbox');
    // The parent div should contain the error icon
    expect(input.parentElement?.querySelector('svg')).toBeTruthy();
  });

  it('renders leftIcon', () => {
    render(<Input leftIcon={<Search data-testid="search-icon" />} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('applies disabled styles', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('fires onChange handler', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('applies error border class when error prop is set', () => {
    render(<Input error="Required" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-[var(--color-error-border)]');
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>;
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies sm size styles', () => {
    render(<Input inputSize="sm" />);
    expect(screen.getByRole('textbox').className).toContain('h-8');
  });

  it('applies lg size styles', () => {
    render(<Input inputSize="lg" />);
    expect(screen.getByRole('textbox').className).toContain('h-11');
  });
});
