import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, FileText, DollarSign, Users } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime } from '@/shared/utils/formatUtils';
import type { ApprovalItem } from '@/shared/types';

type ApprovalAction = 'approve' | 'reject';

interface ActionState {
  item: ApprovalItem | null;
  action: ApprovalAction | null;
  isOpen: boolean;
}

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({
    item: null,
    action: null,
    isOpen: false,
  });
  const { toasts, addToast, removeToast } = useToast();

  const fetchApprovals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getApprovals();
      setApprovals(response.items);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load approvals',
        message: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = (item: ApprovalItem, action: ApprovalAction) => {
    setActionState({ item, action, isOpen: true });
  };

  const handleConfirmAction = async () => {
    if (!actionState.item || !actionState.action) return;

    const { item, action } = actionState;
    setIsProcessing(true);

    try {
      const reason = action === 'reject' ? 'Rejected by admin' : 'Approved by admin';

      switch (item.type) {
        case 'CREDIT_REQUEST':
          if (action === 'approve') {
            await adminApi.approveCreditRequest(item.id, { reason });
          } else {
            await adminApi.rejectCreditRequest(item.id, { reason });
          }
          break;
        case 'PAYROLL_RUN':
          if (action === 'approve') {
            await adminApi.approvePayroll(item.id);
          } else {
            throw new Error('Payroll runs can only be approved, not rejected');
          }
          break;
        case 'CREDIT_OVERRIDE':
          if (action === 'approve') {
            await adminApi.approveCreditOverride(item.id);
          } else {
            await adminApi.rejectCreditOverride(item.id);
          }
          break;
        default:
          throw new Error(`Unknown approval type: ${item.type}`);
      }

      addToast({
        type: 'success',
        title: `${action === 'approve' ? 'Approved' : 'Rejected'} successfully`,
        message: `${item.type.replace(/_/g, ' ')} ${item.reference} has been ${action}ed.`,
      });

      await fetchApprovals();
    } catch (error) {
      addToast({
        type: 'error',
        title: `Failed to ${action}`,
        message: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsProcessing(false);
      setActionState({ item: null, action: null, isOpen: false });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_REQUEST':
        return DollarSign;
      case 'PAYROLL_RUN':
        return Users;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Pending Approvals
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Review and manage approval requests
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          disabled={isLoading}
          className="btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {approvals.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No pending approvals"
            description="All approval requests have been processed. Check back later for new requests."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvals.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="card p-6 space-y-4 hover:shadow-[var(--shadow-md)] transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[var(--color-primary-100)] p-2">
                        <TypeIcon className="h-5 w-5 text-[var(--color-primary-600)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {getTypeLabel(item.type)}
                        </p>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                          {item.reference}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Created {formatDateTime(item.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(item, 'reject')}
                        disabled={isProcessing}
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(item, 'approve')}
                        disabled={isProcessing}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="table-container hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Summary</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <tr key={`${item.type}-${item.id}`}>
                      <td data-label="Type">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-[var(--color-primary-600)]" />
                          <span>{getTypeLabel(item.type)}</span>
                        </div>
                      </td>
                      <td data-label="Reference">{item.reference}</td>
                      <td data-label="Summary" className="max-w-xs truncate">
                        {item.summary}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td data-label="Created">{formatDateTime(item.createdAt)}</td>
                      <td data-label="Actions">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(item, 'reject')}
                            disabled={isProcessing}
                            className="btn-danger px-3 py-1.5 text-xs"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(item, 'approve')}
                            disabled={isProcessing}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={actionState.isOpen}
        title={`${actionState.action === 'approve' ? 'Approve' : 'Reject'} ${actionState.item?.type.replace(/_/g, ' ')}`}
        message={`Are you sure you want to ${actionState.action} ${actionState.item?.reference}? This action cannot be undone.`}
        confirmLabel={actionState.action === 'approve' ? 'Approve' : 'Reject'}
        cancelLabel="Cancel"
        variant={actionState.action === 'approve' ? 'info' : 'danger'}
        onConfirm={handleConfirmAction}
        onCancel={() => setActionState({ item: null, action: null, isOpen: false })}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
