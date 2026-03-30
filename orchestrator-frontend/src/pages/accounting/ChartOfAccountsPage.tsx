 /**
  * ChartOfAccountsPage
  *
  * Full Chart of Accounts with:
  *  1. Tree view — expandable/collapsible nodes per account type
  *     (Assets, Liabilities, Equity, Revenue, Expenses)
  *  2. Create account form modal (code, name, type, parent dropdown)
  *  3. Account detail panel — activity tab with paginated ledger,
  *     debit/credit columns, running balance
  *  4. Balance as-of date picker
  *
  * API endpoints used:
  *  GET  /api/v1/accounting/accounts/tree
  *  POST /api/v1/accounting/accounts
  *  GET  /api/v1/accounting/accounts/{id}/activity
  *  GET  /api/v1/accounting/accounts/{id}/balance/as-of
  */

 import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
 import {
   ChevronRight,
   ChevronDown,
   Plus,
   AlertCircle,
   RefreshCcw,
   X,
   Calendar,
   Filter,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { format, parseISO } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Badge } from '@/components/ui/Badge';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { EmptyState } from '@/components/ui/EmptyState';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import {
   accountingApi,
   type AccountTreeNode,
   type AccountDto,
   type AccountType,
   type AccountActivityReport,
   type AccountMovement,
   ACCOUNT_TYPE_LABELS,
 } from '@/lib/accountingApi';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: AccountType[] = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'COGS',
  'OTHER_INCOME',
  'OTHER_EXPENSE',
];

 function formatINR(amount: number): string {
   return new Intl.NumberFormat('en-IN', {
     style: 'currency',
     currency: 'INR',
     maximumFractionDigits: 2,
   }).format(amount);
 }

 function formatDate(dateStr: string): string {
   try {
     return format(parseISO(dateStr), 'dd MMM yyyy');
   } catch {
     return dateStr;
   }
 }

 function todayISO(): string {
   return new Date().toISOString().split('T')[0];
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Account Type Badge
 // ─────────────────────────────────────────────────────────────────────────────

 function AccountTypeBadge({ type }: { type: string }) {
   const badgeMap: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
    ASSET: 'success',
    LIABILITY: 'danger',
    EQUITY: 'warning',
    REVENUE: 'success',
    EXPENSE: 'default',
    COGS: 'warning',
    OTHER_INCOME: 'success',
    OTHER_EXPENSE: 'default',
  };
   return (
     <Badge variant={badgeMap[type] ?? 'default'}>
       {ACCOUNT_TYPE_LABELS[type as AccountType] ?? type}
     </Badge>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Tree Node
 // ─────────────────────────────────────────────────────────────────────────────

 interface TreeNodeProps {
   node: AccountTreeNode;
   depth: number;
   selectedId: number | null;
   onSelect: (node: AccountTreeNode) => void;
 }

 function TreeNode({ node, depth, selectedId, onSelect }: TreeNodeProps) {
   const [expanded, setExpanded] = useState(depth === 0);
   const hasChildren = node.children && node.children.length > 0;
   const isSelected = selectedId === node.id;

   return (
     <div>
       <button
         type="button"
         onClick={() => {
           onSelect(node);
           if (hasChildren) setExpanded((v) => !v);
         }}
         className={clsx(
           'w-full flex items-center gap-1.5 py-1.5 pr-3 rounded-lg text-left transition-colors duration-100',
           'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/20',
           isSelected
             ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]'
             : 'hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
         )}
         style={{ paddingLeft: `${depth * 16 + 8}px` }}
       >
         <span className="shrink-0 w-4 flex items-center justify-center">
           {hasChildren ? (
             expanded ? (
               <ChevronDown size={12} />
             ) : (
               <ChevronRight size={12} />
             )
           ) : null}
         </span>
         <span className={clsx(
           'flex-1 min-w-0',
           depth === 0 ? 'text-[11px] font-semibold uppercase tracking-[0.08em]' : 'text-[13px]',
           isSelected
             ? 'text-[var(--color-text-inverse)]'
             : depth === 0
               ? 'text-[var(--color-text-tertiary)]'
               : 'text-[var(--color-text-primary)]',
         )}>
           {depth > 0 && (
             <span className={clsx(
               'mr-1.5 tabular-nums text-[11px]',
               isSelected ? 'text-white/60' : 'text-[var(--color-text-tertiary)]',
             )}>
               {node.code}
             </span>
           )}
           {depth === 0 ? ACCOUNT_TYPE_LABELS[node.type as AccountType] ?? node.name : node.name}
         </span>
         {depth > 0 && (
           <span className={clsx(
             'ml-auto text-[11px] tabular-nums shrink-0',
             isSelected ? 'text-white/70' : 'text-[var(--color-text-tertiary)]',
             node.balance < 0 && !isSelected && 'text-[var(--color-error)]',
           )}>
             {formatINR(node.balance)}
           </span>
         )}
       </button>

       {hasChildren && expanded && (
         <div>
           {node.children!.map((child) => (
             <TreeNode
               key={child.id}
               node={child}
               depth={depth + 1}
               selectedId={selectedId}
               onSelect={onSelect}
             />
           ))}
         </div>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Account Type Filter Tabs
 // ─────────────────────────────────────────────────────────────────────────────

 type TypeFilter = AccountType | 'ALL';

 const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
   { value: 'ALL', label: 'All' },
   { value: 'ASSET', label: 'Assets' },
   { value: 'LIABILITY', label: 'Liabilities' },
   { value: 'EQUITY', label: 'Equity' },
   { value: 'REVENUE', label: 'Revenue' },
   { value: 'EXPENSE', label: 'Expenses' },
   { value: 'COGS', label: 'COGS' },
   { value: 'OTHER_INCOME', label: 'Other Income' },
   { value: 'OTHER_EXPENSE', label: 'Other Expense' },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Account Tree Panel
 // ─────────────────────────────────────────────────────────────────────────────

 interface AccountTreePanelProps {
   tree: AccountTreeNode[];
   isLoading: boolean;
   selectedId: number | null;
   typeFilter: TypeFilter;
   onTypeFilterChange: (type: TypeFilter) => void;
   onSelect: (node: AccountTreeNode) => void;
   onCreateNew: () => void;
 }

 function AccountTreePanel({
   tree,
   isLoading,
   selectedId,
   typeFilter,
   onTypeFilterChange,
   onSelect,
   onCreateNew,
 }: AccountTreePanelProps) {
   return (
     <div className="flex flex-col h-full border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
       <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--color-border-subtle)]">
         <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
           Chart of Accounts
         </h2>
         <Button variant="secondary" size="sm" leftIcon={<Plus />} onClick={onCreateNew}>
           New
         </Button>
       </div>

       {/* Type filter bar */}
       <div className="px-2 py-2 border-b border-[var(--color-border-subtle)] overflow-x-auto">
         <div className="flex items-center gap-1 min-w-max">
           <Filter size={11} className="text-[var(--color-text-tertiary)] ml-1 shrink-0" />
           {TYPE_FILTER_OPTIONS.map((opt) => (
             <button
               key={opt.value}
               type="button"
               onClick={() => onTypeFilterChange(opt.value)}
               className={clsx(
                 'px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors',
                 typeFilter === opt.value
                   ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]'
                   : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)]',
               )}
             >
               {opt.label}
             </button>
           ))}
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-2">
         {isLoading ? (
           <div className="space-y-1.5 p-2">
             {Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} height={28} />
             ))}
           </div>
         ) : tree.length === 0 ? (
           <div className="p-4">
             <EmptyState
               title="No accounts yet"
               description="Create your first account to get started."
             />
           </div>
         ) : (
           <div className="space-y-1">
             {tree.map((rootNode) => (
               <TreeNode
                 key={rootNode.id}
                 node={rootNode}
                 depth={0}
                 selectedId={selectedId}
                 onSelect={onSelect}
               />
             ))}
           </div>
         )}
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Activity Ledger Table
 // ─────────────────────────────────────────────────────────────────────────────

 const PAGE_SIZE = 15;

 interface ActivityLedgerProps {
   report: AccountActivityReport | null;
   isLoading: boolean;
   hasError: boolean;
   onRetry: () => void;
 }

 function ActivityLedger({ report, isLoading, hasError, onRetry }: ActivityLedgerProps) {
   const [page, setPage] = useState(0);

   const movements = report?.movements ?? [];
   const totalPages = Math.max(1, Math.ceil(movements.length / PAGE_SIZE));
   const pageMovements = movements.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

   if (isLoading) {
     return (
       <div className="space-y-2 p-4">
         {Array.from({ length: 6 }).map((_, i) => (
           <Skeleton key={i} height={32} />
         ))}
       </div>
     );
   }

   if (hasError) {
     return (
       <div className="flex flex-col items-center gap-3 py-12 text-center">
         <AlertCircle size={24} className="text-[var(--color-text-tertiary)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">Could not load activity.</p>
         <Button variant="secondary" size="sm" leftIcon={<RefreshCcw />} onClick={onRetry}>
           Try again
         </Button>
       </div>
     );
   }

   if (!report) {
     return (
       <div className="py-12 text-center">
         <p className="text-[13px] text-[var(--color-text-tertiary)]">
           Select an account to view its activity.
         </p>
       </div>
     );
   }

   return (
     <div>
       {/* Summary row */}
       <div className="grid grid-cols-3 gap-3 p-4 border-b border-[var(--color-border-subtle)]">
         {[
           { label: 'Opening Balance', value: report.openingBalance },
           { label: 'Total Debits', value: report.totalDebits },
           { label: 'Total Credits', value: report.totalCredits },
         ].map(({ label, value }) => (
           <div key={label}>
             <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
               {label}
             </p>
             <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-[var(--color-text-primary)]">
               {formatINR(value)}
             </p>
           </div>
         ))}
       </div>

       {/* Ledger table */}
       {movements.length === 0 ? (
         <div className="py-10 text-center">
           <EmptyState
             title="No activity"
             description="No journal entries posted to this account yet."
           />
         </div>
       ) : (
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-default)]">
                   {['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(
                     (h, i) => (
                       <th
                         key={h}
                         className={clsx(
                           'px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]',
                           i >= 3 ? 'text-right' : 'text-left',
                         )}
                       >
                         {h}
                       </th>
                     )
                   )}
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-border-subtle)]">
                 {pageMovements.map((mv: AccountMovement, idx: number) => (
                   <tr
                     key={idx}
                     className="hover:bg-[var(--color-surface-secondary)] transition-colors"
                   >
                     <td className="px-3 py-2.5 text-[12px] tabular-nums text-[var(--color-text-secondary)] whitespace-nowrap">
                       {formatDate(mv.date)}
                     </td>
                     <td className="px-3 py-2.5 text-[12px] font-medium tabular-nums text-[var(--color-text-primary)] whitespace-nowrap">
                       {mv.referenceNumber}
                     </td>
                     <td className="px-3 py-2.5 text-[12px] text-[var(--color-text-secondary)] max-w-[200px] truncate">
                       {mv.memo}
                     </td>
                     <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[var(--color-text-primary)]">
                       {mv.debit > 0 ? formatINR(mv.debit) : '—'}
                     </td>
                     <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[var(--color-text-primary)]">
                       {mv.credit > 0 ? formatINR(mv.credit) : '—'}
                     </td>
                     <td className={clsx(
                       'px-3 py-2.5 text-right text-[12px] font-medium tabular-nums',
                       mv.balance < 0
                         ? 'text-[var(--color-error)]'
                         : 'text-[var(--color-text-primary)]',
                     )}>
                       {formatINR(mv.balance)}
                     </td>
                   </tr>
                 ))}
               </tbody>
               {/* Closing balance footer */}
               <tfoot>
                 <tr className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                   <td colSpan={5} className="px-3 py-2.5 text-right text-[12px] font-semibold text-[var(--color-text-secondary)]">
                     Closing Balance
                   </td>
                   <td className="px-3 py-2.5 text-right text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                     {formatINR(report.closingBalance)}
                   </td>
                 </tr>
               </tfoot>
             </table>
           </div>

           {/* Pagination */}
           {totalPages > 1 && (
             <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)]">
               <p className="text-[11px] text-[var(--color-text-tertiary)]">
                 {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, movements.length)} of{' '}
                 {movements.length} entries
               </p>
               <div className="flex items-center gap-1.5">
                 <Button
                   variant="secondary"
                   size="sm"
                   onClick={() => setPage((p) => Math.max(0, p - 1))}
                   disabled={page === 0}
                 >
                   Previous
                 </Button>
                 <Button
                   variant="secondary"
                   size="sm"
                   onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                   disabled={page >= totalPages - 1}
                 >
                   Next
                 </Button>
               </div>
             </div>
           )}
         </>
       )}
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Account Detail Panel
 // ─────────────────────────────────────────────────────────────────────────────

 interface AccountDetailPanelProps {
   account: AccountTreeNode;
   onClose: () => void;
 }

 function AccountDetailPanel({ account, onClose }: AccountDetailPanelProps) {
   const [activity, setActivity] = useState<AccountActivityReport | null>(null);
   const [activityLoading, setActivityLoading] = useState(false);
   const [activityError, setActivityError] = useState(false);
   const [asOfDate, setAsOfDate] = useState(todayISO());
   const [asOfBalance, setAsOfBalance] = useState<number | null>(null);
   const [asOfLoading, setAsOfLoading] = useState(false);
   const dateInputRef = useRef<HTMLInputElement>(null);

   const loadActivity = useCallback(async () => {
     setActivityLoading(true);
     setActivityError(false);
     try {
       const data = await accountingApi.getAccountActivity(account.id);
       setActivity(data);
     } catch {
       setActivityError(true);
     } finally {
       setActivityLoading(false);
     }
   }, [account.id]);

   const loadBalanceAsOf = useCallback(async (date: string) => {
     setAsOfLoading(true);
     try {
       const bal = await accountingApi.getAccountBalanceAsOf(account.id, date);
       setAsOfBalance(bal);
     } catch {
       setAsOfBalance(null);
     } finally {
       setAsOfLoading(false);
     }
   }, [account.id]);

   useEffect(() => {
     void loadActivity();
     void loadBalanceAsOf(asOfDate);
   }, [loadActivity, loadBalanceAsOf, asOfDate]);

   return (
     <div className="flex flex-col h-full bg-[var(--color-surface-primary)]">
       {/* Panel header */}
       <div className="flex items-start justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
         <div className="min-w-0">
           <div className="flex items-center gap-2 flex-wrap">
             <span className="text-[11px] font-semibold tabular-nums text-[var(--color-text-tertiary)]">
               {account.code}
             </span>
             <AccountTypeBadge type={account.type} />
           </div>
           <h3 className="mt-0.5 text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
             {account.name}
           </h3>
           <p className="mt-0.5 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
             Balance: {formatINR(account.balance)}
           </p>
         </div>
         <button
           type="button"
           onClick={onClose}
           className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors text-[var(--color-text-tertiary)]"
           aria-label="Close panel"
         >
           <X size={15} />
         </button>
       </div>

       {/* Balance as-of date picker */}
       <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
         <div className="flex items-center gap-2">
           <Calendar size={13} className="text-[var(--color-text-tertiary)]" />
           <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
             Balance as of:
           </span>
         </div>
         <input
           ref={dateInputRef}
           type="date"
           value={asOfDate}
           onChange={(e) => {
             setAsOfDate(e.target.value);
           }}
           className="h-7 px-2 border border-[var(--color-border-default)] rounded-lg text-[12px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:border-[var(--color-neutral-400)]"
         />
         <span className={clsx(
           'text-[13px] font-semibold tabular-nums',
           asOfLoading
             ? 'text-[var(--color-text-tertiary)] animate-pulse'
             : asOfBalance !== null && asOfBalance < 0
               ? 'text-[var(--color-error)]'
               : 'text-[var(--color-text-primary)]',
         )}>
           {asOfLoading ? '…' : asOfBalance !== null ? formatINR(asOfBalance) : '—'}
         </span>
       </div>

       {/* Activity tab */}
       <div className="flex-1 overflow-y-auto">
         <ActivityLedger
           report={activity}
           isLoading={activityLoading}
           hasError={activityError}
           onRetry={loadActivity}
         />
       </div>
     </div>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Create Account Modal
 // ─────────────────────────────────────────────────────────────────────────────

 interface CreateAccountModalProps {
   isOpen: boolean;
   onClose: () => void;
   onCreated: (account: AccountDto) => void;
   flatAccounts: AccountDto[];
 }

 function CreateAccountModal({
   isOpen,
   onClose,
   onCreated,
   flatAccounts,
 }: CreateAccountModalProps) {
   const [code, setCode] = useState('');
   const [name, setName] = useState('');
   const [type, setType] = useState<AccountType>('ASSET');
   const [parentId, setParentId] = useState<string>('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState('');

   const parentOptions = useMemo(() => {
     const filtered = flatAccounts.filter((a) => a.type === type);
     return [
       { value: '', label: 'None (top-level)' },
       ...filtered.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
     ];
   }, [flatAccounts, type]);

   const handleSubmit = async () => {
     if (!code.trim() || !name.trim()) {
       setError('Code and name are required.');
       return;
     }
     setError('');
     setIsSubmitting(true);
     try {
       const result = await accountingApi.createAccount({
         code: code.trim(),
         name: name.trim(),
         type,
         parentId: parentId ? Number(parentId) : null,
       });
       onCreated(result);
       setCode('');
       setName('');
       setType('ASSET');
       setParentId('');
       onClose();
     } catch (err: unknown) {
       const message =
         err instanceof Error ? err.message : 'Failed to create account. Please try again.';
       setError(message);
     } finally {
       setIsSubmitting(false);
     }
   };

   if (!isOpen) return null;

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       title="New Account"
       description="Add a new account to the chart of accounts."
       size="md"
       footer={
         <>
           <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
             Cancel
           </Button>
           <Button
             variant="primary"
             onClick={() => void handleSubmit()}
             isLoading={isSubmitting}
           >
             Create Account
           </Button>
         </>
       }
     >
       <div className="space-y-4">
         {error && (
           <div className="flex items-center gap-2 text-[12px] text-[var(--color-error)] bg-[var(--color-error-subtle)] rounded-lg px-3 py-2">
             <AlertCircle size={13} />
             {error}
           </div>
         )}
         <div className="grid grid-cols-2 gap-3">
           <Input
             label="Account Code"
             value={code}
             onChange={(e) => setCode(e.target.value)}
             placeholder="e.g. 1010"
           />
           <Select
             label="Account Type"
             value={type}
             onChange={(e) => {
               setType(e.target.value as AccountType);
               setParentId('');
             }}
             options={ACCOUNT_TYPES.map((t) => ({
               value: t,
               label: ACCOUNT_TYPE_LABELS[t],
             }))}
           />
         </div>
         <Input
           label="Account Name"
           value={name}
           onChange={(e) => setName(e.target.value)}
           placeholder="e.g. Cash and Cash Equivalents"
         />
         <Select
           label="Parent Account"
           value={parentId}
           onChange={(e) => setParentId(e.target.value)}
           options={parentOptions}
           hint={`Accounts of type ${ACCOUNT_TYPE_LABELS[type]} are shown.`}
         />
       </div>
     </Modal>
   );
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────

 export function ChartOfAccountsPage() {
   const [tree, setTree] = useState<AccountTreeNode[]>([]);
   const [flatAccounts, setFlatAccounts] = useState<AccountDto[]>([]);
   const [treeLoading, setTreeLoading] = useState(true);
   const [treeError, setTreeError] = useState(false);
   const [selectedNode, setSelectedNode] = useState<AccountTreeNode | null>(null);
   const [createModalOpen, setCreateModalOpen] = useState(false);
   const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

   const loadTree = useCallback(async (filter: TypeFilter) => {
     setTreeLoading(true);
     setTreeError(false);
     try {
       const [treeData, flatData] = await Promise.all([
         filter === 'ALL'
           ? accountingApi.getAccountTree()
           : accountingApi.getAccountTreeByType(filter),
         accountingApi.getAccounts(),
       ]);
       setTree(treeData);
       setFlatAccounts(flatData);
     } catch {
       setTreeError(true);
     } finally {
       setTreeLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadTree(typeFilter);
   }, [loadTree, typeFilter]);

   const handleTypeFilterChange = useCallback(
     (newFilter: TypeFilter) => {
       setTypeFilter(newFilter);
       setSelectedNode(null);
     },
     []
   );

   const handleAccountCreated = useCallback(
     (newAccount: AccountDto) => {
       setFlatAccounts((prev) => [...prev, newAccount]);
       void loadTree(typeFilter);
     },
     [loadTree, typeFilter]
   );

   const handleNodeSelect = useCallback((node: AccountTreeNode) => {
     // Only show detail for leaf/non-root accounts
     if (node.level > 0 || !node.children?.length) {
       setSelectedNode(node);
     }
   }, []);

   if (treeError) {
     return (
       <div className="flex flex-col items-center gap-3 py-16 text-center">
         <AlertCircle size={28} className="text-[var(--color-text-tertiary)]" />
         <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
           Couldn't load chart of accounts
         </p>
         <Button variant="secondary" size="sm" leftIcon={<RefreshCcw />} onClick={() => void loadTree(typeFilter)}>
           Try again
         </Button>
       </div>
     );
   }

   return (
     <>
       <div
         className={clsx(
           'grid h-[calc(100vh-120px)] rounded-xl border border-[var(--color-border-default)] overflow-hidden',
           selectedNode
             ? 'grid-cols-1 sm:grid-cols-[300px_1fr]'
             : 'grid-cols-1',
         )}
       >
         {/* Tree panel */}
         <AccountTreePanel
           tree={tree}
           isLoading={treeLoading}
           selectedId={selectedNode?.id ?? null}
           typeFilter={typeFilter}
           onTypeFilterChange={handleTypeFilterChange}
           onSelect={handleNodeSelect}
           onCreateNew={() => setCreateModalOpen(true)}
         />

         {/* Detail panel */}
         {selectedNode && (
           <AccountDetailPanel
             key={selectedNode.id}
             account={selectedNode}
             onClose={() => setSelectedNode(null)}
           />
         )}
       </div>

       {/* Create Account Modal */}
       <CreateAccountModal
         isOpen={createModalOpen}
         onClose={() => setCreateModalOpen(false)}
         onCreated={handleAccountCreated}
         flatAccounts={flatAccounts}
       />
     </>
   );
 }
