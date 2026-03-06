 /**
  * FactoryDashboardPage
  *
  * Factory portal dashboard showing:
  *  - Stat cards: production efficiency %, completed plans, active batches
  *  - Alerts / notifications list
  *  - Quick navigation to key sections
  */
 
 import { useCallback, useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import {
   Factory,
   Activity,
   CheckCircle2,
   Layers,
   AlertTriangle,
   ArrowRight,
   RefreshCcw,
   ClipboardList,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { factoryApi } from '@/lib/factoryApi';
 import type { FactoryDashboardDto } from '@/types';
 
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
 }
 
 function KpiCard({ label, value, description, onClick, isLoading, icon }: KpiCardProps) {
   if (isLoading) {
     return (
       <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
         <Skeleton width="50%" className="mb-2" />
         <Skeleton height={28} width="60%" />
         {description && <Skeleton width="40%" className="mt-1.5" />}
       </div>
     );
   }
 
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
       {description && (
         <div className="mt-1.5 flex items-center justify-between gap-2">
           <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{description}</p>
           <ArrowRight
             size={12}
             className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
           />
         </div>
       )}
     </button>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function FactoryDashboardPage() {
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [data, setData] = useState<FactoryDashboardDto | null>(null);
 
   const loadDashboard = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const dashboard = await factoryApi.getDashboard();
       setData(dashboard);
     } catch {
       setError("Couldn't load factory dashboard. Please try again.");
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     loadDashboard();
   }, [loadDashboard]);
 
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
           Factory Portal
         </p>
         <div className="mt-1 flex items-center justify-between gap-4">
           <h1 className="text-[22px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             {greeting}
           </h1>
           <button
             type="button"
             onClick={loadDashboard}
             disabled={isLoading}
             className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
             aria-label="Refresh dashboard"
           >
             <RefreshCcw size={14} className={clsx(isLoading && 'animate-spin')} />
             <span className="hidden sm:inline">Refresh</span>
           </button>
         </div>
       </div>
 
       {/* ── Error ───────────────────────────────────────────────────── */}
       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button
             type="button"
             onClick={loadDashboard}
             className="shrink-0 font-medium underline-offset-2 hover:underline"
           >
             Retry
           </button>
         </div>
       )}
 
       {/* ── KPI Cards ───────────────────────────────────────────────── */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <KpiCard
           label="Production Efficiency"
           value={isLoading ? '–' : `${(data?.productionEfficiency ?? 0).toFixed(1)}%`}
           description="Overall batch output efficiency"
           onClick={() => navigate('/factory/production/logs')}
           isLoading={isLoading}
           icon={<Activity size={16} />}
         />
         <KpiCard
           label="Completed Plans"
           value={isLoading ? '–' : (data?.completedPlans ?? 0)}
           description="View production plans"
           onClick={() => navigate('/factory/production/plans')}
           isLoading={isLoading}
           icon={<CheckCircle2 size={16} />}
         />
         <KpiCard
           label="Batches Logged"
           value={isLoading ? '–' : (data?.batchesLogged ?? 0)}
           description="View production batches"
           onClick={() => navigate('/factory/production/batches')}
           isLoading={isLoading}
           icon={<Layers size={16} />}
         />
       </div>
 
       {/* ── Main Content Grid ─────────────────────────────────────── */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
         {/* Alerts */}
         <div className="lg:col-span-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
           <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
             <div className="flex items-center gap-2">
               <AlertTriangle size={15} className="text-[var(--color-warning)]" />
               <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                 Alerts &amp; Notifications
               </h2>
             </div>
             {data?.alerts?.length != null && (
               <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                 {data.alerts.length}
               </span>
             )}
           </div>
 
           <div className="p-5">
             {isLoading ? (
               <div className="space-y-2.5">
                 {[...Array(3)].map((_, i) => (
                   <Skeleton key={i} height={32} />
                 ))}
               </div>
             ) : !data?.alerts?.length ? (
               <div className="py-8 text-center">
                 <CheckCircle2
                   size={32}
                   className="mx-auto mb-2.5 text-[var(--color-text-tertiary)] opacity-40"
                 />
                 <p className="text-[13px] text-[var(--color-text-tertiary)]">
                   No alerts at the moment.
                 </p>
               </div>
             ) : (
               <ul className="space-y-2">
                 {data.alerts.map((alert, idx) => (
                   <li
                     key={idx}
                     className="flex items-start gap-3 px-3 py-2.5 bg-[var(--color-surface-secondary)] rounded-lg text-[13px] text-[var(--color-text-primary)]"
                   >
                     <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-warning)]" />
                     {alert}
                   </li>
                 ))}
               </ul>
             )}
           </div>
         </div>
 
         {/* Quick Actions */}
         <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
           <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
             <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
               Quick Actions
             </h2>
           </div>
           <nav className="p-3 space-y-1">
             {[
               {
                 label: 'Production Plans',
                 description: 'Create or manage plans',
                 to: '/factory/production/plans',
                 icon: <Factory size={15} />,
               },
               {
                 label: 'Production Logs',
                 description: 'Log batch output',
                 to: '/factory/production/logs',
                 icon: <ClipboardList size={15} />,
               },
               {
                 label: 'Production Batches',
                 description: 'View batch list',
                 to: '/factory/production/batches',
                 icon: <Layers size={15} />,
               },
             ].map((action) => (
               <button
                 key={action.to}
                 type="button"
                 onClick={() => navigate(action.to)}
                 className={clsx(
                   'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                   'hover:bg-[var(--color-surface-tertiary)] transition-colors duration-150',
                 )}
               >
                 <span className="shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                   {action.icon}
                 </span>
                 <div className="min-w-0 flex-1">
                   <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                     {action.label}
                   </p>
                   <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                     {action.description}
                   </p>
                 </div>
                 <ArrowRight
                   size={13}
                   className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                 />
               </button>
             ))}
           </nav>
         </div>
       </div>
     </div>
   );
 }
