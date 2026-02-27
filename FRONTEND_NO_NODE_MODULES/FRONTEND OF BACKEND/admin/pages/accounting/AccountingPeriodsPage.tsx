import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listAccountingPeriods, closeAccountingPeriod, type AccountingPeriod } from '../../lib/accountingApi';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { format } from 'date-fns';

function normalizeDate(d: unknown): Date {
  if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
  return new Date(d as string);
}

export default function AccountingPeriodsPage() {
    const { session } = useAuth();
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadPeriods();
    }, [session]);

    const loadPeriods = async () => {
        if (!session) return;
        try {
            setLoading(true);
            const data = await listAccountingPeriods(session);
            setPeriods(data);
        } catch (err) {
            setError('Failed to load accounting periods');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClosePeriod = async (id: number) => {
        if (!confirm('Are you sure you want to close this accounting period? This action cannot be undone.')) return;
        try {
            await closeAccountingPeriod(id, session);
            setSuccess('Period closed successfully');
            loadPeriods();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to close period');
        }
    };

    return (
        <div className="space-y-6">
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

            <div className="rounded-xl border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-highlight text-secondary">
                            <tr>
                                <th className="px-6 py-3 font-medium">Period Name</th>
                                <th className="px-6 py-3 font-medium">Start Date</th>
                                <th className="px-6 py-3 font-medium">End Date</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {periods.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                                        No accounting periods found.
                                    </td>
                                </tr>
                            )}
                            {periods.map((period) => (
                                <tr key={period.id} className="hover:bg-surface-highlight transition-colors">
                                    <td className="px-6 py-4 font-medium text-primary">
                                        {period.name}
                                    </td>
                                    <td className="px-6 py-4 text-secondary">
                                        {format(normalizeDate(period.startDate), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-secondary">
                                        {format(normalizeDate(period.endDate), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                                            period.status === 'OPEN'
                                                ? "bg-status-success-bg text-status-success-text"
                                                : "bg-surface-highlight text-secondary"
                                        )}>
                                            {period.status === 'OPEN' ? <LockOpenIcon className="h-3 w-3" /> : <LockClosedIcon className="h-3 w-3" />}
                                            {period.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {period.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleClosePeriod(period.id)}
                                                className="text-sm font-medium text-status-error-text hover:opacity-80 transition-colors"
                                            >
                                                Close Period
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
