import { useState, useCallback, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';

interface OrderLine {
  id: string;
  product: string;
  qty: string;
  rate: string;
  gst: string;
  amount: number;
}

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    dealer: string;
    orderDate: string;
    poNumber: string;
    lines: OrderLine[];
    notes: string;
  }) => void;
  products?: string[];
  dealers?: string[];
}

function emptyLine(): OrderLine {
  return { id: uuidv4(), product: '', qty: '', rate: '', gst: '18', amount: 0 };
}

function fmt(v: number) {
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inputCls = 'w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors';
const fieldInputCls = 'w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors duration-150';

export function SalesOrderModal({ isOpen, onClose, onSubmit, products = [], dealers = [] }: SalesOrderModalProps) {
  const [dealer, setDealer] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([emptyLine(), emptyLine()]);

  const updateLine = useCallback((id: string, field: keyof OrderLine, value: string) => {
    setLines((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      const qty = parseFloat(field === 'qty' ? value : l.qty) || 0;
      const rate = parseFloat(field === 'rate' ? value : l.rate) || 0;
      const gst = parseFloat(field === 'gst' ? value : l.gst) || 0;
      updated.amount = qty * rate * (1 + gst / 100);
      return updated;
    }));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.length <= 1 ? prev : prev.filter((l) => l.id !== id));
  }, []);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => {
      const qty = parseFloat(l.qty) || 0;
      const rate = parseFloat(l.rate) || 0;
      return s + (qty * rate);
    }, 0);
    const tax = lines.reduce((s, l) => {
      const qty = parseFloat(l.qty) || 0;
      const rate = parseFloat(l.rate) || 0;
      const gst = parseFloat(l.gst) || 0;
      return s + (qty * rate * gst / 100);
    }, 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  const canSubmit = dealer && lines.some((l) => l.product && parseFloat(l.qty) > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[4vh] sm:pt-[6vh]">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl max-h-[88vh] bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] overflow-hidden flex flex-col mx-4"
        style={{
          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.05)',
          animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">New sales order</h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Create an order against a dealer</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors">
            <X size={15} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Dealer</label>
              <input
                list="so-dealers"
                value={dealer}
                onChange={(e) => setDealer(e.target.value)}
                placeholder="Search dealer"
                className={fieldInputCls}
              />
              {dealers.length > 0 && (
                <datalist id="so-dealers">
                  {dealers.map((d) => <option key={d} value={d} />)}
                </datalist>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Order date</label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={fieldInputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">PO number</label>
              <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Optional" className={fieldInputCls} />
            </div>
          </div>

          {/* Lines table (desktop) */}
          <div className="hidden sm:block border border-[var(--color-border-default)] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[30%]">Product</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[12%]">Qty</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[15%]">Rate (INR)</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[10%]">GST %</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[18%]">Amount (INR)</th>
                  <th className="px-2 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-t border-[var(--color-border-subtle)]">
                    <td className="px-2 py-1.5">
                      <input
                        list={`so-prod-${idx}`}
                        value={line.product}
                        onChange={(e) => updateLine(line.id, 'product', e.target.value)}
                        placeholder="Search product"
                        className={inputCls}
                      />
                      {products.length > 0 && (
                        <datalist id={`so-prod-${idx}`}>
                          {products.map((p) => <option key={p} value={p} />)}
                        </datalist>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={line.qty} onChange={(e) => updateLine(line.id, 'qty', e.target.value)} placeholder="0" className={clsx(inputCls, 'text-right tabular-nums')} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" step="0.01" value={line.rate} onChange={(e) => updateLine(line.id, 'rate', e.target.value)} placeholder="0.00" className={clsx(inputCls, 'text-right tabular-nums')} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={line.gst} onChange={(e) => updateLine(line.id, 'gst', e.target.value)} placeholder="18" className={clsx(inputCls, 'text-right tabular-nums')} />
                    </td>
                    <td className="px-3 py-1.5 text-right text-[13px] tabular-nums text-[var(--color-text-primary)]">
                      {line.amount > 0 ? fmt(line.amount) : '—'}
                    </td>
                    <td className="px-1 py-1.5">
                      <button onClick={() => removeLine(line.id)} disabled={lines.length <= 1} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lines (mobile) */}
          <div className="sm:hidden space-y-3">
            {lines.map((line, idx) => (
              <div key={line.id} className="border border-[var(--color-border-default)] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Item {idx + 1}</span>
                  <button onClick={() => removeLine(line.id)} disabled={lines.length <= 1} className="text-[var(--color-text-tertiary)] disabled:opacity-30">
                    <Trash2 size={12} />
                  </button>
                </div>
                <input list={`so-prodm-${idx}`} value={line.product} onChange={(e) => updateLine(line.id, 'product', e.target.value)} placeholder="Product" className={fieldInputCls} />
                {products.length > 0 && <datalist id={`so-prodm-${idx}`}>{products.map((p) => <option key={p} value={p} />)}</datalist>}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Qty</label>
                    <input type="number" value={line.qty} onChange={(e) => updateLine(line.id, 'qty', e.target.value)} placeholder="0" className={clsx(fieldInputCls, 'text-right tabular-nums')} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Rate</label>
                    <input type="number" step="0.01" value={line.rate} onChange={(e) => updateLine(line.id, 'rate', e.target.value)} placeholder="0.00" className={clsx(fieldInputCls, 'text-right tabular-nums')} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">GST</label>
                    <input type="number" value={line.gst} onChange={(e) => updateLine(line.id, 'gst', e.target.value)} placeholder="18" className={clsx(fieldInputCls, 'text-right tabular-nums')} />
                  </div>
                </div>
                {line.amount > 0 && (
                  <p className="text-right text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">INR {fmt(line.amount)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add line */}
          <button
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Plus size={13} className="inline mr-1" />Add item
          </button>

          {/* Totals */}
          <div className="border-t border-[var(--color-border-subtle)] pt-3 space-y-1.5 max-w-[240px] ml-auto">
            <div className="flex justify-between text-[12px]">
              <span className="text-[var(--color-text-tertiary)]">Subtotal</span>
              <span className="tabular-nums text-[var(--color-text-secondary)]">INR {fmt(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[var(--color-text-tertiary)]">Tax</span>
              <span className="tabular-nums text-[var(--color-text-secondary)]">INR {fmt(totals.tax)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-semibold pt-1.5 border-t border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-primary)]">Total</span>
              <span className="tabular-nums text-[var(--color-text-primary)]">INR {fmt(totals.total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Remarks</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions" rows={2} className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
            Discard
          </button>
          <button
            onClick={() => { if (canSubmit) onSubmit({ dealer, orderDate, poNumber, lines, notes }); }}
            disabled={!canSubmit}
            className={clsx(
              'h-9 px-5 rounded-lg text-[13px] font-medium transition-all duration-150',
              canSubmit
                ? 'bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-800)]'
                : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)] cursor-not-allowed',
            )}
          >
            Create order
          </button>
        </div>
      </div>
    </div>
  );
}
