import React from 'react';
import { FileQuestion } from 'lucide-react';
import clsx from 'clsx';

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state placeholder for lists/tables with no data.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No users found"
 *   description="Try adjusting your search or filters."
 *   action={{ label: "Add User", onClick: () => setShowCreate(true) }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-surface-highlight)]">
        <Icon className="h-7 w-7 text-[var(--text-tertiary)]" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-lg bg-[var(--action-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--action-primary-text)] shadow-sm transition-all hover:bg-[var(--action-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
