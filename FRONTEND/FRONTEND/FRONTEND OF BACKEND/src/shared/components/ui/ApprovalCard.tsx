import { ReactNode } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ApprovalCardProps {
  id: string;
  type: string;
  requester: {
    name: string;
    avatar?: ReactNode;
  };
  requestDate: string;
  details: { label: string; value: ReactNode }[];
  status?: 'pending' | 'approved' | 'rejected';
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending Approval' },
  approved: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Approved' },
  rejected: { icon: X, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
};

export function ApprovalCard({
  id,
  type,
  requester,
  requestDate,
  details,
  status = 'pending',
  onApprove,
  onReject,
  className,
}: ApprovalCardProps) {
  const StatusIcon = statusConfig[status].icon;

  return (
    <div className={twMerge('bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {requester.avatar ? (
            <div className="shrink-0">{requester.avatar}</div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] flex items-center justify-center shrink-0">
              <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                {requester.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {requester.name}
            </h4>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              Requested {type} on {requestDate}
            </p>
          </div>
        </div>
        
        <div className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium shrink-0',
          statusConfig[status].bg,
          statusConfig[status].color
        )}>
          <StatusIcon size={12} />
          {statusConfig[status].label}
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 bg-[var(--color-surface-secondary)]/30">
        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
          {details.map((detail, idx) => (
            <div key={idx}>
              <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                {detail.label}
              </div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                {detail.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Footer */}
      {status === 'pending' && (onApprove || onReject) && (
        <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] flex justify-end gap-2">
          {onReject && (
            <button
              onClick={() => onReject(id)}
              className="px-4 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <X size={14} />
              Reject
            </button>
          )}
          {onApprove && (
            <button
              onClick={() => onApprove(id)}
              className="px-4 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Check size={14} />
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  );
}
