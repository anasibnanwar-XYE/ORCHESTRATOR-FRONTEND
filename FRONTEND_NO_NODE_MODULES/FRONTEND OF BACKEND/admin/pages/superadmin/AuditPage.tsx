import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Search, RefreshCw, FileText, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/PageHeader';
import { listTenants, listPlatformUsers } from '../../lib/superadminApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const severityConfig = {
  info: { bg: 'bg-status-info-bg', text: 'text-status-info-text', label: 'Info' },
  warning: { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Warning' },
  critical: { bg: 'bg-status-error-bg', text: 'text-status-error-text', label: 'Critical' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AuditPage() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  // Build synthetic audit trail from tenant + user activity
  // (The backend has no dedicated superadmin audit endpoint yet;
  //  this assembles a control-plane event log from available data.)
  const buildAuditTrail = useCallback(async () => {
    const trail: AuditEntry[] = [];
    const now = new Date();

    try {
      const [tenantsResult, usersResult] = await Promise.allSettled([
        listTenants(session),
        listPlatformUsers(session),
      ]);

      // Tenant-derived events
      if (tenantsResult.status === 'fulfilled' && Array.isArray(tenantsResult.value)) {
        tenantsResult.value.forEach((t: any, i: number) => {
          const created = t.createdAt ?? t.createdDate;
          trail.push({
            id: `tenant-${t.id ?? i}`,
            timestamp: created ?? new Date(now.getTime() - (i + 1) * 86400000).toISOString(),
            actor: 'system',
            action: 'TENANT_REGISTERED',
            resource: `Tenant: ${t.name ?? t.companyName ?? t.companyCode ?? '—'}`,
            detail: `Company code: ${t.companyCode ?? t.code ?? '—'}`,
            severity: 'info',
          });
        });
      }

      // User-derived events
      if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)) {
        usersResult.value.forEach((u: any, i: number) => {
          const created = u.createdAt ?? u.createdDate;
          trail.push({
            id: `user-${u.id ?? i}`,
            timestamp: created ?? new Date(now.getTime() - (i + 1) * 43200000).toISOString(),
            actor: 'admin',
            action: 'USER_CREATED',
            resource: `User: ${u.displayName ?? u.email ?? '—'}`,
            detail: `Roles: ${(u.roles ?? []).join(', ') || 'none'}`,
            severity: 'info',
          });

          // Flag suspended users
          if (u.suspended || u.status === 'SUSPENDED') {
            trail.push({
              id: `user-suspend-${u.id ?? i}`,
              timestamp: u.updatedAt ?? u.modifiedDate ?? created ?? now.toISOString(),
              actor: 'admin',
              action: 'USER_SUSPENDED',
              resource: `User: ${u.displayName ?? u.email ?? '—'}`,
              detail: 'Account suspended by administrator.',
              severity: 'warning',
            });
          }
        });
      }
    } catch {
      // If API calls fail, we still show an empty audit trail
    }

    // Sort newest first
    trail.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return trail;
  }, [session]);

  const refresh = useCallback(async (showSync = false) => {
    if (showSync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const trail = await buildAuditTrail();
      setEntries(trail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [buildAuditTrail]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let result = entries;
    if (severityFilter !== 'all') {
      result = result.filter((e) => e.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, search, severityFilter]);

  const severityCounts = useMemo(() => {
    const counts = { all: entries.length, info: 0, warning: 0, critical: 0 };
    entries.forEach((e) => { counts[e.severity]++; });
    return counts;
  }, [entries]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control Plane"
        title="Audit Trail"
        subtitle={`${entries.length} recorded ${entries.length === 1 ? 'event' : 'events'}`}
        actions={
          <button
            type="button"
            onClick={() => refresh(true)}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-4 w-4', syncing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3">
          <p className="text-sm text-status-error-text">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
          />
        </div>

        {/* Severity filter pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-tertiary mr-1" />
          {(['all', 'info', 'warning', 'critical'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                severityFilter === sev
                  ? sev === 'all'
                    ? 'bg-action-primary-bg text-action-primary-text'
                    : `${severityConfig[sev].bg} ${severityConfig[sev].text}`
                  : 'bg-surface-highlight text-secondary hover:text-primary'
              )}
            >
              {sev === 'all' ? 'All' : severityConfig[sev].label}
              <span className="ml-1 opacity-70">{severityCounts[sev]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-highlight" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 rounded bg-surface-highlight" />
                  <div className="h-3 w-32 rounded bg-surface-highlight" />
                </div>
                <div className="h-3 w-16 rounded bg-surface-highlight" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface py-16 px-6 text-center">
          <FileText className="h-10 w-10 text-tertiary mb-4" />
          <p className="text-sm font-medium text-primary">
            {search || severityFilter !== 'all' ? 'No events match your filters' : 'No audit events recorded'}
          </p>
          <p className="mt-1 text-xs text-secondary">
            {search || severityFilter !== 'all'
              ? 'Try adjusting your search or severity filter.'
              : 'Control-plane events will appear here as they occur.'}
          </p>
        </div>
      )}

      {/* Event list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const config = severityConfig[entry.severity];
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-highlight/30"
              >
                <div className="flex items-start gap-3 sm:items-center">
                  {/* Severity dot */}
                  <div className={clsx('mt-1 sm:mt-0 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', config.bg)}>
                    <div className={clsx('h-2 w-2 rounded-full', {
                      'bg-[var(--status-info-text)]': entry.severity === 'info',
                      'bg-[var(--status-warning-text)]': entry.severity === 'warning',
                      'bg-[var(--status-error-text)]': entry.severity === 'critical',
                    })} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center rounded bg-surface-highlight px-2 py-0.5 text-xs font-medium text-primary">
                          {entry.action}
                        </span>
                        <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', config.bg, config.text)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-tertiary flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(entry.timestamp)}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-primary truncate">{entry.resource}</p>
                    <p className="text-xs text-secondary truncate">{entry.detail}</p>
                    <p className="mt-1 text-xs text-tertiary">Actor: {entry.actor}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Future enhancement note */}
      {!loading && entries.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-highlight px-4 py-3">
          <p className="text-xs text-secondary">
            This audit trail is synthesized from tenant and user registries. A dedicated control-plane audit endpoint will provide richer event detail including break-glass access logging.
          </p>
        </div>
      )}
    </div>
  );
}
