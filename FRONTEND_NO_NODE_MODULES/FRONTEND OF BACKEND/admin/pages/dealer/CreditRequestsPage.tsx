import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listCreditRequests,
  createCreditRequest,
  type CreditRequestPayload,
} from '../../lib/salesApi';
import type { CreditRequestDto } from '../../lib/client/models/CreditRequestDto';

const fmtCurrency = (amount?: number) => {
  if (amount == null) return '—';
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusStyle = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return 'bg-status-success-bg text-status-success-text';
    case 'REJECTED':
      return 'bg-status-error-bg text-status-error-text';
    case 'PENDING':
      return 'bg-brand-500/10 text-brand-400';
    default:
      return 'bg-surface-highlight text-secondary';
  }
};

export default function CreditRequestsPage() {
  const { session } = useAuth();

  const [requests, setRequests] = useState<CreditRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCreditRequests(session);
      setRequests(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load credit requests');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload: CreditRequestPayload = {
        amountRequested: parsed,
        reason: reason.trim() || undefined,
      };
      await createCreditRequest(payload, session);
      setSuccess('Credit limit increase request submitted successfully.');
      setAmount('');
      setReason('');
      setShowForm(false);
      await loadRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Credit Requests</h1>
          <p className="text-xs text-secondary mt-0.5">Request an increase to your credit limit</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSuccess(''); }}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            New Request
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {success}
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-primary">Request Credit Limit Increase</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Amount Requested *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-secondary font-medium">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2.5 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
                placeholder="e.g. 500000"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-brand-400 transition-colors resize-none"
              placeholder="Why do you need a higher credit limit?"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-secondary">
          <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {/* Empty */}
      {!loading && requests.length === 0 && (
        <div className="py-12 text-center text-sm text-secondary">
          No credit requests yet. Tap "New Request" to get started.
        </div>
      )}

      {/* Request Cards — mobile-first */}
      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id ?? req.publicId}
              className="rounded-xl border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-primary tabular-nums">
                  {fmtCurrency(req.amountRequested)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(req.status)}`}>
                  {req.status ?? 'Unknown'}
                </span>
              </div>

              {req.reason && (
                <p className="text-sm text-secondary leading-relaxed">{req.reason}</p>
              )}

              <div className="flex items-center justify-between text-xs text-tertiary">
                <span>{fmtDate(req.createdAt)}</span>
                {req.publicId && <span className="font-mono">{req.publicId}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
