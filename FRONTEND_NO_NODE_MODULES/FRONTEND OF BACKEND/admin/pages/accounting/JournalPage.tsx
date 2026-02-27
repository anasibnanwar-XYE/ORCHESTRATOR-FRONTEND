import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import { createJournalEntry, listAccounts, listJournalEntries, reverseJournalEntry, cascadeReverseJournalEntry, searchDealers, type AccountSummary, type JournalEntryRequest, type JournalEntrySummary, type JournalEntryReversalRequest, type DealerLookup, type ReversalReasonCode } from '../../lib/accountingApi';
import SearchableCombobox, { type ComboboxOption } from '../../components/SearchableCombobox';
import { HelpCircle, X } from 'lucide-react';
import TutorialGuide from '../../components/TutorialGuide';
import { journalEntryFormSteps } from '../../lib/tutorialSteps';
import { FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import { ResponsiveButton } from '../../design-system/ResponsiveButton';

/* ── Shared style constants ─────────────────────────────────────────── */

function classNames(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(' '); }

const checkboxCls = 'rounded border-border accent-action-bg focus:ring-primary/20';
const secondaryBtnCls = 'rounded-md border border-border bg-surface px-3 py-2 text-sm text-secondary hover:bg-surface-highlight transition-colors touch-manipulation min-h-[44px] sm:min-h-0';
const detailCardCls = 'rounded-lg border border-border bg-surface-highlight p-4';
const detailLabelCls = 'text-xs font-medium text-secondary uppercase tracking-wider';
const tableHeaderCellCls = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary';
const modalPanelCls = 'w-full rounded-xl border border-border bg-surface shadow-xl ring-1 ring-border';
const closeBtnCls = 'rounded-md p-2 text-tertiary hover:bg-surface-highlight hover:text-secondary transition-colors touch-manipulation min-h-[44px] sm:min-h-0';

type VoucherType = 'Journal' | 'Receipt' | 'Payment' | 'Contra';

function statusBadgeCls(status: string | undefined): string {
  switch (status) {
    case 'Posted': return 'bg-status-success-bg text-status-success-text';
    case 'Draft': return 'bg-surface-highlight text-secondary';
    case 'Reversed': return 'bg-status-error-bg text-status-error-text';
    default: return 'bg-surface-highlight text-secondary';
  }
}

/** Calculate display totals — falls back to line-level sums when summary is 0 */
function resolveDisplayTotals(entry: JournalEntrySummary | null | undefined) {
  const calcDebit = entry?.lines?.reduce((s, l) => s + (l.debit || 0), 0) ?? 0;
  const calcCredit = entry?.lines?.reduce((s, l) => s + (l.credit || 0), 0) ?? 0;
  return {
    debit: (entry?.debitTotal && entry.debitTotal > 0) ? entry.debitTotal : calcDebit,
    credit: (entry?.creditTotal && entry.creditTotal > 0) ? entry.creditTotal : calcCredit,
  };
}

/* ── Types ───────────────────────────────────────────────────────────── */

interface FilterState {
  from?: string;
  to?: string;
  dealerId?: number;
  status?: string;
  q?: string;
  minAmount?: number;
  maxAmount?: number;
}

/* ── Main component ──────────────────────────────────────────────────── */

export default function JournalPage() {
  const { session, user } = useAuth();
  const [searchParams] = useSearchParams();
  const dealerIdFromUrl = searchParams.get('dealerId');
  const [companyCode, setCompanyCode] = useState<string | undefined>(session?.companyCode);
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || undefined;
      const status = params.get('status') || undefined;
      const dealerId = params.get('dealerId');
      return { q, status, dealerId: dealerId ? Number(dealerId) : undefined };
    } catch {
      return {};
    }
  });
  const [rows, setRows] = useState<JournalEntrySummary[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntrySummary | null>(null);
  const [reversalTargets, setReversalTargets] = useState<number[]>([]);
  const [reversalForm, setReversalForm] = useState<Partial<JournalEntryReversalRequest>>({
    reason: '',
    reasonCode: undefined,
    reversalDate: new Date().toISOString().split('T')[0],
    memo: '',
    cascadeRelatedEntries: false,
    adminOverride: false,
  });

  const canUseAdminOverride = useMemo(() => {
    const roles = (user?.roles ?? []).map((r) => r.toLowerCase());
    const permissions = (user?.permissions ?? []).map((p) => p.toLowerCase());
    const hasAdminRole = roles.some((r) => r.includes('admin') || r.includes('super'));
    const hasAccountingRole = roles.some((r) => r.includes('account'));
    const hasOverridePermission = permissions.some((p) => p.includes('journal') || p.includes('override') || p.includes('admin'));
    return hasAdminRole || hasAccountingRole || hasOverridePermission;
  }, [user?.roles, user?.permissions]);

  const debitTotal = useMemo(() => rows.reduce((s, r) => s + r.debitTotal, 0), [rows]);
  const creditTotal = useMemo(() => rows.reduce((s, r) => s + r.creditTotal, 0), [rows]);
  const accountLookup = useMemo(() => {
    const map = new Map<number, AccountSummary>();
    accounts.forEach((account) => map.set(account.id, account));
    return map;
  }, [accounts]);

  useEffect(() => {
    listAccounts(session).then(setAccounts).catch(() => undefined);
  }, [session]);

  const load = async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await listJournalEntries(filters, session);
      setRows(data);
    } catch (err: unknown) {
      setRows([]);
      setListError(err instanceof Error ? err.message : 'Unable to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode, filters.dealerId]);

  useEffect(() => {
    const nextDealerId = dealerIdFromUrl ? Number(dealerIdFromUrl) : undefined;
    setFilters((current) => {
      if (current.dealerId === nextDealerId) return current;
      return { ...current, dealerId: nextDealerId };
    });
  }, [dealerIdFromUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); setShowForm(true); }
      if (e.altKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); document.getElementById('journal-filter-q')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const exportCsv = () => {
    const headers = ['Date', 'Ref', 'Memo', 'Dealer', 'Debit Total', 'Credit Total', 'Status'];
    const lines = rows.map(r => [r.entryDate, r.referenceNumber, r.memo ?? '', r.dealerName ?? '', r.debitTotal, r.creditTotal, r.status]);
    const csv = [headers, ...lines].map(r => r.map(v => typeof v === 'string' ? `"${v.replaceAll('"', '""')}"` : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'journal.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleBulkReverse = () => {
    if (!session) { setListError('You must be signed in to reverse entries.'); return; }
    const targets = rows.filter((r) => selected[r.id] && r.status === 'Posted').map((r) => r.id);
    if (targets.length === 0) { setListError('Select at least one posted entry to reverse.'); return; }
    setReversalTargets(targets);
    setReversalForm({ reason: '', reasonCode: undefined, reversalDate: new Date().toISOString().split('T')[0], memo: '', cascadeRelatedEntries: false, adminOverride: false });
    setReversalModalOpen(true);
  };

  const handleSingleReverse = (id: number) => {
    setReversalTargets([id]);
    setReversalForm({ reason: '', reasonCode: undefined, reversalDate: new Date().toISOString().split('T')[0], memo: '', cascadeRelatedEntries: false, adminOverride: false });
    setReversalModalOpen(true);
  };

  const handleViewEntry = (entry: JournalEntrySummary) => {
    setSelectedEntry(entry);
    setDetailModalOpen(true);
  };

  const executeReversal = async () => {
    if (!session || reversalTargets.length === 0) return;
    if (!reversalForm.reason || !reversalForm.reasonCode) { setListError('Reason and reason code are required.'); return; }

    setLoading(true);
    setListError(null);
    try {
      const payload: JournalEntryReversalRequest = {
        reason: reversalForm.reason,
        reasonCode: reversalForm.reasonCode,
        reversalDate: reversalForm.reversalDate,
        memo: reversalForm.memo || undefined,
        cascadeRelatedEntries: reversalForm.cascadeRelatedEntries || undefined,
        adminOverride: reversalForm.adminOverride || undefined,
      };
      for (const id of reversalTargets) {
        if (payload.cascadeRelatedEntries) {
          // eslint-disable-next-line no-await-in-loop
          await cascadeReverseJournalEntry(id, payload, session, companyCode);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await reverseJournalEntry(id, payload, session, companyCode);
        }
      }
      setSelected({});
      setReversalModalOpen(false);
      await load();
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to reverse selected entries.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Journal</h1>
          <p className="text-sm text-secondary">List and create manual entries</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div id="journal-totals" className="hidden sm:block text-sm text-secondary tabular-nums">
            <span className="mr-4">Debit: <span className="font-semibold text-status-success-text">{debitTotal.toLocaleString()}</span></span>
            <span>Credit: <span className="font-semibold text-status-error-text">{creditTotal.toLocaleString()}</span></span>
          </div>
          <button
            type="button"
            id="journal-new-entry-btn"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-action-bg px-3 py-2 text-sm font-medium text-action-text shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all touch-manipulation min-h-[44px] sm:min-h-0"
            title="Alt+N"
          >
            New Entry
          </button>
          <button type="button" id="journal-export-csv" onClick={exportCsv} className={secondaryBtnCls}>
            Export CSV
          </button>
          <button type="button" onClick={handleBulkReverse} className={secondaryBtnCls}>
            Reverse
          </button>
        </div>
      </div>

      {/* Filters */}
      <div id="journal-filters" className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5 items-end">
        <FormInput
          id="journal-filter-q"
          className="h-9"
          placeholder="Search text"
          value={filters.q ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <FormSelect
          className="h-9"
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          options={[
            { value: '', label: 'Any status' },
            { value: 'Draft', label: 'Draft' },
            { value: 'Posted', label: 'Posted' },
            { value: 'Reversed', label: 'Reversed' },
          ]}
        />
        <FormInput
          type="number"
          className="h-9"
          placeholder="Min amount"
          value={filters.minAmount ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value ? Number(e.target.value) : undefined }))}
        />
        <FormInput
          type="number"
          className="h-9"
          placeholder="Max amount"
          value={filters.maxAmount ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value ? Number(e.target.value) : undefined }))}
        />
        <ResponsiveButton variant="primary" onClick={load} className="h-9" fullWidth>
          Filter
        </ResponsiveButton>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {listError && (
          <p className="border-b border-status-warning-text/20 bg-status-warning-bg px-3 py-2 text-sm text-status-warning-text">{listError}</p>
        )}

        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-9 gap-0 border-b border-border bg-surface-highlight px-3 py-2 text-xs font-medium uppercase tracking-wider text-secondary">
          <div>
            <input
              type="checkbox"
              className={classNames('h-4 w-4', checkboxCls)}
              onChange={(e) => {
                const v = e.target.checked;
                const obj: Record<number, boolean> = {};
                rows.forEach((r) => { obj[r.id] = v; });
                setSelected(obj);
              }}
            />
          </div>
          <div>Date</div>
          <div>Ref</div>
          <div>Type</div>
          <div>Memo</div>
          <div>Dealer</div>
          <div className="text-right">Debit</div>
          <div className="text-right">Credit</div>
          <div>Status</div>
        </div>

        <div>
          {loading ? (
            <div className="p-4 text-sm text-secondary">Loading&hellip;</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-secondary">No journal entries</div>
          ) : (
            rows.map((r) => {
              const { debit: displayDebit, credit: displayCredit } = resolveDisplayTotals(r);
              return (
                <div key={r.id} className="border-b border-border">
                  <button
                    type="button"
                    className="w-full text-left text-primary hover:bg-surface-highlight transition-colors group"
                    onClick={() => handleViewEntry(r)}
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-9 items-center gap-2 px-3 py-2 text-sm">
                      <div>
                        <input
                          type="checkbox"
                          checked={!!selected[r.id]}
                          onChange={(e) => { const v = e.target.checked; setSelected((m) => ({ ...m, [r.id]: v })); }}
                          className={classNames('h-4 w-4', checkboxCls)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="tabular-nums">{r.entryDate}</div>
                      <div className="font-medium text-primary truncate" title={r.referenceNumber || ''}>{r.referenceNumber}</div>
                      <div className="text-secondary truncate">{r.voucherType}</div>
                      <div className="truncate text-secondary">{r.memo || '-'}</div>
                      <div className="text-secondary truncate">
                        {r.dealerName
                          ? <span className="rounded-full bg-surface-highlight px-2 py-0.5 text-xs text-primary">{r.dealerName}</span>
                          : '-'}
                      </div>
                      <div className="text-right font-medium text-status-success-text tabular-nums truncate">{displayDebit.toLocaleString()}</div>
                      <div className="text-right font-medium text-status-error-text tabular-nums truncate">{displayCredit.toLocaleString()}</div>
                      <div>
                        <span className={classNames('rounded-full px-2 py-1 text-xs', statusBadgeCls(r.status))}>{r.status}</span>
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div className="flex flex-col gap-2 p-4 sm:hidden bg-surface border border-border rounded-lg mb-3 shadow-sm relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected[r.id]}
                            onChange={(e) => { const v = e.target.checked; setSelected((m) => ({ ...m, [r.id]: v })); }}
                            className={classNames('h-5 w-5', checkboxCls)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <div className="font-semibold text-primary">{r.referenceNumber || 'No Ref'}</div>
                            <div className="text-xs text-secondary">{r.entryDate} &bull; {r.voucherType}</div>
                          </div>
                        </div>
                        <span className={classNames('rounded-full px-2 py-1 text-xs font-medium', statusBadgeCls(r.status))}>{r.status}</span>
                      </div>

                      {r.dealerName && (
                        <div className="text-sm text-secondary flex items-center gap-2">
                          <span className="text-xs uppercase text-tertiary font-medium">Dealer</span>
                          <span className="bg-surface-highlight px-2 py-0.5 rounded text-xs text-primary">{r.dealerName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm mt-1 border-t border-border pt-2">
                        <div>
                          <span className="block text-xs uppercase text-tertiary">Debit</span>
                          <span className="font-medium text-status-success-text tabular-nums">{displayDebit.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs uppercase text-tertiary">Credit</span>
                          <span className="font-medium text-status-error-text tabular-nums">{displayCredit.toLocaleString()}</span>
                        </div>
                      </div>

                      {r.memo && (
                        <div className="text-xs text-secondary mt-1 italic truncate">
                          &ldquo;{r.memo}&rdquo;
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showForm && <JournalEntryForm accounts={accounts} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}

      {/* ── Reversal Modal ─────────────────────────────────────────── */}
      <Transition show={reversalModalOpen} as={Fragment}>
        <Dialog onClose={() => setReversalModalOpen(false)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-lg items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className={classNames(modalPanelCls, 'p-6')}>
                  <Dialog.Title className="font-display text-lg font-semibold text-primary">
                    Reverse Journal {reversalTargets.length > 1 ? `Entries (${reversalTargets.length})` : 'Entry'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-secondary">
                    Provide details for reversing {reversalTargets.length > 1 ? 'these entries' : 'this entry'}.
                  </p>

                  <div className="mt-6 space-y-4">
                    <FormInput
                      label="Reason"
                      required
                      value={reversalForm.reason || ''}
                      onChange={(e) => setReversalForm((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Customer return, pricing error..."
                    />

                    <FormSelect
                      label="Reason Code"
                      required
                      value={reversalForm.reasonCode || ''}
                      onChange={(e) => setReversalForm((prev) => ({ ...prev, reasonCode: e.target.value as ReversalReasonCode }))}
                      options={[
                        { value: '', label: 'Select reason code...' },
                        { value: 'CUSTOMER_RETURN', label: 'Customer Return' },
                        { value: 'VENDOR_CREDIT', label: 'Vendor Credit' },
                        { value: 'PRICING_ERROR', label: 'Pricing Error' },
                        { value: 'DUPLICATE_ENTRY', label: 'Duplicate Entry' },
                        { value: 'WRONG_ACCOUNT', label: 'Wrong Account' },
                        { value: 'WRONG_PERIOD', label: 'Wrong Period' },
                        { value: 'FRAUD_CORRECTION', label: 'Fraud Correction' },
                        { value: 'SYSTEM_ERROR', label: 'System Error' },
                        { value: 'AUDIT_ADJUSTMENT', label: 'Audit Adjustment' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                    />

                    <FormInput
                      type="date"
                      label="Reversal Date"
                      value={reversalForm.reversalDate || ''}
                      onChange={(e) => setReversalForm((prev) => ({ ...prev, reversalDate: e.target.value }))}
                    />

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Memo (optional)
                      </label>
                      <textarea
                        value={reversalForm.memo || ''}
                        onChange={(e) => setReversalForm((prev) => ({ ...prev, memo: e.target.value }))}
                        placeholder="Additional notes for the reversal entry..."
                        rows={3}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reversalForm.cascadeRelatedEntries || false}
                          onChange={(e) => setReversalForm((prev) => ({ ...prev, cascadeRelatedEntries: e.target.checked }))}
                          className={classNames('h-4 w-4', checkboxCls)}
                        />
                        <span className="text-sm text-primary">
                          Also reverse related entries (COGS, tax, etc.)
                        </span>
                      </label>
                      <p className="text-xs text-secondary ml-6">
                        When checked, this will automatically find and reverse related entries like COGS and tax entries linked to this journal entry.
                      </p>
                    </div>

                    {canUseAdminOverride && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reversalForm.adminOverride || false}
                          onChange={(e) => setReversalForm((prev) => ({ ...prev, adminOverride: e.target.checked }))}
                          className={classNames('h-4 w-4', checkboxCls)}
                        />
                        <span className="text-sm text-primary">
                          Override period locks (admin only)
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                    <button
                      type="button"
                      onClick={() => setReversalModalOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface-highlight transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeReversal}
                      disabled={loading || !reversalForm.reason || !reversalForm.reasonCode}
                      className="rounded-lg bg-action-bg px-6 py-2 text-sm font-medium text-action-text shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      {loading ? 'Reversing...' : `Reverse ${reversalTargets.length > 1 ? `${reversalTargets.length} Entries` : 'Entry'}`}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── Detail Modal ───────────────────────────────────────────── */}
      <Transition show={!!detailModalOpen && !!selectedEntry} as={Fragment}>
        <Dialog onClose={() => setDetailModalOpen(false)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className={modalPanelCls}>
                  {/* Scrollable inner wrapper — NOT a nested Dialog.Panel */}
                  <div className="max-h-[85vh] overflow-y-auto">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-surface px-4 py-4 sm:px-6">
                      <Dialog.Title className="font-display text-lg font-semibold text-primary">
                        Journal Entry: {selectedEntry?.referenceNumber || 'No Ref'}
                      </Dialog.Title>
                      <button type="button" onClick={() => setDetailModalOpen(false)} className={closeBtnCls}>
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-6 sm:px-6">
                      {/* Status + Reverse action */}
                      <div className="mb-6 flex flex-wrap items-center gap-3">
                        <span className={classNames('rounded-full px-3 py-1 text-sm font-medium', statusBadgeCls(selectedEntry?.status))}>
                          {selectedEntry?.status}
                        </span>
                        {selectedEntry?.status === 'Posted' && (
                          <button
                            type="button"
                            onClick={() => { setDetailModalOpen(false); handleSingleReverse(selectedEntry!.id); }}
                            className="rounded-md border border-status-error-text/30 bg-status-error-bg px-3 py-1.5 text-sm font-medium text-status-error-text hover:bg-status-error-bg/80 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                          >
                            Reverse Entry
                          </button>
                        )}
                      </div>

                      {/* Detail grid */}
                      <div className="mb-6 grid gap-3 sm:grid-cols-2">
                        <div className={detailCardCls}>
                          <span className={detailLabelCls}>Reference Number</span>
                          <p className="mt-1 font-mono text-sm text-primary">{selectedEntry?.referenceNumber || '-'}</p>
                        </div>
                        <div className={detailCardCls}>
                          <span className={detailLabelCls}>Voucher Type</span>
                          <p className="mt-1 text-sm text-primary">{selectedEntry?.voucherType || '-'}</p>
                        </div>
                        <div className={detailCardCls}>
                          <span className={detailLabelCls}>Entry Date</span>
                          <p className="mt-1 text-sm text-primary tabular-nums">{selectedEntry?.entryDate || '-'}</p>
                        </div>
                        <div className={detailCardCls}>
                          <span className={detailLabelCls}>Dealer</span>
                          <p className="mt-1 text-sm text-primary">
                            {selectedEntry?.dealerName
                              ? <span className="rounded-full bg-surface-highlight px-2 py-0.5 text-xs text-primary">{selectedEntry.dealerName}</span>
                              : '-'}
                          </p>
                        </div>
                        {(selectedEntry?.createdAt || selectedEntry?.createdBy) && (
                          <>
                            <div className={detailCardCls}>
                              <span className={detailLabelCls}>Created At</span>
                              <p className="mt-1 text-sm text-primary tabular-nums">
                                {selectedEntry?.createdAt ? (() => {
                                  const dateStr = typeof selectedEntry.createdAt === 'string' ? selectedEntry.createdAt.trim() : String(selectedEntry.createdAt);
                                  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '-';
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return dateStr;
                                  return date.toLocaleString();
                                })() : '-'}
                              </p>
                            </div>
                            <div className={detailCardCls}>
                              <span className={detailLabelCls}>Created By</span>
                              <p className="mt-1 text-sm text-primary">{selectedEntry?.createdBy || '-'}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Memo */}
                      {selectedEntry?.memo && (
                        <div className={classNames(detailCardCls, 'mb-6')}>
                          <span className={detailLabelCls}>Memo</span>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-primary">{selectedEntry.memo}</p>
                        </div>
                      )}

                      {/* Totals hero */}
                      <div className={classNames(detailCardCls, 'mb-6 flex gap-4')}>
                        <div className="flex-1">
                          <span className={detailLabelCls}>Debit Total</span>
                          <p className="mt-1 text-2xl font-semibold text-status-success-text tabular-nums">
                            {resolveDisplayTotals(selectedEntry).debit.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-1">
                          <span className={detailLabelCls}>Credit Total</span>
                          <p className="mt-1 text-2xl font-semibold text-status-error-text tabular-nums">
                            {resolveDisplayTotals(selectedEntry).credit.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Journal lines table */}
                      {selectedEntry?.lines && selectedEntry.lines.length > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="border-b border-border bg-surface-highlight px-4 py-3">
                            <h3 className="text-sm font-medium text-primary">Journal Lines</h3>
                          </div>

                          {/* Desktop table */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-surface-highlight">
                                <tr>
                                  <th className={tableHeaderCellCls}>Account Code</th>
                                  <th className={tableHeaderCellCls}>Account Name</th>
                                  <th className={tableHeaderCellCls}>Description</th>
                                  <th className={classNames(tableHeaderCellCls, 'text-right')}>Debit</th>
                                  <th className={classNames(tableHeaderCellCls, 'text-right')}>Credit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {selectedEntry.lines.map((l, idx) => {
                                  const accountName = l.accountName || accountLookup.get(l.accountId)?.name;
                                  return (
                                    <tr key={idx} className="hover:bg-surface-highlight transition-colors">
                                      <td className="px-4 py-3 font-mono text-secondary">{l.accountCode || '-'}</td>
                                      <td className="px-4 py-3 text-primary">{accountName || '-'}</td>
                                      <td className="px-4 py-3 text-secondary">{l.description || '-'}</td>
                                      <td className="px-4 py-3 text-right font-medium text-status-success-text tabular-nums">{l.debit ? l.debit.toLocaleString() : '-'}</td>
                                      <td className="px-4 py-3 text-right font-medium text-status-error-text tabular-nums">{l.credit ? l.credit.toLocaleString() : '-'}</td>
                                    </tr>
                                  );
                                })}
                                <tr className="border-t-2 border-border bg-surface-highlight font-semibold">
                                  <td colSpan={3} className="px-4 py-3 text-right text-primary">Total</td>
                                  <td className="px-4 py-3 text-right text-status-success-text tabular-nums">
                                    {resolveDisplayTotals(selectedEntry).debit.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right text-status-error-text tabular-nums">
                                    {resolveDisplayTotals(selectedEntry).credit.toLocaleString()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile card list for journal lines */}
                          <div className="sm:hidden divide-y divide-border">
                            {selectedEntry.lines.map((l, idx) => {
                              const accountName = l.accountName || accountLookup.get(l.accountId)?.name;
                              return (
                                <div key={idx} className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-secondary">{l.accountCode || '-'}</span>
                                  </div>
                                  <div className="text-sm font-medium text-primary">{accountName || '-'}</div>
                                  {l.description && <div className="text-xs text-secondary">{l.description}</div>}
                                  <div className="flex items-center justify-between pt-1">
                                    <div>
                                      <span className="block text-xs uppercase text-tertiary">Debit</span>
                                      <span className="font-medium text-status-success-text tabular-nums text-sm">{l.debit ? l.debit.toLocaleString() : '-'}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-xs uppercase text-tertiary">Credit</span>
                                      <span className="font-medium text-status-error-text tabular-nums text-sm">{l.credit ? l.credit.toLocaleString() : '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="p-4 bg-surface-highlight flex items-center justify-between font-semibold text-sm">
                              <span className="text-primary">Total</span>
                              <div className="flex gap-6 tabular-nums">
                                <span className="text-status-success-text">{resolveDisplayTotals(selectedEntry).debit.toLocaleString()}</span>
                                <span className="text-status-error-text">{resolveDisplayTotals(selectedEntry).credit.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

/* ── Journal Entry Form ──────────────────────────────────────────────── */

function JournalEntryForm({ accounts, onClose, onSaved }: { accounts: AccountSummary[]; onClose: () => void; onSaved: () => void }) {
  const { session, user } = useAuth();
  const [companyCode] = useState(session?.companyCode);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [dealerId, setDealerId] = useState<number | undefined>(undefined);
  const [dealerName, setDealerName] = useState<string>('');
  const [voucherType, setVoucherType] = useState<VoucherType>('Journal');
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [adminOverride, setAdminOverride] = useState(false);
  const [lines, setLines] = useState<Array<{ accountId?: number; description?: string; debit?: number; credit?: number }>>([{}, {}]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const totalDebit = useMemo(() => lines.reduce((s, l) => s + (l.debit || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + (l.credit || 0), 0), [lines]);
  const difference = useMemo(() => totalDebit - totalCredit, [totalDebit, totalCredit]);
  const canUseAdminOverride = useMemo(() => {
    const roles = (user?.roles ?? []).map((r) => r.toLowerCase());
    const permissions = (user?.permissions ?? []).map((p) => p.toLowerCase());
    const hasAdminRole = roles.some((r) => r.includes('admin') || r.includes('super'));
    const hasAccountingRole = roles.some((r) => r.includes('account'));
    const hasOverridePermission = permissions.some((p) => p.includes('journal') || p.includes('override') || p.includes('admin'));
    return hasAdminRole || hasAccountingRole || hasOverridePermission;
  }, [user?.roles, user?.permissions]);

  const accountOptions = useMemo<ComboboxOption[]>(() => {
    return accounts.map((a) => ({ id: a.id, label: `${a.code} — ${a.name}`, subLabel: a.type }));
  }, [accounts]);

  const loadDealers = async (query: string): Promise<ComboboxOption[]> => {
    try {
      const results = await searchDealers(query, session, companyCode);
      return results.map((d) => ({ id: d.id, label: d.name, subLabel: d.code }));
    } catch {
      return [];
    }
  };

  // Keyboard: Alt+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const updateLine = (idx: number, patch: Partial<{ accountId?: number; description?: string; debit?: number; credit?: number }>) => {
    setLines((arr) => arr.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((arr) => [...arr, {}]);
  const removeLine = (idx: number) => setLines((arr) => arr.filter((_, i) => i !== idx));

  const onCellKeyDown = (e: React.KeyboardEvent<HTMLElement>, idx: number, pos: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cellIndex = idx * 4 + pos;
      const next = document.querySelector(`[data-cell-index='${cellIndex + 1}']`) as HTMLElement | null;
      next?.focus();
    }
  };

  const valid = entryDate && Math.abs(difference) < 0.00001 && lines.length > 0 && lines.every((l) => l.accountId);

  const handleSave = async () => {
    if (!valid) { setError('Please fix highlighted fields. Ensure entry is balanced and accounts are selected.'); return; }
    setSaving(true); setError(null);
    try {
      const payload: JournalEntryRequest = {
        referenceNumber: referenceNumber.trim() || undefined,
        entryDate,
        memo: memo || undefined,
        dealerId,
        supplierId: supplierId ?? null,
        adminOverride: canUseAdminOverride && adminOverride ? true : undefined,
        voucherType,
        lines: lines.map((l) => ({
          accountId: Number(l.accountId!),
          description: l.description || '',
          debit: l.debit || 0,
          credit: l.credit || 0,
        })),
      };
      await createJournalEntry(payload, session, companyCode);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl border border-border bg-surface p-3 sm:p-4 shadow-2xl my-auto">
        {/* Form header */}
        <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base sm:text-lg font-semibold text-primary">Manual Journal Entry</h2>
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className={closeBtnCls}
              title="How to use this form"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="journal-form-save"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial rounded-md bg-action-bg px-4 py-2.5 sm:py-2 text-sm font-medium text-action-text hover:opacity-90 disabled:opacity-60 transition-all touch-manipulation min-h-[44px] sm:min-h-0"
              title="Alt+S"
            >
              {saving ? 'Saving\u2026' : 'Post'}
            </button>
            <button type="button" onClick={onClose} className={classNames(secondaryBtnCls, 'flex-1 sm:flex-initial')}>
              Close
            </button>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1" id="journal-form-ref">
            <FormInput label="External reference (optional)" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Cheque no, legacy ref, etc." />
          </div>
          <div className="grid gap-1" id="journal-form-date">
            <FormInput type="date" label="Date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <FormInput label="Memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <div className="grid gap-1" id="journal-form-dealer">
            <SearchableCombobox
              label="Dealer (optional)"
              placeholder="Search dealer..."
              value={dealerId ? { id: dealerId, label: dealerName } : null}
              onChange={(val) => { setDealerId(val?.id as number | undefined); setDealerName(val?.label ?? ''); }}
              loadOptions={loadDealers}
            />
          </div>
          <div className="grid gap-1" id="journal-form-voucher">
            <FormSelect
              label="Voucher Type"
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value as VoucherType)}
              options={[
                { value: 'Journal', label: 'Journal' },
                { value: 'Receipt', label: 'Receipt' },
                { value: 'Payment', label: 'Payment' },
                { value: 'Contra', label: 'Contra' },
              ]}
            />
          </div>
          <div className="grid gap-1">
            <FormInput type="number" label="Supplier ID (optional)" value={supplierId ?? ''} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          {canUseAdminOverride && (
            <div className="flex items-center gap-2 pt-4">
              <input
                id="journal-admin-override"
                type="checkbox"
                checked={adminOverride}
                onChange={(e) => setAdminOverride(e.target.checked)}
                className={classNames('h-4 w-4', checkboxCls)}
              />
              <label htmlFor="journal-admin-override" className="text-xs text-secondary">
                Allow date override (admin only)
              </label>
            </div>
          )}
        </div>

        {/* Lines grid */}
        <div className="mt-4 overflow-x-auto" id="journal-form-lines">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-6 gap-0 rounded-t-md bg-surface-highlight px-2 py-2 text-xs font-medium uppercase tracking-wider text-secondary">
              <div className="col-span-2">Account</div>
              <div>Description</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Credit</div>
              <div></div>
            </div>
            {lines.map((l, idx) => (
              <div key={idx} className={classNames('grid grid-cols-6 items-start gap-2 px-2 py-2', (l.debit || 0) !== 0 && (l.credit || 0) !== 0 ? 'bg-status-error-bg' : '')}>
                <div className="col-span-2">
                  <SearchableCombobox
                    options={accountOptions}
                    value={l.accountId ? accountOptions.find((o) => o.id === l.accountId) ?? null : null}
                    onChange={(val) => updateLine(idx, { accountId: val?.id as number | undefined })}
                    placeholder="Select account..."
                    className="w-full"
                  />
                </div>
                <input value={l.description ?? ''} onChange={(e) => updateLine(idx, { description: e.target.value })} className="h-10 sm:h-[38px] rounded-md border border-border bg-surface px-2 text-sm text-primary touch-manipulation" data-cell-index={idx * 4 + 1} onKeyDown={(e) => onCellKeyDown(e, idx, 1)} />
                <input inputMode="decimal" value={l.debit ?? ''} onChange={(e) => updateLine(idx, { debit: e.target.value ? Number(e.target.value) : undefined, credit: undefined })} className="h-10 sm:h-[38px] rounded-md border border-border bg-surface px-2 text-right text-status-success-text tabular-nums touch-manipulation" data-cell-index={idx * 4 + 2} onKeyDown={(e) => onCellKeyDown(e, idx, 2)} />
                <input inputMode="decimal" value={l.credit ?? ''} onChange={(e) => updateLine(idx, { credit: e.target.value ? Number(e.target.value) : undefined, debit: undefined })} className="h-10 sm:h-[38px] rounded-md border border-border bg-surface px-2 text-right text-status-error-text tabular-nums touch-manipulation" data-cell-index={idx * 4 + 3} onKeyDown={(e) => onCellKeyDown(e, idx, 3)} />
                <div className="flex items-center justify-end pt-1">
                  <button type="button" onClick={() => removeLine(idx)} className="rounded-md border border-status-error-text/20 bg-status-error-bg px-3 py-2 text-xs text-status-error-text hover:bg-status-error-bg/80 transition-colors touch-manipulation min-h-[44px] sm:min-h-0">Remove</button>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 border-t border-border bg-surface-highlight px-2 py-2 text-sm">
              <button type="button" onClick={addLine} className={secondaryBtnCls}>Add line</button>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm tabular-nums">
                <span className="text-secondary">Debit: <span className="font-semibold text-status-success-text">{totalDebit.toLocaleString()}</span></span>
                <span className="text-secondary">Credit: <span className="font-semibold text-status-error-text">{totalCredit.toLocaleString()}</span></span>
                <span className="text-secondary">Diff: <span className={classNames('font-semibold', Math.abs(difference) < 0.00001 ? 'text-secondary' : 'text-status-warning-text')}>{difference.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mt-3 rounded-md bg-status-error-bg p-3 text-sm text-status-error-text">{error}</div>}
        {!valid && <div className="mt-2 text-xs text-status-warning-text">Ensure Date, accounts selected, and Debits equals Credits.</div>}
      </div>
      <TutorialGuide steps={journalEntryFormSteps} enabled={tutorialOpen} onExit={() => setTutorialOpen(false)} />
    </div>
  );
}
