import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, size = 'md', className }: SwitchProps) {
  const trackSize = size === 'sm' ? 'w-8 h-[18px]' : 'w-10 h-[22px]';
  const thumbSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]';
  const thumbOffset = size === 'sm' ? 'translate-x-3.5' : 'translate-x-[18px]';

  return (
    <label className={clsx('flex items-start gap-3 select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative shrink-0 rounded-full transition-colors duration-200 ease-out',
          trackSize,
          checked ? 'bg-[var(--color-neutral-900)]' : 'bg-[var(--color-neutral-200)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-neutral-300)]',
        )}
      >
        <span
          className={clsx(
            'absolute top-[2px] left-[2px] bg-white rounded-full shadow-sm',
            'transition-transform duration-200 ease-out',
            thumbSize,
            checked && thumbOffset,
          )}
        />
      </button>
      {(label || description) && (
        <div className="pt-px">
          {label && <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</span>}
          {description && <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
