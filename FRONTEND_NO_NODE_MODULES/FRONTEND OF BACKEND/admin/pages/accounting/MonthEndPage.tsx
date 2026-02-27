import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listAccountingPeriods, getMonthEndChecklist, updateMonthEndChecklist, closeAccountingPeriod, type AccountingPeriod, type MonthEndChecklistItem } from '../../lib/accountingApi';
import { ResponsiveButton } from '../../design-system/ResponsiveButton';
import { CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { ResponsiveModal } from '../../design-system/ResponsiveModal';

function normalizeDate(d: unknown): Date {
  if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
  return new Date(d as string);
}

export default function MonthEndPage() {
    const { session } = useAuth();
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | ''>('');
    const [checklist, setChecklist] = useState<MonthEndChecklistItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [confirmClose, setConfirmClose] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        loadData();
    }, [session]);

    useEffect(() => {
        if (!session) return;
        const periodId = typeof selectedPeriodId === 'number' && selectedPeriodId > 0 ? selectedPeriodId : undefined;
        getMonthEndChecklist(session, periodId)
            .then((data) => setChecklist(Array.isArray(data) ? data : []))
            .catch(() => setChecklist([]));
    }, [session, selectedPeriodId]);

    const loadData = async () => {
        if (!session) return;
        try {
            setLoading(true);
            const [periodsData, checklistData] = await Promise.all([
                listAccountingPeriods(session),
                getMonthEndChecklist(session)
            ]);
            setPeriods(periodsData || []);
            setChecklist(Array.isArray(checklistData) ? checklistData : []);
        } catch {
            setError('Failed to load month-end data');
            setChecklist([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleItem = (id: string) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const handleSaveProgress = async () => {
        if (!selectedPeriodId) return;
        try {
            await updateMonthEndChecklist(Number(selectedPeriodId), checklist, session);
            setSuccess('Checklist progress saved');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save progress');
        }
    };

    const handleCompleteMonthEnd = () => {
        if (!selectedPeriodId) return;
        const incompleteRequired = checklist.some(i => i.required && !i.completed);
        if (incompleteRequired) {
            setError('Please complete all required checklist items before closing the period.');
            return;
        }
        setConfirmClose(true);
    };

    const handleConfirmClose = async () => {
        if (!selectedPeriodId) return;
        setClosing(true);
        try {
            await updateMonthEndChecklist(Number(selectedPeriodId), checklist, session);
            await closeAccountingPeriod(Number(selectedPeriodId), session);
            setSuccess('Month-end closing completed successfully. Period is now CLOSED.');
            setConfirmClose(false);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to close period');
            setConfirmClose(false);
        } finally {
            setClosing(false);
        }
    };

    const selectedPeriod = periods.find(p => p.id === Number(selectedPeriodId));
    // Safe calculation with array check
    const safeChecklist = Array.isArray(checklist) ? checklist : [];
    const completedCount = safeChecklist.filter(i => i.completed).length;
    const totalCount = safeChecklist.length || 1;
    const completionPercentage = Math.round((completedCount / totalCount) * 100);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'OPEN': return 'success';
            case 'CLOSED': return 'secondary';
            case 'LOCKED': return 'warning';
            default: return 'default';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary">Month-End Closing</h1>
                <p className="text-sm text-secondary">Manage checklist and close accounting periods</p>
            </div>

            {error && (
                <div className="rounded-lg bg-status-error-bg p-4 text-sm text-status-error-text border border-transparent">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-status-success-bg p-4 text-sm text-status-success-text border border-transparent">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Select Period
                            </label>
                            <select
                                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                value={selectedPeriodId}
                                onChange={(e) => setSelectedPeriodId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">Choose a period...</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {format(normalizeDate(p.startDate), 'MMM d, yyyy')} to {format(normalizeDate(p.endDate), 'MMM d, yyyy')} ({p.status})
                                    </option>
                                ))}
                            </select>

                            {selectedPeriod && (
                                <div className="mt-4 pt-4 border-t border-border space-y-3">
                                    <div>
                                        <div className="text-xs text-tertiary uppercase font-semibold mb-1">Status</div>
                                        <Badge variant={getStatusVariant(selectedPeriod.status)}>
                                            {selectedPeriod.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-xs text-tertiary uppercase font-semibold mb-1">Period Range</div>
                                        <p className="text-sm font-medium text-primary">
                                            {format(normalizeDate(selectedPeriod.startDate), 'MMM d, yyyy')}
                                        </p>
                                        <p className="text-xs text-secondary">to</p>
                                        <p className="text-sm font-medium text-primary">
                                            {format(normalizeDate(selectedPeriod.endDate), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm font-medium text-primary mb-2">Progress</div>
                            <div className="h-2 w-full bg-surface-highlight rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-action-bg transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <div className="mt-2 text-right text-xs text-secondary">
                                {completionPercentage}% Complete
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="border-b border-border p-4">
                            <CardTitle className="text-base">Closing Checklist</CardTitle>
                        </CardHeader>
                        <div className="divide-y divide-border">
                            {safeChecklist.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 px-6 py-4 hover:bg-surface-highlight transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={() => handleToggleItem(item.id)}
                                        className="mt-1 h-4 w-4 rounded border-border text-action-bg focus:ring-action-bg bg-background"
                                        disabled={!selectedPeriod || selectedPeriod.status !== 'OPEN'}
                                    />
                                    <div className="flex-1">
                                        <p className={clsx(
                                            "text-sm font-medium",
                                            item.completed ? "text-secondary line-through" : "text-primary"
                                        )}>
                                            {item.label}
                                        </p>
                                        {item.required && (
                                            <p className="text-xs text-status-error-text mt-0.5">Required</p>
                                        )}
                                    </div>
                                     {item.completed && <CheckCircle className="h-5 w-5 text-status-success-text" />}
                                </div>
                            ))}
                            {safeChecklist.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-secondary">
                                    No checklist items found.
                                </div>
                            )}
                        </div>
                        <div className="bg-surface/50 px-6 py-4 rounded-b-xl border-t border-border flex justify-end gap-3">
                            <Button
                                onClick={handleSaveProgress}
                                variant="outline"
                                disabled={!selectedPeriod || selectedPeriod.status !== 'OPEN' || loading}
                            >
                                Save Progress
                            </Button>
                             <Button
                                onClick={handleCompleteMonthEnd}
                                disabled={!selectedPeriod || selectedPeriod.status !== 'OPEN' || loading || closing}
                            >
                                {closing ? 'Closing...' : 'Complete & Close Period'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Close Period Confirmation */}
            <ResponsiveModal
                isOpen={confirmClose}
                onClose={() => setConfirmClose(false)}
                title="Close Accounting Period"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setConfirmClose(false)}
                            disabled={closing}
                            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-highlight sm:w-auto"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmClose}
                            disabled={closing}
                            className="w-full rounded-lg bg-status-error-bg px-4 py-2.5 text-sm font-medium text-status-error-text transition-colors hover:opacity-80 sm:w-auto"
                        >
                            {closing ? 'Closing...' : 'Yes, Close Period'}
                        </button>
                    </>
                }
            >
                <p className="text-sm text-secondary">
                    Are you sure you want to close this accounting period? This action is <strong className="text-primary">irreversible</strong> and cannot be undone.
                </p>
            </ResponsiveModal>
        </div>
    );
}
