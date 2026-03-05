import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DispatchLine {
  product: string;
  ordered: number;
  dispatched: number;
  toDispatch: string;
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    orderRef: string;
    dispatchDate: string;
    transporter: string;
    vehicleNo: string;
    lrNumber: string;
    packages: string;
    lines: DispatchLine[];
  }) => void;
  order?: {
    ref: string;
    dealer: string;
    lines: Array<{ product: string; ordered: number; dispatched: number }>;
  };
}

type DispatchStep = 'items' | 'transport';

const fieldInputCls = 'w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors duration-150';

export function DispatchModal({ isOpen, onClose, onSubmit, order }: DispatchModalProps) {
  const [step, setStep] = useState<DispatchStep>('items');
  const [dispatchDate, setDispatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [packages, setPackages] = useState('');
  const [lines, setLines] = useState<DispatchLine[]>(
    order?.lines.map((l) => ({
      ...l,
      toDispatch: String(l.ordered - l.dispatched),
    })) || [],
  );

  const totalItems = useMemo(() =>
    lines.reduce((s, l) => s + (parseInt(l.toDispatch) || 0), 0),
  [lines]);

  const canProceed = totalItems > 0;

  const handleSubmit = () => {
    if (!canProceed) return;
    onSubmit({
      orderRef: order?.ref || '',
      dispatchDate,
      transporter,
      vehicleNo,
      lrNumber,
      packages,
      lines,
    });
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[5vh] sm:pt-[8vh]">
      <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] overflow-hidden flex flex-col mx-4"
        style={{
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Dispatch</h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                {order.ref} &middot; {order.dealer}
              </p>
            </div>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors">
              <X size={15} className="text-[var(--color-text-tertiary)]" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-3">
            {(['items', 'transport'] as DispatchStep[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={clsx(
                  'text-[11px] font-medium uppercase tracking-wider transition-colors',
                  step === s ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]',
                )}
              >
                {i + 1}. {s === 'items' ? 'Quantities' : 'Transport'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'items' ? (
            <>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Dispatch date</label>
                <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} className={fieldInputCls} />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_64px_64px_80px] gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-1">
                  <span>Product</span>
                  <span className="text-right">Ordered</span>
                  <span className="text-right">Sent</span>
                  <span className="text-right">To dispatch</span>
                </div>
                {lines.map((line, idx) => {
                  const remaining = line.ordered - line.dispatched;
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_64px_64px_80px] gap-2 items-center py-2 border-b border-[var(--color-border-subtle)]">
                      <span className="text-[13px] text-[var(--color-text-primary)] truncate">{line.product}</span>
                      <span className="text-[12px] text-right tabular-nums text-[var(--color-text-tertiary)]">{line.ordered}</span>
                      <span className="text-[12px] text-right tabular-nums text-[var(--color-text-tertiary)]">{line.dispatched}</span>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={line.toDispatch}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value) || 0, remaining);
                          setLines((prev) => prev.map((l, i) => i === idx ? { ...l, toDispatch: String(val) } : l));
                        }}
                        className="h-8 px-2 border border-[var(--color-border-default)] rounded-md text-[13px] text-right tabular-nums bg-[var(--color-surface-primary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors"
                      />
                    </div>
                  );
                })}
              </div>

              <p className="text-right text-[12px] text-[var(--color-text-tertiary)]">
                Total items: <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{totalItems}</span>
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Transporter</label>
                <input value={transporter} onChange={(e) => setTransporter(e.target.value)} placeholder="Transporter name" className={fieldInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Vehicle no.</label>
                  <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g. MH 01 AB 1234" className={fieldInputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">LR number</label>
                  <input value={lrNumber} onChange={(e) => setLrNumber(e.target.value)} placeholder="Optional" className={fieldInputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">No. of packages</label>
                <input type="number" value={packages} onChange={(e) => setPackages(e.target.value)} placeholder="0" className={clsx(fieldInputCls, 'text-right tabular-nums max-w-[120px]')} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
          <div>
            {step === 'transport' && (
              <button onClick={() => setStep('items')} className="text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
              Cancel
            </button>
            {step === 'items' ? (
              <button
                onClick={() => { if (canProceed) setStep('transport'); }}
                disabled={!canProceed}
                className={clsx(
                  'h-9 px-5 rounded-lg text-[13px] font-medium transition-all duration-150',
                  canProceed
                    ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)]'
                    : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)] cursor-not-allowed',
                )}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="h-9 px-5 rounded-lg text-[13px] font-medium bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)] transition-all duration-150"
              >
                Confirm dispatch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
