import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string; timeFrame?: string };
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral'; // explicit trend control beyond math
  layout?: 'default' | 'horizontal'; // adaptable layout
  className?: string;
  children?: ReactNode; // For passing custom content like Sparklines
}

export function StatCard({ 
  label, 
  value, 
  change, 
  icon, 
  trend,
  layout = 'default',
  className, 
  children 
}: StatCardProps) {
  // Determine trend: Explicitly passed > Mathematically derived
  const isPositive = trend === 'up' || (trend === undefined && change && change.value >= 0);
  const isNegative = trend === 'down' || (trend === undefined && change && change.value < 0);
  
  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : TrendingUp;

  // Horizontal Layout
  if (layout === 'horizontal') {
    return (
      <div className={twMerge(
        'group bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:border-[var(--color-border-hover)] hover:shadow-sm',
        className
      )}>
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-tertiary)] shrink-0 group-hover:bg-[var(--color-surface-tertiary)] transition-colors">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] mb-0.5 truncate">
              {label}
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums truncate">
                {value}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          {change && (
            <>
              <div className={clsx(
                'flex items-center gap-1 text-[13px] font-semibold tabular-nums',
                isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-[var(--color-text-secondary)]'
              )}>
                {Math.abs(change.value)}%
                <TrendIcon size={16} strokeWidth={2.5} />
              </div>
              {(change.label || change.timeFrame) && (
                <span className="text-[11px] text-[var(--color-text-tertiary)] whitespace-nowrap hidden sm:block">
                  {change.label || change.timeFrame}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Default Vertical Layout
  return (
    <div className={twMerge(
      'relative group bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5',
      className
    )}>
      <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
        <h3 className="text-[13px] sm:text-[14px] font-medium text-[var(--color-text-secondary)] leading-tight">
          {label}
        </h3>
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-tertiary)] shrink-0 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-1">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums leading-none">
            {value}
          </p>
          
          {change && (
            <div className={clsx(
              'flex items-center gap-0.5 text-[12px] sm:text-[13px] font-semibold tabular-nums pb-0.5',
              isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-[var(--color-text-secondary)]'
            )}>
              <TrendIcon size={16} strokeWidth={2.5} className="shrink-0" />
              {Math.abs(change.value)}%
            </div>
          )}
        </div>

        {change && (change.label || change.timeFrame) && (
          <p className="text-[11px] sm:text-[12px] text-[var(--color-text-tertiary)] mt-1 truncate">
            {change.label || change.timeFrame}
          </p>
        )}
      </div>

      {children && (
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 opacity-30 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
          <div className="w-full h-full [mask-image:linear-gradient(to_bottom,transparent,black)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
