import { ArrowRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { DatePicker } from './DatePicker';

export interface DateRange {
  start?: string;
  end?: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  error?: string;
  className?: string;
}

export function DateRangePicker({ value, onChange, label, error, className }: DateRangePickerProps) {
  return (
    <div className={twMerge('space-y-1.5', className)}>
      {label && (
        <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <DatePicker
          value={value.start}
          onChange={(start) => onChange({ ...value, start })}
          placeholder="Start date"
          className="w-full sm:flex-1"
        />
        <ArrowRight size={14} className="hidden sm:block text-[var(--color-text-tertiary)] shrink-0" />
        <DatePicker
          value={value.end}
          onChange={(end) => onChange({ ...value, end })}
          placeholder="End date"
          className="w-full sm:flex-1"
        />
      </div>
      {error && <p className="text-[11px] text-[var(--color-error)] mt-1">{error}</p>}
    </div>
  );
}
