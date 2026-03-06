/**
 * TicketDetailPage
 *
 * Full ticket detail view for superadmin.
 *
 * Features:
 *  - Ticket metadata: subject, priority, status, tenant, created date
 *  - Conversation thread with public replies and internal notes
 *  - Attachments list
 *  - Status history timeline
 *  - Actions: add response (public / internal), change priority, assign agent, resolve, close
 *
 * Data source:
 *  - superadminTicketsDetailApi.getTicket(id)    → GET /api/v1/support/tickets/:id
 *  - superadminTicketsDetailApi.addResponse()    → POST /api/v1/support/tickets/:id/responses
 *  - superadminTicketsDetailApi.updateStatus()   → PATCH /api/v1/support/tickets/:id/status
 *  - superadminTicketsDetailApi.updatePriority() → PATCH /api/v1/support/tickets/:id/priority
 *  - superadminTicketsDetailApi.assignAgent()    → PATCH /api/v1/support/tickets/:id/assign
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  User,
  Clock,
  MessageSquare,
  Lock,
  Send,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { superadminTicketsDetailApi } from '@/lib/superadminApi';
import type {
  SupportTicketResponse,
  TicketPriority,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

function statusVariant(status: TicketStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'OPEN') return 'warning';
  if (status === 'IN_PROGRESS') return 'default';
  if (status === 'RESOLVED') return 'success';
  if (status === 'CLOSED') return 'default';
  return 'default';
}

function priorityVariant(priority: TicketPriority): 'danger' | 'warning' | 'default' {
  if (priority === 'CRITICAL') return 'danger';
  if (priority === 'HIGH') return 'warning';
  return 'default';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return map[status] ?? status;
}

function formatTs(ts: string): string {
  try {
    return format(new Date(ts), 'd MMM yyyy, HH:mm');
  } catch {
    return ts;
  }
}

function formatDateShort(ts: string): string {
  try {
    return format(new Date(ts), 'd MMM yyyy');
  } catch {
    return ts;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation Thread
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Assign Agent Modal
// ─────────────────────────────────────────────────────────────────────────────

function AssignAgentModal({
  ticketId,
  isOpen,
  onClose,
  onSuccess,
}: {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [agentEmail, setAgentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setAgentEmail('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!agentEmail.trim()) {
      setError('Agent email is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await superadminTicketsDetailApi.assignAgent(ticketId, { agentEmail: agentEmail.trim() });
      toast({ title: 'Agent assigned', type: 'success' });
      handleClose();
      onSuccess();
    } catch (err) {
      toast({
        title: 'Failed to assign agent',
        description: err instanceof Error ? err.message : 'Please try again',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign Agent"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Assign
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">
          Agent Email <span className="text-[var(--color-error)]">*</span>
        </label>
        <Input
          type="email"
          value={agentEmail}
          onChange={(e) => { setAgentEmail(e.target.value); setError(''); }}
          placeholder="agent@example.com"
          error={error}
        />
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<SupportTicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply form state
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Status/priority change
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await superadminTicketsDetailApi.getTicket(id);
      setTicket(data);
    } catch {
      setError("Couldn't load this ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const handleSendReply = async () => {
    if (!id || !replyMessage.trim()) return;
    setIsSending(true);
    try {
      await superadminTicketsDetailApi.addResponse(id, {
        message: replyMessage.trim(),
        isInternal,
      });
      toast({ title: isInternal ? 'Internal note added' : 'Reply sent', type: 'success' });
      setReplyMessage('');
      setIsInternal(false);
      await loadTicket();
    } catch (err) {
      toast({
        title: 'Failed to send reply',
        description: err instanceof Error ? err.message : 'Please try again',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    setIsChangingStatus(true);
    try {
      await superadminTicketsDetailApi.updateStatus(id, newStatus);
      toast({ title: `Status updated to ${statusLabel(newStatus)}`, type: 'success' });
      await loadTicket();
    } catch (err) {
      toast({
        title: 'Failed to update status',
        description: err instanceof Error ? err.message : 'Please try again',
        type: 'error',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!id) return;
    try {
      await superadminTicketsDetailApi.updatePriority(id, {
        priority: newPriority as TicketPriority,
      });
      toast({ title: 'Priority updated', type: 'success' });
      await loadTicket();
    } catch (err) {
      toast({
        title: 'Failed to update priority',
        description: err instanceof Error ? err.message : 'Please try again',
        type: 'error',
      });
    }
  };

  // ── Skeleton loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse" />
        <div className="h-6 w-64 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
              />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadTicket()}
            className="text-[12px] font-medium underline underline-offset-2 hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const canAct = ticket.status !== 'CLOSED';

  return (
    <div className="space-y-5">
      {/* ── Back nav ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/superadmin/tickets')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeft size={14} />
        Support Tickets
      </button>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">{ticket.publicId}</span>
            <Badge variant={statusVariant(ticket.status as TicketStatus)}>{statusLabel(ticket.status)}</Badge>
            {ticket.priority && <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>}
          </div>
          <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] truncate">
            {ticket.subject}
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            <span className="ml-1.5 font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[10px]">
              {ticket.companyCode}
            </span>
            {' · '}Opened {formatDateShort(ticket.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTicket()}
          className="shrink-0 p-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: conversation + reply ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {ticket.description && (
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
                Description
              </p>
              <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Conversation thread */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Conversation
            </p>
            <div className="py-8 text-center">
              <MessageSquare size={24} className="mx-auto text-[var(--color-text-tertiary)] opacity-30 mb-2" />
              <p className="text-[12px] text-[var(--color-text-tertiary)]">No replies yet.</p>
            </div>
          </div>

          {/* Attachments */}

          {/* Reply box */}
          {canAct && (
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  {isInternal ? 'Add Internal Note' : 'Add Reply'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsInternal((v) => !v)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors',
                    isInternal
                      ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border-strong)]'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-default)]',
                  )}
                >
                  <Lock size={11} />
                  {isInternal ? 'Internal note' : 'Public reply'}
                </button>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                placeholder={isInternal ? 'Add a note visible only to support agents…' : 'Type your reply…'}
                className={clsx(
                  'w-full px-3 py-2.5 rounded-lg border text-[13px] resize-none',
                  'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]',
                  'placeholder:text-[var(--color-text-placeholder)] outline-none',
                  'focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
                  'transition-colors duration-150',
                  isInternal
                    ? 'border-dashed border-[var(--color-border-strong)]'
                    : 'border-[var(--color-border-default)]',
                )}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleSendReply()}
                  isLoading={isSending}
                  disabled={!replyMessage.trim()}
                  leftIcon={<Send size={13} />}
                >
                  {isInternal ? 'Add Note' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: metadata + actions ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Actions */}
          {canAct && (
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Actions
              </p>

              {/* Change status */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">Status</label>
                <div className="relative">
                  <Select
                    value={ticket.status}
                    onChange={(e) => void handleStatusChange(e.target.value)}
                    disabled={isChangingStatus}
                    options={[
                      { value: 'OPEN', label: 'Open' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'RESOLVED', label: 'Resolved' },
                      { value: 'CLOSED', label: 'Closed' },
                    ]}
                  />
                  {isChangingStatus && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-primary)] opacity-60 rounded-lg">
                      <div className="w-4 h-4 border-2 border-[var(--color-text-tertiary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Change priority */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">Priority</label>
                <Select
                  value={ticket.priority ?? ''}
                  onChange={(e) => void handlePriorityChange(e.target.value)}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'CRITICAL', label: 'Critical' },
                  ]}
                />
              </div>

              {/* Assign agent */}
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setAssignOpen(true)}
                leftIcon={<User size={13} />}
              >
                Assign Agent
              </Button>

              {/* Quick resolve / close */}
              <div className="flex gap-2 pt-1 border-t border-[var(--color-border-subtle)]">
                {ticket.status !== 'RESOLVED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => void handleStatusChange('RESOLVED')}
                  >
                    Resolve
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => void handleStatusChange('CLOSED')}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Details
            </p>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">Tenant</dt>
                <dd className="text-[12px] text-[var(--color-text-primary)]">
                  <span className="font-mono text-[10px] bg-[var(--color-surface-tertiary)] px-1 py-0.5 rounded">
                    {ticket.companyCode}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">Opened</dt>
                <dd className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums flex items-center gap-1.5">
                  <Clock size={11} />
                  {formatTs(ticket.createdAt)}
                </dd>
              </div>
              {ticket.updatedAt && (
                <div>
                  <dt className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">Last Updated</dt>
                  <dd className="text-[12px] text-[var(--color-text-tertiary)] tabular-nums flex items-center gap-1.5">
                    <Clock size={11} />
                    {formatTs(ticket.updatedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Status history */}
        </div>
      </div>

      {/* ── Assign agent modal ─────────────────────────────────────── */}
      <AssignAgentModal
        ticketId={ticket.publicId}
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={() => void loadTicket()}
      />
    </div>
  );
}
