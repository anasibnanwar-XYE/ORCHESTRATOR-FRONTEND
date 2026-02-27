import { FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { FileDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createSupplier,
  listSuppliers,
  updateSupplier,
  listAccounts,
  getSupplierStatementPdf,
  getSupplierAgingPdf,
  type SupplierRequest,
  type SupplierResponse,
  type AccountSummary,
} from '../../lib/accountingApi';
import SettlementModal from '../../components/SettlementModal';
import DebitNoteModal from '../../components/DebitNoteModal';

// ── PDF Download Helper ───────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  const [pdfDownloading, setPdfDownloading] = useState<{ id: number; type: 'statement' | 'aging' } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  const handleDownloadPdf = async (supplier: SupplierResponse, type: 'statement' | 'aging') => {
    if (!session) return;
    setPdfDownloading({ id: supplier.id, type });
    setPdfError(null);
    try {
      const blob = type === 'statement'
        ? await getSupplierStatementPdf(supplier.id, session)
        : await getSupplierAgingPdf(supplier.id, session);
      const filename = type === 'statement'
        ? `supplier-statement-${supplier.code || supplier.id}.pdf`
        : `supplier-aging-${supplier.code || supplier.id}.pdf`;
      downloadBlob(blob, filename);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Failed to download PDF');
    } finally {
      setPdfDownloading(null);
    }
  };

  if (!session) {
    return (
      <div className="rounded-xl border border-transparent bg-status-warning-bg p-6 text-sm text-status-warning-text">
        Sign in to manage suppliers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Supplier Master</p>
        <h1 className="text-3xl font-semibold text-primary">Supplier Accounts</h1>
        <p className="text-sm text-secondary">
          Manage supplier information and track outstanding balances.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}
      {pdfError && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {pdfError}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">
              {editing ? 'Edit Supplier' : 'Add Supplier'}
            </p>
            <h2 className="text-xl font-semibold text-primary">Supplier Information</h2>
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-secondary">
              Supplier name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Asian Paints Ltd"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Code (optional)
              <input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="SUP001"
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
                  placeholder="orders@asianpaints.com"
                />
              </label>
              <label className="text-xs uppercase tracking-widest text-secondary">
                Contact mobile
                <input
                  value={form.contactPhone}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="+91 98765 43210"
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
                placeholder="Warehouse address"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Credit limit
              <input
                type="number"
                value={form.creditLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="100000"
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-secondary">
              Payable Account (Liability)
              <select
                value={form.payableAccountId}
                onChange={(event) => setForm((prev) => ({ ...prev, payableAccountId: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-border bg-surface-highlight px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-xs text-status-error-text">
              {status.message}
            </div>
          )}
          {status.state === 'success' && status.message && (
            <div className="rounded-lg border border-transparent bg-status-success-bg px-4 py-3 text-xs text-status-success-text">
              {status.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-highlight"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={clsx(
                'w-full rounded-lg bg-action-primary-bg px-4 py-2.5 text-sm font-semibold text-action-primary-text shadow transition hover:bg-action-primary-hover',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {submitting ? 'Saving…' : editing ? 'Update supplier' : 'Create supplier'}
            </button>
          </div>
        </form>

        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Supplier Master List</p>
              <h2 className="text-xl font-semibold text-primary">Active Suppliers</h2>
            </div>
            <button
              type="button"
              onClick={refreshSuppliers}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-highlight hover:text-primary"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-secondary">Loading suppliers…</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-secondary">No suppliers found.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-highlight text-left text-xs font-medium uppercase tracking-wider text-secondary">
                  <tr>
                    <th className="px-4 py-2.5">Supplier</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5 text-right">Outstanding</th>
                    <th className="px-4 py-2.5 text-right">PDFs</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-surface-highlight">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-primary">{supplier.name}</div>
                        <div className="text-xs text-secondary">{supplier.code}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-primary">{supplier.contactEmail}</div>
                        <div className="text-xs text-secondary">{supplier.contactPhone}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-secondary">
                        ₹{(supplier.outstandingBalance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPdf(supplier, 'statement')}
                            disabled={!!pdfDownloading}
                            title="Download Statement PDF"
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-secondary hover:bg-surface-highlight hover:text-primary disabled:opacity-50 transition-colors"
                          >
                            <FileDown className="h-3 w-3" />
                            {pdfDownloading?.id === supplier.id && pdfDownloading?.type === 'statement' ? '…' : 'Stmt'}
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(supplier, 'aging')}
                            disabled={!!pdfDownloading}
                            title="Download Aging PDF"
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-secondary hover:bg-surface-highlight hover:text-primary disabled:opacity-50 transition-colors"
                          >
                            <FileDown className="h-3 w-3" />
                            {pdfDownloading?.id === supplier.id && pdfDownloading?.type === 'aging' ? '…' : 'Aging'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
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
                            className="text-xs font-medium text-secondary hover:text-primary"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettlementSupplier(supplier)}
                            className="text-xs font-medium text-secondary hover:text-primary"
                          >
                            Settle
                          </button>
                          <button
                            type="button"
                            onClick={() => setDebitNoteSupplier(supplier)}
                            className="text-xs font-medium text-secondary hover:text-primary"
                          >
                            Debit Note
                          </button>
                        </div>
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
