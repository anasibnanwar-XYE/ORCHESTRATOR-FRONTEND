import { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  value?: string | number;
}

export interface TreeViewProps {
  data: TreeNode[];
  defaultExpanded?: boolean;
  className?: string;
  onSelect?: (node: TreeNode) => void;
}

function getAllIds(nodes: TreeNode[]): string[] {
  let ids: string[] = [];
  for (const node of nodes) {
    if (node.children) {
      ids.push(node.id);
      ids = ids.concat(getAllIds(node.children));
    }
  }
  return ids;
}

export function TreeView({ data, defaultExpanded = false, className, onSelect }: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(defaultExpanded ? getAllIds(data) : []),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSelect = (node: TreeNode) => {
    setSelectedId(node.id);
    onSelect?.(node);
  };

  const renderTree = (nodes: TreeNode[], level = 0): React.ReactNode => {
    return (
      <ul className={clsx(level > 0 && 'pl-4 ml-2 border-l border-[var(--color-border-subtle)]')}>
        {nodes.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedIds.has(node.id);
          const isSelected = selectedId === node.id;

          return (
            <li key={node.id} className="mt-1">
              <div
                onClick={() => handleSelect(node)}
                className={clsx(
                  'flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors',
                  isSelected
                    ? 'bg-[var(--color-surface-secondary)] font-medium text-[var(--color-text-primary)]'
                    : 'hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleExpand(node.id, e)}
                      className="p-0.5 -ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <div className="w-[18px] shrink-0" />
                  )}

                  {hasChildren ? (
                    <Folder
                      size={14}
                      className={clsx(
                        'shrink-0',
                        isExpanded
                          ? 'text-[var(--color-primary-500)]'
                          : 'text-[var(--color-text-tertiary)]',
                      )}
                    />
                  ) : (
                    <File size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
                  )}

                  <span className="truncate">{node.label}</span>
                </div>

                {node.value !== undefined && (
                  <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)] font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded">
                    {node.value}
                  </span>
                )}
              </div>

              {hasChildren && isExpanded && renderTree(node.children!, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div
      className={twMerge(
        'bg-[var(--color-surface-primary)] p-2 rounded-xl border border-[var(--color-border-default)] overflow-x-auto',
        className,
      )}
    >
      {renderTree(data)}
    </div>
  );
}
