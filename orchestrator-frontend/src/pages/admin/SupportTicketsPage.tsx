/**
 * SupportTicketsPage — Admin Support Ticket Management
 *
 * Features:
 *  - Ticket list using DataTable (columns: ID, subject/title, status, created date)
 *  - Create ticket form in a Modal (subject + description + category fields)
 *  - Ticket detail view (click row to open Drawer with full details)
 *  - Status badges using Badge component
 *  - Dark mode support with CSS variables
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, AlertCircle, RefreshCcw, Mail, Calendar, MessageSquare, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { adminSupportApi, type SupportTicket, type CreateTicketRequest } from '@/lib/adminApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TicketCategory = 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: TicketStatus | string) {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'OPEN':
      return <Badge variant="info" dot>Open</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="warning" dot>In Progress</Badge>;
    case 'RESOLVED':
      return <Badge variant="success" dot>Resolved</Badge>;
    case 'CLOSED':
      return <Badge variant="default" dot>Closed</Badge>;
    default:
      return <Badge variant="default" dot>{status || 'Unknown'}</Badge>;
  }
}

function getPriorityBadge(priority: TicketPriority | string) {
  const normalized = (priority || '').toUpperCase();
  switch (normalized) {
    case 'CRITICAL':
      return <Badge variant="danger">Critical</Badge>;
    case 'HIGH':
      return <Badge variant="warning">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="default">Medium</Badge>;
    case 'LOW':
      return <Badge variant="success">Low</Badge>;
    default:
      return <Badge variant="default">{priority || '—'}</Badge>;
  }
}

function getCategoryLabel(category: TicketCategory | string): string {
  const normalized = (category || '').toUpperCase();
  switch (normalized) {
    case 'BUG':
      return 'Bug Report';
    case 'FEATURE_REQUEST':
      return 'Feature Request';
    case 'SUPPORT':
      return 'Support';
    default:
      return category || '—';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Ticket Modal
// ─────────────────────────────────────────────────────────────────────────────

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketRequest) => Promise<void>;
  isSubmitting: boolean;
}

function CreateTicketModal({ isOpen, onClose, onSubmit, isSubmitting }: CreateTicketModalProps) {
  const [form, setForm] = useState<CreateTicketRequest>({
    subject: '',
    description: '',
    category: 'SUPPORT',
    priority: 'MEDIUM',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTicketRequest, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    else if (form.subject.length < 3) newErrors.subject = 'Subject must be at least 3 characters';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    else if (form.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
    setForm({ subject: '', description: '', category: 'SUPPORT', priority: 'MEDIUM' });
  };

  const handleClose = () => {
    setForm({ subject: '', description: '', category: 'SUPPORT', priority: 'MEDIUM' });
    setErrors({});
    onClose();
  };

  const categoryOptions = [
    { value: 'SUPPORT', label: 'Support' },
    { value: 'BUG', label: 'Bug Report' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create support ticket"
      description="Submit a new support ticket for assistance"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Create ticket
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Subject"
          placeholder="Brief summary of the issue"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          error={errors.subject}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TicketCategory }))}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[var(--color-text-primary)]">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Provide detailed information about the issue..."
            disabled={isSubmitting}
            className={clsx(
              'w-full h-28 px-3 py-2.5 text-[13px] bg-[var(--color-surface-secondary)]',
              'border rounded-lg resize-none',
              'focus:outline-none focus:border-[var(--color-neutral-300)]',
              'placeholder:text-[var(--color-text-tertiary)]',
              errors.description && 'border-[var(--color-error-border)]'
            )}
          />
          {errors.description && (
            <p className="text-[11px] text-[var(--color-error)]">{errors.description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket Detail Drawer
// ─────────────────────────────────────────────────────────────────────────────

interface TicketDetailDrawerProps {
  ticket: SupportTicket | null;
  onClose: () => void;
}

function TicketDetailDrawer({ ticket, onClose }: TicketDetailDrawerProps) {
  if (!ticket) return null;

  return (
    <Drawer
      isOpen={ticket !== null}
      onClose={onClose}
      title={ticket.subject}
      description={`Ticket #${ticket.publicId}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Status and Priority Row */}
        <div className="flex flex-wrap items-center gap-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
          <span className="text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] px-2 py-0.5 rounded">
            {getCategoryLabel(ticket.category)}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--color-surface-secondary)] rounded-xl">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
              Created
            </p>
            <p className="text-[13px] text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Calendar size={12} className="text-[var(--color-text-tertiary)]" />
              {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
              Company
            </p>
            <p className="text-[13px] text-[var(--color-text-primary)]">
              {ticket.companyCode}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
              Requester
            </p>
            <p className="text-[13px] text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Mail size={12} className="text-[var(--color-text-tertiary)]" />
              {ticket.requesterEmail || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-0.5">
              Updated
            </p>
            <p className="text-[13px] text-[var(--color-text-primary)]">
              {formatDate(ticket.updatedAt)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <MessageSquare size={14} className="text-[var(--color-text-tertiary)]" />
            Description
          </h4>
          <div className="p-4 bg-[var(--color-surface-secondary)] rounded-xl text-[13px] text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* GitHub Info (if synced) */}
        {(ticket as unknown as { githubIssueNumber?: number }).githubIssueNumber && (
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <ArrowUpRight size={14} className="text-[var(--color-text-tertiary)]" />
              GitHub Issue
            </h4>
            <div className="p-3 bg-[var(--color-surface-secondary)] rounded-xl">
              <a
                href={(ticket as unknown as { githubIssueUrl?: string }).githubIssueUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-blue-600 hover:underline flex items-center gap-1.5"
              >
                #{((ticket as unknown as { githubIssueNumber?: number }).githubIssueNumber)} on GitHub
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            This ticket is currently <strong className="text-[var(--color-text-secondary)]">{ticket.status.toLowerCase().replace('_', ' ')}</strong>.
            {ticket.resolvedAt && (
              <>
                {' '}It was resolved on {formatDate(ticket.resolvedAt)}.
              </>
            )}
          </p>
        </div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function SupportTicketsPage() {
  const { success, error: toastError } = useToast();

  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  // Load tickets
  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminSupportApi.listTickets();
      setTickets(data);
    } catch (err) {
      setError('Failed to load tickets');
      toastError('Error loading tickets', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Create ticket handler
  const handleCreateTicket = async (data: CreateTicketRequest) => {
    setIsSubmitting(true);
    try {
      const newTicket = await adminSupportApi.createTicket(data);
      success('Ticket created', `Ticket #${newTicket.publicId} has been submitted`);
      setShowCreateModal(false);
      await loadTickets();
    } catch (err) {
      toastError('Failed to create ticket', err instanceof Error ? err.message : 'Please try again');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns
  const columns: Column<SupportTicket>[] = [
    {
      id: 'ticket',
      header: 'Ticket',
      accessor: (row) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)] leading-tight">{row.subject}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">#{row.publicId}</p>
        </div>
      ),
      sortable: true,
      sortAccessor: (row) => row.subject,
    },
    {
      id: 'category',
      header: 'Category',
      accessor: (row) => (
        <span className="text-[12px] text-[var(--color-text-secondary)]">{getCategoryLabel(row.category)}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
      sortable: true,
      sortAccessor: (row) => row.status,
      width: '120px',
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: (row) => getPriorityBadge(row.priority),
      sortable: true,
      sortAccessor: (row) => row.priority,
      width: '100px',
      hideOnMobile: true,
    },
    {
      id: 'created',
      header: 'Created',
      accessor: (row) => <span className="text-[12px] text-[var(--color-text-secondary)] tabular-nums">{formatDate(row.createdAt)}</span>,
      sortable: true,
      sortAccessor: (row) => row.createdAt,
      width: '120px',
    },
  ];

  // Row actions dropdown
  const rowActions = (ticket: SupportTicket) => (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        trigger={
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
        }
        items={[
          { label: 'View details', value: 'view' },
          { label: 'Copy ticket ID', value: 'copy' },
        ]}
        onSelect={(value) => {
          if (value === 'view') {
            setSelectedTicket(ticket);
          } else if (value === 'copy') {
            navigator.clipboard.writeText(ticket.publicId);
            success('Copied', 'Ticket ID copied to clipboard');
          }
        }}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">Support Tickets</h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">View and manage support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCcw size={14} />}
            onClick={loadTickets}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
            Create ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold">Total</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p>
        </div>
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-info)] font-semibold">Open</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{stats.open}</p>
        </div>
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-warning)] font-semibold">In Progress</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-success)] font-semibold">Resolved</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{stats.resolved}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadTickets}
            className="text-[12px] font-medium underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
        <DataTable<SupportTicket>
          columns={columns}
          data={tickets}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No tickets yet. Create your first ticket to get started."
          searchable
          searchPlaceholder="Search tickets..."
          searchFilter={(row, q) =>
            row.subject.toLowerCase().includes(q) ||
            row.publicId.toLowerCase().includes(q) ||
            row.status.toLowerCase().includes(q)
          }
          onRowClick={(row) => setSelectedTicket(row)}
          rowActions={rowActions}
          pageSize={10}
          mobileCardRenderer={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)] text-[13px] leading-tight">{row.subject}</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">#{row.publicId}</p>
                </div>
                {getStatusBadge(row.status)}
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--color-text-secondary)]">{getCategoryLabel(row.category)}</span>
                <span className="text-[var(--color-text-tertiary)]">{formatDate(row.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                {getPriorityBadge(row.priority)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(row);
                  }}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View details
                </button>
              </div>
            </div>
          )}
        />
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTicket}
        isSubmitting={isSubmitting}
      />

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
