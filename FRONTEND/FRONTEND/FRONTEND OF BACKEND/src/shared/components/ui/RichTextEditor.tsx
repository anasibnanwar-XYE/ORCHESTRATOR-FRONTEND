import { useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface RichTextEditorProps {
  label?: string;
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function RichTextEditor({ label, value, onChange, placeholder, error, className }: RichTextEditorProps) {
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]);
  };

  const ToolbarButton = ({ icon: Icon, format }: { icon: any, format: string }) => (
    <button
      type="button"
      onClick={() => toggleFormat(format)}
      className={clsx(
        'p-1.5 rounded transition-colors',
        activeFormats.includes(format) 
          ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]' 
          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-secondary)]'
      )}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className={twMerge('space-y-1.5', className)}>
      {label && (
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className={clsx(
        'border rounded-xl bg-[var(--color-surface-primary)] overflow-hidden transition-all duration-150',
        error ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100' : 'border-[var(--color-border-default)] focus-within:ring-2 focus-within:ring-[var(--color-neutral-900)]/10 focus-within:border-[var(--color-neutral-400)]'
      )}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50">
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Bold} format="bold" />
            <ToolbarButton icon={Italic} format="italic" />
            <ToolbarButton icon={Underline} format="underline" />
          </div>
          <div className="w-px h-4 bg-[var(--color-border-default)] mx-1" />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={List} format="bullet" />
            <ToolbarButton icon={ListOrdered} format="number" />
          </div>
          <div className="w-px h-4 bg-[var(--color-border-default)] mx-1" />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={AlignLeft} format="align-left" />
            <ToolbarButton icon={AlignCenter} format="align-center" />
            <ToolbarButton icon={AlignRight} format="align-right" />
          </div>
          <div className="w-px h-4 bg-[var(--color-border-default)] mx-1" />
          <ToolbarButton icon={Link2} format="link" />
        </div>
        
        {/* Editor Area */}
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || 'Enter text...'}
          className={clsx(
            'w-full min-h-[120px] p-3 text-[13px] bg-transparent resize-y focus:outline-none placeholder:text-[var(--color-text-tertiary)]',
            activeFormats.includes('bold') && 'font-bold',
            activeFormats.includes('italic') && 'italic',
            activeFormats.includes('underline') && 'underline',
            activeFormats.includes('align-center') && 'text-center',
            activeFormats.includes('align-right') && 'text-right'
          )}
        />
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
