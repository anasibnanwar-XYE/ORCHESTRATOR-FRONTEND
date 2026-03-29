import { useState, useCallback, useMemo } from 'react';
import { X, Plus, Trash2, Paperclip, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';

interface JournalLine {
  id: string;
  account: string;
  debit: string;
  credit: string;
  narration: string;
}

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    voucherNo: string;
    narration: string;
    lines: JournalLine[];
  }) => void;
  accounts?: string[];
}

function emptyLine(): JournalLine {
  return { id: uuidv4(), account: '', debit: '', credit: '', narration: '' };
}

function formatINR(v: number) {
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function JournalEntryModal({ isOpen, onClose, onSubmit, accounts = [] }: JournalEntryModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);

  const updateLine = useCallback((id: string, field: keyof JournalLine, value: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === 'debit' && value) updated.credit = '';
        if (field === 'credit' && value) updated.debit = '';
        return updated;
      }),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => (prev.length <= 2 ? prev : prev.filter((l) => l.id !== id)));
  }, []);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const handleSubmit = () => {
    if (!totals.balanced) return;
    onSubmit({ date, voucherNo, narration, lines });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[5vh] sm:pt-[8vh]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-xl overflow-hidden flex flex-col mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">New Journal Entry</h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Record a manual journal voucher</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors"
          >
            <X size={16} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/10 focus-visible:border-[var(--color-neutral-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Voucher No.</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="Auto"
                className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/10 focus-visible:border-[var(--color-neutral-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">Narration</label>
              <input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Entry description"
                className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)]/10 focus-visible:border-[var(--color-neutral-400)]"
              />
            </div>
          </div>

          {/* Lines table (desktop) */}
          <div className="hidden sm:block border border-[var(--color-border-default)] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[35%]">Account</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[18%]">Debit (₹)</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5 w-[18%]">Credit (₹)</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-3 py-2.5">Narration</th>
                  <th className="px-2 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-t border-[var(--color-border-subtle)]">
                    <td className="px-2 py-1.5">
                      <input
                        list={`accts-${idx}`}
                        value={line.account}
                        onChange={(e) => updateLine(line.id, 'account', e.target.value)}
                        placeholder="Search account"
                        className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                      />
                      {accounts.length > 0 && (
                        <datalist id={`accts-${idx}`}>
                          {accounts.map((a) => <option key={a} value={a} />)}
                        </datalist>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-right tabular-nums text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-right tabular-nums text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={line.narration}
                        onChange={(e) => updateLine(line.id, 'narration', e.target.value)}
                        placeholder="Note"
                        className="w-full h-8 px-2 border border-transparent rounded-md text-[13px] text-[var(--color-text-primary)] bg-transparent hover:border-[var(--color-border-default)] focus:border-[var(--color-border-default)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {formatINR(totals.debit)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {formatINR(totals.credit)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Lines cards (mobile) */}
          <div className="sm:hidden space-y-3">
            {lines.map((line, idx) => (
              <div key={line.id} className="border border-[var(--color-border-default)] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Line {idx + 1}
                  </span>
                  <button
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 2}
                    className="h-6 w-6 flex items-center justify-center rounded text-[var(--color-text-tertiary)] disabled:opacity-30"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <input
                  list={`accts-m-${idx}`}
                  value={line.account}
                  onChange={(e) => updateLine(line.id, 'account', e.target.value)}
                  placeholder="Account name"
                  className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] focus:outline-none"
                />
                {accounts.length > 0 && (
                  <datalist id={`accts-m-${idx}`}>
                    {accounts.map((a) => <option key={a} value={a} />)}
                  </datalist>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Debit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={line.debit}
                      onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] text-right tabular-nums bg-[var(--color-surface-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1 block">Credit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={line.credit}
                      onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] text-right tabular-nums bg-[var(--color-surface-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add line + balance status */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Plus size={14} />
              Add line
            </button>

            {!totals.balanced && totals.debit + totals.credit > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <AlertCircle size={12} />
                <span className="text-[11px] font-medium">
                  Difference: ₹{formatINR(Math.abs(totals.debit - totals.credit))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
          <button className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors">
            <Paperclip size={13} />
            Attach
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!totals.balanced}
              className={clsx(
                'h-9 px-5 rounded-lg text-[13px] font-medium transition-all duration-150',
                totals.balanced
                  ? 'bg-[var(--color-neutral-900)] text-white hover:bg-[var(--color-neutral-800)]'
                  : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)] cursor-not-allowed',
              )}
            >
              Post Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
