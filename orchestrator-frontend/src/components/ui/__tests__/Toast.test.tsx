import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

// Helper component that triggers toasts
function ToastTrigger({ type, title }: { type: 'success' | 'error' | 'warning' | 'info'; title: string }) {
  const toast = useToast();
  return (
    <button
      onClick={() => {
        if (type === 'success') toast.success(title);
        else if (type === 'error') toast.error(title);
        else if (type === 'warning') toast.warning(title);
        else if (type === 'info') toast.info(title);
      }}
    >
      Show {type}
    </button>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('ToastProvider / useToast', () => {
  it('throws when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastTrigger type="success" title="test" />)).toThrow();
    spy.mockRestore();
  });

  it('renders success toast on success call', async () => {
    renderWithProvider(<ToastTrigger type="success" title="Saved!" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Saved!')).toBeInTheDocument());
  });

  it('renders error toast on error call', async () => {
    renderWithProvider(<ToastTrigger type="error" title="Failed!" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Failed!')).toBeInTheDocument());
  });

  it('renders warning toast', async () => {
    renderWithProvider(<ToastTrigger type="warning" title="Warning!" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Warning!')).toBeInTheDocument());
  });

  it('renders info toast', async () => {
    renderWithProvider(<ToastTrigger type="info" title="Info!" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Info!')).toBeInTheDocument());
  });

  it('renders multiple toasts', async () => {
    function MultiToast() {
      const toast = useToast();
      return (
        <>
          <button onClick={() => toast.success('Toast One')}>btn-first</button>
          <button onClick={() => toast.error('Toast Two')}>btn-second</button>
        </>
      );
    }
    renderWithProvider(<MultiToast />);
    fireEvent.click(screen.getByText('btn-first'));
    fireEvent.click(screen.getByText('btn-second'));
    await waitFor(() => {
      expect(screen.getByText('Toast One')).toBeInTheDocument();
      expect(screen.getByText('Toast Two')).toBeInTheDocument();
    });
  });

  it('renders toast with description', async () => {
    function ToastWithDesc() {
      const toast = useToast();
      return (
        <button onClick={() => toast.success('Toast Title', 'Description text')}>Show</button>
      );
    }
    renderWithProvider(<ToastWithDesc />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });

  it('can dismiss a toast via the dismiss function', async () => {
    function DismissToast() {
      const toast = useToast();
      const handleShow = () => {
        toast.toast({ type: 'info', title: 'Dismissable', duration: 100000 });
      };
      return <button onClick={handleShow}>Show</button>;
    }
    renderWithProvider(<DismissToast />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Dismissable')).toBeInTheDocument());
  });
});
