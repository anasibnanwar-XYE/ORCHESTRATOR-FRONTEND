import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  error,
  disabled,
  className,
}: DatePickerProps) {
  const today = new Date();
  const initial = value ? new Date(value + 'T00:00:00') : today;
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {label && (
        <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center justify-between w-full h-9 px-3',
          'bg-[var(--color-surface-primary)] border rounded-lg text-[13px]',
          'transition-all duration-150',
          error
            ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-100'
            : 'border-[var(--color-border-default)] focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/10 focus-visible:border-[var(--color-neutral-400)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={value ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
      </button>

      {error && (
        <p className="text-[11px] text-red-600 mt-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[280px] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl shadow-lg z-[var(--z-dropdown)] p-3 animate-fade-in">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="h-7 flex items-center justify-center text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'h-8 w-full flex items-center justify-center text-[12px] rounded-lg transition-colors',
                    isSelected
                      ? 'bg-[var(--color-neutral-900)] text-white font-medium'
                      : isToday
                        ? 'font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-tertiary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={() => {
                onChange(todayStr);
                setIsOpen(false);
              }}
              className="w-full text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors py-1"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
