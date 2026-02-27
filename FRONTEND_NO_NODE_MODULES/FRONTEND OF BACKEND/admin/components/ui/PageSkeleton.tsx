import clsx from 'clsx';

export interface PageSkeletonProps {
  /** Number of shimmer rows to render */
  rows?: number;
  /** Show a header skeleton bar */
  header?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Shimmer loading placeholder for page content.
 * Uses CSS animation — no JS timers needed.
 *
 * Usage:
 * ```tsx
 * {loading ? <PageSkeleton rows={5} header /> : <ActualContent />}
 * ```
 */
export function PageSkeleton({ rows = 4, header = true, className }: PageSkeletonProps) {
  return (
    <div className={clsx('animate-pulse space-y-4', className)} role="status" aria-label="Loading">
      {header && (
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-[var(--bg-surface-highlight)]" />
          <div className="h-4 w-72 rounded bg-[var(--bg-surface-highlight)]" />
        </div>
      )}

      {/* Action bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 rounded-lg bg-[var(--bg-surface-highlight)]" />
        <div className="h-9 w-24 rounded-lg bg-[var(--bg-surface-highlight)]" />
      </div>

      {/* Table/card rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-[var(--border-primary)] p-4"
            style={{ opacity: 1 - i * (0.6 / rows) }}
          >
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--bg-surface-highlight)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--bg-surface-highlight)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-highlight)]" />
            </div>
            <div className="h-6 w-16 rounded-full bg-[var(--bg-surface-highlight)]" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
