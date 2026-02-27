import { Mail, Phone, Eye } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from './StatusBadge';
import { CreditUtilizationBar } from './CreditUtilizationBar';
import type { DealerResponse } from '../../../lib/client/models/DealerResponse';

type DealerStatus = 'active' | 'suspended' | 'on-hold' | 'pending';

interface DealerCardProps {
  dealer: DealerResponse & { status?: string; onHold?: boolean };
  onView?: (dealer: DealerResponse) => void;
  onCopyEmail?: (email: string) => void;
  onCopyPhone?: (phone: string) => void;
}

function resolveStatus(dealer: DealerResponse & { status?: string; onHold?: boolean }): DealerStatus {
  if (dealer.status) {
    const s = dealer.status.toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'suspended') return 'suspended';
    if (s === 'on_hold' || s === 'on-hold') return 'on-hold';
    if (s === 'pending') return 'pending';
  }
  if (dealer.onHold) return 'on-hold';
  return 'active';
}

export function DealerCard({
  dealer,
  onView,
  onCopyEmail,
  onCopyPhone,
}: DealerCardProps) {
  const balance = dealer.outstandingBalance ?? 0;
  const limit = dealer.creditLimit ?? 0;
  const utilizationPercent = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  const isOverLimit = limit > 0 && balance > limit;
  const isNearLimit = limit > 0 && utilizationPercent > 80 && !isOverLimit;
  const dealerStatus = resolveStatus(dealer);

  return (
    <article
      className={clsx(
        'rounded-xl border border-border bg-surface p-4 shadow-sm',
        'transition-shadow hover:shadow-md'
      )}
    >
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-primary truncate">{dealer.name || '—'}</h3>
          <p className="text-sm text-secondary truncate">{dealer.email || 'No email'}</p>
        </div>
        <StatusBadge status={dealerStatus} size="sm" />
      </div>

      {/* Contact Info */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        {dealer.email && (
          <button
            onClick={() => onCopyEmail?.(dealer.email || '')}
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors"
            title="Copy email"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate max-w-[140px]">{dealer.email}</span>
          </button>
        )}
        {dealer.phone && (
          <button
            onClick={() => onCopyPhone?.(dealer.phone || '')}
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors"
            title="Copy phone"
          >
            <Phone className="h-3.5 w-3.5" />
            {dealer.phone}
          </button>
        )}
      </div>

      {/* Financial Summary */}
      <div className="space-y-3">
        {/* Balance Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">Current balance</span>
          <span
            className={clsx(
              'font-semibold',
              isOverLimit ? 'text-status-error-text' : 'text-primary'
            )}
          >
            {balance?.toLocaleString?.() ?? '—'}
          </span>
        </div>

        {/* Credit Limit Row */}
        {limit > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Credit limit</span>
              <span className="font-medium text-primary">{limit?.toLocaleString?.() ?? '—'}</span>
            </div>

            {/* Utilization Bar */}
            <CreditUtilizationBar percent={utilizationPercent} isOverLimit={isOverLimit} isNearLimit={isNearLimit} />
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">Account type</span>
            <span className="text-sm font-medium text-secondary bg-surface-highlight px-2 py-0.5 rounded">
              No credit limit
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => onView?.(dealer)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border bg-surface text-primary text-sm font-medium hover:bg-surface-highlight transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </button>
      </div>
    </article>
  );
}
