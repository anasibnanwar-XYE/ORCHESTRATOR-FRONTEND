 /**
  * PortalInsightsPage
  *
  * Tabbed portal monitoring views:
  *  - Dashboard: Platform usage (sessions, page views, errors, active users)
  *  - Operations: API latency p50/p95/p99, queue depths, uptime
  *  - Workforce: Attendance rate, overtime, department headcount, leave utilisation
  *
  * Data sources:
  *  - GET /api/v1/portal/dashboard
  *  - GET /api/v1/portal/operations
  *  - GET /api/v1/portal/workforce
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Monitor,
   Activity,
   Users,
   TrendingUp,
   Eye,
   AlertCircle,
   RefreshCcw,
   Clock,
   Zap,
   BarChart2,
   UserCheck,
   Building2,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Tabs } from '@/components/ui/Tabs';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { portalInsightsApi } from '@/lib/adminApi';
 import type { PortalDashboard, PortalOperations, PortalWorkforce } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatNumber(n: number): string {
   return new Intl.NumberFormat('en-IN').format(n);
 }
 
 function formatPercent(n: number): string {
   return `${n.toFixed(1)}%`;
 }
 
 function formatMs(n: number): string {
   return `${n} ms`;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Stat Tile (compact metric display)
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface StatTileProps {
   label: string;
   value: string | number;
   sublabel?: string;
   icon: React.ReactNode;
   accent?: 'default' | 'success' | 'warning' | 'error';
 }
 
 function StatTile({ label, value, sublabel, icon, accent = 'default' }: StatTileProps) {
   const accentMap = {
     default: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
     success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
     warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
     error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
   };
 
   return (
     <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
       <div className="flex items-start justify-between gap-3 mb-3">
         <span className={clsx('p-2 rounded-lg', accentMap[accent])}>{icon}</span>
       </div>
       <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
       <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</p>
       {sublabel && (
         <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">{sublabel}</p>
       )}
     </div>
   );
 }
 
 function StatTileSkeleton() {
   return (
     <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl animate-pulse">
       <Skeleton width={32} height={32} className="rounded-lg mb-3" />
       <Skeleton width="60%" height={28} />
       <Skeleton width="40%" height={12} className="mt-2" />
     </div>
   );
 }
 
 function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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
 // Dashboard Tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 function DashboardTab() {
   const [data, setData] = useState<PortalDashboard | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await portalInsightsApi.getDashboard();
       setData(result);
     } catch {
       setError('Failed to load platform dashboard data.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   if (loading) {
     return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {Array.from({ length: 6 }).map((_, i) => <StatTileSkeleton key={i} />)}
       </div>
     );
   }
 
   if (error || !data) {
     return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
   }
 
   return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
       {data.sessions !== undefined && (
         <StatTile
           label="Sessions"
           value={formatNumber(data.sessions)}
           sublabel="Active sessions today"
           icon={<Monitor size={16} />}
           accent="default"
         />
       )}
       {data.pageViews !== undefined && (
         <StatTile
           label="Page Views"
           value={formatNumber(data.pageViews)}
           sublabel="Total today"
           icon={<Eye size={16} />}
           accent="default"
         />
       )}
       {data.errors !== undefined && (
         <StatTile
           label="Errors"
           value={formatNumber(data.errors)}
           sublabel="Unhandled errors"
           icon={<AlertCircle size={16} />}
           accent={(data.errors ?? 0) > 10 ? 'error' : (data.errors ?? 0) > 0 ? 'warning' : 'success'}
         />
       )}
       {data.activeUsers !== undefined && (
         <StatTile
           label="Active Users"
           value={formatNumber(data.activeUsers)}
           sublabel="Online now"
           icon={<Users size={16} />}
           accent="default"
         />
       )}
       {data.avgSessionDuration !== undefined && (
         <StatTile
           label="Avg Session"
           value={`${Math.floor(data.avgSessionDuration / 60)}m ${data.avgSessionDuration % 60}s`}
           sublabel="Average duration"
           icon={<Clock size={16} />}
           accent="default"
         />
       )}
       {data.bounceRate !== undefined && (
         <StatTile
           label="Bounce Rate"
           value={formatPercent(data.bounceRate)}
           sublabel="Single-page sessions"
           icon={<TrendingUp size={16} />}
           accent={data.bounceRate > 60 ? 'warning' : 'default'}
         />
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Operations Tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 function OperationsTab() {
   const [data, setData] = useState<PortalOperations | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await portalInsightsApi.getOperations();
       setData(result);
     } catch {
       setError('Failed to load operations data.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   if (loading) {
     return (
       <div className="space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           {Array.from({ length: 3 }).map((_, i) => <StatTileSkeleton key={i} />)}
         </div>
         <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4 h-32" />
       </div>
     );
   }
 
   if (error || !data) {
     return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
   }
 
   const latencyAccent = (ms: number): 'success' | 'warning' | 'error' =>
     ms < 100 ? 'success' : ms < 500 ? 'warning' : 'error';
 
   return (
     <div className="space-y-6">
       {/* API Latency */}
       <div>
         <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
           API Latency
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <StatTile
             label="p50"
             value={formatMs(data.apiLatencyP50)}
             sublabel="Median response time"
             icon={<Zap size={16} />}
             accent={latencyAccent(data.apiLatencyP50)}
           />
           <StatTile
             label="p95"
             value={formatMs(data.apiLatencyP95)}
             sublabel="95th percentile"
             icon={<Activity size={16} />}
             accent={latencyAccent(data.apiLatencyP95)}
           />
           <StatTile
             label="p99"
             value={formatMs(data.apiLatencyP99)}
             sublabel="99th percentile"
             icon={<BarChart2 size={16} />}
             accent={latencyAccent(data.apiLatencyP99)}
           />
         </div>
       </div>
 
       {/* Service Health */}
       {(data.uptime !== undefined || data.errorRate !== undefined) && (
         <div>
           <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
             Service Health
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {data.uptime !== undefined && (
               <StatTile
                 label="Uptime"
                 value={formatPercent(data.uptime)}
                 sublabel="Last 30 days"
                 icon={<TrendingUp size={16} />}
                 accent={data.uptime >= 99.9 ? 'success' : data.uptime >= 99 ? 'warning' : 'error'}
               />
             )}
             {data.errorRate !== undefined && (
               <StatTile
                 label="Error Rate"
                 value={formatPercent(data.errorRate)}
                 sublabel="Request error rate"
                 icon={<AlertCircle size={16} />}
                 accent={data.errorRate < 1 ? 'success' : data.errorRate < 5 ? 'warning' : 'error'}
               />
             )}
           </div>
         </div>
       )}
 
       {/* Queue Depths */}
       {data.queueDepths.length > 0 && (
         <div>
           <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
             Queue Depths
           </h3>
           <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
             {data.queueDepths.map((q) => (
               <div key={q.queue} className="flex items-center justify-between px-4 py-3">
                 <span className="text-[13px] text-[var(--color-text-primary)] font-medium">{q.queue}</span>
                 <span className={clsx(
                   'text-[13px] tabular-nums font-semibold',
                   q.depth > 100 ? 'text-[var(--color-error)]' :
                   q.depth > 50 ? 'text-[var(--color-warning)]' :
                   'text-[var(--color-success)]',
                 )}>
                   {formatNumber(q.depth)}
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Workforce Tab
 // ─────────────────────────────────────────────────────────────────────────────
 
 function WorkforceTab() {
   const [data, setData] = useState<PortalWorkforce | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const load = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await portalInsightsApi.getWorkforce();
       setData(result);
     } catch {
       setError('Failed to load workforce data.');
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => { void load(); }, [load]);
 
   if (loading) {
     return (
       <div className="space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)}
         </div>
         <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4 h-32" />
       </div>
     );
   }
 
   if (error || !data) {
     return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
   }
 
   return (
     <div className="space-y-6">
       {/* KPIs */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatTile
           label="Attendance Rate"
           value={formatPercent(data.attendanceRate)}
           sublabel="This month"
           icon={<UserCheck size={16} />}
           accent={data.attendanceRate >= 95 ? 'success' : data.attendanceRate >= 85 ? 'warning' : 'error'}
         />
         <StatTile
           label="Overtime Hours"
           value={formatNumber(data.overtime)}
           sublabel="This period"
           icon={<Clock size={16} />}
           accent={data.overtime > 100 ? 'warning' : 'default'}
         />
         <StatTile
           label="Leave Utilisation"
           value={formatPercent(data.leaveUtilisation)}
           sublabel="Leave quota used"
           icon={<Activity size={16} />}
           accent="default"
         />
         {data.totalHeadcount !== undefined && (
           <StatTile
             label="Total Headcount"
             value={formatNumber(data.totalHeadcount)}
             sublabel="All departments"
             icon={<Users size={16} />}
             accent="default"
           />
         )}
       </div>
 
       {/* Department Headcount */}
       {data.departmentHeadcount.length > 0 && (
         <div>
           <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
             Department Headcount
           </h3>
           <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
             {data.departmentHeadcount.map((d) => {
               const total = data.totalHeadcount || data.departmentHeadcount.reduce((sum, x) => sum + x.count, 0);
               const pct = total > 0 ? (d.count / total) * 100 : 0;
               return (
                 <div key={d.department} className="px-4 py-3">
                   <div className="flex items-center justify-between mb-1.5">
                     <div className="flex items-center gap-2">
                       <Building2 size={13} className="text-[var(--color-text-tertiary)]" />
                       <span className="text-[13px] text-[var(--color-text-primary)] font-medium">
                         {d.department}
                       </span>
                     </div>
                     <span className="text-[13px] tabular-nums font-semibold text-[var(--color-text-secondary)]">
                       {d.count}
                     </span>
                   </div>
                   <div className="h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                     <div
                       className="h-full bg-[var(--color-neutral-900)] rounded-full transition-all duration-500"
                       style={{ width: `${pct}%` }}
                     />
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 const TABS = [
   { label: 'Dashboard', value: 'dashboard' },
   { label: 'Operations', value: 'operations' },
   { label: 'Workforce', value: 'workforce' },
 ];
 
 export function PortalInsightsPage() {
   const [activeTab, setActiveTab] = useState('dashboard');
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Portal Insights</h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
           Platform usage, API health, and workforce analytics.
         </p>
       </div>
 
       {/* Tabs */}
       <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
 
       {/* Tab content */}
       <div>
         {activeTab === 'dashboard' && <DashboardTab />}
         {activeTab === 'operations' && <OperationsTab />}
         {activeTab === 'workforce' && <WorkforceTab />}
       </div>
     </div>
   );
 }
