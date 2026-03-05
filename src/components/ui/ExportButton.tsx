 /**
  * ExportButton — triggers PDF or CSV export for reports.
  *
  * Usage:
  *   <ExportButton onExport={handleExport} />
  *   <ExportButton onExport={handleExport} className="..." />
  */

 import { useState } from 'react';
 import { Download, FileText, Table2 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';

 interface ExportButtonProps {
   onExport: (format: 'PDF' | 'CSV') => Promise<void> | void;
   pdfLabel?: string;
   csvLabel?: string;
   className?: string;
   disabled?: boolean;
 }

 export function ExportButton({
   onExport,
   pdfLabel = 'Export PDF',
   csvLabel = 'Export CSV',
   className,
   disabled = false,
 }: ExportButtonProps) {
   const [open, setOpen] = useState(false);
   const [loadingPdf, setLoadingPdf] = useState(false);
   const [loadingCsv, setLoadingCsv] = useState(false);

   const handleExport = async (format: 'PDF' | 'CSV') => {
     const setLoading = format === 'PDF' ? setLoadingPdf : setLoadingCsv;
     setLoading(true);
     setOpen(false);
     try {
       await onExport(format);
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className={clsx('relative inline-block', className)}>
       <Button
         variant="secondary"
         size="sm"
         leftIcon={<Download size={14} />}
         isLoading={loadingPdf || loadingCsv}
         disabled={disabled}
         onClick={() => setOpen((o) => !o)}
       >
         Export
       </Button>

       {open && (
         <>
           {/* backdrop */}
           <div
             className="fixed inset-0 z-10"
             onClick={() => setOpen(false)}
           />
           <div
             className={clsx(
               'absolute right-0 top-full mt-1 z-20',
               'w-40 py-1',
               'bg-[var(--color-surface-primary)]',
               'border border-[var(--color-border-default)]',
               'rounded-xl shadow-lg',
             )}
             style={{ animation: 'slideUp 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
           >
             <button
               type="button"
               onClick={() => handleExport('PDF')}
               disabled={loadingPdf}
               className={clsx(
                 'flex items-center gap-2.5 w-full px-3 h-8 text-[13px] text-left',
                 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]',
                 'transition-colors duration-100 disabled:opacity-40',
               )}
             >
               <FileText size={13} className="text-[var(--color-text-tertiary)] shrink-0" />
               {pdfLabel}
             </button>
             <button
               type="button"
               onClick={() => handleExport('CSV')}
               disabled={loadingCsv}
               className={clsx(
                 'flex items-center gap-2.5 w-full px-3 h-8 text-[13px] text-left',
                 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]',
                 'transition-colors duration-100 disabled:opacity-40',
               )}
             >
               <Table2 size={13} className="text-[var(--color-text-tertiary)] shrink-0" />
               {csvLabel}
             </button>
           </div>
         </>
       )}
     </div>
   );
 }
