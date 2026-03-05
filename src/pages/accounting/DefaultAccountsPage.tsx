/**
 * DefaultAccountsPage
 *
 * Configuration form to set the default GL accounts:
 *  - Inventory Account
 *  - COGS Account
 *  - Revenue Account
 *  - Discount Account
 *  - Tax Payable Account
 *
 * API:
 *  GET /api/v1/accounting/default-accounts
 *  PUT /api/v1/accounting/default-accounts
 */

import { useState, useCallback, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  accountingApi,
  type AccountDto,
  type CompanyDefaultAccountsResponse,
} from '@/lib/accountingApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DefaultAccountsForm {
  inventoryAccountId: string;
  cogsAccountId: string;
  revenueAccountId: string;
  discountAccountId: string;
  taxAccountId: string;
}

function responseToForm(data: CompanyDefaultAccountsResponse): DefaultAccountsForm {
  return {
    inventoryAccountId: data.inventoryAccountId != null ? String(data.inventoryAccountId) : '',
    cogsAccountId: data.cogsAccountId != null ? String(data.cogsAccountId) : '',
    revenueAccountId: data.revenueAccountId != null ? String(data.revenueAccountId) : '',
    discountAccountId: data.discountAccountId != null ? String(data.discountAccountId) : '',
    taxAccountId: data.taxAccountId != null ? String(data.taxAccountId) : '',
  };
}

function formToRequest(form: DefaultAccountsForm): Partial<CompanyDefaultAccountsResponse> {
  return {
    inventoryAccountId: form.inventoryAccountId ? Number(form.inventoryAccountId) : null,
    cogsAccountId: form.cogsAccountId ? Number(form.cogsAccountId) : null,
    revenueAccountId: form.revenueAccountId ? Number(form.revenueAccountId) : null,
    discountAccountId: form.discountAccountId ? Number(form.discountAccountId) : null,
    taxAccountId: form.taxAccountId ? Number(form.taxAccountId) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function DefaultAccountsPage() {
  const toast = useToast();

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [form, setForm] = useState<DefaultAccountsForm>({
    inventoryAccountId: '',
    cogsAccountId: '',
    revenueAccountId: '',
    discountAccountId: '',
    taxAccountId: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [defaults, accts] = await Promise.all([
        accountingApi.getDefaultAccounts(),
        accountingApi.getAccounts(),
      ]);
      setForm(responseToForm(defaults));
      setAccounts(accts);
    } catch {
      setError('Could not load default accounts configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await accountingApi.updateDefaultAccounts(formToRequest(form));
      setForm(responseToForm(updated));
      setSaveSuccess(true);
      toast.success('Default accounts saved successfully.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Account options ────────────────────────────────────────────────────────

  const accountOptions = [
    { value: '', label: 'Not configured' },
    ...accounts.map((a) => ({
      value: String(a.id),
      label: `${a.code} — ${a.name}`,
    })),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            Default Accounts
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            Configure the default GL accounts used for automated journal postings.
          </p>
        </div>
        {!isLoading && !error && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCcw size={14} />}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)]">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle size={20} className="text-[var(--color-error)] mb-3" />
            <p className="text-[13px] text-[var(--color-text-secondary)]">{error}</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={fetchData}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Account fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Inventory Account"
                options={accountOptions}
                value={form.inventoryAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, inventoryAccountId: e.target.value }))}
                hint="Used when recording inventory movements"
              />
              <Select
                label="Cost of Goods Sold (COGS)"
                options={accountOptions}
                value={form.cogsAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, cogsAccountId: e.target.value }))}
                hint="Debited when inventory is sold"
              />
              <Select
                label="Revenue Account"
                options={accountOptions}
                value={form.revenueAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, revenueAccountId: e.target.value }))}
                hint="Credited on sales invoices"
              />
              <Select
                label="Discount Account"
                options={accountOptions}
                value={form.discountAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, discountAccountId: e.target.value }))}
                hint="Used for trade discounts and rebates"
              />
              <Select
                label="Tax Payable Account"
                options={accountOptions}
                value={form.taxAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, taxAccountId: e.target.value }))}
                hint="GST / tax liability account"
              />
            </div>

            {/* Divider + Actions */}
            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Changes apply to future automated journal entries only.
              </p>
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-[12px] text-[var(--color-success-icon)]">
                    <CheckCircle2 size={14} />
                    Saved
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  leftIcon={<Save size={14} />}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
