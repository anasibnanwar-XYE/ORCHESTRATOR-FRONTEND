import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AccountingPeriodsPage from './AccountingPeriodsPage';
import MonthEndPage from './MonthEndPage';
import BankReconciliationPage from './BankReconciliationPage';

const tabs = [
  { key: 'periods', label: 'Periods' },
  { key: 'month-end', label: 'Month-End Closing' },
  { key: 'reconciliation', label: 'Bank Reconciliation' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function PeriodsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'periods';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'periods' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Period Management</h1>
        <p className="mt-1 text-sm text-secondary">Accounting periods, month-end closing, and bank reconciliation</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Period management tabs">
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
        {activeTab === 'periods' && <AccountingPeriodsPage />}
        {activeTab === 'month-end' && <MonthEndPage />}
        {activeTab === 'reconciliation' && <BankReconciliationPage />}
      </div>
    </div>
  );
}
