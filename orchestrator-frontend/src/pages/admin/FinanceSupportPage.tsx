/**
 * FinanceSupportPage — Admin Finance Support Views
 *
 * Features:
 *  - Dealer selector at top (dropdown/combobox to pick a dealer)
 *  - Three tabs: Ledger, Invoices, Aging
 *  - Each tab shows data from the corresponding endpoint for the selected dealer
 *  - DataTable for tabular data
 *  - StatCard/summary cards for totals
 *  - Empty state when no dealer selected
 *  - Dark mode support with CSS variables
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Building2, FileText, TrendingUp, AlertCircle, RefreshCcw, Receipt, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';
import { salesApi } from '@/lib/salesApi';
import { financeSupportApi } from '@/lib/adminApi';
import type { LedgerEntry, FinanceInvoice, FinanceAging } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TabValue = 'ledger' | 'invoices' | 'aging';

interface DealerOption {
  id: number;
  name: string;
  code: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string) {
  const normalized = status?.toLowerCase() || '';
  if (normalized.includes('paid')) return <Badge variant="success" dot>Paid</Badge>;
  if (normalized.includes('overdue')) return <Badge variant="danger" dot>Overdue</Badge>;
  if (normalized.includes('pending')) return <Badge variant="warning" dot>Pending</Badge>;
  if (normalized.includes('open')) return <Badge variant="info" dot>Open</Badge>;
  if (normalized.includes('resolved')) return <Badge variant="success" dot>Resolved</Badge>;
  if (normalized.includes('closed')) return <Badge variant="default" dot>Closed</Badge>;
  return <Badge variant="default" dot>{status}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dealer Selector Component
// ─────────────────────────────────────────────────────────────────────────────

interface DealerSelectorProps {
  dealers: DealerOption[];
  selected: DealerOption | null;
  onSelect: (dealer: DealerOption | null) => void;
  isLoading?: boolean;
}

function DealerSelector({ dealers, selected, onSelect, isLoading }: DealerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return dealers;
    const q = search.toLowerCase();
    return dealers.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [dealers, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={clsx(
          'w-full sm:w-[320px] h-10 flex items-center gap-3 px-3 text-left',
          'bg-[var(--color-surface-primary)]',
          'border rounded-lg transition-all duration-150',
          isOpen
            ? 'border-[var(--color-neutral-300)] shadow-sm'
            : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
          isLoading && 'opacity-60 cursor-not-allowed'
        )}
      >
        {selected ? (
          <>
            <div className="h-7 w-7 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-[var(--color-text-tertiary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate block">
                {selected.name}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono shrink-0 px-1.5 py-0.5 bg-[var(--color-surface-tertiary)] rounded">
              {selected.code}
            </span>
          </>
        ) : (
          <>
            <Building2 size={16} className="shrink-0 text-[var(--color-text-tertiary)]" />
            <span className="flex-1 text-[13px] text-[var(--color-text-tertiary)]">
              {isLoading ? 'Loading dealers...' : 'Select dealer...'}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full sm:w-[320px] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-[var(--color-border-subtle)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dealers..."
              className="w-full h-8 px-2.5 text-[13px] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-md focus:outline-none focus:border-[var(--color-neutral-300)]"
              autoFocus
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[var(--color-text-tertiary)]">
                No dealers found
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((dealer) => (
                  <button
                    key={dealer.id}
                    onClick={() => {
                      onSelect(dealer);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-left',
                      'hover:bg-[var(--color-surface-secondary)] transition-colors',
                      selected?.id === dealer.id && 'bg-[var(--color-surface-tertiary)]'
                    )}
                  >
                    <div className="h-6 w-6 rounded bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-[var(--color-text-tertiary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-[var(--color-text-primary)] truncate block">
                        {dealer.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                      {dealer.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Content Components
// ─────────────────────────────────────────────────────────────────────────────

function LedgerTab({ entries, isLoading }: { entries: LedgerEntry[]; isLoading: boolean }) {
  const totalDebit = useMemo(() => entries.reduce((sum, e) => sum + (e.debit || 0), 0), [entries]);
  const totalCredit = useMemo(() => entries.reduce((sum, e) => sum + (e.credit || 0), 0), [entries]);

  const columns: Column<LedgerEntry>[] = [
    {
      id: 'date',
      header: 'Date',
      accessor: (row) => <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.date)}</span>,
      sortable: true,
      sortAccessor: (row) => row.date,
      width: '110px',
    },
    {
      id: 'reference',
      header: 'Reference',
      accessor: (row) => <span className="font-medium">{row.reference || '—'}</span>,
      sortable: true,
      sortAccessor: (row) => row.reference || '',
    },
    {
      id: 'description',
      header: 'Description',
      accessor: (row) => <span className="text-[var(--color-text-secondary)]">{row.description || '—'}</span>,
    },
    {
      id: 'debit',
      header: 'Debit',
      accessor: (row) => row.debit > 0 ? <span className="tabular-nums text-[var(--color-text-primary)]">{formatCurrency(row.debit)}</span> : '—',
      sortable: true,
      sortAccessor: (row) => row.debit || 0,
      align: 'right',
    },
    {
      id: 'credit',
      header: 'Credit',
      accessor: (row) => row.credit > 0 ? <span className="tabular-nums text-[var(--color-text-primary)]">{formatCurrency(row.credit)}</span> : '—',
      sortable: true,
      sortAccessor: (row) => row.credit || 0,
      align: 'right',
    },
    {
      id: 'balance',
      header: 'Balance',
      accessor: (row) => <span className="tabular-nums font-medium">{formatCurrency(row.balance)}</span>,
      sortable: true,
      sortAccessor: (row) => row.balance || 0,
      align: 'right',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Debit"
          value={formatCurrency(totalDebit)}
          icon={<TrendingUp size={16} style={{ color: 'var(--color-success-icon)' }} />}
        />
        <StatCard
          label="Total Credit"
          value={formatCurrency(totalCredit)}
          icon={<Receipt size={16} style={{ color: 'var(--color-debit)' }} />}
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(entries[entries.length - 1]?.balance || 0)}
          icon={<FileText size={16} style={{ color: 'var(--color-accent-icon)' }} />}
        />
      </div>

      {/* Data Table */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
        <DataTable<LedgerEntry>
          columns={columns}
          data={entries}
          keyExtractor={(row) => `${row.date}-${row.reference || ''}-${row.debit}-${row.credit}-${row.balance}`}
          isLoading={isLoading}
          emptyMessage="No ledger entries found"
          searchable
          searchPlaceholder="Search entries..."
          searchFilter={(row, q) =>
            (row.reference?.toLowerCase() || '').includes(q) ||
            (row.description?.toLowerCase() || '').includes(q)
          }
          pageSize={10}
          mobileCardRenderer={(row) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--color-text-tertiary)]">{formatDate(row.date)}</span>
                <span className="text-[13px] font-medium tabular-nums">{formatCurrency(row.balance)}</span>
              </div>
              <p className="text-[13px] text-[var(--color-text-primary)]">{row.description || row.reference || '—'}</p>
              <div className="flex items-center gap-4 pt-1">
                {row.debit > 0 && <span className="text-[12px]" style={{ color: 'var(--color-credit)' }}>Dr: {formatCurrency(row.debit)}</span>}
                {row.credit > 0 && <span className="text-[12px]" style={{ color: 'var(--color-debit)' }}>Cr: {formatCurrency(row.credit)}</span>}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function InvoicesTab({ invoices, isLoading }: { invoices: FinanceInvoice[]; isLoading: boolean }) {
  const totalAmount = useMemo(() => invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0), [invoices]);
  const outstandingAmount = useMemo(() => invoices.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0), [invoices]);
  const paidCount = useMemo(() => invoices.filter(i => i.status?.toLowerCase() === 'paid').length, [invoices]);

  const columns: Column<FinanceInvoice>[] = [
    {
      id: 'number',
      header: 'Invoice #',
      accessor: (row) => <span className="font-medium">{row.invoiceNumber}</span>,
      sortable: true,
      sortAccessor: (row) => row.invoiceNumber,
    },
    {
      id: 'date',
      header: 'Issue Date',
      accessor: (row) => <span className="tabular-nums text-[var(--color-text-secondary)]">{formatDate(row.issueDate)}</span>,
      sortable: true,
      sortAccessor: (row) => row.issueDate,
      width: '120px',
    },
    {
      id: 'due',
      header: 'Due Date',
      accessor: (row) => <span className="tabular-nums text-[var(--color-text-tertiary)]">{formatDate(row.dueDate)}</span>,
      sortable: true,
      sortAccessor: (row) => row.dueDate,
      width: '120px',
      hideOnMobile: true,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: (row) => <span className="tabular-nums">{formatCurrency(row.totalAmount)}</span>,
      sortable: true,
      sortAccessor: (row) => row.totalAmount,
      align: 'right',
    },
    {
      id: 'outstanding',
      header: 'Outstanding',
      accessor: (row) => row.outstandingAmount > 0 ? <span className="tabular-nums text-[var(--color-error)]">{formatCurrency(row.outstandingAmount)}</span> : <span className="tabular-nums text-[var(--color-text-tertiary)]">—</span>,
      sortable: true,
      sortAccessor: (row) => row.outstandingAmount,
      align: 'right',
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
      sortable: true,
      sortAccessor: (row) => row.status,
      width: '100px',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Invoiced"
          value={formatCurrency(totalAmount)}
          icon={<FileText size={16} style={{ color: 'var(--color-accent-icon)' }} />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstandingAmount)}
          icon={<AlertCircle size={16} style={{ color: 'var(--color-warning-icon)' }} />}
        />
        <StatCard
          label="Paid"
          value={`${paidCount} invoices`}
          icon={<Receipt size={16} style={{ color: 'var(--color-success-icon)' }} />}
        />
      </div>

      {/* Data Table */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
        <DataTable<FinanceInvoice>
          columns={columns}
          data={invoices}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No invoices found"
          searchable
          searchPlaceholder="Search invoices..."
          searchFilter={(row, q) =>
            (row.invoiceNumber?.toLowerCase() || '').includes(q) ||
            (row.status?.toLowerCase() || '').includes(q)
          }
          pageSize={10}
          mobileCardRenderer={(row) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{row.invoiceNumber}</span>
                {getStatusBadge(row.status)}
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--color-text-secondary)]">{formatDate(row.issueDate)}</span>
                <span className="tabular-nums font-medium">{formatCurrency(row.totalAmount)}</span>
              </div>
              {row.outstandingAmount > 0 && (
                <p className="text-[11px] text-[var(--color-error)]">Outstanding: {formatCurrency(row.outstandingAmount)}</p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

function AgingTab({ aging, isLoading }: { aging: FinanceAging | null; isLoading: boolean }) {
  const total = aging?.totalOutstanding || 0;

  const bucketData = useMemo(() => {
    const buckets = aging?.buckets || [];
    if (!total) return buckets.map((bucket) => ({ ...bucket, percent: 0 }));
    return buckets.map((bucket) => ({
      ...bucket,
      percent: Math.round((bucket.amount / total) * 100),
    }));
  }, [aging?.buckets, total]);

  const maxBucket = useMemo(() => {
    return bucketData.reduce(
      (max, bucket) => (bucket.amount > max.amount ? bucket : max),
      bucketData[0] || { amount: 0 },
    );
  }, [bucketData]);

  if (!aging && !isLoading) {
    return (
      <EmptyState
        title="No aging data"
        description="Select a dealer to view aging analysis"
        icon={<Calendar size={32} className="text-[var(--color-text-tertiary)]" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Outstanding */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5">
        <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-1">
          Total Outstanding
        </p>
        <p className="text-3xl font-semibold tabular-nums text-[var(--color-text-primary)]">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Aging Buckets */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">Aging Breakdown</h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 w-1/4 bg-[var(--color-surface-tertiary)] rounded" />
                <div className="h-6 w-full bg-[var(--color-surface-tertiary)] rounded" />
              </div>
            ))}
          </div>
        ) : bucketData.length === 0 ? (
          <EmptyState
            title="No aging buckets"
            description="No aging data available for this dealer"
          />
        ) : (
          <div className="space-y-4">
            {bucketData.map((bucket) => {
              const isLargest = bucket.label === maxBucket?.label;
              const isOverdue = bucket.fromDays > 30;

              return (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className={clsx(
                      "font-medium",
                      isOverdue ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"
                    )}>
                      {bucket.label}
                    </span>
                    <span className="tabular-nums font-medium">{formatCurrency(bucket.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          isOverdue ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]",
                          isLargest && "opacity-100"
                        )}
                        style={{ width: `${Math.max(bucket.percent, 2)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums w-8 text-right">
                      {bucket.percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <span>Current (0-30 days)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
          <span>Overdue (31+ days)</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceSupportPage() {
  const { error: toastError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<TabValue>('ledger');
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerOption | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [aging, setAging] = useState<FinanceAging | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDealers, setIsLoadingDealers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dealers on mount
  const loadDealers = useCallback(async () => {
    setIsLoadingDealers(true);
    try {
      // Fetch dealers using salesApi (which uses /dealers endpoint)
      // Backend may return a plain array or a PageResponse with .content
      const response = await salesApi.listDealers({ size: 500 });
      const dealerList = Array.isArray(response) ? response : (response.content || []);
      setDealers(dealerList.map((d: { id: number; name?: string; code?: string }) => ({ id: d.id, name: d.name || '', code: d.code || '' })));
    } catch (err) {
      setError('Failed to load dealers');
    } finally {
      setIsLoadingDealers(false);
    }
  }, []);

  useEffect(() => {
    loadDealers();
  }, [loadDealers]);

  // Load finance data when dealer changes
  const loadFinanceData = useCallback(async (dealerId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const [ledgerRes, invoicesRes, agingRes] = await Promise.allSettled([
        financeSupportApi.getLedger(dealerId),
        financeSupportApi.getInvoices(dealerId),
        financeSupportApi.getAging(dealerId),
      ]);

      if (ledgerRes.status === 'fulfilled') {
        setLedger(ledgerRes.value);
      }
      if (invoicesRes.status === 'fulfilled') {
        setInvoices(invoicesRes.value);
      }
      if (agingRes.status === 'fulfilled') {
        setAging(agingRes.value);
      }

      // Log any errors
      [ledgerRes, invoicesRes, agingRes].forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.error(`Failed to load ${['ledger', 'invoices', 'aging'][idx]}:`, res.reason);
        }
      });
    } catch (err) {
      setError('Failed to load finance data');
      toastError('Error loading finance data', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (selectedDealer) {
      loadFinanceData(selectedDealer.id);
    } else {
      setLedger([]);
      setInvoices([]);
      setAging(null);
    }
  }, [selectedDealer, loadFinanceData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dealer-selector')) {
        // Close any open dropdowns
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const tabs = [
    { value: 'ledger', label: 'Ledger', count: ledger.length },
    { value: 'invoices', label: 'Invoices', count: invoices.length },
    { value: 'aging', label: 'Aging' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Finance Support"
        description="View dealer ledger, invoices, and aging analysis"
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCcw size={14} />}
            onClick={() => selectedDealer && loadFinanceData(selectedDealer.id)}
            disabled={!selectedDealer || isLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => loadDealers()}
            className="text-[12px] font-medium underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dealer Selector */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-[13px] font-medium text-[var(--color-text-primary)] shrink-0">
            Select dealer
          </label>
          <div className="dealer-selector">
            <DealerSelector
              dealers={dealers}
              selected={selectedDealer}
              onSelect={setSelectedDealer}
              isLoading={isLoadingDealers}
            />
          </div>
        </div>
      </div>

      {/* Empty State (No Dealer Selected) */}
      {!selectedDealer && (
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-12">
          <EmptyState
            title="Select a dealer"
            description="Choose a dealer from the dropdown above to view their financial data including ledger entries, invoices, and aging analysis."
            icon={<Building2 size={48} className="text-[var(--color-text-tertiary)]" />}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.querySelector('.dealer-selector button')?.dispatchEvent(new MouseEvent('click'))}
              >
                Select dealer
              </Button>
            }
          />
        </div>
      )}

      {/* Tab Content */}
      {selectedDealer && (
        <div className="space-y-4">
          <Tabs tabs={tabs} active={activeTab} onChange={(v) => setActiveTab(v as TabValue)} variant="underline" />

          <div className="pt-2">
            {activeTab === 'ledger' && <LedgerTab entries={ledger} isLoading={isLoading} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} isLoading={isLoading} />}
            {activeTab === 'aging' && <AgingTab aging={aging} isLoading={isLoading} />}
          </div>
        </div>
      )}
    </div>
  );
}
