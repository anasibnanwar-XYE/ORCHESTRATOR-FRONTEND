import { useState, useRef } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface FileUploadProps {
  label?: string;
  hint?: string;
  accept?: string;
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ label, hint, accept, maxFiles = 1, onUpload, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const updated = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updated);
    onUpload?.(updated);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload?.(updated);
  };

  return (
    <div className={twMerge('space-y-1.5', className)}>
      {label && (
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1">
          {label}
        </label>
      )}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center',
          isDragging 
            ? 'border-[var(--color-neutral-900)] bg-[var(--color-surface-secondary)]' 
            : 'border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
            e.target.value = ''; // Reset so the same file can be chosen again
          }}
          className="hidden"
        />
        <div className="w-10 h-10 mb-3 rounded-full bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] flex items-center justify-center shadow-sm">
          <UploadCloud size={18} className="text-[var(--color-text-secondary)]" />
        </div>
        <p className="text-[13px] text-[var(--color-text-primary)] font-medium mb-1">
          Click to upload <span className="font-normal text-[var(--color-text-tertiary)]">or drag and drop</span>
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {hint || `Maximum file size 10MB`}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mt-3">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <File size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1.5 text-[var(--color-text-tertiary)] hover:text-red-500 rounded-md hover:bg-red-50 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
