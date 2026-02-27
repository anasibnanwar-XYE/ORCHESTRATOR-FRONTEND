import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listDealers, type DealerSummary } from '../../lib/accountingApi';
import { RegisterDealerModal } from './modals/RegisterDealerModal';
import { DealerDetailModal } from './modals/DealerDetailModal';
import { DealerCard } from './components/DealerCard';
import { StatusBadge } from './components/StatusBadge';
import { Plus, Search } from 'lucide-react';
import type { DealerResponse } from '../../lib/client/models/DealerResponse';

type SortField = 'name' | 'balance' | 'creditLimit';
type SortDirection = 'asc' | 'desc';

export default function DealersPage() {
  const { session } = useAuth();
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<DealerResponse | null>(null);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'name', direction: 'asc' });

  const filteredDealers = useMemo(() => {
    if (!searchQuery) return dealers;
    const query = searchQuery.toLowerCase();
    return dealers.filter(
      (d) =>
        (d.name?.toLowerCase().includes(query)) ||
        (d.email?.toLowerCase().includes(query)) ||
        (d.code?.toLowerCase().includes(query))
    );
  }, [dealers, searchQuery]);

  const sortedDealers = useMemo(() => {
    return [...filteredDealers].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '');
          break;
        case 'balance':
          cmp = (a.outstandingBalance || 0) - (b.outstandingBalance || 0);
          break;
        case 'creditLimit':
          cmp = (a.creditLimit || 0) - (b.creditLimit || 0);
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [filteredDealers, sort]);

  const handleSort = (field: SortField) => {
    setSort((s) => ({
      field,
      direction: s.field === field && s.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortIndicator = (field: SortField) =>
    sort.field !== field ? '' : sort.direction === 'asc' ? ' ▲' : ' ▼';

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    listDealers(session)
      .then((list) => {
        if (active) setDealers(list);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load dealers');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refreshDealers = () => {
    if (!session) return;
    listDealers(session)
      .then(setDealers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh'));
  };

  if (!session) {
    return (
      <div className="rounded-2xl border border-transparent bg-status-warning-bg px-6 py-4 text-sm text-status-warning-text">
        Sign in to manage dealers.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Dealer management</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary truncate">Dealers</h1>
            <p className="text-sm text-secondary mt-1 truncate">
              Register and manage your dealer accounts, credit limits, and contact information.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: 'var(--action-primary-bg)',
              color: 'var(--action-primary-text)',
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Register dealer</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
            {error}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
        <input
          type="text"
          placeholder="Search by name, email, or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-surface px-3 pl-10 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
        />
      </div>

      {/* Dealers List/Grid */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-secondary">Loading dealers...</p>
          </div>
        ) : sortedDealers.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-surface-highlight p-6">
            <p className="text-sm text-secondary mb-2">
              {dealers.length === 0 ? 'No dealers yet. Register your first dealer to get started.' : 'No dealers match your search.'}
            </p>
            {dealers.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--action-primary-bg)',
                  color: 'var(--action-primary-text)',
                }}
              >
                <Plus className="h-4 w-4" />
                Register your first dealer
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Card Grid */}
            <div className="grid gap-4 lg:hidden">
              {sortedDealers.map((dealer) => (
                <DealerCard
                  key={dealer.id}
                  dealer={dealer}
                  onView={(d) => setSelectedDealer(d)}
                  onCopyEmail={(email) => navigator.clipboard.writeText(email)}
                  onCopyPhone={(phone) => navigator.clipboard.writeText(phone)}
                />
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-highlight">
                      <th
                        className="px-4 py-3 text-left font-semibold text-primary min-w-[200px] cursor-pointer hover:bg-surface transition-colors select-none"
                        onClick={() => handleSort('name')}
                      >
                        Dealer{sortIndicator('name')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-primary">Status</th>
                      <th
                        className="px-4 py-3 text-right font-semibold text-primary cursor-pointer hover:bg-surface transition-colors select-none"
                        onClick={() => handleSort('balance')}
                      >
                        Current balance{sortIndicator('balance')}
                      </th>
                      <th
                        className="px-4 py-3 text-right font-semibold text-primary cursor-pointer hover:bg-surface transition-colors select-none"
                        onClick={() => handleSort('creditLimit')}
                      >
                        Credit limit{sortIndicator('creditLimit')}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-primary">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedDealers.map((dealer) => (
                      <tr key={dealer.id} className="hover:bg-surface-highlight transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <button
                              onClick={() => setSelectedDealer(dealer as DealerResponse)}
                              className="font-medium text-primary hover:underline cursor-pointer transition-colors text-left"
                            >
                              {dealer.name || '—'}
                            </button>
                            <p className="text-xs text-secondary">{dealer.code || dealer.email || 'No contact'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              (dealer as DealerSummary & { status?: string; onHold?: boolean }).status?.toLowerCase() === 'suspended'
                                ? 'suspended'
                                : (dealer as DealerSummary & { status?: string; onHold?: boolean }).status?.toLowerCase() === 'on_hold' ||
                                  (dealer as DealerSummary & { status?: string; onHold?: boolean }).status?.toLowerCase() === 'on-hold' ||
                                  (dealer as DealerSummary & { status?: string; onHold?: boolean }).onHold
                                ? 'on-hold'
                                : (dealer as DealerSummary & { status?: string; onHold?: boolean }).status?.toLowerCase() === 'pending'
                                ? 'pending'
                                : 'active'
                            }
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-primary font-medium">{(dealer.outstandingBalance || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-primary">{(dealer.creditLimit || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {dealer.email ? (
                            <button
                              onClick={() => navigator.clipboard.writeText(dealer.email || '')}
                              className="text-secondary hover:text-primary transition-colors text-xs underline"
                            >
                              Copy email
                            </button>
                          ) : (
                            <span className="text-xs text-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <RegisterDealerModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={refreshDealers} session={session} />
      <DealerDetailModal
        dealer={selectedDealer}
        open={!!selectedDealer}
        onOpenChange={(open) => !open && setSelectedDealer(null)}
        session={session}
      />
    </div>
  );
}
