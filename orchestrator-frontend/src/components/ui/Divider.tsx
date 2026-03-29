import { clsx } from 'clsx';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-[var(--color-border-default)]" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] shrink-0">
          {label}
        </span>
        <div className="flex-1 h-px bg-[var(--color-border-default)]" />
      </div>
    );
  }

  return <div className={clsx('h-px bg-[var(--color-border-default)]', className)} />;
}
