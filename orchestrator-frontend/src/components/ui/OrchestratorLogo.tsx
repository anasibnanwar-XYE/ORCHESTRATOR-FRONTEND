import { clsx } from 'clsx';

interface OrchestratorLogoProps {
  size?: number;
  variant?: 'mark' | 'full' | 'wordmark';
  animated?: boolean;
  className?: string;
}

/**
 * Orchestrator brand mark.
 *
 * The symbol: three stacked horizontal bars with staggered widths,
 * forming an abstract "ledger" / "stack" motif. Represents layers of
 * orchestration -- transactions stacking, workflows layering, data flowing.
 * Clean geometry, no gradients, no fills -- just precise strokes.
 */
export function OrchestratorLogo({
  size = 32,
  variant = 'mark',
  animated = false,
  className,
}: OrchestratorLogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(animated && 'orchestrator-logo-animated', className)}
    >
      <rect
        x="4" y="6" width="24" height="2.5" rx="1.25"
        fill="currentColor"
        className={animated ? 'orchestrator-bar-1' : undefined}
      />
      <rect
        x="4" y="14.75" width="18" height="2.5" rx="1.25"
        fill="currentColor"
        opacity="0.55"
        className={animated ? 'orchestrator-bar-2' : undefined}
      />
      <rect
        x="4" y="23.5" width="12" height="2.5" rx="1.25"
        fill="currentColor"
        opacity="0.25"
        className={animated ? 'orchestrator-bar-3' : undefined}
      />
    </svg>
  );

  if (variant === 'mark') return mark;

  if (variant === 'wordmark') {
    return (
      <span
        className={clsx(
          'inline-flex items-center select-none',
          className,
        )}
        style={{ fontSize: size * 0.48, lineHeight: 1 }}
      >
        <span className="font-semibold tracking-tight text-[var(--color-text-primary)]">
          Orchestrator
        </span>
      </span>
    );
  }

  return (
    <span className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      {mark}
      <span
        className="font-semibold tracking-tight text-[var(--color-text-primary)]"
        style={{ fontSize: size * 0.48, lineHeight: 1 }}
      >
        Orchestrator
      </span>
    </span>
  );
}
