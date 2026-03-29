import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy');
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch {
    return '-';
  }
}

export function formatCurrency(amount: number | null | undefined, currency = '₹'): string {
  if (amount === null || amount === undefined) return '-';
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-IN');
}

export function formatPercentage(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
}
