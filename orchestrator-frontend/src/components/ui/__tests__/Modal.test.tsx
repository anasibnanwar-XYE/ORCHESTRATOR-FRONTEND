import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="My Modal" description="Modal description">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal description')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        <p>Content</p>
      </Modal>
    );
    // Click the backdrop (first div inside fixed container)
    const backdrop = document.querySelector('.absolute.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        <p>Content</p>
      </Modal>
    );
    // The close button has X icon
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Modal"
        footer={<button>Save</button>}
      >
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('applies sm size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <p>Content</p>
      </Modal>
    );
    expect(container.querySelector('.max-w-sm')).toBeInTheDocument();
  });

  it('applies xl size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        <p>Content</p>
      </Modal>
    );
    expect(container.querySelector('.max-w-2xl')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
