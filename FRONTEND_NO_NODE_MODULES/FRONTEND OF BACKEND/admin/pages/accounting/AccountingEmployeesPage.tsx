import React from 'react';
import { useSearchParams } from 'react-router-dom';
import EmployeesPage from '../admin/EmployeesPage';
import AttendancePage from '../admin/AttendancePage';
import { CalendarOff } from 'lucide-react';

const tabs = [
  { key: 'employees', label: 'Employees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tabKeys = tabs.map((t) => t.key) as readonly TabKey[];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && (tabKeys as readonly string[]).includes(value);
}

function LeavePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-surface-highlight p-4">
        <CalendarOff className="h-8 w-8 text-tertiary" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-primary">Leave Management</h2>
      <p className="mt-2 max-w-sm text-sm text-secondary">
        Leave requests, approvals, and balance tracking will be available here once the backend integration is complete.
      </p>
    </div>
  );
}

export default function AccountingEmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : 'employees';

  const setTab = (key: TabKey) => {
    setSearchParams(key === 'employees' ? {} : { tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Employees</h1>
        <p className="mt-1 text-sm text-secondary">
          Employee records, attendance tracking, and leave management
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Employees tabs">
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
        {activeTab === 'employees' && <EmployeesPage />}
        {activeTab === 'attendance' && <AttendancePage />}
        {activeTab === 'leave' && <LeavePlaceholder />}
      </div>
    </div>
  );
}
