import clsx from 'clsx';

/**
 * Canonical status-to-variant mapping.
 * Normalises the many backend status strings into a small set of visual variants.
 */
const STATUS_MAP: Record<string, StatusVariant> = {
  // Success family
  active: 'success',
  approved: 'success',
  completed: 'success',
  confirmed: 'success',
  delivered: 'success',
  dispatched: 'success',
  fulfilled: 'success',
  paid: 'success',
  posted: 'success',
  resolved: 'success',
  verified: 'success',
  enabled: 'success',

  // Warning family
  pending: 'warning',
  pending_approval: 'warning',
  in_progress: 'warning',
  in_review: 'warning',
  processing: 'warning',
  partial: 'warning',
  partially_paid: 'warning',
  draft: 'warning',
  open: 'warning',
  awaiting: 'warning',

  // Error / danger family
  rejected: 'error',
  failed: 'error',
  cancelled: 'error',
  canceled: 'error',
  overdue: 'error',
  expired: 'error',
  suspended: 'error',
  blocked: 'error',
  disabled: 'error',
  deleted: 'error',
  written_off: 'error',
  reversed: 'error',

  // Info / neutral family
  inactive: 'neutral',
  closed: 'neutral',
  archived: 'neutral',
  locked: 'neutral',
  unknown: 'neutral',
  new: 'info',
  created: 'info',
  scheduled: 'info',
};

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  /** Raw status string from the backend (e.g. "PENDING_APPROVAL") */
  status: string;
  /** Override the automatic variant detection */
  variant?: StatusVariant;
  /** Override the displayed label (defaults to humanised status) */
  label?: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  error: 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
  neutral: 'bg-[var(--bg-surface-highlight)] text-[var(--text-secondary)]',
};

/**
 * Resolve a raw backend status string to a visual variant.
 * Handles UPPER_CASE, lowercase, Title Case, kebab-case, etc.
 */
export function resolveVariant(status: string): StatusVariant {
  const normalised = status.toLowerCase().replace(/[-\s]+/g, '_').trim();
  return STATUS_MAP[normalised] ?? 'neutral';
}

/** Turn "PENDING_APPROVAL" into "Pending Approval" */
function humanise(status: string): string {
  return status
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Unified status badge used across all portals.
 * Automatically maps backend status strings to consistent visual styles
 * using the design-system CSS variables.
 *
 * Usage:
 * ```tsx
 * <StatusBadge status="PENDING_APPROVAL" />
 * <StatusBadge status="active" variant="success" label="Live" />
 * ```
 */
export function StatusBadge({ status, variant, label, className }: StatusBadgeProps) {
  const resolved = variant ?? resolveVariant(status);
  const displayLabel = label ?? humanise(status);

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantStyles[resolved],
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
