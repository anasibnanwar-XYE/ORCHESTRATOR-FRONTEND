 /**
  * OrchestratorDashboardPage
  *
  * Tabbed dashboard for cross-functional orchestrator views:
  *  - Admin tab: Total orders, dispatches, fulfilments, pending approvals
  *  - Factory tab: Active jobs, throughput, packing queue, efficiency
  *  - Finance tab: Revenue, COGS, gross profit, receivables, payables
  *
  * Data sources:
  *  - GET /api/v1/orchestrator/dashboard/admin
  *  - GET /api/v1/orchestrator/dashboard/factory
  *  - GET /api/v1/orchestrator/dashboard/finance
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   LayoutGrid,
   Factory,
   DollarSign,
   ShoppingCart,
   Truck,
   Package,
   TrendingUp,
   Activity,
   RefreshCcw,
   AlertCircle,
   Boxes,
   CreditCard,
   Receipt,
   BarChart2,
   Cpu,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Tabs } from '@/components/ui/Tabs';
 import { Skeleton } from '@/components/ui/Skeleton';
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
 // KPI Card
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
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Admin Dashboard Tab
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
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)}
       </div>
     );
   }
 
   if (error || !data) {
     return (
       <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
         <AlertCircle size={16} className="shrink-0" />
         <span>{error || 'Failed to load data.'}</span>
         <button
           type="button"
           onClick={load}
           className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
         >
           <RefreshCcw size={13} />
           Retry
         </button>
       </div>
     );
   }
 
   return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
       <KpiCard
         label="Total Orders"
         value={formatNumber(data.totalOrders)}
         sublabel="All time"
         icon={<ShoppingCart size={16} />}
         accent="info"
       />
       <KpiCard
         label="Total Dispatches"
         value={formatNumber(data.totalDispatches)}
         sublabel="All time"
         icon={<Truck size={16} />}
         accent="default"
       />
       <KpiCard
         label="Total Fulfilments"
         value={formatNumber(data.totalFulfilments)}
         sublabel="Delivered to dealers"
         icon={<Package size={16} />}
         accent="success"
       />
       <KpiCard
         label="Pending Approvals"
         value={formatNumber(data.pendingApprovals)}
         sublabel="Requires action"
         icon={<Activity size={16} />}
         accent={data.pendingApprovals > 0 ? 'warning' : 'success'}
       />
       {data.revenueThisMonth !== undefined && (
         <KpiCard
           label="Revenue (Month)"
           value={formatCurrency(data.revenueThisMonth)}
           sublabel="Current month"
           icon={<TrendingUp size={16} />}
           accent="success"
         />
       )}
       {data.activeUsers !== undefined && (
         <KpiCard
           label="Active Users"
           value={formatNumber(data.activeUsers)}
           sublabel="Currently online"
           icon={<LayoutGrid size={16} />}
           accent="default"
         />
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Factory Dashboard Tab
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
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
       </div>
     );
   }
 
   if (error || !data) {
     return (
       <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
         <AlertCircle size={16} className="shrink-0" />
         <span>{error || 'Failed to load data.'}</span>
         <button
           type="button"
           onClick={load}
           className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
         >
           <RefreshCcw size={13} />
           Retry
         </button>
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <KpiCard
           label="Active Jobs"
           value={formatNumber(data.activeJobs)}
           sublabel="Currently running"
           icon={<Cpu size={16} />}
           accent="info"
         />
         <KpiCard
           label="Throughput"
           value={formatPercent(data.throughput)}
           sublabel="vs plan"
           icon={<BarChart2 size={16} />}
           accent={data.throughput >= 90 ? 'success' : data.throughput >= 70 ? 'warning' : 'error'}
         />
         <KpiCard
           label="Packing Queue"
           value={formatNumber(data.packingQueue)}
           sublabel="Awaiting packing"
           icon={<Boxes size={16} />}
           accent={data.packingQueue > 50 ? 'warning' : 'default'}
         />
         <KpiCard
           label="Completed Today"
           value={formatNumber(data.completedToday)}
           sublabel="Finished goods packed"
           icon={<Package size={16} />}
           accent="success"
         />
         {data.efficiencyRate !== undefined && (
           <KpiCard
             label="Efficiency Rate"
             value={formatPercent(data.efficiencyRate)}
             sublabel="Overall line efficiency"
             icon={<Activity size={16} />}
             accent={data.efficiencyRate >= 85 ? 'success' : data.efficiencyRate >= 65 ? 'warning' : 'error'}
           />
         )}
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Finance Dashboard Tab
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
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)}
       </div>
     );
   }
 
   if (error || !data) {
     return (
       <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
         <AlertCircle size={16} className="shrink-0" />
         <span>{error || 'Failed to load data.'}</span>
         <button
           type="button"
           onClick={load}
           className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
         >
           <RefreshCcw size={13} />
           Retry
         </button>
       </div>
     );
   }
 
   const grossMargin = data.revenue > 0
     ? ((data.grossProfit / data.revenue) * 100).toFixed(1)
     : '0.0';
 
   return (
     <div className="space-y-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <KpiCard
           label="Revenue"
           value={formatCurrency(data.revenue)}
           sublabel="Total revenue"
           icon={<TrendingUp size={16} />}
           accent="success"
         />
         <KpiCard
           label="COGS"
           value={formatCurrency(data.cogs)}
           sublabel="Cost of goods sold"
           icon={<Receipt size={16} />}
           accent="default"
         />
         <KpiCard
           label="Gross Profit"
           value={formatCurrency(data.grossProfit)}
           sublabel={`${grossMargin}% margin`}
           icon={<DollarSign size={16} />}
           accent={data.grossProfit > 0 ? 'success' : 'error'}
         />
         <KpiCard
           label="Receivables"
           value={formatCurrency(data.receivables)}
           sublabel="Outstanding from dealers"
           icon={<CreditCard size={16} />}
           accent="warning"
         />
         <KpiCard
           label="Payables"
           value={formatCurrency(data.payables)}
           sublabel="Owed to suppliers"
           icon={<Factory size={16} />}
           accent="default"
         />
         {data.netCashFlow !== undefined && (
           <KpiCard
             label="Net Cash Flow"
             value={formatCurrency(data.netCashFlow)}
             sublabel="Operating cash flow"
             icon={<BarChart2 size={16} />}
             accent={data.netCashFlow >= 0 ? 'success' : 'error'}
           />
         )}
       </div>
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
           Cross-functional metrics across Admin, Factory, and Finance.
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
