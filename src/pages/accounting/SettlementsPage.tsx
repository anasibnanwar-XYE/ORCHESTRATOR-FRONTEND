/**
 * SettlementsPage
 *
 * Tabbed settlement operations:
 *  1. Dealer Receipt         — standard receipt with invoice allocation
 *  2. Hybrid Receipt         — split across cash + bank accounts
 *  3. Supplier Payment       — payment against supplier POs/purchases
 *  4. Dealer Settlement      — net unsettled invoices/receipts
 *  5. Supplier Settlement    — net supplier invoices/payments
 *  6. Credit Note            — credit against a sales invoice
 *  7. Debit Note             — debit against a purchase
 *  8. Bad Debt Write-off     — write off uncollectable invoice
 *  9. Accrual                — record accrual entry
 *
 * API endpoints used are in accountingApi.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  accountingApi,
  type AccountDto,
  type DealerResponse,
  type SupplierResponse,
  type InvoiceRef,
  type PurchaseRef,
} from '@/lib/accountingApi';

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────

type TabId =
  | 'dealer-receipt'
  | 'hybrid-receipt'
  | 'supplier-payment'
  | 'dealer-settlement'
  | 'supplier-settlement'
  | 'credit-note'
  | 'debit-note'
  | 'bad-debt'
  | 'accrual';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dealer-receipt', label: 'Dealer Receipt' },
  { id: 'hybrid-receipt', label: 'Hybrid Receipt' },
  { id: 'supplier-payment', label: 'Supplier Payment' },
  { id: 'dealer-settlement', label: 'Dealer Settlement' },
  { id: 'supplier-settlement', label: 'Supplier Settlement' },
  { id: 'credit-note', label: 'Credit Note' },
  { id: 'debit-note', label: 'Debit Note' },
  { id: 'bad-debt', label: 'Bad Debt Write-off' },
  { id: 'accrual', label: 'Accrual' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface SuccessResultProps {
  message: string;
  referenceNumber?: string;
  onReset: () => void;
}

function SuccessResult({ message, referenceNumber, onReset }: SuccessResultProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-tertiary)] p-5 text-center space-y-3">
      <div className="flex justify-center">
        <div className="h-10 w-10 rounded-full bg-[var(--color-success-icon)]/10 flex items-center justify-center">
          <svg className="h-5 w-5 text-[var(--color-success-icon)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{message}</p>
        {referenceNumber && (
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5 tabular-nums">
            Reference: {referenceNumber}
          </p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onReset}>
        Record another
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dealer Receipt Form
// ─────────────────────────────────────────────────────────────────────────────

interface DealerReceiptFormProps {
  dealers: DealerResponse[];
  accounts: AccountDto[];
}

function DealerReceiptForm({ dealers, accounts }: DealerReceiptFormProps) {
  const toast = useToast();
  const [dealerId, setDealerId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dealerInvoices, setDealerInvoices] = useState<InvoiceRef[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const handleDealerChange = useCallback(async (id: string) => {
    setDealerId(id);
    setInvoiceId('');
    if (!id) { setDealerInvoices([]); return; }
    setInvoicesLoading(true);
    try {
      const inv = await accountingApi.getDealerInvoices(Number(id));
      setDealerInvoices(inv.filter((i) => i.status !== 'PAID' && Number(i.outstandingAmount) > 0));
    } catch {
      setDealerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!dealerId) errs.dealerId = 'Select a dealer';
    if (!cashAccountId) errs.cashAccountId = 'Select a payment account';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!invoiceId) errs.invoiceId = 'Select an invoice to allocate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.recordDealerReceipt({
        dealerId: Number(dealerId),
        cashAccountId: Number(cashAccountId),
        amount: Number(amount),
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
        allocations: [{ invoiceId: Number(invoiceId), amount: Number(amount) }],
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Dealer receipt recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Dealer receipt recorded successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDealerId(''); setCashAccountId(''); setAmount(''); setInvoiceId(''); setMemo('');
          setDealerInvoices([]);
        }}
      />
    );
  }

  const dealerOptions = [
    { value: '', label: 'Select dealer...' },
    ...dealers.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
  ];
  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];
  const invoiceOptions = [
    { value: '', label: invoicesLoading ? 'Loading invoices...' : dealerId ? 'Select invoice...' : 'Select dealer first' },
    ...dealerInvoices.map((inv) => ({
      value: String(inv.id),
      label: `${inv.invoiceNumber} — Outstanding: ₹${Number(inv.outstandingAmount).toLocaleString('en-IN')}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Record a standard payment from a dealer against a specific invoice.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Dealer"
          options={dealerOptions}
          value={dealerId}
          onChange={(e) => { void handleDealerChange(e.target.value); }}
          error={errors.dealerId}
        />
        <Select
          label="Payment Account (Cash/Bank)"
          options={accountOptions}
          value={cashAccountId}
          onChange={(e) => setCashAccountId(e.target.value)}
          error={errors.cashAccountId}
        />
        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />
        <Select
          label="Invoice to Allocate"
          options={invoiceOptions}
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          error={errors.invoiceId}
          disabled={!dealerId || invoicesLoading}
        />
        <div className="sm:col-span-2">
          <Input
            label="Memo (optional)"
            placeholder="Payment description..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Payment'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hybrid Receipt Form
// ─────────────────────────────────────────────────────────────────────────────

interface HybridLine {
  id: string;
  cashAccountId: string;
  amount: string;
  invoiceId: string;
}

interface HybridReceiptFormProps {
  dealers: DealerResponse[];
  accounts: AccountDto[];
}

function HybridReceiptForm({ dealers, accounts }: HybridReceiptFormProps) {
  const toast = useToast();
  const [dealerId, setDealerId] = useState('');
  const [lines, setLines] = useState<HybridLine[]>([
    { id: uuidv4(), cashAccountId: '', amount: '', invoiceId: '' },
  ]);
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);

  const addLine = () => {
    setLines((prev) => [...prev, { id: uuidv4(), cashAccountId: '', amount: '', invoiceId: '' }]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof Omit<HybridLine, 'id'>, value: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = async () => {
    if (!dealerId) { toast.error('Select a dealer.'); return; }
    const validLines = lines.filter((l) => l.cashAccountId && l.amount && Number(l.amount) > 0);
    if (validLines.length === 0) { toast.error('Add at least one payment line.'); return; }

    setIsLoading(true);
    try {
      const entry = await accountingApi.recordHybridReceipt({
        dealerId: Number(dealerId),
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
        incomingLines: validLines.map((l) => ({
          cashAccountId: Number(l.cashAccountId),
          amount: Number(l.amount),
          allocations: l.invoiceId ? [{ invoiceId: Number(l.invoiceId), amount: Number(l.amount) }] : [],
        })),
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Hybrid receipt recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record hybrid receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Hybrid receipt recorded successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDealerId(''); setLines([{ id: uuidv4(), cashAccountId: '', amount: '', invoiceId: '' }]); setMemo('');
        }}
      />
    );
  }

  const dealerOptions = [
    { value: '', label: 'Select dealer...' },
    ...dealers.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
  ];
  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Split a dealer payment across multiple cash and bank accounts.
      </p>
      <Select
        label="Dealer"
        options={dealerOptions}
        value={dealerId}
        onChange={(e) => setDealerId(e.target.value)}
      />

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Payment Lines</p>
        {lines.map((line, idx) => (
          <div key={line.id} className="grid gap-2 sm:grid-cols-3 items-end p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
            <Select
              label={idx === 0 ? 'Account' : undefined}
              options={accountOptions}
              value={line.cashAccountId}
              onChange={(e) => updateLine(line.id, 'cashAccountId', e.target.value)}
            />
            <Input
              label={idx === 0 ? 'Amount' : undefined}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={line.amount}
              onChange={(e) => updateLine(line.id, 'amount', e.target.value)}
            />
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <Input
                  label={idx === 0 ? 'Invoice ID (optional)' : undefined}
                  type="number"
                  placeholder="Invoice ID"
                  value={line.invoiceId}
                  onChange={(e) => updateLine(line.id, 'invoiceId', e.target.value)}
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="mb-0 h-9 w-9 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] py-1"
        >
          <Plus size={13} />
          Add payment line
        </button>
      </div>

      <Input
        label="Memo (optional)"
        placeholder="Payment description..."
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Hybrid Receipt'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Supplier Payment Form
// ─────────────────────────────────────────────────────────────────────────────

interface SupplierPaymentFormProps {
  suppliers: SupplierResponse[];
  accounts: AccountDto[];
}

function SupplierPaymentForm({ suppliers, accounts }: SupplierPaymentFormProps) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supplierPurchases, setSupplierPurchases] = useState<PurchaseRef[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const handleSupplierChange = useCallback(async (id: string) => {
    setSupplierId(id);
    setPurchaseId('');
    if (!id) { setSupplierPurchases([]); return; }
    setPurchasesLoading(true);
    try {
      const purchases = await accountingApi.getSupplierPurchases(Number(id));
      setSupplierPurchases(purchases.filter((p) => Number(p.outstandingAmount) > 0));
    } catch {
      setSupplierPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplierId = 'Select a supplier';
    if (!cashAccountId) errs.cashAccountId = 'Select a payment account';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!purchaseId) errs.purchaseId = 'Select a purchase invoice to allocate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.recordSupplierPayment({
        supplierId: Number(supplierId),
        cashAccountId: Number(cashAccountId),
        amount: Number(amount),
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
        allocations: [{ purchaseId: Number(purchaseId), amount: Number(amount) }],
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Supplier payment recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Supplier payment recorded successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setSupplierId(''); setCashAccountId(''); setAmount(''); setPurchaseId(''); setMemo('');
          setSupplierPurchases([]);
        }}
      />
    );
  }

  const supplierOptions = [
    { value: '', label: 'Select supplier...' },
    ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
  ];
  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];
  const purchaseOptions = [
    { value: '', label: purchasesLoading ? 'Loading purchases...' : supplierId ? 'Select purchase...' : 'Select supplier first' },
    ...supplierPurchases.map((p) => ({
      value: String(p.id),
      label: `${p.invoiceNumber} — Outstanding: ₹${Number(p.outstandingAmount).toLocaleString('en-IN')}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Record a payment to a supplier against a specific purchase invoice.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Supplier"
          options={supplierOptions}
          value={supplierId}
          onChange={(e) => { void handleSupplierChange(e.target.value); }}
          error={errors.supplierId}
        />
        <Select
          label="Payment Account"
          options={accountOptions}
          value={cashAccountId}
          onChange={(e) => setCashAccountId(e.target.value)}
          error={errors.cashAccountId}
        />
        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />
        <Select
          label="Purchase Invoice to Allocate"
          options={purchaseOptions}
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          error={errors.purchaseId}
          disabled={!supplierId || purchasesLoading}
        />
        <div className="sm:col-span-2">
          <Input
            label="Memo (optional)"
            placeholder="Payment description..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Supplier Payment'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Dealer Settlement Form
// ─────────────────────────────────────────────────────────────────────────────

interface DealerSettlementFormProps {
  dealers: DealerResponse[];
  accounts: AccountDto[];
}

function DealerSettlementForm({ dealers, accounts }: DealerSettlementFormProps) {
  const toast = useToast();
  const [dealerId, setDealerId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [discountAccountId, setDiscountAccountId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(todayISO());
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ totalApplied: number; refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dealerInvoices, setDealerInvoices] = useState<InvoiceRef[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const handleDealerChange = useCallback(async (id: string) => {
    setDealerId(id);
    setInvoiceId('');
    if (!id) { setDealerInvoices([]); return; }
    setInvoicesLoading(true);
    try {
      const inv = await accountingApi.getDealerInvoices(Number(id));
      setDealerInvoices(inv.filter((i) => i.status !== 'PAID' && Number(i.outstandingAmount) > 0));
    } catch {
      setDealerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!dealerId) errs.dealerId = 'Select a dealer';
    if (!invoiceId) errs.invoiceId = 'Select an invoice';
    if (!allocAmount || Number(allocAmount) <= 0) errs.allocAmount = 'Enter amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const resp = await accountingApi.createDealerSettlement({
        dealerId: Number(dealerId),
        cashAccountId: cashAccountId ? Number(cashAccountId) : undefined,
        discountAccountId: discountAccountId ? Number(discountAccountId) : undefined,
        settlementDate: settlementDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
        allocations: [{ invoiceId: Number(invoiceId), amount: Number(allocAmount) }],
      });
      setResult({ totalApplied: resp.totalApplied, refNumber: resp.journalEntry.referenceNumber });
      toast.success('Dealer settlement created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Settlement failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message={`Dealer settlement created. Total applied: ₹${result.totalApplied.toLocaleString('en-IN')}`}
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDealerId(''); setCashAccountId(''); setDiscountAccountId(''); setInvoiceId('');
          setAllocAmount(''); setSettlementDate(todayISO()); setMemo('');
          setDealerInvoices([]);
        }}
      />
    );
  }

  const dealerOptions = [
    { value: '', label: 'Select dealer...' },
    ...dealers.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
  ];
  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];
  const invoiceOptions = [
    { value: '', label: invoicesLoading ? 'Loading invoices...' : dealerId ? 'Select invoice...' : 'Select dealer first' },
    ...dealerInvoices.map((inv) => ({
      value: String(inv.id),
      label: `${inv.invoiceNumber} — Outstanding: ₹${Number(inv.outstandingAmount).toLocaleString('en-IN')}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Net unsettled invoices and receipts into a settlement document with journal posting.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Dealer" options={dealerOptions} value={dealerId} onChange={(e) => { void handleDealerChange(e.target.value); }} error={errors.dealerId} />
        <Select label="Cash/Bank Account (optional)" options={accountOptions} value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} />
        <Select label="Discount Account (optional)" options={accountOptions} value={discountAccountId} onChange={(e) => setDiscountAccountId(e.target.value)} />
        <Input label="Settlement Date" type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} />
        <Select
          label="Invoice"
          options={invoiceOptions}
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          error={errors.invoiceId}
          disabled={!dealerId || invoicesLoading}
        />
        <Input label="Allocation Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} error={errors.allocAmount} />
        <div className="sm:col-span-2">
          <Input label="Memo (optional)" placeholder="Settlement notes..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Create Dealer Settlement'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Supplier Settlement Form
// ─────────────────────────────────────────────────────────────────────────────

interface SupplierSettlementFormProps {
  suppliers: SupplierResponse[];
  accounts: AccountDto[];
}

function SupplierSettlementForm({ suppliers, accounts }: SupplierSettlementFormProps) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(todayISO());
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ totalApplied: number; refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supplierPurchases, setSupplierPurchases] = useState<PurchaseRef[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const handleSupplierChange = useCallback(async (id: string) => {
    setSupplierId(id);
    setPurchaseId('');
    if (!id) { setSupplierPurchases([]); return; }
    setPurchasesLoading(true);
    try {
      const purchases = await accountingApi.getSupplierPurchases(Number(id));
      setSupplierPurchases(purchases.filter((p) => Number(p.outstandingAmount) > 0));
    } catch {
      setSupplierPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplierId = 'Select a supplier';
    if (!cashAccountId) errs.cashAccountId = 'Select a payment account';
    if (!purchaseId) errs.purchaseId = 'Select a purchase invoice';
    if (!allocAmount || Number(allocAmount) <= 0) errs.allocAmount = 'Enter amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const resp = await accountingApi.createSupplierSettlement({
        supplierId: Number(supplierId),
        cashAccountId: Number(cashAccountId),
        settlementDate: settlementDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
        allocations: [{ purchaseId: Number(purchaseId), amount: Number(allocAmount) }],
      });
      setResult({ totalApplied: resp.totalApplied, refNumber: resp.journalEntry.referenceNumber });
      toast.success('Supplier settlement created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Settlement failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message={`Supplier settlement created. Total applied: ₹${result.totalApplied.toLocaleString('en-IN')}`}
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setSupplierId(''); setCashAccountId(''); setPurchaseId(''); setAllocAmount('');
          setSettlementDate(todayISO()); setMemo('');
          setSupplierPurchases([]);
        }}
      />
    );
  }

  const supplierOptions = [{ value: '', label: 'Select supplier...' }, ...suppliers.map((s) => ({ value: String(s.id), label: `${s.name}` }))];
  const accountOptions = [{ value: '', label: 'Select account...' }, ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }))];
  const purchaseOptions = [
    { value: '', label: purchasesLoading ? 'Loading purchases...' : supplierId ? 'Select purchase...' : 'Select supplier first' },
    ...supplierPurchases.map((p) => ({
      value: String(p.id),
      label: `${p.invoiceNumber} — Outstanding: ₹${Number(p.outstandingAmount).toLocaleString('en-IN')}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Settle outstanding supplier invoices with a payment allocation.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Supplier" options={supplierOptions} value={supplierId} onChange={(e) => { void handleSupplierChange(e.target.value); }} error={errors.supplierId} />
        <Select label="Payment Account" options={accountOptions} value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} error={errors.cashAccountId} />
        <Input label="Settlement Date" type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} />
        <Select
          label="Purchase Invoice"
          options={purchaseOptions}
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          error={errors.purchaseId}
          disabled={!supplierId || purchasesLoading}
        />
        <Input label="Allocation Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} error={errors.allocAmount} />
        <div className="sm:col-span-2">
          <Input label="Memo (optional)" placeholder="Notes..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Create Supplier Settlement'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Credit Note Form
// ─────────────────────────────────────────────────────────────────────────────

function CreditNoteForm({ dealers }: { dealers: DealerResponse[]; accounts?: AccountDto[] }) {
  const toast = useToast();
  const [dealerId, setDealerId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dealerInvoices, setDealerInvoices] = useState<InvoiceRef[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const handleDealerChange = useCallback(async (id: string) => {
    setDealerId(id);
    setInvoiceId('');
    if (!id) { setDealerInvoices([]); return; }
    setInvoicesLoading(true);
    try {
      const inv = await accountingApi.getDealerInvoices(Number(id));
      setDealerInvoices(inv);
    } catch {
      setDealerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!dealerId) errs.dealerId = 'Select a dealer';
    if (!invoiceId) errs.invoiceId = 'Select an invoice';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.createCreditNote({
        invoiceId: Number(invoiceId),
        amount: Number(amount),
        entryDate: entryDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Credit note created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create credit note.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Credit note created successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDealerId(''); setInvoiceId(''); setAmount(''); setMemo(''); setEntryDate(todayISO());
          setDealerInvoices([]);
        }}
      />
    );
  }

  const dealerOptions = [
    { value: '', label: 'Select dealer...' },
    ...dealers.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
  ];
  const invoiceOptions = [
    { value: '', label: invoicesLoading ? 'Loading invoices...' : dealerId ? 'Select invoice...' : 'Select dealer first' },
    ...dealerInvoices.map((inv) => ({
      value: String(inv.id),
      label: `${inv.invoiceNumber}${inv.outstandingAmount ? ` — ₹${Number(inv.outstandingAmount).toLocaleString('en-IN')}` : ''}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Issue a credit against a sales invoice to reduce the dealer's outstanding balance.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Dealer" options={dealerOptions} value={dealerId} onChange={(e) => { void handleDealerChange(e.target.value); }} error={errors.dealerId} />
        <Select
          label="Invoice"
          options={invoiceOptions}
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          error={errors.invoiceId}
          disabled={!dealerId || invoicesLoading}
        />
        <Input label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
        <Input label="Entry Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Memo (optional)" placeholder="Credit note reason..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Credit Note'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DebitNoteForm({ suppliers }: { suppliers: SupplierResponse[] }) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supplierPurchases, setSupplierPurchases] = useState<PurchaseRef[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const handleSupplierChange = useCallback(async (id: string) => {
    setSupplierId(id);
    setPurchaseId('');
    if (!id) { setSupplierPurchases([]); return; }
    setPurchasesLoading(true);
    try {
      const purchases = await accountingApi.getSupplierPurchases(Number(id));
      setSupplierPurchases(purchases);
    } catch {
      setSupplierPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplierId = 'Select a supplier';
    if (!purchaseId) errs.purchaseId = 'Select a purchase invoice';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.createDebitNote({
        purchaseId: Number(purchaseId),
        amount: Number(amount),
        entryDate: entryDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Debit note created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create debit note.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Debit note created successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setSupplierId(''); setPurchaseId(''); setAmount(''); setMemo(''); setEntryDate(todayISO());
          setSupplierPurchases([]);
        }}
      />
    );
  }

  const supplierOptions = [
    { value: '', label: 'Select supplier...' },
    ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
  ];
  const purchaseOptions = [
    { value: '', label: purchasesLoading ? 'Loading purchases...' : supplierId ? 'Select purchase...' : 'Select supplier first' },
    ...supplierPurchases.map((p) => ({
      value: String(p.id),
      label: `${p.invoiceNumber}${p.totalAmount ? ` — ₹${Number(p.totalAmount).toLocaleString('en-IN')}` : ''}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Issue a debit note against a purchase invoice to reduce the supplier's balance.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Supplier" options={supplierOptions} value={supplierId} onChange={(e) => { void handleSupplierChange(e.target.value); }} error={errors.supplierId} />
        <Select
          label="Purchase Invoice"
          options={purchaseOptions}
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          error={errors.purchaseId}
          disabled={!supplierId || purchasesLoading}
        />
        <Input label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
        <Input label="Entry Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Memo (optional)" placeholder="Debit note reason..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Debit Note'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function BadDebtForm({ accounts, dealers }: { accounts: AccountDto[]; dealers: DealerResponse[] }) {
  const toast = useToast();
  const [dealerId, setDealerId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dealerInvoices, setDealerInvoices] = useState<InvoiceRef[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const handleDealerChange = useCallback(async (id: string) => {
    setDealerId(id);
    setInvoiceId('');
    if (!id) { setDealerInvoices([]); return; }
    setInvoicesLoading(true);
    try {
      const inv = await accountingApi.getDealerInvoices(Number(id));
      setDealerInvoices(inv.filter((i) => i.status !== 'PAID'));
    } catch {
      setDealerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!dealerId) errs.dealerId = 'Select a dealer';
    if (!invoiceId) errs.invoiceId = 'Select an invoice';
    if (!expenseAccountId) errs.expenseAccountId = 'Select bad debt expense account';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.writeBadDebt({
        invoiceId: Number(invoiceId),
        expenseAccountId: Number(expenseAccountId),
        amount: Number(amount),
        entryDate: entryDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Bad debt written off.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to write off bad debt.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Bad debt written off successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDealerId(''); setInvoiceId(''); setExpenseAccountId(''); setAmount('');
          setMemo(''); setEntryDate(todayISO());
          setDealerInvoices([]);
        }}
      />
    );
  }

  const dealerOptions = [
    { value: '', label: 'Select dealer...' },
    ...dealers.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
  ];
  const invoiceOptions = [
    { value: '', label: invoicesLoading ? 'Loading invoices...' : dealerId ? 'Select invoice...' : 'Select dealer first' },
    ...dealerInvoices.map((inv) => ({
      value: String(inv.id),
      label: `${inv.invoiceNumber}${inv.outstandingAmount ? ` — ₹${Number(inv.outstandingAmount).toLocaleString('en-IN')} outstanding` : ''}`,
    })),
  ];
  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-4 py-3 flex items-start gap-2.5">
        <AlertCircle size={15} className="text-[var(--color-warning-icon)] shrink-0 mt-0.5" />
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          Bad debt write-off is irreversible. This will debit the bad debt expense account and credit Accounts Receivable.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Dealer" options={dealerOptions} value={dealerId} onChange={(e) => { void handleDealerChange(e.target.value); }} error={errors.dealerId} />
        <Select
          label="Invoice"
          options={invoiceOptions}
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          error={errors.invoiceId}
          disabled={!dealerId || invoicesLoading}
        />
        <Select label="Bad Debt Expense Account" options={accountOptions} value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} error={errors.expenseAccountId} />
        <Input label="Amount to Write Off" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
        <Input label="Entry Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Memo" placeholder="Reason for write-off..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="danger" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Writing off...' : 'Write Off Bad Debt'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface AccrualFormProps {
  accounts: AccountDto[];
}

function AccrualForm({ accounts }: AccrualFormProps) {
  const toast = useToast();
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [autoReverseDate, setAutoReverseDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ refNumber: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!debitAccountId) errs.debitAccountId = 'Select debit account';
    if (!creditAccountId) errs.creditAccountId = 'Select credit account';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const entry = await accountingApi.recordAccrual({
        debitAccountId: Number(debitAccountId),
        creditAccountId: Number(creditAccountId),
        amount: Number(amount),
        entryDate: entryDate || undefined,
        autoReverseDate: autoReverseDate || undefined,
        memo: memo || undefined,
        idempotencyKey: uuidv4(),
      });
      setResult({ refNumber: entry.referenceNumber });
      toast.success('Accrual recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record accrual.');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <SuccessResult
        message="Accrual entry posted successfully."
        referenceNumber={result.refNumber}
        onReset={() => {
          setResult(null);
          setDebitAccountId(''); setCreditAccountId(''); setAmount(''); setMemo(''); setAutoReverseDate('');
        }}
      />
    );
  }

  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        Record an accrual entry for expenses or revenues not yet invoiced. Set an auto-reverse date to automatically create a reversing entry.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Debit Account" options={accountOptions} value={debitAccountId} onChange={(e) => setDebitAccountId(e.target.value)} error={errors.debitAccountId} />
        <Select label="Credit Account" options={accountOptions} value={creditAccountId} onChange={(e) => setCreditAccountId(e.target.value)} error={errors.creditAccountId} />
        <Input label="Amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
        <Input label="Entry Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <Input label="Auto-Reverse Date (optional)" type="date" value={autoReverseDate} onChange={(e) => setAutoReverseDate(e.target.value)} hint="Leave blank to skip auto-reversal" />
        <div className="sm:col-span-2">
          <Input label="Memo (optional)" placeholder="Accrual description..." value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Accrual'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function SettlementsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dealer-receipt');
  const [dealers, setDealers] = useState<DealerResponse[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [d, s, a] = await Promise.all([
        accountingApi.getDealers(),
        accountingApi.getSuppliers(),
        accountingApi.getAccounts(),
      ]);
      setDealers(d);
      setSuppliers(s);
      setAccounts(a);
    } catch {
      setLoadError('Could not load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderTab = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <AlertCircle size={20} className="text-[var(--color-error)] mb-3" />
          <p className="text-[13px] text-[var(--color-text-secondary)]">{loadError}</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={fetchData}>Try again</Button>
        </div>
      );
    }
    switch (activeTab) {
      case 'dealer-receipt': return <DealerReceiptForm dealers={dealers} accounts={accounts} />;
      case 'hybrid-receipt': return <HybridReceiptForm dealers={dealers} accounts={accounts} />;
      case 'supplier-payment': return <SupplierPaymentForm suppliers={suppliers} accounts={accounts} />;
      case 'dealer-settlement': return <DealerSettlementForm dealers={dealers} accounts={accounts} />;
      case 'supplier-settlement': return <SupplierSettlementForm suppliers={suppliers} accounts={accounts} />;
      case 'credit-note': return <CreditNoteForm dealers={dealers} accounts={accounts} />;
      case 'debit-note': return <DebitNoteForm suppliers={suppliers} />;
      case 'bad-debt': return <BadDebtForm accounts={accounts} dealers={dealers} />;
      case 'accrual': return <AccrualForm accounts={accounts} />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Settlements
        </h1>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
          Record receipts, settlements, credit and debit notes, bad debt write-offs, and accruals.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[var(--color-border-default)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'shrink-0 px-4 h-10 text-[12px] font-medium transition-colors whitespace-nowrap border-b-2 -mb-[1px]',
                activeTab === tab.id
                  ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                  : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
