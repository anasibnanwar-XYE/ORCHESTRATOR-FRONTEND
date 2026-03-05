/**
 * CompanySwitcher — header dropdown for switching between companies.
 *
 * Features:
 *  - Shows current company code in a compact trigger button
 *  - Dropdown lists all available companies (fetched from /companies)
 *  - Inline search to filter companies by name or code
 *  - Calls switchCompany() on selection, updates tokens and portal data
 *  - Shows loading state while switching
 *  - Only mounted for ROLE_ADMIN users (who can access /companies)
 *  - Closes on outside click or after successful switch
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { Building2, Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/error-resolver';
import type { Company } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// CompanySwitcher
// ─────────────────────────────────────────────────────────────────────────────

export function CompanySwitcher() {
  const { session, switchCompany, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [query, setQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentCode = session?.companyCode ?? user?.companyCode ?? '';

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [isOpen]);

  // Fetch companies when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    setIsFetching(true);
    adminApi
      .getCompanies()
      .then((data) => {
        setCompanies(data);
      })
      .catch(() => {
        // Silently fail — switcher will just show empty state
        setCompanies([]);
      })
      .finally(() => {
        setIsFetching(false);
        // Focus search after companies load
        requestAnimationFrame(() => searchRef.current?.focus());
      });
  }, [isOpen]);

  // Filter companies by query
  const filtered = companies.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const handleOpen = () => {
    setQuery('');
    setIsOpen((v) => !v);
  };

  const handleSelect = useCallback(
    async (company: Company) => {
      if (company.code === currentCode) {
        setIsOpen(false);
        return;
      }

      setIsSwitching(true);
      try {
        await switchCompany({ companyCode: company.code });
        toast.success('Company switched', `Now viewing ${company.name}`);
        setIsOpen(false);
        // Navigate to /hub to force remount of all portal pages so stale
        // company-specific data (fetched under the previous company token)
        // is discarded and fresh data is loaded under the new company.
        navigate('/hub');
      } catch (err) {
        toast.error('Switch failed', getErrorMessage(err) ?? 'Something went wrong, please try again');
      } finally {
        setIsSwitching(false);
      }
    },
    [currentCode, switchCompany, toast, navigate]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={isSwitching}
        className={clsx(
          'flex items-center gap-1.5 h-8 px-2.5 rounded-lg',
          'text-[12px] font-medium',
          'bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--color-surface-tertiary)] transition-colors duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]',
        )}
        aria-label="Switch company"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isSwitching ? (
          <Loader2 size={12} className="animate-spin text-[var(--color-text-tertiary)]" />
        ) : (
          <Building2 size={12} className="text-[var(--color-text-tertiary)]" />
        )}
        <span className="font-mono tracking-tight">{currentCode || 'Company'}</span>
        <ChevronDown
          size={11}
          className={clsx(
            'text-[var(--color-text-tertiary)] transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-1.5 z-50 w-64',
            'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
            'rounded-xl overflow-hidden',
          )}
          style={{
            boxShadow: '0 8px 30px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.05)',
            animation: 'o-scale-in 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            transformOrigin: 'top right',
          }}
          role="listbox"
          aria-label="Select company"
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
            <Search size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies..."
              className="flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
              autoComplete="off"
            />
          </div>

          {/* Company list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-[var(--color-text-tertiary)]" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-5 text-center text-[12px] text-[var(--color-text-tertiary)]">
                {query ? 'No matches' : 'No companies found'}
              </p>
            ) : (
              filtered.map((company) => {
                const isActive = company.code === currentCode;
                return (
                  <button
                    key={company.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(company)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                      'transition-colors duration-75',
                      isActive
                        ? 'bg-[var(--color-surface-secondary)]'
                        : 'hover:bg-[var(--color-surface-secondary)]',
                      !company.isActive && 'opacity-50',
                    )}
                  >
                    {/* Company code badge */}
                    <div className={clsx(
                      'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg',
                      'text-[9px] font-bold font-mono tracking-tight',
                      isActive
                        ? 'bg-[var(--color-neutral-900)] text-white'
                        : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
                    )}>
                      {company.code.slice(0, 3)}
                    </div>

                    {/* Company info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                        {company.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
                        {company.code}
                        {!company.isActive && ' · Inactive'}
                      </p>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <Check size={13} className="shrink-0 text-[var(--color-neutral-900)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard wrapper — only renders for ROLE_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps CompanySwitcher in a guard so it only renders for admin users.
 * Usage: `<AdminCompanySwitcher />` in portal headers.
 */
export function AdminCompanySwitcher(): ReactNode {
  const { user } = useAuth();
  if (!user || user.role !== 'ROLE_ADMIN') return null;
  return <CompanySwitcher />;
}
