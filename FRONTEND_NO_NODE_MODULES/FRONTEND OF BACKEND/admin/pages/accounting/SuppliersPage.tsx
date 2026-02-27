import { FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import {
  createSupplier,
  listSuppliers,
  updateSupplier,
  listAccounts,
  type SupplierRequest,
  type SupplierResponse,
  type AccountSummary,
} from '../../lib/accountingApi';
import SettlementModal from '../../components/SettlementModal';
import DebitNoteModal from '../../components/DebitNoteModal';

const initialForm = {
  name: '',
  code: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  creditLimit: '',
  payableAccountId: '',
};

export default function SuppliersPage() {
  const { session } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState<SupplierResponse | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ state: 'idle' | 'success' | 'error'; message?: string }>({ state: 'idle' });
  const [settlementSupplier, setSettlementSupplier] = useState<SupplierResponse | null>(null);
  const [debitNoteSupplier, setDebitNoteSupplier] = useState<SupplierResponse | null>(null);

  const canSubmit = useMemo(
    () => form.name.trim().length > 0,
    [form]
  );

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listSuppliers(session),
      listAccounts(session)
    ])
      .then(([supplierRows, accountRows]) => {
        if (!active) return;
        setSuppliers(supplierRows);
        setAccounts(accountRows);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load data.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refreshSuppliers = () => {
    if (!session) return;
    listSuppliers(session)
      .then(setSuppliers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh suppliers.'));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditing(null);
    setStatus({ state: 'idle' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !canSubmit || submitting) return;
    setSubmitting(true);
    setStatus({ state: 'idle' });
    setError(null);

    const creditLimitNumber = form.creditLimit ? Math.max(0, Number(form.creditLimit)) : undefined;
    const payload: SupplierRequest = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      address: form.address.trim() || undefined,
      creditLimit: creditLimitNumber,
      payableAccountId: form.payableAccountId ? Number(form.payableAccountId) : undefined,
    };

    try {
      if (editing) {
        await updateSupplier(editing.id, payload, session);
        setStatus({ state: 'success', message: 'Supplier updated.' });
      } else {
        await createSupplier(payload, session);
        setStatus({ state: 'success', message: 'Supplier created.' });
      }
      resetForm();
      refreshSuppliers();
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Unable to save supplier.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-900 dark:text-amber-100">
        Sign in to manage suppliers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Supplier Master</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Supplier Accounts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage supplier information and track outstanding balances.
        </p>
      </header>

      {error && <p className="rounded-3xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400">
              {editing ? 'Edit Supplier' : 'Add Supplier'}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Supplier Information</h2>
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Supplier name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Asian Paints Ltd"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Code (optional)
              <input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="SUP001"
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
                  placeholder="orders@asianpaints.com"
                />
              </label>
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Contact mobile
                <input
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="+91 98765 43210"
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
                placeholder="Warehouse address"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Credit limit
              <input
                type="number"
                value={form.creditLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="100000"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Payable Account (Liability)
              <select
                value={form.payableAccountId}
                onChange={(event) => setForm((prev) => ({ ...prev, payableAccountId: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="">Default (Auto-assigned)</option>
                {accounts
                  .filter((a) => a.type === 'Liability' || a.type === 'Accounts Payable')
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {status.state === 'error' && status.message && (
            <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{status.message}</p>
          )}
          {status.state === 'success' && status.message && (
            <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{status.message}</p>
          )}

          <div className="flex items-center gap-2">
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={clsx(
                'w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                'enabled:hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {submitting ? 'Saving…' : editing ? 'Update supplier' : 'Create supplier'}
            </button>
          </div>
        </form>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Supplier Master List</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Active Suppliers</h2>
            </div>
            <button
              type="button"
              onClick={refreshSuppliers}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500 hover:border-brand-300 hover:text-brand-200 dark:border-white/20"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading suppliers…</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No suppliers found.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 dark:border-white/10">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Supplier</th>
                    <th className="px-4 py-2">Contact</th>
                    <th className="px-4 py-2 text-right">Outstanding</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-slate-900 dark:text-white">{supplier.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{supplier.code}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-slate-900 dark:text-slate-200">{supplier.contactEmail}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{supplier.contactPhone}</div>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">
                        ₹{(supplier.outstandingBalance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditing(supplier);
                            setForm({
                              name: supplier.name,
                              code: supplier.code,
                              contactEmail: supplier.contactEmail || '',
                              contactPhone: supplier.contactPhone || '',
                              address: supplier.address || '',
                              creditLimit: supplier.creditLimit ? String(supplier.creditLimit) : '',
                              payableAccountId: supplier.payableAccountId ? String(supplier.payableAccountId) : '',
                            });
                            setStatus({ state: 'idle' });
                          }}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSettlementSupplier(supplier)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => setDebitNoteSupplier(supplier)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          Debit Note
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

      {settlementSupplier && (
        <SettlementModal
          open={!!settlementSupplier}
          onClose={() => setSettlementSupplier(null)}
          partnerId={settlementSupplier.id}
          partnerType="SUPPLIER"
          partnerName={settlementSupplier.name}
          onSuccess={() => {
            refreshSuppliers();
          }}
        />
      )}

      {debitNoteSupplier && (
        <DebitNoteModal
          open={!!debitNoteSupplier}
          onClose={() => setDebitNoteSupplier(null)}
          supplierId={debitNoteSupplier.id}
          supplierName={debitNoteSupplier.name}
          onSuccess={() => {
            refreshSuppliers();
          }}
        />
      )}
    </div>
  );
}
