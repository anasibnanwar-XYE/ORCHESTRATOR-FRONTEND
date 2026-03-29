import React, { useState } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Mail,
  Filter,
  Search,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Tabs,
  Modal,
  Drawer,
  DataTable,
  SearchBar,
  DealerSelector,
  OrchestratorLogo,
  Loader,
  PageLoader,
  WelcomeLoader,
  Avatar,
  ProfileMenu,
  PageHeader,
  Breadcrumb,
  StatCard,
  LedgerCard,
  EmptyState,
  DatePicker,
  ToastProvider,
  useToast,
  JournalEntryModal,
  ProductEntryModal,
  SalesOrderModal,
  DispatchModal,
  Sidebar,
  BottomSheet,
  ActionSheet,
  SwipeableCard,
  PullToRefresh,
  ResponsiveGrid,
  Stack,
  Combobox,
  DateRangePicker,
  FileUpload,
  Timeline,
  Changelog,
  MultiSelect,
  Accordion,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Stepper,
  Alert,
  RichTextEditor,
  TreeView,
  KanbanBoard,
  ApprovalCard,
  AuditLog,
  CompactAuditLog,
  MFAInput,
  RecoveryCodeInput,
  MFASetup,
  ProgressBar,
  Sparkline,
  BarChart,
  CommandPalette,
  FilterBuilder,
  Pagination,
  type FilterRule,
  type Column,
  type Dealer,
  type BottomNavItem,
  type ActionSheetItem,
} from '../components/ui';
import {
  Home,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  Edit3,
  Share2,
  Copy,
  Archive,
  MoreHorizontal,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface SampleInvoice {
  id: number;
  number: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  date: string;
}

const sampleInvoices: SampleInvoice[] = [
  { id: 1, number: 'INV-001', customer: 'Acme Corp', amount: 12500.0, status: 'paid', date: '2024-03-01' },
  { id: 2, number: 'INV-002', customer: 'Globex Industries', amount: 8750.5, status: 'pending', date: '2024-03-05' },
  { id: 3, number: 'INV-003', customer: 'Initech Solutions', amount: 3200.0, status: 'overdue', date: '2024-02-15' },
  { id: 4, number: 'INV-004', customer: 'Umbrella Corp', amount: 45000.0, status: 'paid', date: '2024-03-10' },
  { id: 5, number: 'INV-005', customer: 'Stark Industries', amount: 18900.75, status: 'draft', date: '2024-03-12' },
  { id: 6, number: 'INV-006', customer: 'Wayne Enterprises', amount: 67200.0, status: 'paid', date: '2024-03-14' },
];

const sampleDealers: Dealer[] = [
  { id: '1', name: 'Sharma Trading Co.', code: 'DLR-001', gstin: '07AABCS1429B1ZD', city: 'Delhi', outstanding: 45000 },
  { id: '2', name: 'Patel Enterprises', code: 'DLR-002', gstin: '24AABCP5678R1Z5', city: 'Ahmedabad', outstanding: 0 },
  { id: '3', name: 'Kumar & Sons', code: 'DLR-003', gstin: '29AABCK1234L1ZB', city: 'Bangalore', outstanding: 12500 },
];

const sampleSearchResults = [
  { id: '1', label: 'INV-001', description: 'Acme Corp — \u20B912,500', type: 'invoice' as const },
  { id: '2', label: 'Globex Industries', description: 'Customer since 2022', type: 'customer' as const },
];

const statusBadge = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { paid: 'success', pending: 'warning', overdue: 'danger', draft: 'default' };
  return <Badge variant={map[status] || 'default'} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
};

const invoiceColumns: Column<SampleInvoice>[] = [
  { id: 'number', header: 'Invoice', accessor: (r) => <span className="font-medium">{r.number}</span>, sortable: true, sortAccessor: (r) => r.number, width: '100px' },
  { id: 'customer', header: 'Customer', accessor: (r) => r.customer, sortable: true, sortAccessor: (r) => r.customer },
  { id: 'amount', header: 'Amount', accessor: (r) => <span className="tabular-nums">{'\u20B9'}{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>, sortable: true, sortAccessor: (r) => r.amount, align: 'right' },
  { id: 'status', header: 'Status', accessor: (r) => statusBadge(r.status), sortable: true, sortAccessor: (r) => r.status },
  { id: 'date', header: 'Date', accessor: (r) => <span className="text-[var(--color-text-tertiary)] tabular-nums">{r.date}</span>, sortable: true, sortAccessor: (r) => r.date, hideOnMobile: true },
];

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <div className="flex-1 h-px bg-[var(--color-border-default)]" />
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function Sub({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</h3>
      {children}
    </div>
  );
}

const nav = [
  'brand', 'loaders', 'buttons', 'inputs', 'select', 'combobox', 'multiselect', 'richtext', 'controls', 'badges',
  'search', 'dealer', 'tabs', 'table', 'treeview', 'kanban', 'timeline', 'changelog', 'audit', 'accordion', 'card', 'approval', 'auth', 'stepper', 'alert', 'command', 'filter', 'pagination', 'charts', 'stats', 'ledger', 'date', 'daterange', 'upload',
  'modal', 'drawer', 'journal', 'product', 'sales', 'dispatch',
  'sidebar', 'mobile', 'toast', 'tokens',
];

function ToastDemo() {
  const { success, error, warning, info } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => success('Voucher posted', 'JV-0847 has been recorded')}>Success</Button>
      <Button variant="secondary" size="sm" onClick={() => error('Posting failed', 'Debit and credit totals do not match')}>Error</Button>
      <Button variant="secondary" size="sm" onClick={() => warning('Credit limit exceeded', 'Dealer DLR-003 is over limit by ₹12,500')}>Warning</Button>
      <Button variant="secondary" size="sm" onClick={() => info('Sync complete', '34 transactions imported')}>Info</Button>
    </div>
  );
}

export function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerDirty, setIsDrawerDirty] = useState(false);
  const [isModalDirty, setIsModalDirty] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger');
  const [switchVal, setSwitchVal] = useState(true);
  const [radioVal, setRadioVal] = useState('regular');
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [dateVal, setDateVal] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [comboVal, setComboVal] = useState('');
  const [multiVal, setMultiVal] = useState<string[]>([]);
  const [mfaMode, setMfaMode] = useState<'mfa' | 'recovery' | 'setup'>('setup');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [mobileActiveNav, setMobileActiveNav] = useState('home');
  const [pullRefreshDone, setPullRefreshDone] = useState(false);

  const mobileNavItems: BottomNavItem[] = [
    { id: 'home', label: 'Home', icon: <Home />, href: '/' },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart />, badge: 5, href: '/orders' },
    { id: 'invoices', label: 'Invoices', icon: <FileText />, href: '/invoices' },
    { id: 'dealers', label: 'Dealers', icon: <Users />, href: '/dealers' },
    { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
  ];

  const actionSheetItems: ActionSheetItem[] = [
    { id: 'edit', label: 'Edit', icon: <Edit3 /> },
    { id: 'share', label: 'Share', icon: <Share2 /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy /> },
    { id: 'archive', label: 'Archive', icon: <Archive />, variant: 'danger' },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-surface-secondary)]">
        {showWelcome && <WelcomeLoader />}

        {/* Sticky nav */}
        <div className="sticky top-0 z-30 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]">
          <div className="max-w-5xl mx-auto px-5">
            <div className="flex items-center h-12 gap-6 overflow-x-auto no-scrollbar">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)] shrink-0">Components</span>
              <div className="h-4 w-px bg-[var(--color-border-default)]" />
              {nav.map((id) => (
                <a key={id} href={`#${id}`} className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] whitespace-nowrap transition-colors capitalize">
                  {id}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 py-10 space-y-14">

          {/* Brand */}
          <Section title="Brand" id="brand">
            <Sub label="Logo mark">
              <div className="flex items-center gap-6">
                <OrchestratorLogo size={24} variant="mark" />
                <OrchestratorLogo size={32} variant="mark" />
                <OrchestratorLogo size={48} variant="mark" />
              </div>
            </Sub>
            <Sub label="Full logo">
              <OrchestratorLogo size={28} variant="full" />
            </Sub>
            <Sub label="Wordmark">
              <OrchestratorLogo size={28} variant="wordmark" />
            </Sub>
          </Section>

          {/* Loaders */}
          <Section title="Loaders" id="loaders">
            <Sub label="Inline">
              <div className="flex items-center gap-6">
                <Loader size="sm" />
                <Loader size="md" />
                <Loader size="lg" />
              </div>
            </Sub>
            <Sub label="Page loader">
              <div className="h-[200px] border border-[var(--color-border-default)] rounded-xl overflow-hidden relative">
                <PageLoader message="Fetching ledger" />
              </div>
            </Sub>
            <Sub label="Welcome loader">
              <Button variant="secondary" size="sm" onClick={() => { setShowWelcome(true); setTimeout(() => setShowWelcome(false), 4000); }}>
                Show welcome screen
              </Button>
            </Sub>
          </Section>

          {/* Buttons */}
          <Section title="Buttons" id="buttons">
            <Sub label="Variants">
              <div className="flex flex-wrap items-center gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </Sub>
            <Sub label="With icons (sparingly)">
              <div className="flex flex-wrap items-center gap-2">
                <Button leftIcon={<Plus />}>New entry</Button>
                <Button variant="secondary" leftIcon={<Download />}>Export</Button>
                <Button variant="danger" leftIcon={<Trash2 />} size="sm">Delete</Button>
              </div>
            </Sub>
            <Sub label="States">
              <div className="flex flex-wrap items-center gap-2">
                <Button isLoading>Posting...</Button>
                <Button disabled>Disabled</Button>
              </div>
            </Sub>
          </Section>

          {/* Inputs */}
          <Section title="Inputs" id="inputs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Input label="Company name" placeholder="Enter company name" />
              <Input label="Email" placeholder="email@example.com" leftIcon={<Mail />} />
              <Input label="GST number" placeholder="22AAAAA0000A1Z5" error="Invalid GST format" />
              <Input label="Amount" placeholder="0.00" type="number" hint="Amount in INR" />
              <Input label="Disabled" placeholder="Read-only" disabled value="Cannot edit" />
            </div>
          </Section>

          {/* Select */}
          <Section title="Select" id="select">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Select label="Account type" placeholder="Choose type..." options={[
                { value: 'asset', label: 'Asset' }, { value: 'liability', label: 'Liability' },
                { value: 'equity', label: 'Equity' }, { value: 'revenue', label: 'Revenue' },
              ]} />
              <Select label="Currency" options={[
                { value: 'inr', label: 'INR — Indian Rupee' }, { value: 'usd', label: 'USD — US Dollar' },
              ]} hint="Base currency" />
              <Select label="With error" options={[{ value: '', label: 'Select...' }]} error="Required" />
            </div>
          </Section>

          {/* Combobox */}
          <Section title="Combobox (Autocomplete)" id="combobox">
            <div className="max-w-sm">
              <Combobox
                label="Product category"
                placeholder="Search categories..."
                options={[
                  { value: 'elec', label: 'Electronics & Appliances' },
                  { value: 'hard', label: 'Hardware & Tools' },
                  { value: 'plumb', label: 'Plumbing & Pipes' },
                  { value: 'paint', label: 'Paints & Chemicals' },
                ]}
                value={comboVal}
                onChange={setComboVal}
              />
            </div>
          </Section>

          {/* MultiSelect */}
          <Section title="MultiSelect (Tags)" id="multiselect">
            <div className="max-w-sm">
              <MultiSelect
                label="Assign tags"
                placeholder="Select tags..."
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'review', label: 'Needs Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                value={multiVal}
                onChange={setMultiVal}
              />
            </div>
          </Section>

          {/* Rich Text Editor */}
          <Section title="Rich Text Editor" id="richtext">
            <div className="max-w-xl">
              <RichTextEditor
                label="Terms and Conditions"
                placeholder="Enter sales terms here..."
              />
            </div>
          </Section>

          {/* Controls */}
          <Section title="Controls" id="controls">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <Sub label="Checkboxes">
                <div className="space-y-3">
                  <Checkbox label="Auto-generate voucher numbers" defaultChecked />
                  <Checkbox label="Send email notifications" />
                  <Checkbox label="Enable GST computation" description="CGST/SGST/IGST auto-calc" defaultChecked />
                </div>
              </Sub>
              <Sub label="Radio">
                <div className="space-y-3">
                  <Radio name="tax" label="Regular scheme" value="regular" checked={radioVal === 'regular'} onChange={() => setRadioVal('regular')} />
                  <Radio name="tax" label="Composition" value="composition" checked={radioVal === 'composition'} onChange={() => setRadioVal('composition')} />
                  <Radio name="tax" label="Exempt" value="exempt" checked={radioVal === 'exempt'} onChange={() => setRadioVal('exempt')} />
                </div>
              </Sub>
              <Sub label="Switches">
                <div className="space-y-3.5">
                  <Switch label="Dark mode" checked={switchVal} onChange={() => setSwitchVal(!switchVal)} />
                  <Switch label="Auto-approve" checked={false} onChange={() => {}} />
                  <Switch label="Reminders" size="sm" checked={true} onChange={() => {}} />
                </div>
              </Sub>
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badges" id="badges">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Default</Badge>
              <Badge variant="success" dot>Paid</Badge>
              <Badge variant="warning" dot>Pending</Badge>
              <Badge variant="danger" dot>Overdue</Badge>
              <Badge variant="info" dot>Processing</Badge>
            </div>
          </Section>

          {/* Search */}
          <Section title="Search" id="search">
            <div className="max-w-xs">
              <SearchBar placeholder="Search invoices, customers..." results={sampleSearchResults} onSearch={() => {}} onSelect={() => {}} />
            </div>
          </Section>

          {/* Dealer */}
          <Section title="Dealer selector" id="dealer">
            <div className="max-w-sm">
              <DealerSelector label="Dealer" dealers={sampleDealers} selected={selectedDealer} onSelect={setSelectedDealer} showOutstanding placeholder="Choose dealer..." />
            </div>
          </Section>

          {/* Tabs */}
          <Section title="Tabs" id="tabs">
            <Sub label="Underline">
              <Tabs tabs={[
                { value: 'ledger', label: 'Ledger', count: 124 },
                { value: 'vouchers', label: 'Vouchers', count: 38 },
                { value: 'reports', label: 'Reports' },
              ]} active={activeTab} onChange={setActiveTab} />
            </Sub>
            <Sub label="Pill">
              <Tabs variant="pill" tabs={[
                { value: 'all', label: 'All', count: 156 },
                { value: 'active', label: 'Active', count: 120 },
                { value: 'draft', label: 'Draft', count: 36 },
              ]} active="all" onChange={() => {}} />
            </Sub>
          </Section>

          {/* Table */}
          <Section title="Data table" id="table">
            <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
              <DataTable<SampleInvoice>
                columns={invoiceColumns}
                data={sampleInvoices}
                keyExtractor={(r) => r.id}
                searchable
                searchPlaceholder="Search invoices..."
                searchFilter={(r, q) => r.number.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)}
                toolbar={<><Button variant="secondary" size="sm" leftIcon={<Filter />}>Filter</Button><Button size="sm" leftIcon={<Plus />}>New</Button></>}
                pageSize={5}
                mobileCardRenderer={(r) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{r.number}</span>
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 truncate">{r.customer}</p>
                    </div>
                    <span className="text-[13px] tabular-nums shrink-0">{'\u20B9'}{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                  </div>
                )}
              />
            </div>
          </Section>

          {/* TreeView */}
          <Section title="Tree View (Hierarchical Data)" id="treeview">
            <div className="max-w-sm">
              <TreeView
                defaultExpanded
                data={[
                  {
                    id: 'assets', label: 'Assets', children: [
                      {
                        id: 'current', label: 'Current Assets', children: [
                          { id: 'cash', label: 'Cash in Hand', value: '₹1,45,230' },
                          { id: 'bank', label: 'Bank Accounts', value: '₹5,30,000' }
                        ]
                      },
                      { id: 'fixed', label: 'Fixed Assets', children: [
                          { id: 'machinery', label: 'Machinery & Equipment' }
                      ] }
                    ]
                  },
                  { id: 'liabilities', label: 'Liabilities' }
                ]}
              />
            </div>
          </Section>

          {/* Kanban */}
          <Section title="Kanban Board" id="kanban">
            <div className="w-full">
              <KanbanBoard
                columns={[
                  {
                    id: 'lead', title: 'Leads', tasks: [
                      { id: 't1', title: 'Follow up with Stark Ind.', description: 'Called twice, waiting for reply.', tags: [{ label: 'High', color: '#ef4444' }] },
                      { id: 't2', title: 'Send quotation to Wayne Ent.', assignee: <Avatar firstName="Anas" size="xs" /> }
                    ]
                  },
                  {
                    id: 'negotiation', title: 'Negotiation', tasks: [
                      { id: 't3', title: 'Price discussion with Acme', description: 'They requested 5% discount.' }
                    ]
                  },
                  {
                    id: 'closed', title: 'Closed / Won', tasks: []
                  }
                ]}
              />
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline" id="timeline">
            <div className="max-w-lg bg-[var(--color-surface-primary)] p-6 border border-[var(--color-border-default)] rounded-xl">
              <Timeline
                items={[
                  { id: '1', title: 'Order placed', description: 'Sales order SO-0421 created by Anas Khan.', time: '10:30 AM', status: 'success', icon: <CheckCircle size={14} /> },
                  { id: '2', title: 'Payment received', description: 'Advance payment of ₹12,500 processed.', time: '11:15 AM', status: 'success', icon: <CheckCircle size={14} /> },
                  { id: '3', title: 'Dispatch pending', description: 'Awaiting stock confirmation for PVC Pipes.', time: '1:00 PM', status: 'warning' },
                  { id: '4', title: 'Delivery', description: 'Expected by tomorrow end of day.' },
                ]}
              />
            </div>
          </Section>

          {/* Changelog */}
          <Section title="Changelog" id="changelog">
            <div className="max-w-2xl">
              <Changelog
                items={[
                  {
                    version: 'v2.4.0',
                    date: 'March 20, 2026',
                    title: 'New reporting engine and dark mode',
                    changes: [
                      { type: 'feature', description: 'Added comprehensive dark mode support across all modules.' },
                      { type: 'improvement', description: 'Redesigned the ledger view for faster loading with large datasets.' },
                      { type: 'fix', description: 'Resolved an issue where PDF exports were failing on mobile devices.' },
                    ]
                  },
                  {
                    version: 'v2.3.5',
                    date: 'March 05, 2026',
                    changes: [
                      { type: 'fix', description: 'Fixed currency formatting for international dealers.' },
                      { type: 'deprecation', description: 'Legacy API endpoints v1 will be removed in the next major release.' },
                    ]
                  }
                ]}
              />
            </div>
          </Section>

          {/* Audit Log */}
          <Section title="Audit Trail (Data Logs)" id="audit">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <Sub label="Full detailed view (e.g. on a dedicated audit page)">
                  <AuditLog
                    entries={[
                      {
                        id: 'log-1',
                        user: 'Priya Sharma',
                        action: 'Updated',
                        timestamp: 'Today, 11:42 AM',
                        resourceType: 'Dealer',
                        resourceId: 'DLR-003',
                        ipAddress: '192.168.1.42',
                        changes: [
                          { field: 'Credit Limit', oldValue: '₹25,000', newValue: '₹50,000' },
                          { field: 'Payment Terms', oldValue: 'Net 30', newValue: 'Net 60' }
                        ]
                      },
                      {
                        id: 'log-2',
                        user: 'System',
                        action: 'Created',
                        timestamp: 'Today, 09:00 AM',
                        resourceType: 'Sales Order',
                        resourceId: 'SO-0421',
                        changes: [
                          { field: 'Status', newValue: 'Draft' },
                          { field: 'Total Amount', newValue: '₹45,000' }
                        ]
                      },
                      {
                        id: 'log-3',
                        user: 'Amit Kumar',
                        action: 'Deleted',
                        timestamp: 'Yesterday, 04:15 PM',
                        resourceType: 'Product Image',
                        resourceId: 'IMG-992'
                      }
                    ]}
                  />
                </Sub>
              </div>
              <div className="space-y-4">
                <Sub label="Compact view (e.g. in a drawer or sidebar tab)">
                  <CompactAuditLog
                    entries={[
                      { id: 'c1', user: 'Priya Sharma', action: 'Approved', timestamp: '10:42 AM' },
                      { id: 'c2', user: 'Amit Kumar', action: 'Updated', timestamp: '10:15 AM', changes: [{ field: 'Status', oldValue: 'Draft', newValue: 'Pending' }] },
                      { id: 'c3', user: 'System', action: 'Created', timestamp: '09:00 AM', changes: [{ field: 'Invoice', newValue: 'INV-042' }] },
                      { id: 'c4', user: 'Raj Patel', action: 'Rejected', timestamp: 'Yesterday' },
                      { id: 'c5', user: 'Amit Kumar', action: 'Updated', timestamp: 'Yesterday', changes: [{ field: 'Amount', oldValue: '₹12,000', newValue: '₹12,500' }] },
                      { id: 'c6', user: 'System', action: 'Created', timestamp: 'Yesterday' },
                    ]}
                  />
                </Sub>
              </div>
            </div>
          </Section>

          {/* Accordion */}
          <Section title="Accordion" id="accordion">
            <div className="max-w-lg">
              <Accordion
                items={[
                  { id: '1', title: 'Company Details', content: 'Configure your company name, GSTIN, and registered address here.' },
                  { id: '2', title: 'Bank Information', content: 'Manage linked bank accounts for receiving customer payments.' },
                  { id: '3', title: 'Tax Settings', content: 'Set default tax rates and HSN codes for products.' },
                ]}
              />
            </div>
          </Section>

          {/* Card */}
          <Section title="Card" id="card">
            <div className="max-w-sm">
              <Card>
                <CardHeader 
                  title="Subscription Active" 
                  subtitle="Enterprise Plan"
                  action={<Badge variant="success">Active</Badge>}
                />
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-[13px] text-[var(--color-text-secondary)]">Your subscription is active until Dec 31, 2026. You have used 450/500 API calls this month.</p>
                    <ProgressBar progress={90} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm">Manage plan</Button>
                  <Button size="sm">Upgrade</Button>
                </CardFooter>
              </Card>
            </div>
          </Section>

          {/* Approval Workflow */}
          <Section title="Maker / Checker Approvals" id="approval">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <ApprovalCard
                id="req-1"
                type="Sales Order"
                requester={{ name: 'Priya Sharma' }}
                requestDate="Today, 10:30 AM"
                status="pending"
                details={[
                  { label: 'Reference', value: 'SO-0421' },
                  { label: 'Dealer', value: 'Sharma Trading Co.' },
                  { label: 'Amount', value: '₹45,000.00' },
                  { label: 'Credit Limit', value: <span className="text-amber-600">Exceeded by ₹5,000</span> },
                ]}
                onApprove={(id) => console.log('Approve', id)}
                onReject={(id) => console.log('Reject', id)}
              />
              <ApprovalCard
                id="req-2"
                type="Journal Voucher"
                requester={{ name: 'Raj Patel' }}
                requestDate="Yesterday, 4:15 PM"
                status="approved"
                details={[
                  { label: 'Voucher No', value: 'JV-8842' },
                  { label: 'Debit Account', value: 'Office Expenses' },
                  { label: 'Amount', value: '₹12,500.00' },
                  { label: 'Notes', value: 'New chairs for reception' },
                ]}
              />
              <ApprovalCard
                id="req-3"
                type="Dealer Registration"
                requester={{ name: 'Amit Kumar' }}
                requestDate="Mar 20, 2026"
                status="rejected"
                details={[
                  { label: 'Dealer Name', value: 'ABC Electronics' },
                  { label: 'GSTIN', value: <span className="text-red-600 font-bold">Invalid Format</span> },
                  { label: 'Region', value: 'North' },
                  { label: 'Sales Rep', value: 'Amit Kumar' },
                ]}
              />
            </div>
          </Section>

          {/* MFA / Auth */}
          <Section title="Authentication & MFA" id="auth">
            <div className="mb-4 flex gap-2">
              <Button size="sm" variant={mfaMode === 'setup' ? 'primary' : 'secondary'} onClick={() => { setMfaMode('setup'); setMfaError(''); }}>Setup View</Button>
              <Button size="sm" variant={mfaMode === 'mfa' ? 'primary' : 'secondary'} onClick={() => { setMfaMode('mfa'); setMfaError(''); }}>Login View</Button>
              <Button size="sm" variant={mfaMode === 'recovery' ? 'primary' : 'secondary'} onClick={() => { setMfaMode('recovery'); setMfaError(''); }}>Recovery View</Button>
            </div>
            
            <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] p-4 sm:p-8 rounded-2xl flex items-center justify-center min-h-[400px]">
              <div className="w-full transition-all duration-300 flex justify-center">
                {mfaMode === 'setup' ? (
                  <MFASetup 
                    onVerify={async (code) => {
                      return new Promise((resolve) => {
                        setTimeout(() => resolve(code === '123456'), 800);
                      });
                    }}
                    onComplete={() => {
                      const { success } = (window as any).__toast || {};
                      if(success) success('Setup complete', 'MFA has been enabled on your account.');
                      setMfaMode('mfa');
                    }}
                  />
                ) : mfaMode === 'mfa' ? (
                  <MFAInput 
                    length={6} 
                    isLoading={mfaLoading}
                    error={mfaError}
                    onUseRecovery={() => {
                      setMfaMode('recovery');
                      setMfaError('');
                    }}
                    onComplete={(code) => {
                      setMfaLoading(true);
                      setMfaError('');
                      setTimeout(() => {
                        setMfaLoading(false);
                        if (code !== '123456') {
                          setMfaError('Invalid code. Try 123456');
                        } else {
                           const { success } = (window as any).__toast || {};
                           if(success) success('Verified', 'Successfully authenticated.');
                        }
                      }, 1000);
                    }}
                  />
                ) : (
                  <RecoveryCodeInput 
                    isLoading={mfaLoading}
                    error={mfaError}
                    onBackToMFA={() => {
                      setMfaMode('mfa');
                      setMfaError('');
                    }}
                    onComplete={(code) => {
                      setMfaLoading(true);
                      setMfaError('');
                      setTimeout(() => {
                        setMfaLoading(false);
                        if (code.length < 8) {
                          setMfaError('Code is too short.');
                        } else {
                           setMfaMode('mfa');
                           const { success } = (window as any).__toast || {};
                           if(success) success('Recovered', 'Successfully logged in using recovery code.');
                        }
                      }, 1000);
                    }}
                  />
                )}
              </div>
            </div>
          </Section>

          {/* Stepper */}
          <Section title="Stepper" id="stepper">
            <div className="max-w-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-6 rounded-xl space-y-12">
              <Stepper 
                currentStep="2"
                steps={[
                  { id: '1', title: 'Cart', description: 'Review items' },
                  { id: '2', title: 'Address', description: 'Shipping details' },
                  { id: '3', title: 'Payment', description: 'Select method' },
                  { id: '4', title: 'Confirm', description: 'Place order' },
                ]}
              />
              <div className="border-t border-[var(--color-border-subtle)] pt-8">
                <Stepper 
                  orientation="vertical"
                  currentStep="2"
                  steps={[
                    { id: '1', title: 'Basic Details', description: 'Enter dealer name and code' },
                    { id: '2', title: 'Contact Info', description: 'Email, phone, and primary contact' },
                    { id: '3', title: 'Tax Registration', description: 'GSTIN and PAN details' },
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* Alert */}
          <Section title="Alerts & Banners" id="alert">
            <div className="max-w-xl space-y-4">
              <Alert 
                variant="info" 
                title="New update available" 
                description="Version 2.4.0 brings a new reporting engine. Refresh the app to update." 
                action={<Button size="sm" variant="secondary">Update now</Button>}
              />
              <Alert 
                variant="success" 
                title="Payment successful" 
                description="Your payment of ₹12,500 has been processed." 
                onClose={() => {}}
              />
              <Alert 
                variant="warning" 
                title="Credit limit exceeded" 
                description="This dealer has exceeded their allowed credit limit. Sales orders require admin approval." 
              />
              <Alert 
                variant="danger" 
                title="Connection lost" 
                description="Cannot connect to the server. Please check your internet connection." 
              />
            </div>
          </Section>

          {/* Command Palette */}
          <Section title="Command Palette" id="command">
            <div className="max-w-md space-y-4">
              <Button onClick={() => setIsCmdOpen(true)} variant="secondary" leftIcon={<Search />}>
                Open Command Palette <kbd className="ml-2 font-mono text-[10px] bg-[var(--color-surface-tertiary)] px-1 rounded border border-[var(--color-border-subtle)]">⌘K</kbd>
              </Button>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                A global search and action palette. Usually triggered via <kbd className="font-mono text-[10px] bg-[var(--color-surface-tertiary)] px-1 rounded border">Cmd+K</kbd> or <kbd className="font-mono text-[10px] bg-[var(--color-surface-tertiary)] px-1 rounded border">Ctrl+K</kbd>.
              </p>
              <CommandPalette
                isOpen={isCmdOpen}
                onClose={() => setIsCmdOpen(false)}
                groups={[
                  {
                    id: 'actions',
                    heading: 'Quick Actions',
                    items: [
                      { id: 'new-invoice', label: 'Create new invoice', subtitle: 'Open the blank invoice form', icon: <Plus size={16} />, shortcut: ['cmd', 'i'], onSelect: () => console.log('Create invoice') },
                      { id: 'new-dealer', label: 'Add new dealer', subtitle: 'Register a new B2B customer', icon: <Users size={16} />, onSelect: () => console.log('Add dealer') },
                    ]
                  },
                  {
                    id: 'pages',
                    heading: 'Navigation',
                    items: [
                      { id: 'go-dashboard', label: 'Go to Dashboard', subtitle: 'View your primary KPI metrics', icon: <Home size={16} />, onSelect: () => console.log('Dashboard') },
                      { id: 'go-settings', label: 'Go to Settings', subtitle: 'Manage your account and preferences', icon: <Settings size={16} />, shortcut: ['cmd', ','], onSelect: () => console.log('Settings') },
                    ]
                  },
                  {
                    id: 'recent',
                    heading: 'Recent Items',
                    items: [
                      { id: 'inv-001', label: 'INV-001', subtitle: 'Acme Corp — ₹12,500.00', icon: <FileText size={16} />, onSelect: () => console.log('View INV-001') },
                      { id: 'dlr-003', label: 'Kumar & Sons', subtitle: 'Dealer DLR-003', icon: <Users size={16} />, onSelect: () => console.log('View DLR-003') },
                    ]
                  }
                ]}
              />
            </div>
          </Section>

          {/* Filter Builder */}
          <Section title="Filter Builder" id="filter">
            <div className="max-w-3xl">
              <FilterBuilder
                rules={filterRules}
                onChange={setFilterRules}
                fields={[
                  { value: 'status', label: 'Status', type: 'select', options: [
                    { value: 'paid', label: 'Paid' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'overdue', label: 'Overdue' }
                  ]},
                  { value: 'amount', label: 'Amount', type: 'number' },
                  { value: 'customerName', label: 'Customer Name', type: 'text' },
                  { value: 'date', label: 'Invoice Date', type: 'date' },
                ]}
              />
              {filterRules.length > 0 && (
                <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] rounded-xl">
                  <h4 className="text-[12px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Generated Query Object</h4>
                  <pre className="text-[11px] font-mono text-[var(--color-text-primary)]">
                    {JSON.stringify(filterRules, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Section>

          {/* Pagination */}
          <Section title="Pagination" id="pagination">
            <div className="max-w-md bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-4 rounded-xl flex items-center justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={12}
                onPageChange={setCurrentPage}
              />
            </div>
          </Section>

          {/* Charts */}
          <Section title="Charts" id="charts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <Sub label="CSS Bar Chart">
                  <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-6 rounded-xl">
                    <div className="mb-6">
                      <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Monthly Revenue</h4>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Last 6 months</p>
                    </div>
                    <BarChart 
                      height={160}
                      valueFormatter={(v) => `₹${(v/1000).toFixed(1)}k`}
                      data={[
                        { label: 'Jan', value: 12500, color: 'var(--color-neutral-300)' },
                        { label: 'Feb', value: 18000, color: 'var(--color-neutral-300)' },
                        { label: 'Mar', value: 14500, color: 'var(--color-neutral-300)' },
                        { label: 'Apr', value: 22000, color: 'var(--color-neutral-300)' },
                        { label: 'May', value: 28000, color: 'var(--color-neutral-300)' },
                        { label: 'Jun', value: 34000, color: 'var(--color-neutral-900)' },
                      ]}
                    />
                  </div>
                </Sub>
              </div>

              <div className="space-y-4">
                <Sub label="SVG Sparklines (Inline trends)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                           <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Orders</div>
                           <div className="text-[16px] font-bold text-[var(--color-text-primary)]">342</div>
                         </div>
                         <div className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12%</div>
                      </div>
                      <Sparkline data={[10, 15, 12, 18, 25, 22, 35]} color="success" />
                    </div>
                    
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                           <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Returns</div>
                           <div className="text-[16px] font-bold text-[var(--color-text-primary)]">14</div>
                         </div>
                         <div className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">-4%</div>
                      </div>
                      <Sparkline data={[20, 18, 15, 19, 14, 10, 12]} color="danger" />
                    </div>
                  </div>
                </Sub>
              </div>
            </div>
          </Section>

          {/* Stats */}
          <Section title="Stat cards" id="stats">
            <Sub label="Standard Vertical (Dashboard KPI)">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard 
                  label="Total Revenue" 
                  value="₹12.4L" 
                  change={{ value: 8.2, timeFrame: 'vs last month' }} 
                  icon={<ArrowUpRight size={20} className="text-emerald-500" />}
                >
                   <Sparkline data={[10, 15, 12, 18, 25, 22, 35]} color="success" height={80} fill={true} strokeWidth={3} />
                </StatCard>

                <StatCard 
                  label="Total Orders" 
                  value="342" 
                  change={{ value: -2.1, timeFrame: 'vs last month' }} 
                  icon={<ShoppingCart size={20} />}
                >
                  <Sparkline data={[35, 30, 28, 22, 15, 18, 10]} color="danger" height={80} fill={true} strokeWidth={3} />
                </StatCard>

                <StatCard 
                  label="Pending Approvals" 
                  value="14" 
                  icon={<Clock size={20} className="text-amber-500" />}
                />

                <StatCard 
                  label="Active Dealers" 
                  value="67" 
                  change={{ value: 12, timeFrame: 'new this year' }} 
                  icon={<Users size={20} className="text-blue-500" />}
                />
              </div>
            </Sub>

            <Sub label="Horizontal (List view / Sidebars)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mt-6">
                <StatCard 
                  layout="horizontal"
                  label="Daily Revenue" 
                  value="₹45,200" 
                  change={{ value: 12.5 }} 
                  icon={<TrendingUp size={20} />}
                />
                <StatCard 
                  layout="horizontal"
                  label="Returns" 
                  value="12" 
                  change={{ value: -4.2 }} 
                  icon={<Archive size={20} />}
                />
              </div>
            </Sub>
          </Section>

          {/* Ledger */}
          <Section title="Ledger cards" id="ledger">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LedgerCard name="Cash in Hand" code="1001" balance={145230} balanceType="Dr" recentTransactions={[
                { id: '1', date: '01 Mar', description: 'Sales receipt — INV-001', credit: 12500 },
                { id: '2', date: '28 Feb', description: 'Petty cash withdrawal', debit: 5000 },
              ]} />
              <LedgerCard name="Sharma Trading Co." code="DLR-001" balance={45000} balanceType="Dr" recentTransactions={[
                { id: '1', date: '01 Mar', description: 'Invoice raised', debit: 25000 },
                { id: '2', date: '25 Feb', description: 'Payment received', credit: 15000 },
              ]} />
            </div>
          </Section>

          {/* Date picker */}
          <Section title="Date picker" id="date">
            <div className="max-w-[200px]">
              <DatePicker label="Transaction date" value={dateVal} onChange={setDateVal} />
            </div>
          </Section>

          {/* Date range picker */}
          <Section title="Date range picker" id="daterange">
            <div className="max-w-lg">
              <DateRangePicker
                label="Report period"
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </Section>

          {/* File upload */}
          <Section title="File upload" id="upload">
            <div className="max-w-md">
              <FileUpload
                label="Supporting documents"
                hint="PDF, JPG, PNG (max. 5MB)"
                maxFiles={3}
                onUpload={(files) => console.log('Uploaded:', files)}
              />
            </div>
          </Section>

          {/* Avatar + Profile + Breadcrumb + PageHeader */}
          <Section title="Profile & navigation" id="modal">
            <Sub label="Avatars">
              <div className="flex items-center gap-3">
                <Avatar firstName="Anas" size="xs" />
                <Avatar firstName="Anas" lastName="Khan" size="sm" />
                <Avatar firstName="Priya" lastName="Sharma" size="md" />
                <Avatar firstName="Raj" lastName="Patel" size="lg" />
              </div>
            </Sub>
            <Sub label="Profile menu">
              <ProfileMenu user={{ firstName: 'Anas', lastName: 'Khan', email: 'anas@orchestrator.io', role: 'Admin' }} onLogout={() => {}} onProfile={() => {}} onSettings={() => {}} />
            </Sub>
            <Sub label="Breadcrumb">
              <Breadcrumb items={[
                { label: 'Dashboard', onClick: () => {} },
                { label: 'Ledgers', onClick: () => {} },
                { label: 'Cash in Hand' },
              ]} />
            </Sub>
            <Sub label="Page header">
              <PageHeader
                title="Pending approvals"
                description="Review and process pending requests"
                breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', onClick: () => {} }, { label: 'Approvals' }]} />}
                actions={<Button size="sm">Refresh</Button>}
              />
            </Sub>
          </Section>

          {/* Modal */}
          <Section title="Modal (with Unsaved Changes Protection)" id="modal">
            <Button onClick={() => { setIsModalOpen(true); setIsModalDirty(false); }}>Open modal</Button>
            <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              title="Create invoice" 
              description="Type anything below to see the 'unsaved changes' protection when trying to close." 
              size="lg" 
              isDirty={isModalDirty}
              footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={() => setIsModalOpen(false)}>Create</Button></>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Customer" placeholder="Enter customer..." onChange={() => setIsModalDirty(true)} />
                <Input label="Amount" type="number" placeholder="0.00" onChange={() => setIsModalDirty(true)} />
              </div>
            </Modal>
          </Section>

          {/* Drawer */}
          <Section title="Drawer (with Unsaved Changes Protection)" id="drawer">
            <Button variant="secondary" onClick={() => { setIsDrawerOpen(true); setIsDrawerDirty(false); }}>Open drawer</Button>
            <Drawer 
              isOpen={isDrawerOpen} 
              onClose={() => setIsDrawerOpen(false)} 
              title="Edit invoice" 
              description="Type anything below to trigger protection." 
              isDirty={isDrawerDirty}
              footer={<><Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button><Button onClick={() => setIsDrawerOpen(false)}>Save</Button></>}
            >
              <div className="space-y-4">
                <Input label="Customer" defaultValue="Acme Corp" onChange={() => setIsDrawerDirty(true)} />
                <Input label="Amount" type="number" defaultValue="12500.00" onChange={() => setIsDrawerDirty(true)} />
              </div>
            </Drawer>
          </Section>

          {/* Journal */}
          <Section title="Journal entry" id="journal">
            <Button onClick={() => setIsJournalOpen(true)}>New journal voucher</Button>
            <JournalEntryModal isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} onSubmit={() => setIsJournalOpen(false)} accounts={['Cash in Hand', 'Bank Account', 'Sales', 'Purchase', 'GST Payable', 'GST Receivable']} />
          </Section>

          {/* Product */}
          <Section title="Product entry" id="product">
            <Button onClick={() => setIsProductOpen(true)}>Add product</Button>
            <ProductEntryModal isOpen={isProductOpen} onClose={() => setIsProductOpen(false)} onSubmit={() => setIsProductOpen(false)} />
          </Section>

          {/* Sales Order */}
          <Section title="Sales order" id="sales">
            <Button onClick={() => setIsSalesOpen(true)}>New sales order</Button>
            <SalesOrderModal isOpen={isSalesOpen} onClose={() => setIsSalesOpen(false)} onSubmit={() => setIsSalesOpen(false)} products={['Copper Wire 2.5mm', 'Steel Rod 8mm', 'PVC Pipe 4inch', 'Cement 50kg']} dealers={['Sharma Trading Co.', 'Patel Enterprises', 'Kumar & Sons']} />
          </Section>

          {/* Dispatch */}
          <Section title="Dispatch" id="dispatch">
            <Button onClick={() => setIsDispatchOpen(true)}>Dispatch order</Button>
            <DispatchModal isOpen={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} onSubmit={() => setIsDispatchOpen(false)} order={{
              ref: 'SO-0421', dealer: 'Sharma Trading Co.',
              lines: [
                { product: 'Copper Wire 2.5mm', ordered: 100, dispatched: 40 },
                { product: 'Steel Rod 8mm', ordered: 50, dispatched: 0 },
                { product: 'PVC Pipe 4inch', ordered: 200, dispatched: 120 },
              ],
            }} />
          </Section>

          {/* Sidebar preview */}
          <Section title="Sidebar" id="sidebar">
            <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden h-[400px]">
              <Sidebar
                groups={[
                  { items: [
                    { id: 'dashboard', label: 'Dashboard', href: '/' },
                    { id: 'approvals', label: 'Approvals', href: '/approvals', badge: 3 },
                  ]},
                  { title: 'Masters', items: [
                    { id: 'products', label: 'Products', href: '/products' },
                    { id: 'dealers', label: 'Dealers', href: '/dealers' },
                    { id: 'ledgers', label: 'Ledgers', href: '/ledgers' },
                  ]},
                  { title: 'Transactions', items: [
                    { id: 'orders', label: 'Sales orders', href: '/orders' },
                    { id: 'invoices', label: 'Invoices', href: '/invoices' },
                    { id: 'journals', label: 'Journal entries', href: '/journals' },
                  ]},
                ]}
                activeId="dashboard"
                onNavigate={() => {}}
                onLogout={() => {}}
              />
            </div>
          </Section>

          {/* Mobile Components */}
          <Section title="Mobile components" id="mobile">
            <Sub label="Bottom navigation (visible on mobile only)">
              <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden relative h-[120px] bg-[var(--color-surface-secondary)]">
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="bg-[var(--color-surface-primary)] border-t border-[var(--color-border-default)]">
                    <div className="flex items-center justify-around h-14 px-2">
                      {mobileNavItems.map((item) => {
                        const isActive = mobileActiveNav === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setMobileActiveNav(item.id)}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0"
                          >
                            <div className="relative">
                              {item.icon && React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{size?: number; className?: string}>, {
                                size: 20,
                                className: isActive ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-text-tertiary)]',
                              })}
                              {item.badge !== undefined && (
                                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white tabular-nums bg-red-500 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-text-tertiary)]'}`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
                The real BottomNav component auto-hides on screens wider than 640px. Use it with MobileAppShell for full integration.
              </p>
            </Sub>

            <Sub label="Bottom sheet (mobile modal)">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsBottomSheetOpen(true)}>
                  Open bottom sheet
                </Button>
              </div>
              <BottomSheet
                isOpen={isBottomSheetOpen}
                onClose={() => setIsBottomSheetOpen(false)}
                title="Create invoice"
                description="Swipe down to dismiss on mobile."
                footer={<><Button variant="secondary" onClick={() => setIsBottomSheetOpen(false)}>Cancel</Button><Button onClick={() => setIsBottomSheetOpen(false)}>Create</Button></>}
              >
                <div className="space-y-4">
                  <Input label="Customer" placeholder="Enter customer name..." />
                  <Input label="Amount" type="number" placeholder="0.00" />
                  <Select label="Payment terms" options={[
                    { value: 'net30', label: 'Net 30' },
                    { value: 'net60', label: 'Net 60' },
                    { value: 'cod', label: 'Cash on delivery' },
                  ]} />
                </div>
              </BottomSheet>
            </Sub>

            <Sub label="Action sheet (iOS-style)">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsActionSheetOpen(true)}>
                  Show actions
                </Button>
              </div>
              <ActionSheet
                isOpen={isActionSheetOpen}
                onClose={() => setIsActionSheetOpen(false)}
                title="Invoice actions"
                items={actionSheetItems}
                onSelect={() => {}}
              />
            </Sub>

            <Sub label="Swipeable cards (swipe left/right on mobile)">
              <div className="space-y-2 max-w-md">
                <SwipeableCard
                  rightActions={[{ id: 'archive', label: 'Archive', color: '#ef4444' }]}
                  leftActions={[{ id: 'approve', label: 'Approve', color: '#22c55e' }]}
                  onAction={() => {}}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">INV-001</span>
                        <Badge variant="success" dot>Paid</Badge>
                      </div>
                      <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">Acme Corp</p>
                    </div>
                    <span className="text-[13px] tabular-nums">₹12,500</span>
                  </div>
                </SwipeableCard>
                <SwipeableCard
                  rightActions={[{ id: 'archive', label: 'Archive', color: '#ef4444' }]}
                  leftActions={[{ id: 'approve', label: 'Approve', color: '#22c55e' }]}
                  onAction={() => {}}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">INV-002</span>
                        <Badge variant="warning" dot>Pending</Badge>
                      </div>
                      <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">Globex Industries</p>
                    </div>
                    <span className="text-[13px] tabular-nums">₹8,750</span>
                  </div>
                </SwipeableCard>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
                Swipe left to reveal delete, swipe right to approve. Touch-optimized for mobile.
              </p>
            </Sub>

            <Sub label="Responsive layout helpers">
              <div className="space-y-4">
                <p className="text-[11px] text-[var(--color-text-tertiary)]">ResponsiveGrid — adapts columns by breakpoint:</p>
                <ResponsiveGrid cols={1} smCols={2} lgCols={4} gap="normal">
                  <StatCard label="Revenue" value="₹12.4L" />
                  <StatCard label="Orders" value="342" />
                  <StatCard label="Pending" value="₹2.8L" />
                  <StatCard label="Dealers" value="67" />
                </ResponsiveGrid>

                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-4">Stack — vertical on mobile, horizontal on desktop:</p>
                <Stack responsive gap="md" align="center">
                  <Button variant="secondary" size="sm" fullWidth>Export CSV</Button>
                  <Button variant="secondary" size="sm" fullWidth>Print</Button>
                  <Button size="sm" fullWidth>New entry</Button>
                </Stack>
              </div>
            </Sub>

            <Sub label="Pull to refresh (touch & drag down)">
              <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden max-w-md">
                <PullToRefresh
                  onRefresh={async () => {
                    await new Promise((r) => setTimeout(r, 1500));
                    setPullRefreshDone(true);
                    setTimeout(() => setPullRefreshDone(false), 2000);
                  }}
                >
                  <div className="p-4 bg-[var(--color-surface-primary)]">
                    <div className="flex items-center gap-2 mb-3">
                      {pullRefreshDone && <CheckCircle size={14} className="text-emerald-600" />}
                      <p className="text-[13px] text-[var(--color-text-secondary)]">
                        {pullRefreshDone ? 'Refreshed!' : 'Pull down to refresh (touch devices)'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {['Transaction A — ₹5,000', 'Transaction B — ₹12,300', 'Transaction C — ₹800'].map((t) => (
                        <div key={t} className="text-[12px] text-[var(--color-text-tertiary)] py-1.5 border-b border-[var(--color-border-subtle)]">{t}</div>
                      ))}
                    </div>
                  </div>
                </PullToRefresh>
              </div>
            </Sub>

            <Sub label="Floating action button">
              <p className="text-[11px] text-[var(--color-text-tertiary)] mb-2">
                FAB is a fixed-position button. In production, use with <code className="text-[11px] bg-[var(--color-surface-tertiary)] px-1 py-0.5 rounded">clearBottomNav</code> to offset above the BottomNav.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Plus />}>Primary FAB</Button>
                <Button variant="ghost" size="sm" leftIcon={<MoreHorizontal />}>Secondary FAB</Button>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                (FAB is not rendered here to avoid floating over the showcase. Import and use <code className="text-[11px] bg-[var(--color-surface-tertiary)] px-1 py-0.5 rounded">FAB</code> in your layout.)
              </p>
            </Sub>

            <Sub label="MobileAppShell usage">
              <div className="bg-[var(--color-surface-tertiary)] rounded-xl p-4 text-[12px] font-mono text-[var(--color-text-secondary)] leading-relaxed overflow-x-auto">
                <pre>{`<MobileAppShell
  title="Dashboard"
  sidebar={<Sidebar ... />}
  bottomNav={<BottomNav items={...} />}
  topBarRight={<ProfileMenu ... />}
>
  <PullToRefresh onRefresh={handleRefresh}>
    <ResponsiveContainer>
      <ResponsiveGrid cols={1} smCols={2} lgCols={4}>
        <StatCard ... />
      </ResponsiveGrid>
    </ResponsiveContainer>
  </PullToRefresh>
  <FAB icon={<Plus />} clearBottomNav />
</MobileAppShell>`}</pre>
              </div>
            </Sub>
          </Section>

          {/* Empty state */}
          <Section title="Empty state" id="toast">
            <div className="border border-[var(--color-border-default)] rounded-xl bg-[var(--color-surface-primary)]">
              <EmptyState title="No pending approvals" description="All requests have been processed. Check back later." action={<Button variant="secondary" size="sm">Refresh</Button>} />
            </div>
          </Section>

          {/* Toast */}
          <Section title="Toast notifications" id="toast">
            <ToastDemo />
          </Section>

          {/* Tokens */}
          <Section title="Design tokens" id="tokens">
            <Sub label="Neutral palette">
              <div className="flex gap-0.5">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => (
                  <div key={s} className="flex-1">
                    <div className="h-8 rounded-md border border-[var(--color-border-subtle)]" style={{ backgroundColor: `var(--color-neutral-${s})` }} />
                    <p className="text-[9px] text-center mt-1 text-[var(--color-text-tertiary)] tabular-nums">{s}</p>
                  </div>
                ))}
              </div>
            </Sub>
            <Sub label="Typography">
              <div className="space-y-2">
                {[
                  { cls: 'text-2xl font-bold', label: '24 / Bold' },
                  { cls: 'text-xl font-semibold', label: '20 / Semibold' },
                  { cls: 'text-[15px] font-semibold', label: '15 / Semibold' },
                  { cls: 'text-[13px] font-medium', label: '13 / Medium' },
                  { cls: 'text-[11px] font-medium uppercase tracking-widest', label: '11 / Label' },
                ].map((t) => (
                  <div key={t.label} className="flex items-baseline gap-4">
                    <span className={`${t.cls} text-[var(--color-text-primary)]`}>Orchestrator</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{t.label}</span>
                  </div>
                ))}
              </div>
            </Sub>
          </Section>

          <div className="text-center py-6 border-t border-[var(--color-border-default)]">
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              Orchestrator &middot; Design System
            </p>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
