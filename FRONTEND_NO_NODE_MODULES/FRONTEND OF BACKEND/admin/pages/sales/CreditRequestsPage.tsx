import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listCreditRequests, createCreditRequest, type CreditRequestDto, type CreditRequestPayload } from '../../lib/salesApi';
import { searchDealers, type DealerLookup } from '../../lib/accountingApi';

export default function CreditRequestsPage() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<CreditRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealerQuery, setDealerQuery] = useState('');
  const [dealerOptions, setDealerOptions] = useState<DealerLookup[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerLookup | null>(null);
  const [limit, setLimit] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCreditRequests(session);
      setRequests(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load credit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session?.companyCode]);

  useEffect(() => {
    let active = true;
    if (!dealerQuery || !session) {
      setDealerOptions([]);
      return () => { active = false; };
    }
    const handle = setTimeout(() => {
      searchDealers(dealerQuery, session)
        .then((opts) => { if (active) setDealerOptions(opts); })
        .catch(() => undefined);
    }, 200);
    return () => { active = false; clearTimeout(handle); };
  }, [dealerQuery, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !selectedDealer) return;
    setSaving(true);
    setStatus(null);
    const payload: CreditRequestPayload = { dealerId: selectedDealer.id, amountRequested: Number(limit) || 0, reason: reason || undefined };
    try {
      await createCreditRequest(payload, session);
      setStatus('Credit request submitted');
      setDealerQuery('');
      setSelectedDealer(null);
      setLimit('');
      setReason('');
      load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Credit Requests</h1>
          <p className="text-sm text-secondary">List and create dealer credit limit requests</p>
        </div>
        {loading && <span className="text-xs text-secondary">Loading…</span>}
      </div>

      {error && <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-sm font-semibold text-primary">New credit request</div>
          <div>
            <input value={dealerQuery} onChange={(e) => { setDealerQuery(e.target.value); setSelectedDealer(null); }} placeholder="Search dealer" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm" />
            {dealerOptions.length > 0 && !selectedDealer && (
              <div className="mt-2 max-h-40 overflow-auto rounded-md border border-border bg-surface text-sm shadow">
                {dealerOptions.map((opt) => (
                  <button key={opt.id} type="button" className="block w-full px-3 py-2 text-left hover:bg-surface-highlight" onClick={() => { setSelectedDealer(opt); setDealerQuery(`${opt.name}${opt.code ? ` (${opt.code})` : ''}`); }}>
                    <div className="font-medium">{opt.name}</div>
                    <div className="text-xs text-secondary">{opt.code ?? ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Requested limit" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm" />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm" />
          <div className="flex items-center gap-2">
            <button disabled={saving || !selectedDealer} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600">{saving ? 'Submitting…' : 'Submit'}</button>
            {status && <span className="text-xs text-secondary">{status}</span>}
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-sm font-semibold text-primary">Requests</div>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">No requests.</p>
          ) : (
            <div className="mt-3 divide-y divide-border text-sm">
              <div className="grid grid-cols-5 gap-2 px-2 py-2 text-xs uppercase tracking-wide text-tertiary">
                <div>Dealer</div>
                <div>Requested limit</div>
                <div>Status</div>
                <div>Reason</div>
                <div>Created</div>
              </div>
              {requests.map((r) => (
                <div key={r.id} className="grid grid-cols-5 gap-2 px-2 py-2">
                  <div className="truncate text-primary">{r.dealerName ?? 'Unknown'}</div>
                  <div className="text-primary">{(r as any).amountRequested?.toLocaleString?.() ?? (r as any).amount?.toLocaleString?.() ?? r.amountRequested}</div>
                  <div><span className="rounded-full bg-surface-highlight px-3 py-1 text-xs text-primary">{r.status ?? '—'}</span></div>
                  <div className="truncate text-secondary">{r.reason ?? '—'}</div>
                  <div className="text-secondary">{r.createdAt ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

