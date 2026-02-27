import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import JournalPage from './JournalPage';
import LedgerPage from './LedgerPage';
import PaymentsPage from './PaymentsPage';

const tabs = [
  { key: 'journal', label: 'Journal' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'payments', label: 'Payments' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'journal';
  const navigate = useNavigate();

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'journal' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Transactions</h1>
          <p className="mt-1 text-sm text-secondary">Journal entries, ledger views, and payment settlements</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/accounting/accounts')}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-surface-highlight"
        >
          <BookOpen className="h-4 w-4" />
          Chart of Accounts
        </button>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Transactions tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'border-b-2 border-primary pb-3 text-sm font-medium text-primary'
                  : 'border-b-2 border-transparent pb-3 text-sm font-medium text-secondary hover:border-border hover:text-primary transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'journal' && <JournalPage />}
        {activeTab === 'ledger' && <LedgerPage />}
        {activeTab === 'payments' && <PaymentsPage />}
      </div>
    </div>
  );
}
