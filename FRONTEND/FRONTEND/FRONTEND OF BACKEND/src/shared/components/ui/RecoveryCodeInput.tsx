import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface RecoveryCodeInputProps {
  onComplete?: (code: string) => void;
  onBackToMFA?: () => void;
  error?: string;
  isLoading?: boolean;
  className?: string;
}

export function RecoveryCodeInput({
  onComplete,
  onBackToMFA,
  error,
  isLoading,
  className,
}: RecoveryCodeInputProps) {
  const [code, setCode] = useState('');

  return (
    <div className={twMerge('flex flex-col w-full max-w-sm mx-auto p-6 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl', className)}>
      <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-1">
        Recovery Code
      </h2>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        Enter one of your 10-character emergency recovery codes.
      </p>

      {/* Code Input */}
      <div className="w-full relative mb-2">
        <input
          type="text"
          placeholder="e.g. A1B2-C3D4-E5"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={isLoading}
          className={clsx(
            'w-full h-11 px-3 text-[14px] font-mono tracking-wide bg-[var(--color-surface-primary)] border rounded-lg transition-all duration-150 uppercase placeholder:normal-case placeholder:tracking-normal focus:outline-none',
            error 
              ? 'border-red-400 text-red-600 focus:ring-1 focus:ring-red-400' 
              : 'border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-[var(--color-neutral-900)] focus:ring-1 focus:ring-[var(--color-neutral-900)]',
            isLoading && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]'
          )}
        />
      </div>

      {/* Error Message */}
      <div className={clsx(
        "flex items-center gap-1.5 text-[12px] text-red-600 font-medium h-5 transition-opacity duration-200",
        error ? "opacity-100" : "opacity-0"
      )}>
        {error && (
          <>
            <AlertCircle size={14} />
            {error}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="w-full mt-6 space-y-4">
        <button
          disabled={isLoading || code.length < 8}
          onClick={() => onComplete?.(code)}
          className="w-full h-10 bg-[var(--color-neutral-900)] text-white text-[13px] font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-opacity hover:bg-black"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Code'}
        </button>

        {onBackToMFA && (
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToMFA}
              disabled={isLoading}
              className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
            >
              Back to authenticator code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
