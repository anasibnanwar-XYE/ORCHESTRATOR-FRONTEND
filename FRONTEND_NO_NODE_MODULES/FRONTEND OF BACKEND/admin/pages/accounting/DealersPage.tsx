import { FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { createDealer, listDealers, toggleDealerHold, type DealerSummary, type CreateDealerPayload } from '../../lib/accountingApi';
import SettlementModal from '../../components/SettlementModal';

const initialForm = {
  name: '',
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  creditLimit: '',
};

export default function DealersPage() {
  const { session } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<{ state: 'idle' | 'success' | 'error'; message?: string }>({ state: 'idle' });
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

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
        setDealers(list);
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
      .then(setDealers)
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
      const res = response as any;
      if (res.portalEmail && res.generatedPassword) {
        setCredentials({ name: res.name, email: res.portalEmail, password: res.generatedPassword });
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

  if (!session) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-900 dark:text-amber-100">
        Sign in to manage dealers.
      </div>
    );
  }

  const [settlementDealer, setSettlementDealer] = useState<DealerSummary | null>(null);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Dealer Master</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Dealer Accounts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create dealer accounts, manage credentials, and track outstanding balances.
        </p>
      </header>

      {error && <p className="rounded-3xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Add Dealer</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Dealer Account Setup</h2>
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Dealer name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="ChatGPT Paint Depot"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Company name
              <input
                value={form.companyName}
                onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="ChatGPT Paints Pvt Ltd"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Contact email
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="ops@chatgptpaints.com"
                />
              </label>
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Contact mobile
                <input
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="+91 12345 67890"
                />
              </label>
            </div>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Address
              <textarea
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Street, city, state"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Credit limit (optional)
              <input
                type="number"
                value={form.creditLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="500000"
              />
            </label>
          </div>
          {status.state === 'error' && status.message && (
            <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{status.message}</p>
          )}
          {status.state === 'success' && status.message && (
            <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{status.message}</p>
          )}
          <button
            type="submit"
            disabled={!canSubmit || creating}
            className={clsx(
              'w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
              'enabled:hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {creating ? 'Issuing credentials…' : 'Create dealer'}
          </button>
          {credentials && (
            <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-50">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Credentials</p>
              <p className="mt-2 font-semibold">{credentials.name}</p>
              <p className="text-xs">Portal email: {credentials.email}</p>
              <p className="text-xs">Temporary password: {credentials.password}</p>
              <p className="mt-2 text-[11px] text-brand-100">Share securely; user will be asked to rotate the password on first login.</p>
            </div>
          )}
        </form>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Dealer Master List</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Active Dealers</h2>
            </div>
            <button
              type="button"
              onClick={refreshDealers}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500 hover:border-brand-300 hover:text-brand-200 dark:border-white/20"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading dealers…</p>
          ) : dealers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No dealers provisioned yet.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 dark:border-white/10">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Dealer</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2 text-right">Outstanding</th>
                    <th className="px-4 py-2 text-right">Credit limit</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {dealers.map((dealer) => (
                    <tr key={dealer.id}>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-slate-900 dark:text-white">{dealer.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dealer.email}</div>
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{dealer.code}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">
                        ₹{(dealer.outstandingBalance ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">
                        ₹{(dealer.creditLimit ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setSettlementDealer(dealer)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                        >
                          Settle
                        </button>
                        <button
                          onClick={async () => {
                            // @ts-ignore - onHold might be missing on type
                            if (!window.confirm(`Are you sure you want to ${dealer.onHold ? 'release' : 'hold'} this dealer?`)) return;
                            try {
                              // @ts-ignore
                              const response = await toggleDealerHold(dealer.id, !dealer.onHold, "Manual override", session);
                              if (response.success) {
                                refreshDealers();
                              } else {
                                alert(response.message);
                              }
                            } catch (e) {
                              alert('Failed to update status');
                            }
                          }}
                          className={clsx(
                            "ml-2 text-xs font-medium",
                            // @ts-ignore
                            dealer.onHold ? "text-emerald-600 hover:text-emerald-500" : "text-rose-600 hover:text-rose-500"
                          )}
                        >
                          {/* @ts-ignore */}
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
    </div>
  );
}

