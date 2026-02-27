import { FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { createDealer, listDealers, toggleDealerHold, type DealerSummary, type CreateDealerPayload } from '../../lib/accountingApi';
import SettlementModal from '../../components/SettlementModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DealerWithHold extends DealerSummary {
  onHold?: boolean;
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl ring-1 ring-border">
        <h3 className="text-base font-semibold text-primary">{state.title}</h3>
        <p className="mt-2 text-sm text-secondary">{state.message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { state.onConfirm(); onClose(); }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form constants ────────────────────────────────────────────────────────────

const initialForm = {
  name: '',
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  creditLimit: '',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function DealersPage() {
  const { session } = useAuth();

  // All hooks declared unconditionally at the top
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<{ state: 'idle' | 'success' | 'error'; message?: string }>({ state: 'idle' });
  const [dealers, setDealers] = useState<DealerWithHold[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [settlementDealer, setSettlementDealer] = useState<DealerSummary | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => undefined,
  });

  const canSubmit = useMemo(
    () => form.name.trim() && form.companyName.trim() && form.contactEmail.trim() && form.contactPhone.trim(),
    [form]
  );

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    listDealers(session)
      .then((list) => {
        if (!active) return;
        setDealers(list as DealerWithHold[]);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load dealers.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refreshDealers = () => {
    if (!session) return;
    listDealers(session)
      .then((list) => setDealers(list as DealerWithHold[]))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh dealers.'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !canSubmit) return;
    setCreating(true);
    setStatus({ state: 'idle' });
    setCredentials(null);
    const payload: CreateDealerPayload = {
      name: form.name.trim(),
      companyName: form.companyName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      address: form.address.trim() || undefined,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
    };
    try {
      const response = await createDealer(payload, session);
      setStatus({ state: 'success', message: `${response.name} created successfully.` });
      const res = response as DealerSummary & { portalEmail?: string; generatedPassword?: string };
      if (res.portalEmail && res.generatedPassword) {
        setCredentials({ name: res.name || '', email: res.portalEmail, password: res.generatedPassword });
      }
      setForm(initialForm);
      refreshDealers();
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Unable to create dealer.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleHold = (dealer: DealerWithHold) => {
    const action = dealer.onHold ? 'release' : 'hold';
    setConfirmState({
      open: true,
      title: dealer.onHold ? 'Release Dealer Hold' : 'Place Dealer on Hold',
      message: `Are you sure you want to ${action} "${dealer.name}"?`,
      onConfirm: async () => {
        try {
          setHoldError(null);
          const response = await toggleDealerHold(dealer.id || 0, !dealer.onHold, 'Manual override', session);
          if (response.success) {
            refreshDealers();
          } else {
            setHoldError(response.message);
          }
        } catch (e) {
          setHoldError(e instanceof Error ? e.message : 'Failed to update dealer status');
        }
      },
    });
  };

  // Conditional render after all hooks
  if (!session) {
    return (
      <div className="rounded-xl border border-transparent bg-status-warning-bg p-6 text-sm text-status-warning-text">
        Sign in to manage dealers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dealer Master</p>
        <h1 className="text-3xl font-semibold text-primary">Dealer Accounts</h1>
        <p className="text-sm text-secondary">
          Create dealer accounts, manage credentials, and track outstanding balances.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}
      {holdError && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {holdError}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Create Dealer Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Add Dealer</p>
            <h2 className="text-xl font-semibold text-primary">Dealer Account Setup</h2>
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-secondary">
              Dealer name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Acme Paint Depot"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Company name
              <input
                value={form.companyName}
                onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Acme Paints Pvt Ltd"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-widest text-secondary">
                Contact email
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="ops@acmepaints.com"
                />
              </label>
              <label className="text-xs uppercase tracking-widest text-secondary">
                Contact mobile
                <input
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="+91 12345 67890"
                />
              </label>
            </div>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Address
              <textarea
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Street, city, state"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Credit limit (optional)
              <input
                type="number"
                value={form.creditLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="500000"
              />
            </label>
          </div>

          {status.state === 'error' && status.message && (
            <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-xs text-status-error-text">
              {status.message}
            </div>
          )}
          {status.state === 'success' && status.message && (
            <div className="rounded-lg border border-transparent bg-status-success-bg px-4 py-3 text-xs text-status-success-text">
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || creating}
            className={clsx(
              'w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {creating ? 'Issuing credentials…' : 'Create dealer'}
          </button>

          {credentials && (
            <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-primary">
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Credentials</p>
              <p className="mt-2 font-semibold">{credentials.name}</p>
              <p className="text-xs text-secondary">Portal email: {credentials.email}</p>
              <p className="text-xs text-secondary">Temporary password: {credentials.password}</p>
              <p className="mt-2 text-xs text-tertiary">
                Share securely; user will be asked to rotate the password on first login.
              </p>
            </div>
          )}
        </form>

        {/* Dealer List */}
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dealer Master List</p>
              <h2 className="text-xl font-semibold text-primary">Active Dealers</h2>
            </div>
            <button
              type="button"
              onClick={refreshDealers}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-highlight hover:text-primary"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-secondary">Loading dealers…</p>
          ) : dealers.length === 0 ? (
            <p className="text-sm text-secondary">No dealers provisioned yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-highlight text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-4 py-2.5">Dealer</th>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5 text-right">Outstanding</th>
                    <th className="px-4 py-2.5 text-right">Credit limit</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {dealers.map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-surface-highlight">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-primary">{dealer.name}</div>
                        <div className="text-xs text-secondary">{dealer.email}</div>
                      </td>
                      <td className="px-4 py-2.5 text-secondary">{dealer.code}</td>
                      <td className="px-4 py-2.5 text-right text-secondary">
                        ₹{(dealer.outstandingBalance ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-secondary">
                        ₹{(dealer.creditLimit ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setSettlementDealer(dealer)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => handleToggleHold(dealer)}
                          className={clsx(
                            'ml-3 text-xs font-medium',
                            dealer.onHold
                              ? 'text-status-success-text hover:opacity-80'
                              : 'text-status-error-text hover:opacity-80'
                          )}
                        >
                          {dealer.onHold ? 'Release' : 'Hold'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {settlementDealer && (
        <SettlementModal
          open={!!settlementDealer}
          onClose={() => setSettlementDealer(null)}
          partnerId={settlementDealer.id || 0}
          partnerType="DEALER"
          partnerName={settlementDealer.name || ''}
          onSuccess={() => {
            refreshDealers();
          }}
        />
      )}

      <ConfirmDialog
        state={confirmState}
        onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
