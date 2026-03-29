import { useState } from 'react';
import { History, ArrowRight, User, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CompactAuditLogChange {
  field: string;
  oldValue?: string;
  newValue?: string;
}

export interface CompactAuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Approved' | 'Rejected' | string;
  changes?: CompactAuditLogChange[];
}

export interface CompactAuditLogProps {
  entries: CompactAuditLogEntry[];
  className?: string;
}

const actionColors: Record<string, string> = {
  Created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Updated: 'bg-blue-50 text-blue-700 border-blue-200',
  Deleted: 'bg-red-50 text-red-700 border-red-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

export function CompactAuditLog({ entries, className }: CompactAuditLogProps) {
  const [filter, setFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterOptions = ['All', ...Array.from(new Set(entries.map(e => e.action)))];
  
  const filteredEntries = filter === 'All' 
    ? entries 
    : entries.filter(e => e.action === filter);

  return (
    <div className={twMerge('bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden flex flex-col h-[400px]', className)}>
      
      {/* Header & Filters */}
      <div className="p-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-primary)]">
          <History size={16} className="text-[var(--color-text-tertiary)]" />
          Audit History
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges-right">
          {filterOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={clsx(
                'px-3 py-1 min-w-[60px] inline-flex items-center justify-center rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border',
                filter === opt 
                  ? 'bg-[var(--color-neutral-900)] text-white border-[var(--color-neutral-900)]' 
                  : 'bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)]'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const hasChanges = entry.changes && entry.changes.length > 0;

          return (
            <div 
              key={entry.id} 
              className={clsx(
                "border rounded-lg transition-colors overflow-hidden",
                isExpanded ? "border-[var(--color-border-default)] shadow-sm" : "border-transparent hover:bg-[var(--color-surface-secondary)]/50"
              )}
            >
              {/* Row Header (Always visible) */}
              <div 
                onClick={() => hasChanges && setExpandedId(isExpanded ? null : entry.id)}
                className={clsx(
                  "px-3 py-2.5 flex items-center justify-between gap-3 text-[12px]",
                  hasChanges && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx(
                    'px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider shrink-0 w-20 flex items-center justify-center text-center',
                    actionColors[entry.action] || 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                  )}>
                    {entry.action}
                  </div>
                  
                  <div className="flex items-center gap-1.5 truncate text-[var(--color-text-primary)] font-medium">
                    <User size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
                    <span className="truncate">{entry.user}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                    {entry.timestamp}
                  </span>
                  {hasChanges && (
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {entry.changes!.length} changes
                    </span>
                  )}
                </div>
              </div>

              {/* Collapsible Changes Details */}
              {isExpanded && hasChanges && (
                <div className="px-3 pb-3 pt-1 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/30">
                   <div className="space-y-1.5 mt-2">
                    {entry.changes!.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[11px]">
                        <span className="font-medium text-[var(--color-text-secondary)] w-24 shrink-0 truncate" title={change.field}>
                          {change.field}
                        </span>
                        
                        <div className="flex-1 flex items-center gap-2 min-w-0 font-mono">
                          {change.oldValue !== undefined && (
                            <>
                              <span className="truncate text-red-600 bg-red-50/50 px-1.5 py-0.5 rounded border border-red-100 max-w-[120px]">
                                {change.oldValue || 'empty'}
                              </span>
                              <ArrowRight size={10} className="text-[var(--color-text-tertiary)] shrink-0" />
                            </>
                          )}
                          <span className="truncate text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100 max-w-[120px]">
                            {change.newValue || 'empty'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredEntries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)] text-[12px] py-10">
            <Filter size={20} className="mb-2 opacity-50" />
            No audit logs match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
