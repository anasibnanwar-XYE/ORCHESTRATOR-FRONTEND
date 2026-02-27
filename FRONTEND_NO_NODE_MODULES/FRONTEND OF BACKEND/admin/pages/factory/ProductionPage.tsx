import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderFulfillmentPage from './OrderFulfillmentPage';
import ProductionBatchesPage from './ProductionBatchesPage';
import TasksPage from './TasksPage';

const tabs = [
  { key: 'plans', label: 'Production Plans' },
  { key: 'batches', label: 'Batches' },
  { key: 'tasks', label: 'Tasks' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function ProductionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'plans';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'plans' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Production</h1>
        <p className="mt-1 text-sm text-secondary">Production plans, batch tracking, and task management</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Production tabs">
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
        {activeTab === 'plans' && <OrderFulfillmentPage />}
        {activeTab === 'batches' && <ProductionBatchesPage />}
        {activeTab === 'tasks' && <TasksPage />}
      </div>
    </div>
  );
}
