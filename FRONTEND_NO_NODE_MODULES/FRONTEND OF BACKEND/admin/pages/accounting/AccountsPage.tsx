import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listAccounts, listAccountTree, type AccountSummary } from '../../lib/accountingApi';
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { FormInput, FormSelect } from '../../design-system/ResponsiveForm';
import { ResponsiveButton } from '../../design-system/ResponsiveButton';

const AccountTreeNode = ({ node, level = 0 }: { node: AccountSummary; level?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <div
        className={clsx(
          "grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 border-b border-zinc-100 px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm last:border-b-0 hover:bg-zinc-50 dark:border-white/5 dark:hover:bg-white/5 transition-colors touch-manipulation",
          level > 0 && "pl-2 sm:pl-3"
        )}
        style={{ paddingLeft: level > 0 ? `${Math.min(level * 1.5, 3) + 0.5}rem` : undefined }}
      >
        <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-200 min-w-0">
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none flex-shrink-0 touch-manipulation"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <FolderOpenIcon className="h-4 w-4" /> : <FolderIcon className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <span className="w-4 flex-shrink-0" />}
          <span className="font-mono truncate">{node.code}</span>
        </div>
        <div className="col-span-1 sm:col-span-2 truncate text-zinc-700 dark:text-zinc-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <span className="truncate">{node.name}</span>
          {node.parentName && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
              Parent: {node.parentName}
            </span>
          )}
        </div>
        <div className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">{node.type}</div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <AccountTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </>
  );
};

export default function AccountsPage() {
  const { session } = useAuth();
  const [companyCode] = useState(session?.companyCode);
  const [rows, setRows] = useState<AccountSummary[]>([]);
  const [tree, setTree] = useState<AccountSummary[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [flatData, treeData] = await Promise.all([
        listAccounts(session),
        listAccountTree(session)
      ]);
      setRows(flatData);
      setTree(treeData);
    } catch (err) {
      console.error('Failed to load accounts', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      load();
    }
  }, [session, companyCode]);

  const filteredList = useMemo(() => rows.filter((r) => (!q || r.code.includes(q) || r.name.toLowerCase().includes(q.toLowerCase())) && (!type || r.type === type)), [rows, q, type]);

  const isFiltering = !!q || !!type;
  const activeView = isFiltering ? 'list' : viewMode;

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white">Chart of Accounts</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Manage hierarchy and account definitions</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('tree')}
            className={clsx(
              "px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation",
              viewMode === 'tree' ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              "px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation",
              viewMode === 'list' ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            List
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      )}


      // ... (existing code start)

      <div id="accounts-filters" className="grid gap-4 sm:grid-cols-3 items-end rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <FormInput
          className="h-10"
          placeholder="Search code or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <FormSelect
          className="h-10"
          options={[
            { value: '', label: 'Any type' },
            { value: 'Asset', label: 'Asset' },
            { value: 'Liability', label: 'Liability' },
            { value: 'Equity', label: 'Equity' },
            { value: 'Revenue', label: 'Revenue' },
            { value: 'Expense', label: 'Expense' },
            { value: 'COGS', label: 'COGS' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <ResponsiveButton
          variant="secondary"
          onClick={load}
          loading={loading}
          icon={<FolderOpenIcon className="h-4 w-4" />}
          fullWidth
        >
          Refresh
        </ResponsiveButton>
      </div>

      <div id="accounts-list" className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="hidden sm:grid grid-cols-4 gap-0 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <div>Code</div>
          <div className="col-span-2">Name</div>
          <div>Type</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 mb-2" />
            <div>Loading accounts...</div>
          </div>
        ) : (
          activeView === 'tree' ? (
            tree.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No accounts found.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {tree.map(node => <AccountTreeNode key={node.id} node={node} />)}
              </div>
            )
          ) : (
            filteredList.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No accounts found matching filters.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {filteredList.map((r) => (
                  <div key={r.id} className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <div className="font-medium text-zinc-900 dark:text-zinc-200 font-mono">{r.code}</div>
                    <div className="col-span-1 sm:col-span-2 truncate text-zinc-700 dark:text-zinc-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="truncate">{r.name}</span>
                      {r.parentName && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
                          Parent: {r.parentName}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-400">{r.type}</div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
