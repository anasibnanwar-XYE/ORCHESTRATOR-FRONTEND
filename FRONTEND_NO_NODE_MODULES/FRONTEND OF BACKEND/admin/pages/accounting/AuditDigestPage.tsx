import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuditDigest, type AuditDigestResponse } from '../../lib/accountingApi';
import { resolvePortalAccess } from '../../types/portal-routing';

export default function AuditDigestPage() {
  const { session, user } = useAuth();
  const portalAccess = resolvePortalAccess(user);

  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [digest, setDigest] = useState<AuditDigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadDigest = async () => {
    if (!session || (!portalAccess.accounting && !portalAccess.admin)) {
      setError('You do not have permission to view audit digests.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditDigest(from || undefined, to || undefined, session, session.companyCode, 'json');
      // Backend returns: { periodLabel: string, entries: string[] }
      setDigest(result as AuditDigestResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit digest');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    if (!session || (!portalAccess.accounting && !portalAccess.admin)) return;
    setExporting(true);
    try {
      const csv = await getAuditDigest(from || undefined, to || undefined, session, session.companyCode, 'csv');
      const blob = new Blob([csv as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-digest-${from || 'all'}-${to || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadDigest();
  }, [from, to, session]);

  if (!portalAccess.accounting && !portalAccess.admin) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-200">
          You do not have permission to view audit digests. This feature requires accounting or admin access.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Accounting Audit Digest</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Journal activity, reversals, and approvals by date</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">From Date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">To Date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={loadDigest}
            disabled={loading}
            className="w-full h-10 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-200">
          {error}
        </div>
      )}

      {digest && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Period</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{digest.periodLabel}</div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {digest.entries?.length || 0} audit event{digest.entries?.length !== 1 ? 's' : ''} recorded
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          <div>Audit Events</div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
        ) : digest && (!digest.entries || digest.entries.length === 0) ? (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No audit entries found for the selected date range.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {digest?.entries?.map((entry, idx) => (
              <div key={idx} className="px-4 py-3 text-sm dark:text-slate-200">
                <div className="whitespace-pre-wrap break-words">{entry}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





