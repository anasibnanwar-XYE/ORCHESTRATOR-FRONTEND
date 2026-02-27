import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, Pencil, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { createTask, listTasks, updateTask, type FactoryTaskDto, type FactoryTaskRequest } from '../../lib/factoryApi';
import { listEmployees, type EmployeeDto } from '../../lib/adminApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/formatUtils';

const initialForm: FactoryTaskRequest = {
  title: '',
  description: '',
  assignee: '',
  status: 'TODO',
  dueDate: '',
};

export default function TasksPage() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<FactoryTaskDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FactoryTaskDto | null>(null);
  const [form, setForm] = useState<FactoryTaskRequest>(initialForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadTasks = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listTasks(params, session);
      setTasks(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!session) return;
    try {
      const data = await listEmployees(session);
      setEmployees(data as EmployeeDto[]);
    } catch (err) {
      // Silently fail - employees are optional
    }
  };

  useEffect(() => {
    loadTasks();
    // Only load employees for admin/HR roles - factory users don't need this
    // and will get 403 without proper role
    const userRoles = (session as any)?.roles || [];
    if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_HR')) {
      loadEmployees();
    }
  }, [session, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (task: FactoryTaskDto) => {
    setEditing(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee || '',
      status: (task.status as FactoryTaskRequest['status']) || 'TODO',
      dueDate: task.dueDate || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateTask(editing.id || 0, form, session);
        setMessage('Task updated successfully');
      } else {
        await createTask(form, session);
        setMessage('Task created successfully');
      }
      closeModal();
      loadTasks();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'TODO': return 'secondary';
      case 'IN_PROGRESS': return 'info';
      case 'DONE': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'secondary';
    }
  };

  const filteredTasks = tasks.filter((task) => !statusFilter || task.status === statusFilter);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Tasks</h1>
          <p className="mt-1 text-sm text-secondary">Manage factory tasks and assignments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={loadTasks}
            disabled={loading}
          >
            <RefreshCw className={clsx('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </header>

      {message && (
        <div className="rounded-xl border border-transparent bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">All Tasks</h2>
            <p className="text-xs text-tertiary">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <option value="">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-tertiary" />
              <p className="mt-2 text-sm text-secondary">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mt-2 text-sm font-medium text-secondary">No tasks found</p>
              <p className="mt-1 text-xs text-tertiary">
                {statusFilter ? 'Try changing the status filter' : 'Create a new task to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const task = t as any; // Cast to access extra fields
                return (
                <div
                  key={task.id}
                  className={clsx(
                    "flex flex-col gap-4 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                    task.status === 'CANCELLED'
                      ? "border-border bg-surface opacity-60"
                      : "border-border hover:bg-surface"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{task.title || 'Untitled Task'}</span>
                          <Badge variant={getStatusVariant(task.status || 'TODO')}>
                            {task.status || 'TODO'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="mt-1 text-sm text-secondary">{task.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-tertiary">
                          {task.assignee && <span>Assignee: {task.assignee}</span>}
                          {task.dueDate && (
                            <span>
                              Due: {formatDate(task.dueDate)}
                              {new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                                <span className="ml-1 text-status-error-text">(Overdue)</span>
                              )}
                            </span>
                          )}
                          {/* Cross-module links */}
                          {task.salesOrderId && (
                            <span className="inline-flex items-center gap-1 text-status-info-text">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              Order #{task.salesOrderId}
                            </span>
                          )}
                          {task.packagingSlipId && (
                            <span className="inline-flex items-center gap-1 text-status-warning-text">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              Slip #{task.packagingSlipId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(task)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Transition show={modalOpen} as={Fragment}>
        <Dialog onClose={closeModal} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-xl">
                <div className="border-b border-border px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-primary">
                    {editing ? 'Edit Task' : 'Create New Task'}
                  </Dialog.Title>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                  {error && (
                    <div className="mb-4 rounded-lg border border-transparent bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <Input
                      label="Title"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                    <div>
                      <label className="block text-sm font-medium text-secondary">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        placeholder="Enter task description (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-secondary">Assignee</label>
                        <select
                          value={form.assignee}
                          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <option value="">Unassigned</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`.trim()}>
                              {emp.firstName} {emp.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary">
                          Status <span className="text-status-error-text">*</span>
                        </label>
                        <select
                          required
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value as FactoryTaskRequest['status'] })}
                          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <option value="TODO">Todo</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <Input
                      label="Due Date"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

