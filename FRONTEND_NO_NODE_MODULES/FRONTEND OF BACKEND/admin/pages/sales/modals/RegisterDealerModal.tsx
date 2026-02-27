import { FormEvent, useState } from 'react';
import clsx from 'clsx';
import { Building2, User, Mail, Phone, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { createDealer, type CreateDealerPayload } from '../../../lib/accountingApi';
import type { AuthSession } from '../../../types/auth';

interface RegisterDealerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  session?: AuthSession | null;
}

interface FormData {
  name: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  creditLimit: string;
}

interface FormErrors {
  name?: string;
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  creditLimit?: string;
}

interface RegistrationResult {
  name: string;
  portalEmail: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  creditLimit: '',
};

export function RegisterDealerModal({ open, onOpenChange, onSuccess, session }: RegisterDealerModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Dealer name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Dealer name must be at least 2 characters';
    }

    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (form.companyName.trim().length < 3) {
      newErrors.companyName = 'Company name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Email is required';
    } else if (!emailRegex.test(form.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email';
    }

    if (!form.contactPhone.trim()) {
      newErrors.contactPhone = 'Phone is required';
    }

    if (form.creditLimit) {
      const limit = parseFloat(form.creditLimit.replace(/[^\d.]/g, ''));
      if (isNaN(limit) || limit <= 0) {
        newErrors.creditLimit = 'Credit limit must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !session) return;

    setIsSubmitting(true);
    try {
      const payload: CreateDealerPayload = {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim() || undefined,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit.replace(/[^\d.]/g, '')) : undefined,
      };

      const response = await createDealer(payload, session);
      setResult({
        name: response.name || '',
        portalEmail: response.portalEmail || response.email || form.contactEmail.trim(),
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to register dealer:', error);
      setErrors({ name: 'Failed to create dealer. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg">
        {/* Header */}
        <div className="sticky top-0 border-b border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-primary">
            {result ? 'Registration complete' : 'Register dealer account'}
          </h2>
          <p className="text-sm text-secondary mt-1">
            {result
              ? 'The dealer account has been created successfully.'
              : 'Create a new dealer account with contact and credit information.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            // Success State
            <div className="space-y-5">
              <div className="rounded-xl bg-status-success-bg/20 border border-status-success-bg p-5">
                <p className="text-sm font-medium text-status-success-text mb-2">
                  Account created for {result.name}
                </p>
                <p className="text-sm text-secondary leading-relaxed">
                  Login credentials have been sent to{' '}
                  <span className="font-medium text-primary">{result.portalEmail}</span>.
                  The dealer will be prompted to change their password on first sign-in.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full h-10 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                style={{
                  backgroundColor: 'var(--action-primary-bg)',
                  color: 'var(--action-primary-text)',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Basic information</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-widest text-secondary block">
                    Dealer name <span className="text-status-error-text">*</span>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Zenith Traders"
                        className={clsx(
                          'block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50',
                          errors.name && 'border-status-error-bg'
                        )}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-status-error-text mt-1">{errors.name}</p>}
                  </label>

                  <label className="text-xs uppercase tracking-widest text-secondary block">
                    Company name <span className="text-status-error-text">*</span>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                        placeholder="Registered legal entity"
                        className={clsx(
                          'block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50',
                          errors.companyName && 'border-status-error-bg'
                        )}
                      />
                    </div>
                    {errors.companyName && <p className="text-xs text-status-error-text mt-1">{errors.companyName}</p>}
                  </label>

                  <label className="text-xs uppercase tracking-widest text-secondary block">
                    Contact email <span className="text-status-error-text">*</span>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                        placeholder="name@company.com"
                        className={clsx(
                          'block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50',
                          errors.contactEmail && 'border-status-error-bg'
                        )}
                      />
                    </div>
                    {errors.contactEmail && (
                      <p className="text-xs text-status-error-text mt-1">{errors.contactEmail}</p>
                    )}
                  </label>

                  <label className="text-xs uppercase tracking-widest text-secondary block">
                    Contact phone <span className="text-status-error-text">*</span>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                      <input
                        type="tel"
                        value={form.contactPhone}
                        onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className={clsx(
                          'block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50',
                          errors.contactPhone && 'border-status-error-bg'
                        )}
                      />
                    </div>
                    {errors.contactPhone && (
                      <p className="text-xs text-status-error-text mt-1">{errors.contactPhone}</p>
                    )}
                  </label>
                </div>
              </section>

              {/* Location */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    Location <span className="text-secondary font-normal normal-case">(optional)</span>
                  </h3>
                </div>

                <label className="text-xs uppercase tracking-widest text-secondary block">
                  Business address
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Street, City, State, PIN"
                      className="block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-9 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50"
                    />
                  </div>
                </label>
              </section>

              {/* Credit Terms */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    Credit terms <span className="text-secondary font-normal normal-case">(optional)</span>
                  </h3>
                </div>

                <label className="text-xs uppercase tracking-widest text-secondary block">
                  Credit limit
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-sm text-secondary font-medium">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.creditLimit}
                      onChange={(e) => {
                        const num = e.target.value.replace(/[^\d]/g, '');
                        setForm((p) => ({ ...p, creditLimit: num }));
                      }}
                      placeholder="500000"
                      className={clsx(
                        'block w-full h-10 rounded-lg border border-border bg-surface px-3 pl-8 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-bg/50',
                        errors.creditLimit && 'border-status-error-bg'
                      )}
                    />
                  </div>
                  {errors.creditLimit ? (
                    <p className="text-xs text-status-error-text mt-1">{errors.creditLimit}</p>
                  ) : (
                    <p className="text-xs text-secondary mt-1">Leave blank for cash-only account</p>
                  )}
                </label>
              </section>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg border border-border bg-surface text-primary hover:bg-surface-highlight transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--action-primary-bg)',
                    color: 'var(--action-primary-text)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register dealer'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

