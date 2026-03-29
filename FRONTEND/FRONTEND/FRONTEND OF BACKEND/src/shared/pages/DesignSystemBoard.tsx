import React, { useState } from 'react';
import {
  Plus,
  Download,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  BookOpen,
  Package,
  Truck,
  Settings,
  BarChart3,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  Button,
  Badge,
  Tabs,
  Avatar,
  OrchestratorLogo,
  Breadcrumb,
  Switch,
  DataTable,
  type Column,
} from '../components/ui';

/* ─── Sample Data ─── */

interface Order {
  id: number;
  ref: string;
  dealer: string;
  amount: number;
  status: 'confirmed' | 'dispatched' | 'pending' | 'draft';
  date: string;
  items: number;
}

const orders: Order[] = [
  { id: 1, ref: 'SO-0847', dealer: 'Sharma Trading Co.', amount: 145200, status: 'confirmed', date: '18 Mar 2026', items: 4 },
  { id: 2, ref: 'SO-0846', dealer: 'Patel Enterprises', amount: 87500, status: 'dispatched', date: '17 Mar 2026', items: 2 },
  { id: 3, ref: 'SO-0845', dealer: 'Kumar & Sons', amount: 234000, status: 'pending', date: '17 Mar 2026', items: 6 },
  { id: 4, ref: 'SO-0844', dealer: 'Gupta Industries', amount: 56800, status: 'confirmed', date: '16 Mar 2026', items: 3 },
  { id: 5, ref: 'SO-0843', dealer: 'Reddy Corp', amount: 192400, status: 'draft', date: '16 Mar 2026', items: 5 },
  { id: 6, ref: 'SO-0842', dealer: 'Singh Brothers', amount: 78900, status: 'dispatched', date: '15 Mar 2026', items: 2 },
];

const statusMap: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
  confirmed: 'success', dispatched: 'info', pending: 'warning', draft: 'default',
};

const orderColumns: Column<Order>[] = [
  { id: 'ref', header: 'Order', accessor: (r) => <span className="font-medium text-[var(--color-text-primary)]">{r.ref}</span>, sortable: true, sortAccessor: (r) => r.ref, width: '100px' },
  { id: 'dealer', header: 'Dealer', accessor: (r) => r.dealer, sortable: true, sortAccessor: (r) => r.dealer },
  { id: 'items', header: 'Items', accessor: (r) => <span className="tabular-nums">{r.items}</span>, sortable: true, sortAccessor: (r) => r.items, align: 'center', hideOnMobile: true },
  { id: 'amount', header: 'Amount', accessor: (r) => <span className="tabular-nums font-medium">₹{r.amount.toLocaleString('en-IN')}</span>, sortable: true, sortAccessor: (r) => r.amount, align: 'right' },
  { id: 'status', header: 'Status', accessor: (r) => <Badge variant={statusMap[r.status]} dot>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Badge>, sortable: true, sortAccessor: (r) => r.status },
  { id: 'date', header: 'Date', accessor: (r) => <span className="text-[var(--color-text-tertiary)] tabular-nums text-[12px]">{r.date}</span>, sortable: true, sortAccessor: (r) => r.date, hideOnMobile: true },
];

/* ─── Sidebar Nav Config ─── */

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
}

const sidebarGroups: { title?: string; items: SidebarItem[] }[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, active: true },
      { id: 'approvals', label: 'Approvals', icon: <CheckCircle2 size={16} />, badge: 3 },
    ],
  },
  {
    title: 'Masters',
    items: [
      { id: 'products', label: 'Products', icon: <Package size={16} /> },
      { id: 'dealers', label: 'Dealers', icon: <Users size={16} /> },
      { id: 'ledgers', label: 'Ledgers', icon: <BookOpen size={16} /> },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { id: 'orders', label: 'Sales Orders', icon: <ShoppingCart size={16} /> },
      { id: 'invoices', label: 'Invoices', icon: <FileText size={16} /> },
      { id: 'dispatch', label: 'Dispatch', icon: <Truck size={16} /> },
    ],
  },
  {
    title: 'Reports',
    items: [
      { id: 'reports', label: 'Analytics', icon: <BarChart3 size={16} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    ],
  },
];

/* ─── Mini Chart Component ─── */

function MiniChart({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={w} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/* ─── Activity Item ─── */

function ActivityItem({ icon, iconBg, title, subtitle, time }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 py-3">
      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{title}</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)] truncate">{subtitle}</p>
      </div>
      <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums shrink-0 mt-0.5">{time}</span>
    </div>
  );
}

/* ─── Quick Stat with Chart ─── */

function QuickStat({ label, value, change, trend, chartData, chartColor }: {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  chartData: number[];
  chartColor: string;
}) {
  return (
    <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</p>
          <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1 tabular-nums tracking-tight">{value}</p>
        </div>
        <MiniChart data={chartData} color={chartColor} />
      </div>
      <div className="flex items-center gap-1.5">
        {trend === 'up' ? (
          <TrendingUp size={12} className="text-emerald-600" />
        ) : (
          <TrendingDown size={12} className="text-red-500" />
        )}
        <span className={`text-[11px] font-medium tabular-nums ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span className="text-[11px] text-[var(--color-text-tertiary)]">vs last month</span>
      </div>
    </div>
  );
}

/* ─── Main Board ─── */

export function DesignSystemBoard() {
  const [activeTab, setActiveTab] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[var(--color-surface-secondary)] flex">

        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)] h-screen sticky top-0">
          <div className="px-5 py-5 border-b border-[var(--color-border-subtle)]">
            <OrchestratorLogo size={22} variant="full" />
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] mt-1">
              Enterprise
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
            {sidebarGroups.map((group, gi) => (
              <div key={gi}>
                {group.title && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    {group.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full flex items-center justify-between h-8 px-3 rounded-lg transition-all duration-150 ${
                        item.active
                          ? 'bg-[var(--color-neutral-900)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span className="text-[13px] font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold tabular-nums rounded-full px-1.5 py-px ${
                          item.active ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-3">
            <div className="flex items-center gap-2.5 px-2">
              <Avatar firstName="Anas" lastName="Khan" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">Anas Khan</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* ─── Top Bar ─── */}
          <header className="sticky top-0 z-20 h-13 shrink-0 flex items-center justify-between gap-4 px-5 bg-[var(--color-surface-primary)]/95 backdrop-blur-xl border-b border-[var(--color-border-default)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden">
                <OrchestratorLogo size={20} variant="mark" />
              </div>
              <div className="hidden sm:block relative w-[260px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full h-8 pl-8 pr-3 text-[13px] bg-[var(--color-surface-secondary)] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-300)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch label="" size="sm" checked={darkMode} onChange={() => {
                setDarkMode(!darkMode);
                document.documentElement.classList.toggle('dark');
              }} />
              <button className="relative h-9 w-9 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
              </button>
              <Avatar firstName="Anas" lastName="Khan" size="sm" />
            </div>
          </header>

          {/* ─── Page Content ─── */}
          <main className="flex-1 p-4 sm:p-5 lg:p-6 space-y-6 max-w-[1200px]">

            {/* Page Header */}
            <div>
              <Breadcrumb items={[{ label: 'Dashboard' }]} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                <div>
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                    Good morning, Anas
                  </h1>
                  <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
                    Here's what's happening across your business today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<Download />}>Export</Button>
                  <Button size="sm" leftIcon={<Plus />}>New order</Button>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickStat
                label="Revenue"
                value="₹18.4L"
                change={12.3}
                trend="up"
                chartData={[30, 45, 38, 52, 60, 55, 72, 68, 80]}
                chartColor="#22c55e"
              />
              <QuickStat
                label="Orders"
                value="847"
                change={8.1}
                trend="up"
                chartData={[20, 30, 25, 35, 28, 42, 38, 45, 50]}
                chartColor="#3b82f6"
              />
              <QuickStat
                label="Outstanding"
                value="₹3.2L"
                change={-4.2}
                trend="down"
                chartData={[50, 45, 48, 42, 38, 40, 35, 32, 30]}
                chartColor="#ef4444"
              />
              <QuickStat
                label="Active Dealers"
                value="67"
                change={5}
                trend="up"
                chartData={[40, 42, 45, 43, 48, 50, 52, 55, 58]}
                chartColor="#8b5cf6"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Orders Table — spans 2 cols */}
              <div className="lg:col-span-2 bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Recent Orders</h2>
                    <button className="text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
                      View all <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="mt-2.5">
                    <Tabs
                      variant="pill"
                      size="sm"
                      tabs={[
                        { value: 'all', label: 'All', count: 847 },
                        { value: 'confirmed', label: 'Confirmed', count: 312 },
                        { value: 'pending', label: 'Pending', count: 89 },
                        { value: 'dispatched', label: 'Dispatched', count: 446 },
                      ]}
                      active={activeTab}
                      onChange={setActiveTab}
                    />
                  </div>
                </div>
                <DataTable<Order>
                  columns={orderColumns}
                  data={orders}
                  keyExtractor={(r) => r.id}
                  pageSize={6}
                  onRowClick={() => {}}
                  mobileCardRenderer={(r) => (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium">{r.ref}</span>
                          <Badge variant={statusMap[r.status]} dot>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Badge>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 truncate">{r.dealer}</p>
                      </div>
                      <span className="text-[13px] font-medium tabular-nums shrink-0">₹{r.amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                />
              </div>

              {/* Right Column — Activity + Quick Actions */}
              <div className="space-y-5">

                {/* Quick Actions */}
                <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
                  <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'New Order', icon: <ShoppingCart size={15} />, bg: 'bg-blue-50 text-blue-600' },
                      { label: 'Add Dealer', icon: <Users size={15} />, bg: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Invoice', icon: <FileText size={15} />, bg: 'bg-purple-50 text-purple-600' },
                      { label: 'Journal', icon: <BookOpen size={15} />, bg: 'bg-amber-50 text-amber-600' },
                    ].map((a) => (
                      <button
                        key={a.label}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-surface-tertiary)] active:bg-[var(--color-neutral-100)] transition-colors text-left"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${a.bg}`}>
                          {a.icon}
                        </div>
                        <span className="text-[12px] font-medium text-[var(--color-text-primary)]">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Activity</h3>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    <ActivityItem
                      icon={<CheckCircle2 size={14} className="text-emerald-600" />}
                      iconBg="bg-emerald-50"
                      title="SO-0847 confirmed"
                      subtitle="Sharma Trading Co. — ₹1,45,200"
                      time="2m"
                    />
                    <ActivityItem
                      icon={<Truck size={14} className="text-blue-600" />}
                      iconBg="bg-blue-50"
                      title="SO-0846 dispatched"
                      subtitle="Patel Enterprises — 2 items"
                      time="15m"
                    />
                    <ActivityItem
                      icon={<IndianRupee size={14} className="text-purple-600" />}
                      iconBg="bg-purple-50"
                      title="Payment received"
                      subtitle="Kumar & Sons — ₹87,500"
                      time="1h"
                    />
                    <ActivityItem
                      icon={<AlertCircle size={14} className="text-amber-600" />}
                      iconBg="bg-amber-50"
                      title="Credit limit warning"
                      subtitle="Gupta Industries exceeded by ₹15K"
                      time="2h"
                    />
                    <ActivityItem
                      icon={<Clock size={14} className="text-[var(--color-text-tertiary)]" />}
                      iconBg="bg-[var(--color-surface-tertiary)]"
                      title="3 approvals pending"
                      subtitle="Journal entries need review"
                      time="3h"
                    />
                  </div>
                </div>

                {/* Pending Summary */}
                <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
                  <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">Pending Items</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Pending approvals', count: 3, color: 'bg-amber-500' },
                      { label: 'Draft orders', count: 12, color: 'bg-[var(--color-neutral-400)]' },
                      { label: 'Overdue invoices', count: 5, color: 'bg-red-500' },
                      { label: 'Low stock alerts', count: 8, color: 'bg-blue-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full ${item.color}`} />
                          <span className="text-[12px] text-[var(--color-text-secondary)]">{item.label}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-[var(--color-text-primary)] tabular-nums">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center py-4 border-t border-[var(--color-border-default)]">
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Orchestrator ERP &middot; Design System Layout &middot; v2.0
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
