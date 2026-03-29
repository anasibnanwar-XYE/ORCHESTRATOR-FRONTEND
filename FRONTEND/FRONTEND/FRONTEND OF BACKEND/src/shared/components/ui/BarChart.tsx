import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  height?: number;
  className?: string;
  showValues?: boolean;
  valueFormatter?: (val: number) => ReactNode;
}

export function BarChart({
  data,
  height = 200,
  className,
  showValues = true,
  valueFormatter = (val) => val,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={twMerge('w-full flex items-end gap-2 sm:gap-4', className)} style={{ height }}>
      {data.map((item, i) => {
        const percentage = (item.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[24px]">
            {showValues && (
              <span className="text-[10px] sm:text-[11px] font-medium text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {valueFormatter(item.value)}
              </span>
            )}
            <div
              className={clsx(
                "w-full rounded-t-sm transition-all duration-500 ease-out min-h-[4px]",
                !item.color && "bg-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-900)]"
              )}
              style={{
                height: `${Math.max(percentage, 2)}%`,
                backgroundColor: item.color,
              }}
            />
            <span className="text-[10px] sm:text-[11px] font-medium text-[var(--color-text-secondary)] truncate max-w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
