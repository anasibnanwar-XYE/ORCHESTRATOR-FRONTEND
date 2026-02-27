import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listPromotions } from '../../lib/salesApi';
import type { PromotionDto } from '../../lib/client/models/PromotionDto';

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDiscount = (type?: string, value?: number) => {
  if (value == null) return '—';
  if (type?.toUpperCase() === 'PERCENTAGE') return `${value}% off`;
  return `₹${value.toLocaleString('en-IN')} off`;
};

const statusStyle = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-status-success-bg text-status-success-text';
    case 'EXPIRED':
      return 'bg-surface-highlight text-tertiary';
    case 'SCHEDULED':
      return 'bg-brand-500/10 text-brand-400';
    default:
      return 'bg-surface-highlight text-secondary';
  }
};

const isActive = (promo: PromotionDto) => {
  const now = new Date();
  if (promo.startDate && new Date(promo.startDate) > now) return false;
  if (promo.endDate && new Date(promo.endDate) < now) return false;
  return promo.status?.toUpperCase() === 'ACTIVE';
};

export default function PromotionsPage() {
  const { session } = useAuth();

  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPromotions(session);
      // Sort: active first, then by end date descending
      data.sort((a, b) => {
        const aActive = isActive(a);
        const bActive = isActive(b);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        const aEnd = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bEnd = b.endDate ? new Date(b.endDate).getTime() : 0;
        return bEnd - aEnd;
      });
      setPromotions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const activePromos = promotions.filter(isActive);
  const otherPromos = promotions.filter((p) => !isActive(p));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-primary">Promotions</h1>
        <p className="text-xs text-secondary mt-0.5">View active promotions and discounts</p>
      </div>

      {error && (
        <div className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-secondary">
          <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {!loading && promotions.length === 0 && (
        <div className="py-12 text-center text-sm text-secondary">
          No promotions available at this time.
        </div>
      )}

      {/* Active Promotions */}
      {!loading && activePromos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Now</h2>
          {activePromos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      )}

      {/* Other Promotions */}
      {!loading && otherPromos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
            {activePromos.length > 0 ? 'Upcoming & Past' : 'Promotions'}
          </h2>
          {otherPromos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromoCard({ promo }: { promo: PromotionDto }) {
  const active = isActive(promo);

  return (
    <div className={`rounded-xl border bg-surface p-4 space-y-2.5 transition-colors ${active ? 'border-brand-400/30' : 'border-border'}`}>
      {/* Title + Status */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary leading-snug">{promo.name ?? 'Untitled Promotion'}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(promo.status)}`}>
          {promo.status ?? 'Unknown'}
        </span>
      </div>

      {/* Description */}
      {promo.description && (
        <p className="text-sm text-secondary leading-relaxed">{promo.description}</p>
      )}

      {/* Discount + Dates */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">
          {fmtDiscount(promo.discountType, promo.discountValue)}
        </span>
        <span className="text-tertiary">
          {fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}
        </span>
      </div>
    </div>
  );
}
