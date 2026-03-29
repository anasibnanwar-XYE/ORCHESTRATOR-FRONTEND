import { ReactNode } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  tags?: { label: string; color?: string }[];
  assignee?: ReactNode;
}

export interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: KanbanTask[];
  onTaskClick?: (task: KanbanTask) => void;
}

export interface KanbanBoardProps {
  columns: KanbanColumnProps[];
  className?: string;
}

export function KanbanBoard({ columns, className }: KanbanBoardProps) {
  return (
    <div className={twMerge('flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory', className)}>
      {columns.map((column) => (
        <div 
          key={column.id} 
          className="shrink-0 w-[280px] sm:w-[320px] snap-center flex flex-col max-h-[80vh] bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-xl"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{column.title}</h3>
              <span className="bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {column.tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-primary)] hover:text-[var(--color-text-primary)] transition-colors">
                <Plus size={14} />
              </button>
              <button className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-primary)] hover:text-[var(--color-text-primary)] transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Tasks Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
            {column.tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => column.onTaskClick?.(task)}
                className="bg-[var(--color-surface-primary)] p-3 rounded-lg border border-[var(--color-border-default)] shadow-sm hover:border-[var(--color-border-hover)] cursor-grab active:cursor-grabbing transition-colors"
              >
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
                        style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : undefined}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
                
                <h4 className="text-[13px] font-medium text-[var(--color-text-primary)] leading-snug">
                  {task.title}
                </h4>
                
                {task.description && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {task.assignee && (
                  <div className="mt-3 flex justify-end">
                    {task.assignee}
                  </div>
                )}
              </div>
            ))}
            
            {column.tasks.length === 0 && (
              <div className="h-20 flex items-center justify-center text-[12px] border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg text-[var(--color-text-tertiary)]">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
