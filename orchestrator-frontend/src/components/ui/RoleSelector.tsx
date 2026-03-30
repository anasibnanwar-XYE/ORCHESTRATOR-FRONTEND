/**
 * RoleSelector — purpose-built multi-select for platform roles.
 *
 * Uses <div role="checkbox"> instead of <button> so the Modal's focus trap
 * selector ('button, input, ...') never matches these tiles — completely
 * eliminating the auto-selection bug on modal open.
 */

import { clsx } from 'clsx';

export interface RoleSelectorOption {
  value: string;
  label: string;
}

export interface RoleSelectorProps {
  options: RoleSelectorOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const ROLE_META: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Full platform control. Assign with extreme care.',
  ROLE_ADMIN:       'Tenant admin — users, approvals, settings.',
  ROLE_ACCOUNTING:  'Accounting, ledger, and period management.',
  ROLE_FACTORY:     'Production logs, packing, and inventory.',
  ROLE_SALES:       'Orders, dealers, and credit management.',
  ROLE_DEALER:      'Dealer portal access and ordering.',
};

export function RoleSelector({
  options,
  value,
  onChange,
  label,
  error,
  disabled,
}: RoleSelectorProps) {
  const toggle = (roleValue: string) => {
    if (disabled) return;
    if (value.includes(roleValue)) {
      onChange(value.filter((v) => v !== roleValue));
    } else {
      onChange([...value, roleValue]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <span className="block text-[13px] font-medium text-[var(--color-text-primary)]">
          {label}
        </span>
      )}

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        {options.map((opt) => {
          const isSelected = value.includes(opt.value);
          const isSuperAdmin = opt.value === 'ROLE_SUPER_ADMIN';
          const desc = ROLE_META[opt.value] ?? null;

          return (
            <div
              key={opt.value}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={disabled}
              /* No tabIndex — intentionally excluded from keyboard focus order
                 to avoid Modal focus-trap interference. */
              onClick={(e) => {
                e.stopPropagation();
                toggle(opt.value);
              }}
              className={clsx(
                'relative flex flex-col justify-center',
                'px-3 py-2.5 rounded-xl border min-h-[62px]',
                'transition-all duration-150',
                'select-none',
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                isSuperAdmin
                  ? isSelected
                    ? 'bg-[#fef3c7] border-[#d97706] dark:bg-[#451a03] dark:border-[#d97706]'
                    : 'bg-[var(--color-surface-primary)] border-[var(--color-border-default)] border-dashed'
                  : isSelected
                    ? 'bg-[#171717] border-[#171717] dark:bg-[#f5f5f5] dark:border-[#f5f5f5]'
                    : 'bg-[var(--color-surface-primary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
              )}
            >
              {/* Selection dot */}
              <span
                className={clsx(
                  'absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full transition-colors duration-150',
                  isSelected
                    ? isSuperAdmin
                      ? 'bg-[#d97706]'
                      : 'bg-white dark:bg-[#171717]'
                    : 'bg-transparent border border-[var(--color-border-strong)]',
                )}
              />

              {/* Role name */}
              <span
                className={clsx(
                  'text-[12px] font-semibold leading-tight pr-4',
                  isSuperAdmin
                    ? isSelected
                      ? 'text-[#92400e] dark:text-[#fcd34d]'
                      : 'text-[var(--color-warning)]'
                    : isSelected
                      ? 'text-white dark:text-[#171717]'
                      : 'text-[var(--color-text-primary)]',
                )}
              >
                {opt.label}
              </span>

              {/* Description */}
              {desc && (
                <span
                  className={clsx(
                    'text-[10.5px] leading-snug mt-0.5',
                    isSelected
                      ? isSuperAdmin
                        ? 'text-[#a16207]'
                        : 'text-white/55 dark:text-[#171717]/60'
                      : 'text-[var(--color-text-tertiary)]',
                  )}
                >
                  {desc}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-[11px] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
