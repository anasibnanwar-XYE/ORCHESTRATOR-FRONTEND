import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  Banknote,
  CheckCircle,
  Eye,
  Play,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/formatUtils';
import ApiErrorBanner, { type ApiErrorInfo } from '../../components/ApiErrorBanner';
import {
  listPayrollRuns,
  getPayrollRun,
  getPayrollRunLines,
  createWeeklyPayrollRun,
  createMonthlyPayrollRun,
  calculatePayroll,
  approvePayroll,
  postPayrollToAccounting,
  markPayrollAsPaid,
  getCurrentWeekPaySummary,
  getCurrentMonthPaySummary,
  getWeeklyPaySummary,
  getMonthlyPaySummary,
  type PayrollRun,
  type PayrollRunLine,
  type PayrollSummary,
} from '../../lib/adminApi';

/* ── Shared style constants ─────────────────────────────────────────── */

const selectCls = 'w-full h-9 sm:h-10 rounded-md border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const inputCls = selectCls;
const labelCls = 'block text-xs sm:text-sm font-medium text-primary mb-1';
const cardCls = 'rounded-xl border border-border bg-surface';
const thCls = 'px-3 sm:px-4 py-2 text-left text-xs font-medium text-secondary';
const tdCls = 'px-3 sm:px-4 py-2 text-xs sm:text-sm';
const actionBtnCls = 'inline-flex items-center justify-center gap-1.5 rounded-md bg-action-bg px-3 py-1.5 text-xs font-medium text-action-text hover:opacity-90 transition-all touch-manipulation min-h-[36px]';
const secondaryBtnCls = 'rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-highlight transition-colors touch-manipulation min-h-[44px] sm:min-h-0';

type TabType = 'runs' | 'summary' | 'create';
type RunFilterType = 'WEEKLY' | 'MONTHLY';
type SummaryViewType = 'current' | 'weekly' | 'monthly';

const statusTokens: Record<string, string> = {
  DRAFT: 'bg-surface-highlight text-secondary',
  CALCULATED: 'bg-status-info-bg text-status-info-text',
  APPROVED: 'bg-status-success-bg text-status-success-text',
  POSTED: 'bg-action-bg text-action-text',
  PAID: 'bg-status-success-bg text-status-success-text',
};

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const confirmInitial: ConfirmState = { open: false, title: '', message: '', onConfirm: () => {} };

/* ── Main component ──────────────────────────────────────────────────── */

export default function PayrollPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('runs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Payroll runs state
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [runLines, setRunLines] = useState<PayrollRunLine[]>([]);
  const [filters, setFilters] = useState<{ type?: RunFilterType; status?: string }>({});

  // Create run state
  const [runType, setRunType] = useState<RunFilterType>('WEEKLY');
  const [weekEndingDate, setWeekEndingDate] = useState(() => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    return sunday.toISOString().split('T')[0];
  });
  const [createYear, setCreateYear] = useState(new Date().getFullYear());
  const [createMonth, setCreateMonth] = useState(new Date().getMonth() + 1);

  // Summary state
  const [summaryType, setSummaryType] = useState<SummaryViewType>('current');
  const [summaryRunType, setSummaryRunType] = useState<RunFilterType>('WEEKLY');
  const [weekEndingDateSummary, setWeekEndingDateSummary] = useState(() => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    return sunday.toISOString().split('T')[0];
  });
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  // Mark paid state
  const [paymentReference, setPaymentReference] = useState('');
  const [showMarkPaidModal, setShowMarkPaidModal] = useState<number | null>(null);

  // Confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(confirmInitial);
  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirm({ open: true, title, message, onConfirm });
  };

  useEffect(() => {
    if (session) loadRuns();
  }, [session, filters]);

  /* ── Data loaders ──────────────────────────────────────────────── */

  const loadRuns = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await listPayrollRuns(filters, session, session.companyCode);
      setRuns(data as PayrollRun[]);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to load payroll runs', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetails = async (runId: number) => {
    if (!session) return;
    try {
      setLoading(true);
      const [runData, linesData] = await Promise.all([
        getPayrollRun(runId, session, session.companyCode),
        getPayrollRunLines(runId, session, session.companyCode),
      ]);
      setSelectedRun(runData as PayrollRun);
      setRunLines(linesData as PayrollRunLine[]);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to load run details', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  /* ── Actions ───────────────────────────────────────────────────── */

  const handleCreateRun = async () => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (runType === 'WEEKLY') {
        await createWeeklyPayrollRun(weekEndingDate, session, session.companyCode);
      } else {
        await createMonthlyPayrollRun(createYear, createMonth, session, session.companyCode);
      }
      setSuccess(`${runType} payroll run created successfully`);
      setActiveTab('runs');
      loadRuns();
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to create payroll run', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (runId: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      await calculatePayroll(runId, session, session.companyCode);
      setSuccess('Payroll calculated successfully');
      loadRuns();
      loadRunDetails(runId);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to calculate payroll', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (runId: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      await approvePayroll(runId, session, session.companyCode);
      setSuccess('Payroll approved successfully');
      loadRuns();
      loadRunDetails(runId);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to approve payroll', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (runId: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      await postPayrollToAccounting(runId, session, session.companyCode);
      setSuccess('Payroll posted to accounting successfully');
      loadRuns();
      loadRunDetails(runId);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to post payroll', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (runId: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      await markPayrollAsPaid(runId, { paymentReference: paymentReference || undefined }, session, session.companyCode);
      setSuccess('Payroll marked as paid');
      setShowMarkPaidModal(null);
      setPaymentReference('');
      loadRuns();
      loadRunDetails(runId);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to mark payroll as paid', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSummary = async () => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      setSummary(null);
      let data: PayrollSummary;
      if (summaryType === 'current') {
        data = summaryRunType === 'WEEKLY'
          ? await getCurrentWeekPaySummary(session, session.companyCode)
          : await getCurrentMonthPaySummary(session, session.companyCode);
      } else if (summaryType === 'weekly') {
        data = await getWeeklyPaySummary(weekEndingDateSummary, session, session.companyCode);
      } else {
        data = await getMonthlyPaySummary(summaryYear, summaryMonth, session, session.companyCode);
      }
      setSummary(data);
    } catch (err: unknown) {
      setError({ message: err instanceof Error ? err.message : 'Failed to load payroll summary', body: (err as Record<string, unknown>)?.body });
    } finally {
      setLoading(false);
    }
  };

  const canCalculate = (run: PayrollRun) => run.status === 'DRAFT';
  const canApprove = (run: PayrollRun) => run.status === 'CALCULATED';
  const canPost = (run: PayrollRun) => run.status === 'APPROVED';
  const canMarkPaid = (run: PayrollRun) => run.status === 'POSTED';

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-primary">Payroll Management</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Manage payroll runs, calculate pay, and process payments
          </p>
        </div>
      </div>

      {/* Alerts */}
      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />
      {success && (
        <div className="rounded-lg bg-status-success-bg p-3 sm:p-4 text-sm text-status-success-text">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {(['runs', 'summary', 'create'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(null); setSuccess(null); }}
            className={[
              'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation min-h-[44px] sm:min-h-0',
              activeTab === tab
                ? 'border-action-bg text-primary'
                : 'border-transparent text-secondary hover:text-primary',
            ].join(' ')}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Payroll Runs Tab ─────────────────────────────────────── */}
      {activeTab === 'runs' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cardCls} p-4`}>
            <div>
              <label className={labelCls}>Type</label>
              <select
                className={selectCls}
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: (e.target.value as RunFilterType) || undefined })}
              >
                <option value="">All Types</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={selectCls}
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CALCULATED">Calculated</option>
                <option value="APPROVED">Approved</option>
                <option value="POSTED">Posted</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadRuns}
                disabled={loading}
                className="w-full h-9 sm:h-10 rounded-md bg-action-bg px-4 text-sm font-medium text-action-text hover:opacity-90 transition-all touch-manipulation disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Runs list */}
          <div className={`overflow-hidden ${cardCls}`}>
            {loading && runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-secondary">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-border border-t-action-bg mb-2" />
                <div>Loading payroll runs...</div>
              </div>
            ) : runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-secondary">
                No payroll runs found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className={[
                      'p-4 hover:bg-surface-highlight transition-colors cursor-pointer',
                      selectedRun?.id === run.id ? 'bg-surface-highlight' : '',
                    ].join(' ')}
                    onClick={() => loadRunDetails(run.id || 0)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-primary">
                            {run.runType} Payroll
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTokens[run.status || 'DRAFT'] || statusTokens.DRAFT}`}>
                            {run.status}
                          </span>
                        </div>
                        <div className="text-xs text-secondary tabular-nums">
                          {formatDate(run.periodStart)} &ndash; {formatDate(run.periodEnd)}
                        </div>
                        {run.totalNetPay != null && run.totalNetPay > 0 && (
                          <div className="text-xs font-medium text-primary mt-1 tabular-nums">
                            Total Net Pay: &#x20B9; {run.totalNetPay.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canCalculate(run) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              askConfirm('Calculate Payroll', `Calculate ${run.runType} payroll for ${formatDate(run.periodStart)} \u2013 ${formatDate(run.periodEnd)}? This will process attendance data.`, () => handleCalculate(run.id || 0));
                            }}
                            className={actionBtnCls}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Calculate
                          </button>
                        )}
                        {canApprove(run) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              askConfirm('Approve Payroll', `Approve ${run.runType} payroll for ${formatDate(run.periodStart)} \u2013 ${formatDate(run.periodEnd)}${run.totalNetPay ? ` (Net: \u20B9${run.totalNetPay.toLocaleString()})` : ''}? This action cannot be undone.`, () => handleApprove(run.id || 0));
                            }}
                            className={actionBtnCls}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                        )}
                        {canPost(run) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              askConfirm('Post to Accounting', `Post ${run.runType} payroll for ${formatDate(run.periodStart)} \u2013 ${formatDate(run.periodEnd)}${run.totalNetPay ? ` (Net: \u20B9${run.totalNetPay.toLocaleString()})` : ''} to accounting? This will create journal entries in the general ledger.`, () => handlePost(run.id || 0));
                            }}
                            className={actionBtnCls}
                          >
                            <FileText className="h-3 w-3" />
                            Post
                          </button>
                        )}
                        {canMarkPaid(run) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowMarkPaidModal(run.id || 0); }}
                            className={actionBtnCls}
                          >
                            <Banknote className="h-3 w-3" />
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run details table */}
          {selectedRun && runLines.length > 0 && (
            <div className={`${cardCls} p-4 sm:p-6`}>
              <h3 className="font-display text-base sm:text-lg font-semibold text-primary mb-4">
                Payroll Details
              </h3>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-highlight">
                    <tr>
                      <th className={thCls}>Employee</th>
                      <th className={`${thCls} text-right`}>Hours</th>
                      <th className={`${thCls} text-right`}>Gross Pay</th>
                      <th className={`${thCls} text-right`}>Deductions</th>
                      <th className={`${thCls} text-right`}>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {runLines.map((line) => (
                      <tr key={line.id} className="hover:bg-surface-highlight transition-colors">
                        <td className={tdCls}>
                          <div className="font-medium text-primary">{line.employeeName}</div>
                          <div className="text-xs text-secondary font-mono">{line.employeeCode}</div>
                        </td>
                        <td className={`${tdCls} text-right tabular-nums`}>
                          {line.regularHours || 0} + {line.overtimeHours || 0} OT
                        </td>
                        <td className={`${tdCls} text-right font-mono tabular-nums`}>&#x20B9; {(line.grossPay || 0).toLocaleString()}</td>
                        <td className={`${tdCls} text-right font-mono tabular-nums`}>&#x20B9; {(line.deductions || 0).toLocaleString()}</td>
                        <td className={`${tdCls} text-right font-mono font-bold text-primary tabular-nums`}>&#x20B9; {(line.netPay || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-border">
                {runLines.map((line) => (
                  <div key={line.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-primary text-sm">{line.employeeName}</div>
                        <div className="text-xs text-secondary font-mono">{line.employeeCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-tertiary uppercase">Net Pay</div>
                        <div className="font-bold font-mono text-primary tabular-nums text-sm">&#x20B9; {(line.netPay || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-secondary tabular-nums">
                      <span>Hours: {line.regularHours || 0} + {line.overtimeHours || 0} OT</span>
                      <span>Gross: &#x20B9; {(line.grossPay || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Summary Tab ──────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="space-y-4 sm:space-y-6">
          <div className={`${cardCls} p-4 sm:p-6`}>
            <h2 className="font-display text-base sm:text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Payroll Preview
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div>
                <label className={labelCls}>Type</label>
                <select
                  className={selectCls}
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value as SummaryViewType)}
                >
                  <option value="current">Current Period</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {summaryType === 'current' ? (
                <div>
                  <label className={labelCls}>Period Type</label>
                  <select
                    className={selectCls}
                    value={summaryRunType}
                    onChange={(e) => setSummaryRunType(e.target.value as RunFilterType)}
                  >
                    <option value="WEEKLY">Current Week</option>
                    <option value="MONTHLY">Current Month</option>
                  </select>
                </div>
              ) : summaryType === 'weekly' ? (
                <div>
                  <label className={labelCls}>Week Ending Date (Sunday)</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={weekEndingDateSummary}
                    onChange={(e) => setWeekEndingDateSummary(e.target.value)}
                  />
                </div>
              ) : summaryType === 'monthly' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Year</label>
                    <input type="number" min="2020" max="2100" className={inputCls} value={summaryYear} onChange={(e) => setSummaryYear(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Month</label>
                    <input type="number" min="1" max="12" className={inputCls} value={summaryMonth} onChange={(e) => setSummaryMonth(Number(e.target.value))} />
                  </div>
                </div>
              ) : null}
            </div>

            <button
              onClick={handlePreviewSummary}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-action-bg px-4 py-2 text-sm font-medium text-action-text hover:opacity-90 transition-all touch-manipulation disabled:opacity-50 min-h-[44px] sm:min-h-0"
            >
              <Eye className="h-4 w-4" />
              Preview Payroll
            </button>

            {summary && (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg bg-surface-highlight p-4">
                  <div className="text-xs sm:text-sm text-secondary tabular-nums">
                    <div>Period: {formatDate(summary.period?.from)} to {formatDate(summary.period?.to)}</div>
                    <div>Calculated at: {summary.calculatedAt ? new Date(summary.calculatedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-highlight">
                      <tr>
                        <th className={thCls}>Employee</th>
                        <th className={`${thCls} text-right`}>Days</th>
                        <th className={`${thCls} text-right`}>Gross</th>
                        <th className={`${thCls} text-right`}>Advance</th>
                        <th className={`${thCls} text-right`}>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {summary.employees.map((emp: Record<string, unknown>) => (
                        <tr key={String(emp.employeeId)} className="hover:bg-surface-highlight transition-colors">
                          <td className={tdCls}>
                            <div className="font-medium text-primary">{String(emp.employeeName)}</div>
                            <div className="text-xs text-secondary font-mono">{String(emp.employeeCode)}</div>
                          </td>
                          <td className={`${tdCls} text-right tabular-nums`}>
                            {String(emp.daysPresent)} full + {String(emp.daysHalf)} half
                          </td>
                          <td className={`${tdCls} text-right font-mono tabular-nums`}>&#x20B9; {Number(emp.grossPay).toLocaleString()}</td>
                          <td className={`${tdCls} text-right font-mono tabular-nums`}>&#x20B9; {Number(emp.advanceDeducted).toLocaleString()}</td>
                          <td className={`${tdCls} text-right font-mono font-bold text-primary tabular-nums`}>&#x20B9; {Number(emp.netPay).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-highlight font-bold border-t-2 border-border">
                      <tr>
                        <td colSpan={4} className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm text-primary">Grand Total</td>
                        <td className="px-3 sm:px-4 py-2 text-right font-mono text-sm sm:text-lg text-primary tabular-nums">&#x20B9; {summary.grandTotal.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                  {summary.employees.map((emp: Record<string, unknown>) => (
                    <div key={String(emp.employeeId)} className={`${cardCls} p-4`}>
                      <div className="mb-3 border-b border-border pb-3">
                        <div className="font-semibold text-primary text-sm">{String(emp.employeeName)}</div>
                        <div className="text-xs text-secondary font-mono mt-0.5">{String(emp.employeeCode)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-secondary">Days Worked</span>
                          <span className="text-xs text-primary tabular-nums">{String(emp.daysPresent)} full + {String(emp.daysHalf)} half</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-secondary">Gross Pay</span>
                          <span className="text-xs font-mono text-primary tabular-nums">&#x20B9; {Number(emp.grossPay).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-secondary">Advance Deducted</span>
                          <span className="text-xs font-mono text-primary tabular-nums">&#x20B9; {Number(emp.advanceDeducted).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-sm font-bold text-primary">Net Pay</span>
                          <span className="text-sm font-bold font-mono text-primary tabular-nums">&#x20B9; {Number(emp.netPay).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Grand total */}
                  <div className="rounded-lg border-2 border-border bg-surface-highlight p-4">
                    <div className="text-sm font-bold text-primary mb-1">Grand Total</div>
                    <div className="text-lg font-bold font-mono text-primary tabular-nums">&#x20B9; {summary.grandTotal.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Run Tab ───────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div className={`${cardCls} p-4 sm:p-6`}>
          <h2 className="font-display text-base sm:text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Play className="h-5 w-5" />
            Create Payroll Run
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className={labelCls}>Run Type</label>
              <select
                className={selectCls}
                value={runType}
                onChange={(e) => setRunType(e.target.value as RunFilterType)}
              >
                <option value="WEEKLY">Weekly (for labourers)</option>
                <option value="MONTHLY">Monthly (for staff)</option>
              </select>
            </div>
            {runType === 'WEEKLY' ? (
              <div>
                <label className={labelCls}>Week Ending Date (Sunday)</label>
                <input type="date" className={inputCls} value={weekEndingDate} onChange={(e) => setWeekEndingDate(e.target.value)} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" min="2020" max="2100" className={inputCls} value={createYear} onChange={(e) => setCreateYear(Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Month</label>
                  <input type="number" min="1" max="12" className={inputCls} value={createMonth} onChange={(e) => setCreateMonth(Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCreateRun}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-action-bg px-4 py-2 text-sm font-medium text-action-text hover:opacity-90 transition-all touch-manipulation disabled:opacity-50 min-h-[44px] sm:min-h-0"
          >
            <Play className="h-4 w-4" />
            Create {runType} Payroll Run
          </button>
        </div>
      )}

      {/* ── Mark Paid Modal ──────────────────────────────────────── */}
      <Transition show={showMarkPaidModal !== null} as={Fragment}>
        <Dialog onClose={() => { setShowMarkPaidModal(null); setPaymentReference(''); }} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-md items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className="w-full rounded-xl border border-border bg-surface p-6 shadow-xl ring-1 ring-border">
                  <Dialog.Title className="font-display text-lg font-semibold text-primary mb-4">
                    Mark Payroll as Paid
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Payment Reference (Optional)</label>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="e.g., NEFT-123456, UPI-xxx"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end border-t border-border pt-4">
                      <button
                        onClick={() => { setShowMarkPaidModal(null); setPaymentReference(''); }}
                        className={secondaryBtnCls}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => showMarkPaidModal && handleMarkPaid(showMarkPaidModal)}
                        disabled={loading}
                        className="rounded-md bg-action-bg px-4 py-2 text-sm font-medium text-action-text hover:opacity-90 transition-all disabled:opacity-50 touch-manipulation min-h-[44px] sm:min-h-0"
                      >
                        {loading ? 'Processing...' : 'Mark as Paid'}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── Confirm Dialog ───────────────────────────────────────── */}
      <Transition show={confirm.open} as={Fragment}>
        <Dialog onClose={() => setConfirm(confirmInitial)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex min-h-full max-w-sm items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3">
                <Dialog.Panel className="w-full rounded-xl border border-border bg-surface p-6 shadow-xl ring-1 ring-border">
                  <Dialog.Title className="font-display text-lg font-semibold text-primary">
                    {confirm.title}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-secondary">{confirm.message}</p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirm(confirmInitial)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface-highlight transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirm(confirmInitial); confirm.onConfirm(); }}
                      className="rounded-lg bg-action-bg px-6 py-2 text-sm font-medium text-action-text shadow-sm hover:opacity-90 transition-all focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      Confirm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
