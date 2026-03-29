/**
 * OrchestratorDashboardPage
 *
 * Tabbed dashboard for cross-functional orchestrator views:
 *  - Admin tab:   dealers (active/total/credit), orders (total/pending/approved), accounting (accounts/balance)
 *  - Factory tab: production (efficiency/completed/batches), inventory (value/lowStock), tasks
 *  - Finance tab: ledger (accounts/balance), cashflow (operating/investing/financing/net),
 *                 aged debtors list, reconciliation (physical vs ledger variance)
 *
 * IMPORTANT: These endpoints return raw JSON — NOT wrapped in ApiResponse.
 *  - GET /api/v1/orchestrator/dashboard/admin
 *  - GET /api/v1/orchestrator/dashboard/factory
 *  - GET /api/v1/orchestrator/dashboard/finance
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  ShoppingCart,
  BookOpen,
  Factory,
  Package,
  BarChart2,
  Activity,
  RefreshCcw,
  AlertCircle,
  Boxes,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Layers,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { orchestratorApi } from '@/lib/adminApi';
import type {
  OrchestratorAdminDashboard,
  OrchestratorFactoryDashboard,
  OrchestratorFinanceDashboard,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

function KpiCard({ label, value, sublabel, icon, accent = 'default' }: KpiCardProps) {
  const accentMap = {
    default: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
    success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
    error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
    info: 'text-[var(--color-info)] bg-[var(--color-info-bg)]',
  };

  return (
    <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={clsx('p-2 rounded-lg', accentMap[accent])}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
      {sublabel && (
        <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">{sublabel}</p>
      )}
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Skeleton width={32} height={32} className="rounded-lg" />
        <Skeleton width="50%" height={12} />
      </div>
      <Skeleton width="60%" height={28} />
      <Skeleton width="40%" height={12} className="mt-2" />
    </div>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
      >
        <RefreshCcw size={13} />
        Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header within a tab
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">{title}</h3>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard Tab
// Actual shape: { dealers: {active, total, creditUtilization}, orders: {total, pending, approved},
//                accounting: {accounts, ledgerBalance} }
// ─────────────────────────────────────────────────────────────────────────────

function AdminTab() {
  const [data, setData] = useState<OrchestratorAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orchestratorApi.getAdminDashboard();
      setData(result);
    } catch {
      setError('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorRetry message={error || 'Failed to load data.'} onRetry={load} />;
  }

  const creditPct = data.dealers.total > 0
    ? Math.min((data.dealers.creditUtilization / (data.dealers.total * 100000)) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Dealers */}
      <div>
        <SectionHeader title="Dealers" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Active Dealers"
            value={formatNumber(data.dealers.active)}
            sublabel={`${formatNumber(data.dealers.total)} total`}
            icon={<Users size={16} />}
            accent="info"
          />
          <KpiCard
            label="Total Dealers"
            value={formatNumber(data.dealers.total)}
            sublabel="Registered entities"
            icon={<Users size={16} />}
            accent="default"
          />
          <KpiCard
            label="Credit Utilisation"
            value={formatCurrency(data.dealers.creditUtilization)}
            sublabel={`${formatPercent(creditPct)} of limit`}
            icon={<CheckCircle size={16} />}
            accent={creditPct > 80 ? 'warning' : 'default'}
          />
        </div>
      </div>

      {/* Orders */}
      <div>
        <SectionHeader title="Orders" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Orders"
            value={formatNumber(data.orders.total)}
            sublabel="All time"
            icon={<ShoppingCart size={16} />}
            accent="default"
          />
          <KpiCard
            label="Pending Orders"
            value={formatNumber(data.orders.pending)}
            sublabel="Awaiting action"
            icon={<Clock size={16} />}
            accent={data.orders.pending > 0 ? 'warning' : 'success'}
          />
          <KpiCard
            label="Approved Orders"
            value={formatNumber(data.orders.approved)}
            sublabel="Confirmed"
            icon={<CheckCircle size={16} />}
            accent="success"
          />
        </div>
      </div>

      {/* Accounting */}
      <div>
        <SectionHeader title="Accounting" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Chart of Accounts"
            value={formatNumber(data.accounting.accounts)}
            sublabel="Total accounts"
            icon={<BookOpen size={16} />}
            accent="default"
          />
          <KpiCard
            label="Ledger Balance"
            value={formatCurrency(data.accounting.ledgerBalance)}
            sublabel="Net position"
            icon={<Activity size={16} />}
            accent={data.accounting.ledgerBalance >= 0 ? 'success' : 'error'}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Dashboard Tab
// Actual shape: { production: {efficiency, completed, batchesLogged},
//                inventory: {value, lowStock}, tasks }
// ─────────────────────────────────────────────────────────────────────────────

function FactoryTab() {
  const [data, setData] = useState<OrchestratorFactoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orchestratorApi.getFactoryDashboard();
      setData(result);
    } catch {
      setError('Failed to load factory dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorRetry message={error || 'Failed to load data.'} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      {/* Production */}
      <div>
        <SectionHeader title="Production" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Efficiency"
            value={formatPercent(data.production.efficiency)}
            sublabel="Line efficiency"
            icon={<BarChart2 size={16} />}
            accent={
              data.production.efficiency >= 85 ? 'success'
                : data.production.efficiency >= 65 ? 'warning'
                : data.production.efficiency > 0 ? 'error'
                : 'default'
            }
          />
          <KpiCard
            label="Batches Completed"
            value={formatNumber(data.production.completed)}
            sublabel="Finished production runs"
            icon={<Package size={16} />}
            accent="success"
          />
          <KpiCard
            label="Batches Logged"
            value={formatNumber(data.production.batchesLogged)}
            sublabel="Total batches recorded"
            icon={<Layers size={16} />}
            accent="default"
          />
        </div>
      </div>

      {/* Inventory */}
      <div>
        <SectionHeader title="Inventory" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Inventory Value"
            value={formatCurrency(data.inventory.value)}
            sublabel="Current stock valuation"
            icon={<Boxes size={16} />}
            accent="default"
          />
          <KpiCard
            label="Low Stock Items"
            value={formatNumber(data.inventory.lowStock)}
            sublabel="Below reorder level"
            icon={<AlertCircle size={16} />}
            accent={data.inventory.lowStock > 0 ? 'warning' : 'success'}
          />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <SectionHeader title="Tasks" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Active Tasks"
            value={formatNumber(data.tasks)}
            sublabel="Pending factory tasks"
            icon={<Activity size={16} />}
            accent={data.tasks > 10 ? 'warning' : 'default'}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance Dashboard Tab
// Actual shape: { ledger: {accounts, ledgerBalance}, cashflow: {investing, net, financing, operating},
//                agedDebtors[], reconciliation: {physicalInventoryValue, ledgerInventoryBalance, variance} }
// ─────────────────────────────────────────────────────────────────────────────

function FinanceTab() {
  const [data, setData] = useState<OrchestratorFinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orchestratorApi.getFinanceDashboard();
      setData(result);
    } catch {
      setError('Failed to load finance dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorRetry message={error || 'Failed to load data.'} onRetry={load} />;
  }

  const varianceSign = data.reconciliation.variance >= 0 ? '+' : '';

  return (
    <div className="space-y-6">
      {/* Ledger */}
      <div>
        <SectionHeader title="Ledger" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Chart of Accounts"
            value={formatNumber(data.ledger.accounts)}
            sublabel="Total accounts"
            icon={<BookOpen size={16} />}
            accent="default"
          />
          <KpiCard
            label="Ledger Balance"
            value={formatCurrency(data.ledger.ledgerBalance)}
            sublabel="Net ledger position"
            icon={<DollarSign size={16} />}
            accent={data.ledger.ledgerBalance >= 0 ? 'success' : 'error'}
          />
        </div>
      </div>

      {/* Cash Flow */}
      <div>
        <SectionHeader title="Cash Flow" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Net Cash Flow"
            value={formatCurrency(data.cashflow.net)}
            sublabel="Total net"
            icon={<ArrowRightLeft size={16} />}
            accent={data.cashflow.net >= 0 ? 'success' : 'error'}
          />
          <KpiCard
            label="Operating"
            value={formatCurrency(data.cashflow.operating)}
            sublabel="Operating activities"
            icon={<Activity size={16} />}
            accent={data.cashflow.operating >= 0 ? 'success' : 'warning'}
          />
          <KpiCard
            label="Investing"
            value={formatCurrency(data.cashflow.investing)}
            sublabel="Investing activities"
            icon={<TrendingUp size={16} />}
            accent="default"
          />
          <KpiCard
            label="Financing"
            value={formatCurrency(data.cashflow.financing)}
            sublabel="Financing activities"
            icon={<Factory size={16} />}
            accent="default"
          />
        </div>
      </div>

      {/* Reconciliation */}
      <div>
        <SectionHeader title="Inventory Reconciliation" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Physical Value"
            value={formatCurrency(data.reconciliation.physicalInventoryValue)}
            sublabel="Actual stock count"
            icon={<Boxes size={16} />}
            accent="default"
          />
          <KpiCard
            label="Ledger Value"
            value={formatCurrency(data.reconciliation.ledgerInventoryBalance)}
            sublabel="Accounting records"
            icon={<BookOpen size={16} />}
            accent="default"
          />
          <KpiCard
            label="Variance"
            value={`${varianceSign}${formatCurrency(data.reconciliation.variance)}`}
            sublabel={data.reconciliation.variance === 0 ? 'Balanced' : 'Discrepancy detected'}
            icon={<TrendingDown size={16} />}
            accent={data.reconciliation.variance === 0 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Aged Debtors */}
      {data.agedDebtors && data.agedDebtors.length > 0 && (
        <div>
          <SectionHeader title="Aged Debtors" />
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.agedDebtors.map((debtor, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-[var(--color-text-primary)] font-medium">
                  {debtor.label || debtor.debtorName || `Debtor ${idx + 1}`}
                </span>
                <div className="flex items-center gap-3">
                  {debtor.count !== undefined && (
                    <Badge variant="default">{debtor.count} invoices</Badge>
                  )}
                  <span className="text-[13px] tabular-nums font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(debtor.amount ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.agedDebtors && data.agedDebtors.length === 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-success-bg)] text-[var(--color-success)] text-[13px] flex items-center gap-2">
          <CheckCircle size={15} />
          <span>No aged debtors — all receivables are current.</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Factory', value: 'factory' },
  { label: 'Finance', value: 'finance' },
];

export function OrchestratorDashboardPage() {
  const [activeTab, setActiveTab] = useState('admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Orchestrator</h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Cross-functional metrics across Admin, Factory, and Finance operations.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div>
        {activeTab === 'admin' && <AdminTab />}
        {activeTab === 'factory' && <FactoryTab />}
        {activeTab === 'finance' && <FinanceTab />}
      </div>
    </div>
  );
}
