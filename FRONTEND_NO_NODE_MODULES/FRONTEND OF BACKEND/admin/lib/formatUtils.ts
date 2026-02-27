/**
 * Date and number formatting utilities
 */

/** Accepted date shapes from the backend */
type DateInput = string | Date | number | number[] | null | undefined;

/**
 * Safely coerce any backend date representation into a Date object.
 *
 * Handles:
 *  - ISO / locale strings  ("2025-02-10", "2025-02-10T00:00:00")
 *  - Date instances
 *  - Epoch milliseconds     (1707523200000)
 *  - Java LocalDate arrays   [2025, 2, 10]  (month is 1-based from Java)
 */
const toDate = (value: DateInput): Date | null => {
  if (value == null) return null;

  // Already a Date
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // Java LocalDate serialised as [year, month, day]
  if (Array.isArray(value)) {
    const [y, m, d] = value;
    if (typeof y === 'number' && typeof m === 'number' && typeof d === 'number') {
      // month is 1-based from Java, 0-based in JS
      const date = new Date(y, m - 1, d);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  // Epoch number (milliseconds)
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // String — normalise bare dates (no T) so they aren't treated as UTC
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export const formatDate = (value?: DateInput): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateShort = (value?: DateInput): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (value?: DateInput): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value?: number | null): string => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return currencyFormatter.format(amount);
};

export const formatMoney = (value?: number | null): string => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value?: number | null): string => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return amount.toLocaleString('en-IN');
};

/**
 * Format a number with 2 decimal places but NO currency symbol.
 * Used in tables/modals where the column header already indicates currency.
 */
export const formatAmount = (value?: number | null): string => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
