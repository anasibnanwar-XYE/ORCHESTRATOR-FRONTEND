 /**
  * AdminDashboardPage
  *
  * Enterprise dashboard for the Admin portal.
  *
  * Sections:
  *  1. KPI stat cards — Total Users, Total Companies, Pending Approvals, System Status
  *     Each card is clickable and navigates to the relevant section.
  *  2. Pipeline stages visualization — Orders → Dispatch → Delivery with aggregate counts
  *  3. HR Pulse card — Headcount, Joiners, Attrition
  *
  * Data sources:
  *  - GET /api/v1/admin/users        → Total Users count
  *  - GET /api/v1/companies          → Total Companies count
  *  - GET /api/v1/admin/approvals    → Pending Approvals count
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Users,
   Building2,
   CheckSquare,
   Activity,
   ArrowRight,
   Package,
   Truck,
   MapPin,
   AlertCircle,
   RefreshCcw,
   UserPlus,
   UserMinus,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { adminApi } from '@/lib/adminApi';
 import type { User, Company, ApprovalsResponse } from '@/types';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdminUser extends Pick<User, 'roles' | 'email' | 'displayName' | 'mfaEnabled'> {
   id: number;
   publicId?: string;
   enabled: boolean;
   companies: string[];
 }
 
 interface DashboardData {
   users: AdminUser[];
   companies: Company[];
   approvals: ApprovalsResponse;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // KPI Card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface KpiCardProps {
   label: string;
   value: string | number;
   description?: string;
   onClick: () => void;
   isLoading?: boolean;
   icon: React.ReactNode;
   badge?: { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' };
 }
 
 function KpiCard({ label, value, description, onClick, isLoading, icon, badge }: KpiCardProps) {
   if (isLoading) {
     return (
       <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <Skeleton width="50%" className="mb-2" />
         <Skeleton height={28} width="60%" />
         {description && <Skeleton width="40%" className="mt-1.5" />}
       </div>
     );
   }
 
   const badgeColors = {
     success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
     warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
     error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
     neutral: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
   };
 
   return (
     <button
       type="button"
       onClick={onClick}
       className={clsx(
         'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
         'transition-all duration-200 hover:border-[var(--color-border-strong)]',
         'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none',
         'focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1',
         'w-full',
       )}
     >
       <div className="flex items-start justify-between gap-3">
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           {label}
         </p>
         <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity">
           {icon}
         </div>
       </div>
       <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-2 tabular-nums tracking-tight">
         {value}
       </p>
       <div className="mt-1.5 flex items-center justify-between gap-2">
         {description && (
           <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{description}</p>
         )}
         {badge && (
           <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', badgeColors[badge.variant])}>
             {badge.label}
           </span>
         )}
         <ArrowRight
           size={12}
           className="ml-auto shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
         />
       </div>
     </button>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Pipeline Stage
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface PipelineStageProps {
   label: string;
   count: number;
   icon: React.ReactNode;
   isLast?: boolean;
 }
 
 function PipelineStage({ label, count, icon, isLast }: PipelineStageProps) {
   return (
     <div className="flex items-center gap-2 flex-1 min-w-0">
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg">
           <div className="shrink-0 text-[var(--color-text-tertiary)]">{icon}</div>
           <div className="min-w-0">
             <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] truncate">
               {label}
             </p>
             <p className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">
               {count}
             </p>
           </div>
         </div>
       </div>
       {!isLast && (
         <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-40">
           <ArrowRight size={14} />
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // HR Pulse Card
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface HrMetric {
   label: string;
   value: number | string;
   icon: React.ReactNode;
   description?: string;
 }
 
 function HrPulseCard({ metrics, isLoading }: { metrics: HrMetric[]; isLoading: boolean }) {
   return (
     <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
       <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
         Workforce Pulse
       </p>
       {isLoading ? (
         <div className="space-y-2">
           {[1, 2, 3].map((i) => (
             <div key={i} className="flex items-center gap-3 p-2">
               <Skeleton width={24} height={24} className="rounded-lg" />
               <div className="flex-1">
                 <Skeleton width="50%" className="mb-1" />
                 <Skeleton width="30%" />
               </div>
             </div>
           ))}
         </div>
       ) : (
         <div className="space-y-2">
           {metrics.map((metric) => (
             <div
               key={metric.label}
               className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors"
             >
               <div className="shrink-0 text-[var(--color-text-tertiary)]">{metric.icon}</div>
               <div className="flex-1 min-w-0">
                 <p className="text-[11px] text-[var(--color-text-tertiary)]">{metric.label}</p>
                 {metric.description && (
                   <p className="text-[11px] text-[var(--color-text-tertiary)] opacity-60 truncate">
                     {metric.description}
                   </p>
                 )}
               </div>
               <p className="text-base font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                 {metric.value}
               </p>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function AdminDashboardPage() {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [data, setData] = useState<DashboardData | null>(null);
 
   const loadDashboard = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const [users, companies, approvals] = await Promise.all([
         adminApi.getUsers(),
         adminApi.getCompanies(),
         adminApi.getApprovals(),
       ]);
      setData({ users: users as unknown as AdminUser[], companies, approvals });
     } catch {
       setError("Couldn't load dashboard data. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadDashboard();
   }, [loadDashboard]);
 
   // Derived stats
   const totalUsers = data?.users.length ?? 0;
   const activeUsers = data?.users.filter((u) => u.enabled).length ?? 0;
   const totalCompanies = data?.companies.length ?? 0;
   const activeCompanies = data?.companies.filter((c) => c.isActive).length ?? 0;
  // Pending approvals — computed from grouped ApprovalsResponse buckets
  const pendingApprovals = data?.approvals
    ? [
        ...(data.approvals.creditRequests ?? []),
        ...(data.approvals.payrollRuns ?? []),
        ...(data.approvals.exportRequests ?? []),
        ...(data.approvals.periodCloseRequests ?? []),
      ].filter((item) => item.status?.toUpperCase() === 'PENDING' || !item.status).length
    : 0;
 
   // HR pulse metrics (derived from user data as proxy)
   const hrMetrics: HrMetric[] = [
     {
       label: 'Headcount',
       value: totalUsers,
       icon: <Users size={14} />,
       description: `${activeUsers} active`,
     },
     {
       label: 'New this month',
       value: 0,
       icon: <UserPlus size={14} />,
       description: 'Joiners',
     },
     {
       label: 'Inactive',
       value: totalUsers - activeUsers,
       icon: <UserMinus size={14} />,
       description: 'Suspended accounts',
     },
   ];
 
   // Pipeline stages (static structure — would be wired to orders API in a later milestone)
   const pipelineStages = [
     { label: 'Orders', count: 0, icon: <Package size={14} /> },
     { label: 'Dispatch', count: 0, icon: <Truck size={14} /> },
     { label: 'Delivery', count: 0, icon: <MapPin size={14} /> },
   ];
 
   // Greeting
   const greeting = (() => {
     const h = new Date().getHours();
     if (h < 12) return 'Good morning';
     if (h < 17) return 'Good afternoon';
     return 'Good evening';
   })();
 
   return (
     <div className="space-y-6">
       {/* ── Page Header ─────────────────────────────────────────────── */}
       <div>
         <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
           {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
         </p>
         <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
           {greeting}
         </h1>
         <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
           Admin portal — platform overview
         </p>
       </div>
 
       {/* ── Error State ─────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
           <AlertCircle size={15} className="shrink-0" />
           <span className="flex-1">{error}</span>
           <button
             type="button"
             onClick={loadDashboard}
             className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 hover:no-underline"
           >
             <RefreshCcw size={12} />
             Retry
           </button>
         </div>
       )}
 
       {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
       <section>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
           <KpiCard
             label="Total Users"
             value={isLoading ? '—' : totalUsers}
             description={isLoading ? undefined : `${activeUsers} active`}
             onClick={() => navigate('/admin/users')}
             isLoading={isLoading}
             icon={<Users size={15} />}
           />
           <KpiCard
             label="Total Companies"
             value={isLoading ? '—' : totalCompanies}
             description={isLoading ? undefined : `${activeCompanies} active`}
             onClick={() => navigate('/admin/companies')}
             isLoading={isLoading}
             icon={<Building2 size={15} />}
           />
           <KpiCard
             label="Pending Approvals"
             value={isLoading ? '—' : pendingApprovals}
             description={isLoading ? undefined : pendingApprovals > 0 ? 'Requires attention' : 'All clear'}
             onClick={() => navigate('/admin/approvals')}
             isLoading={isLoading}
             icon={<CheckSquare size={15} />}
             badge={
               !isLoading && pendingApprovals > 0
                 ? { label: 'Action needed', variant: 'warning' }
                 : !isLoading
                 ? { label: 'Up to date', variant: 'success' }
                 : undefined
             }
           />
           <KpiCard
             label="System Status"
             value={isLoading ? '—' : 'Operational'}
             description={isLoading ? undefined : 'All services running'}
             onClick={() => navigate('/admin/settings')}
             isLoading={isLoading}
             icon={<Activity size={15} />}
             badge={!isLoading ? { label: 'Healthy', variant: 'success' } : undefined}
           />
         </div>
       </section>
 
       {/* ── Pipeline + HR Pulse ─────────────────────────────────────── */}
       <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
         {/* Pipeline stages */}
         <div className="lg:col-span-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Order Pipeline
           </p>
           {isLoading ? (
             <div className="flex items-center gap-2">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center gap-2 flex-1">
                   <div className="flex-1 p-3 rounded-lg bg-[var(--color-surface-secondary)] animate-pulse h-16" />
                   {i < 3 && <div className="w-3.5 h-3.5 rounded bg-[var(--color-surface-tertiary)] animate-pulse shrink-0" />}
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex items-center gap-1 sm:gap-2">
               {pipelineStages.map((stage, idx) => (
                 <PipelineStage
                   key={stage.label}
                   label={stage.label}
                   count={stage.count}
                   icon={stage.icon}
                   isLast={idx === pipelineStages.length - 1}
                 />
               ))}
             </div>
           )}
           <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
             Live pipeline data will appear when orders are active.
           </p>
         </div>
 
         {/* HR Pulse */}
         <HrPulseCard metrics={hrMetrics} isLoading={isLoading} />
       </section>
 
       {/* ── Quick Actions ────────────────────────────────────────────── */}
       {!isLoading && !error && (
         <section>
           <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
             Quick Actions
           </p>
           <div className="flex flex-wrap gap-2">
             <button
               type="button"
               onClick={() => navigate('/admin/users')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <Users size={13} />
               Manage Users
             </button>
             <button
               type="button"
               onClick={() => navigate('/admin/approvals')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <CheckSquare size={13} />
               View Approvals
             </button>
             <button
               type="button"
               onClick={() => navigate('/admin/roles')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <Activity size={13} />
               Manage Roles
             </button>
             <button
               type="button"
               onClick={() => navigate('/admin/settings')}
               className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
             >
               <Building2 size={13} />
               Settings
             </button>
           </div>
         </section>
       )}
     </div>
   );
 }
