import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ className, variant = 'text', width, height, lines = 1 }: SkeletonProps) {
  const base = 'bg-[var(--color-surface-tertiary)] animate-pulse rounded';

  if (variant === 'circular') {
    return (
      <div
        className={clsx(base, 'rounded-full', className)}
        style={{ width: width || 40, height: height || width || 40 }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={clsx(base, 'rounded-lg', className)}
        style={{ width: width || '100%', height: height || 80 }}
      />
    );
  }

  if (lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(base, 'h-3.5')}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(base, 'h-3.5', className)}
      style={{ width: width || '100%', height }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card p-5 space-y-3', className)}>
      <Skeleton width="40%" />
      <Skeleton height={28} width="60%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="h-10 bg-[var(--color-surface-tertiary)] animate-pulse" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-12 border-b border-[var(--color-border-subtle)] px-4 flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${20 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
