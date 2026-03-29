export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-1/3 rounded bg-[var(--color-surface-tertiary)]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6 space-y-3">
            <div className="h-4 w-1/2 rounded bg-[var(--color-surface-tertiary)]" />
            <div className="h-8 w-3/4 rounded bg-[var(--color-surface-tertiary)]" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="h-12 bg-[var(--color-surface-tertiary)]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-[var(--color-border-subtle)] px-4 flex items-center gap-4">
            <div className="h-4 w-1/4 rounded bg-[var(--color-surface-tertiary)]" />
            <div className="h-4 w-1/4 rounded bg-[var(--color-surface-tertiary)]" />
            <div className="h-4 w-1/4 rounded bg-[var(--color-surface-tertiary)]" />
            <div className="h-4 w-1/4 rounded bg-[var(--color-surface-tertiary)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
