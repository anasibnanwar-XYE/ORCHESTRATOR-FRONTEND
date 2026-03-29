 /**
  * OpeningStockPage
  *
  * Opening stock management:
  *  - CSV upload form for initial quantities and values
  *  - Posts journal (debit Inventory, credit Opening Balance Equity)
  *  - Import history with paginated log, error counts
  *  - Template download hint with required columns
  *
  * API:
  *  POST /api/v1/inventory/opening-stock (multipart)
  *  GET  /api/v1/inventory/opening-stock?page=&size=
  */
 
 import { useEffect, useState, useCallback, useRef } from 'react';
 import {
   AlertCircle,
   RefreshCcw,
   Upload,
   FileText,
   CheckCircle,
   XCircle,
 } from 'lucide-react';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Badge } from '@/components/ui/Badge';
 import { PageHeader } from '@/components/ui/PageHeader';
 import { useToast } from '@/components/ui/Toast';
 import {
   inventoryApi,
   type OpeningStockImportHistoryItem,
   type OpeningStockImportResponse,
 } from '@/lib/inventoryApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────
 
 function formatDate(dateStr: string): string {
   return new Date(dateStr).toLocaleDateString('en-IN', {
     day: '2-digit',
     month: 'short',
     year: 'numeric',
     hour: '2-digit',
     minute: '2-digit',
   });
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Upload Panel
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface UploadPanelProps {
   onImported: () => void;
 }
 
 function UploadPanel({ onImported }: UploadPanelProps) {
   const toast = useToast();
   const fileRef = useRef<HTMLInputElement>(null);
   const [file, setFile] = useState<File | null>(null);
   const [isUploading, setIsUploading] = useState(false);
   const [result, setResult] = useState<OpeningStockImportResponse | null>(null);
 
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const f = e.target.files?.[0] ?? null;
     setFile(f);
     setResult(null);
   };
 
   const handleUpload = async () => {
     if (!file) return;
     setIsUploading(true);
     try {
       const res = await inventoryApi.importOpeningStock(file);
       setResult(res);
       if (!res.errors || res.errors.length === 0) {
         toast.success('Opening stock imported. Journal entry posted.');
       } else {
         toast.warning?.('Import completed with errors. Check the details below.');
       }
       onImported();
     } catch {
       toast.error('Failed to import opening stock. Please check the file format and try again.');
     } finally {
       setIsUploading(false);
     }
   };
 
   return (
     <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] p-5 space-y-4">
       <div>
         <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">Upload CSV</p>
         <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
           Upload a CSV file with opening stock quantities and values. Required columns: <code className="font-mono bg-[var(--color-surface-secondary)] px-1 rounded">sku</code>, <code className="font-mono bg-[var(--color-surface-secondary)] px-1 rounded">quantity</code>, <code className="font-mono bg-[var(--color-surface-secondary)] px-1 rounded">unitCost</code>
         </p>
       </div>
 
       <div
         className="border-2 border-dashed border-[var(--color-border-default)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
         onClick={() => fileRef.current?.click()}
       >
         <Upload size={22} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
         {file ? (
           <div>
             <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{file.name}</p>
             <p className="text-[11px] text-[var(--color-text-tertiary)]">{(file.size / 1024).toFixed(1)} KB</p>
           </div>
         ) : (
           <p className="text-[13px] text-[var(--color-text-secondary)]">
             Click to select CSV file
           </p>
         )}
       </div>
       <input
         ref={fileRef}
         type="file"
         accept=".csv"
         className="hidden"
         onChange={handleFileChange}
       />
 
       {result && (
         <div className="space-y-2">
           <div className="flex items-center gap-2 text-[13px]">
             {(!result.errors || result.errors.length === 0) ? (
               <CheckCircle size={15} className="text-[var(--color-success-text)]" />
             ) : (
               <XCircle size={15} className="text-[var(--color-danger-text)]" />
             )}
             <span className="text-[var(--color-text-primary)]">
               {result.rowsProcessed ?? 0} rows processed
               {result.productsCreated ? `, ${result.productsCreated} products created` : ''}
               {result.rawMaterialsSeeded ? `, ${result.rawMaterialsSeeded} materials seeded` : ''}
             </span>
           </div>
           {result.errors && result.errors.length > 0 && (
             <div className="rounded-lg bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] p-3 space-y-1">
               <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-danger-text)]">
                 {result.errors.length} error(s)
               </p>
               {result.errors.slice(0, 5).map((e, i) => (
                 <p key={i} className="text-[12px] text-[var(--color-danger-text)]">
                   Row {e.rowNumber}: {e.message}
                 </p>
               ))}
               {result.errors.length > 5 && (
                 <p className="text-[12px] text-[var(--color-text-tertiary)]">
                   +{result.errors.length - 5} more errors
                 </p>
               )}
             </div>
           )}
         </div>
       )}
 
       <div className="flex justify-end">
         <Button
           leftIcon={<Upload size={14} />}
           onClick={handleUpload}
           isLoading={isUploading}
           disabled={!file || isUploading}
         >
           Import
         </Button>
       </div>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Import History
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface HistoryPanelProps {
   history: OpeningStockImportHistoryItem[];
   isLoading: boolean;
 }
 
 function HistoryPanel({ history, isLoading }: HistoryPanelProps) {
   if (isLoading) {
     return (
       <div className="space-y-2">
         {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
       </div>
     );
   }
   if (history.length === 0) {
     return (
       <div className="py-8 text-center">
         <FileText size={22} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
         <p className="text-[13px] text-[var(--color-text-secondary)]">No import history yet.</p>
       </div>
     );
   }
   return (
     <div className="overflow-x-auto rounded-xl border border-[var(--color-border-default)]">
       <table className="w-full text-[13px]">
         <thead className="bg-[var(--color-surface-secondary)]">
           <tr>
             <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-secondary)]">Reference</th>
             <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-secondary)]">File</th>
             <th className="px-3 py-2.5 text-center font-medium text-[var(--color-text-secondary)]">Journal</th>
             <th className="px-3 py-2.5 text-center font-medium text-[var(--color-text-secondary)]">Errors</th>
             <th className="px-3 py-2.5 text-left font-medium text-[var(--color-text-secondary)]">Imported</th>
           </tr>
         </thead>
         <tbody>
           {history.map((item) => (
             <tr key={item.id} className="border-t border-[var(--color-border-subtle)]">
               <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--color-text-secondary)]">
                 {item.referenceNumber ?? `IMP-${item.id}`}
               </td>
               <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">
                 {item.fileName ?? '—'}
               </td>
               <td className="px-3 py-2.5 text-center tabular-nums text-[var(--color-text-tertiary)]">
                 {item.journalEntryId ? `#${item.journalEntryId}` : '—'}
               </td>
               <td className="px-3 py-2.5 text-center">
                 {(item.errorCount ?? 0) > 0 ? (
                   <Badge variant="danger">{item.errorCount}</Badge>
                 ) : (
                   <Badge variant="success">0</Badge>
                 )}
               </td>
               <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">
                 {formatDate(item.createdAt)}
               </td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   );
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Main Page
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function OpeningStockPage() {
   const [history, setHistory] = useState<OpeningStockImportHistoryItem[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [historyError, setHistoryError] = useState<string | null>(null);
 
   const loadHistory = useCallback(async () => {
     setIsLoadingHistory(true);
     setHistoryError(null);
     try {
       const res = await inventoryApi.getOpeningStockHistory(0, 20);
       setHistory(res.content ?? []);
     } catch {
       setHistoryError('Failed to load import history.');
     } finally {
       setIsLoadingHistory(false);
     }
   }, []);
 
   useEffect(() => { loadHistory(); }, [loadHistory]);
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Opening Stock"
         description="Import initial inventory quantities and values — posts debit Inventory, credit Opening Balance Equity"
       />
 
       <UploadPanel onImported={loadHistory} />
 
       <div>
         <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
           Import History
         </p>
         {historyError ? (
           <div className="flex items-center gap-2 text-[13px] text-[var(--color-danger-text)]">
             <AlertCircle size={14} />
             {historyError}
             <Button size="sm" variant="ghost" leftIcon={<RefreshCcw size={12} />} onClick={loadHistory}>
               Retry
             </Button>
           </div>
         ) : (
           <HistoryPanel history={history} isLoading={isLoadingHistory} />
         )}
       </div>
     </div>
   );
 }
