import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  editData?: ProductFormData | null;
}

interface ProductFormData {
  name: string;
  sku: string;
  hsn: string;
  category: string;
  unit: string;
  gstRate: string;
  mrp: string;
  sellingPrice: string;
  costPrice: string;
  openingStock: string;
  description: string;
}

const emptyProduct: ProductFormData = {
  name: '', sku: '', hsn: '', category: '', unit: 'PCS',
  gstRate: '18', mrp: '', sellingPrice: '', costPrice: '',
  openingStock: '0', description: '',
};

const units = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'PKT', 'SET', 'NOS'];
const gstRates = ['0', '5', '12', '18', '28'];

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-9 px-3 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors duration-150';
const selectCls = inputCls + ' appearance-none cursor-pointer';

export function ProductEntryModal({ isOpen, onClose, onSubmit, editData }: ProductEntryModalProps) {
  const [form, setForm] = useState<ProductFormData>(editData || emptyProduct);
  const isEdit = !!editData;

  const set = (field: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.sku) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[5vh] sm:pt-[8vh]">
      <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative w-full max-w-xl max-h-[85vh] bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] overflow-hidden flex flex-col mx-4"
        style={{
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {isEdit ? 'Edit product' : 'New product'}
            </h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              {isEdit ? 'Update product details and pricing' : 'Add a product to your catalogue'}
            </p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors">
            <X size={15} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Product name" span={2}>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Copper Wire 2.5mm" className={inputCls} />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={set('sku')} placeholder="e.g. CW-250" className={inputCls} />
            </Field>
            <Field label="HSN code">
              <input value={form.hsn} onChange={set('hsn')} placeholder="e.g. 7408" className={inputCls} />
            </Field>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Category">
              <input value={form.category} onChange={set('category')} placeholder="e.g. Raw Materials" className={inputCls} />
            </Field>
            <Field label="Unit">
              <select value={form.unit} onChange={set('unit')} className={selectCls}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="GST rate">
              <select value={form.gstRate} onChange={set('gstRate')} className={selectCls}>
                {gstRates.map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </Field>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--color-border-subtle)]" />

          {/* Pricing */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">Pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="MRP (INR)">
                <input type="number" step="0.01" value={form.mrp} onChange={set('mrp')} placeholder="0.00" className={clsx(inputCls, 'text-right tabular-nums')} />
              </Field>
              <Field label="Selling price (INR)">
                <input type="number" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="0.00" className={clsx(inputCls, 'text-right tabular-nums')} />
              </Field>
              <Field label="Cost price (INR)">
                <input type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} placeholder="0.00" className={clsx(inputCls, 'text-right tabular-nums')} />
              </Field>
            </div>
          </div>

          {/* Stock & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Opening stock">
              <input type="number" value={form.openingStock} onChange={set('openingStock')} placeholder="0" className={clsx(inputCls, 'text-right tabular-nums')} />
            </Field>
            <Field label="Description" span={2}>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Optional notes"
                rows={2}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-lg text-[13px] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neutral-300)] transition-colors duration-150 resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.sku}
            className={clsx(
              'h-9 px-5 rounded-lg text-[13px] font-medium transition-all duration-150',
              form.name && form.sku
                ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)] hover:bg-[var(--color-neutral-800)]'
                : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)] cursor-not-allowed',
            )}
          >
            {isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}
