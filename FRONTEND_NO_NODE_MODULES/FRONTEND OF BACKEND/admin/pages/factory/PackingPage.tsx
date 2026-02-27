import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PackingQueuePage from './PackingQueuePage';
import BulkPackingPage from './BulkPackingPage';
import DispatchPage from './DispatchPage';

const tabs = [
  { key: 'queue', label: 'Packing Queue' },
  { key: 'bulk', label: 'Bulk Packing' },
  { key: 'dispatch', label: 'Dispatch' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function PackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'queue';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'queue' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Packing & Dispatch</h1>
        <p className="mt-1 text-sm text-secondary">Packing queue, bulk operations, and dispatch tracking</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Packing tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'border-b-2 border-primary pb-3 text-sm font-medium text-primary whitespace-nowrap'
                  : 'border-b-2 border-transparent pb-3 text-sm font-medium text-secondary hover:border-border hover:text-primary transition-colors whitespace-nowrap'
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'queue' && <PackingQueuePage />}
        {activeTab === 'bulk' && <BulkPackingPage />}
        {activeTab === 'dispatch' && <DispatchPage />}
      </div>
    </div>
  );
}
