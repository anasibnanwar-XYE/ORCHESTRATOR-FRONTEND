import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  createCreditOverrideRequest,
  type CreditLimitOverrideRequestCreateRequest,
} from '../../lib/salesApi';

/**
 * Sales portal credit override request page.
 *
 * ROLE_SALES can only CREATE override requests.
 * Listing / approving / rejecting is restricted to ROLE_ADMIN | ROLE_ACCOUNTING
 * and handled in the accounting portal.
 */
export default function CreditOverridesPage() {
  const { session } = useAuth();

  const [formData, setFormData] = useState<CreditLimitOverrideRequestCreateRequest>({
    dispatchAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dispatchAmount <= 0) {
      setError('Dispatch amount is required');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createCreditOverrideRequest(formData, session);
      setSuccess('Override request submitted. It will be reviewed by the accounting team.');
      setFormData({ dispatchAmount: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-xl font-semibold text-primary">Request Credit Override</h1>
        <p className="mt-1 text-sm text-secondary">
          Submit a credit limit override request for dispatch approval. Requests are reviewed by the accounting team.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {success}
        </div>
      )}

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Dealer ID</label>
            <input
              type="number"
              value={formData.dealerId ?? ''}
              onChange={(e) => setFormData({ ...formData, dealerId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Sales Order ID</label>
            <input
              type="number"
              value={formData.salesOrderId ?? ''}
              onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Packaging Slip ID</label>
            <input
              type="number"
              value={formData.packagingSlipId ?? ''}
              onChange={(e) => setFormData({ ...formData, packagingSlipId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Dispatch Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.dispatchAmount || ''}
              onChange={(e) => setFormData({ ...formData, dispatchAmount: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
              placeholder="Required"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Reason</label>
            <textarea
              value={formData.reason ?? ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value || undefined })}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors resize-none"
              placeholder="Justification for the override"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Expires At</label>
            <input
              type="date"
              value={formData.expiresAt ?? ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-brand-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
