import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CatalogPage from './CatalogPage';
import RawMaterialsPage from '../factory/RawMaterialsPage';
import FinishedGoodsPage from '../factory/FinishedGoodsPage';
import InventoryAdjustmentsPage from '../factory/InventoryAdjustmentsPage';

const tabs = [
  { key: 'catalog', label: 'SKU Catalog' },
  { key: 'raw-materials', label: 'Raw Materials' },
  { key: 'finished-goods', label: 'Finished Goods' },
  { key: 'adjustments', label: 'Adjustments' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

export default function AccountingInventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'catalog';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'catalog' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Products & Materials</h1>
        <p className="mt-1 text-sm text-secondary">
          Product catalog, raw material inventory, finished goods, and stock adjustments
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Inventory tabs">
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
        {activeTab === 'catalog' && <CatalogPage />}
        {activeTab === 'raw-materials' && <RawMaterialsPage />}
        {activeTab === 'finished-goods' && <FinishedGoodsPage />}
        {activeTab === 'adjustments' && <InventoryAdjustmentsPage />}
      </div>
    </div>
  );
}
