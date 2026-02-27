import { Clock } from 'lucide-react';

export default function BankReconciliationPage() {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="rounded-full bg-surface-highlight p-4 mb-6">
                <Clock className="h-8 w-8 text-tertiary" />
            </div>
            <h1 className="text-xl font-semibold text-primary font-display">Bank Reconciliation</h1>
            <p className="mt-2 max-w-md text-center text-sm text-secondary">
                Bank reconciliation is not yet available. This feature is under development and will be enabled once the backend endpoint is ready.
            </p>
        </div>
    );
}
