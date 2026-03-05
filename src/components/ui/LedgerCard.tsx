import { clsx } from 'clsx';

interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
}

interface LedgerCardProps {
  name: string;
  code?: string;
  balance: number;
  balanceType: 'Dr' | 'Cr';
  recentTransactions?: LedgerTransaction[];
  onClick?: () => void;
  className?: string;
}

function formatINR(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LedgerCard({
  name,
  code,
  balance,
  balanceType,
  recentTransactions = [],
  onClick,
  className,
}: LedgerCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
        onClick && 'cursor-pointer hover:border-[var(--color-neutral-300)] transition-colors',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{name}</p>
          {code && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mt-0.5">{code}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-semibold tabular-nums text-[var(--color-text-primary)]">
            ₹{formatINR(balance)}
          </p>
          <span className={clsx(
            'text-[10px] font-semibold uppercase tracking-wider',
            balanceType === 'Dr' ? 'text-[var(--color-debit)]' : 'text-[var(--color-credit)]',
          )}>
            {balanceType}
          </span>
        </div>
      </div>

      {recentTransactions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
          {recentTransactions.slice(0, 3).map((txn) => {
            const amount = txn.debit || txn.credit || 0;
            const isDebit = !!txn.debit;
            return (
              <div key={txn.id} className="flex items-center justify-between gap-3">
                <p className="text-[12px] text-[var(--color-text-secondary)] truncate min-w-0">{txn.description}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={clsx(
                    'text-[12px] tabular-nums font-medium',
                    isDebit ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-credit)]',
                  )}>
                    {isDebit ? '' : '+'} ₹{formatINR(amount)}
                  </span>
                  <span className="text-[9px] text-[var(--color-text-tertiary)] tabular-nums">{txn.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
