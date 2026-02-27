import React from 'react';
import { useSearchParams } from 'react-router-dom';
import DealersPage from './DealersPage';
import SuppliersPage from './SuppliersPage';

const tabs = [
  { key: 'dealers', label: 'Dealers' },
  { key: 'suppliers', label: 'Suppliers' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function PartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'dealers';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'dealers' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Partners</h1>
        <p className="mt-1 text-sm text-secondary">Manage dealers and suppliers</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Partners tabs">
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
        {activeTab === 'dealers' && <DealersPage />}
        {activeTab === 'suppliers' && <SuppliersPage />}
      </div>
    </div>
  );
}
