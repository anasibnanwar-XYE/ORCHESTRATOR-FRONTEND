import { ReactNode } from 'react';
import { History, ArrowRight, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AuditLogChange {
  field: string;
  oldValue?: ReactNode;
  newValue?: ReactNode;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Approved' | 'Rejected' | string;
  resourceType: string;
  resourceId?: string;
  changes?: AuditLogChange[];
  ipAddress?: string;
}

export interface AuditLogProps {
  entries: AuditLogEntry[];
  className?: string;
}

const actionColors: Record<string, string> = {
  Created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Updated: 'bg-blue-50 text-blue-700 border-blue-200',
  Deleted: 'bg-red-50 text-red-700 border-red-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

export function AuditLog({ entries, className }: AuditLogProps) {
  return (
    <div className={twMerge('space-y-4', className)}>
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden shadow-sm"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] flex items-center justify-center shrink-0">
                <User size={14} className="text-[var(--color-text-tertiary)]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    {entry.user}
                  </span>
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">
                    performed
                  </span>
                  <span className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                    actionColors[entry.action] || 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                  )}>
                    {entry.action}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 flex items-center gap-2">
                  <History size={10} />
                  {entry.timestamp}
                  {entry.ipAddress && (
                     <>
                      <span className="w-1 h-1 rounded-full bg-[var(--color-border-default)]" />
                      IP: {entry.ipAddress}
                     </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] px-2 py-1 rounded-md shrink-0">
              {entry.resourceType} {entry.resourceId && <span className="text-[var(--color-text-tertiary)] ml-1">#{entry.resourceId}</span>}
            </div>
          </div>

          {/* Changes (Diff) */}
          {entry.changes && entry.changes.length > 0 && (
            <div className="px-4 py-3 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                Field Changes
              </div>
              <div className="grid grid-cols-1 gap-2">
                {entry.changes.map((change, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center text-[12px] gap-2 p-2 rounded-lg bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border-subtle)]">
                    <div className="sm:w-1/4 font-medium text-[var(--color-text-secondary)]">
                      {change.field}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                      {change.oldValue !== undefined ? (
                        <>
                          <div className="flex-1 truncate text-red-600 bg-red-50/50 px-2 py-1 rounded border border-red-100">
                            {change.oldValue === null ? <em>null</em> : change.oldValue === '' ? <em>empty</em> : change.oldValue}
                          </div>
                          <ArrowRight size={14} className="text-[var(--color-text-tertiary)] shrink-0 hidden sm:block" />
                          <div className="flex-1 truncate text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded border border-emerald-100">
                            {change.newValue === null ? <em>null</em> : change.newValue === '' ? <em>empty</em> : change.newValue}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 truncate text-[var(--color-text-primary)] px-2 py-1 rounded bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)]">
                          {change.newValue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
