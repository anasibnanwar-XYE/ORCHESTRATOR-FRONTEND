import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MFAInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onUseRecovery?: () => void;
  error?: string;
  isLoading?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

export function MFAInput({
  length = 6,
  onComplete,
  onUseRecovery,
  error,
  isLoading,
  className,
  title = "Two-Factor Authentication",
  description = "Enter the 6-digit code from your authenticator app."
}: MFAInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    if (value.length > 1) {
      const pastedCode = value.slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newCode[i] = pastedCode[i] || '';
      }
      setCode(newCode);
      const nextEmpty = newCode.findIndex(val => val === '');
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
      
      if (nextEmpty === -1 && onComplete) {
        onComplete(newCode.join(''));
      }
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(val => val !== '') && onComplete) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className={twMerge('flex flex-col w-full max-w-sm mx-auto p-6 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl', className)}>
      <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h2>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {description}
      </p>

      {/* Code Inputs */}
      <div className="flex justify-between gap-1.5 sm:gap-2 mb-2 w-full" dir="ltr">
        {code.map((value, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            value={value}
            disabled={isLoading}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={clsx(
              'w-full h-12 text-center text-lg font-semibold bg-[var(--color-surface-primary)] border rounded-md transition-all duration-150 focus:outline-none',
              error 
                ? 'border-red-400 text-red-600 focus:ring-1 focus:ring-red-400' 
                : 'border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-[var(--color-neutral-900)] focus:ring-1 focus:ring-[var(--color-neutral-900)]',
              isLoading && 'opacity-50 cursor-not-allowed bg-[var(--color-surface-tertiary)]'
            )}
          />
        ))}
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
          disabled={isLoading || code.some(v => v === '')}
          onClick={() => onComplete?.(code.join(''))}
          className="w-full h-10 bg-[var(--color-neutral-900)] text-white text-[13px] font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-opacity hover:bg-black"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
        </button>

        {onUseRecovery && (
          <div className="text-center">
             <button
              type="button"
              onClick={onUseRecovery}
              disabled={isLoading}
              className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
            >
              Use a recovery code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
