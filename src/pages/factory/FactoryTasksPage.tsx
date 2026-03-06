 /**
  * FactoryTasksPage
  *
  * CRUD DataTable for factory tasks:
  *   - task ID, description, assignee, priority, status, due date
  *   - Create / Update / status toggle
  */

 import { useCallback, useEffect, useState } from 'react';
 import { Plus, Pencil } from 'lucide-react';
 import { format } from 'date-fns';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Select } from '@/components/ui/Select';
 import { Modal } from '@/components/ui/Modal';
 import { DataTable, type Column } from '@/components/ui/DataTable';
 import { Badge } from '@/components/ui/Badge';
 import { factoryApi } from '@/lib/factoryApi';
 import type {
   FactoryTaskDto,
   FactoryTaskRequest,
   FactoryTaskPriority,
   FactoryTaskStatus,
 } from '@/types';

 // ─────────────────────────────────────────────────────────────────────────────
 // Helpers
 // ─────────────────────────────────────────────────────────────────────────────

 function fmtDate(iso: string | undefined): string {
   if (!iso) return '—';
   try {
     return format(new Date(iso), 'dd MMM yyyy');
   } catch {
     return iso;
   }
 }

 type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

 function priorityVariant(priority: string | undefined): BadgeVariant {
   switch (priority) {
     case 'CRITICAL': return 'danger';
     case 'HIGH': return 'warning';
     case 'MEDIUM': return 'info';
     case 'LOW': return 'default';
     default: return 'default';
   }
 }

 function statusVariant(status: string | undefined): BadgeVariant {
   switch (status) {
     case 'DONE': return 'success';
     case 'IN_PROGRESS': return 'info';
     case 'OPEN': return 'warning';
     case 'CANCELLED': return 'danger';
     default: return 'default';
   }
 }

 const PRIORITY_OPTIONS: { value: FactoryTaskPriority; label: string }[] = [
   { value: 'LOW', label: 'Low' },
   { value: 'MEDIUM', label: 'Medium' },
   { value: 'HIGH', label: 'High' },
   { value: 'CRITICAL', label: 'Critical' },
 ];

 const STATUS_OPTIONS: { value: FactoryTaskStatus; label: string }[] = [
   { value: 'OPEN', label: 'Open' },
   { value: 'IN_PROGRESS', label: 'In Progress' },
   { value: 'DONE', label: 'Done' },
   { value: 'CANCELLED', label: 'Cancelled' },
 ];

 // ─────────────────────────────────────────────────────────────────────────────
 // Form state
 // ─────────────────────────────────────────────────────────────────────────────

 interface TaskFormState {
   title: string;
   description: string;
   assignee: string;
   priority: FactoryTaskPriority;
   status: FactoryTaskStatus;
   dueDate: string;
 }

 function emptyTaskForm(): TaskFormState {
   return {
     title: '',
     description: '',
     assignee: '',
     priority: 'MEDIUM',
     status: 'OPEN',
     dueDate: '',
   };
 }

 function taskToForm(task: FactoryTaskDto): TaskFormState {
   return {
     title: task.title ?? '',
     description: task.description ?? '',
     assignee: task.assignee ?? '',
     priority: (task.priority as FactoryTaskPriority) ?? 'MEDIUM',
     status: (task.status as FactoryTaskStatus) ?? 'OPEN',
     dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
   };
 }

 interface TaskFormErrors {
   title?: string;
 }

 function validateTaskForm(form: TaskFormState): TaskFormErrors {
   const errors: TaskFormErrors = {};
   if (!form.title.trim()) errors.title = 'Title is required';
   return errors;
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // Main Component
 // ─────────────────────────────────────────────────────────────────────────────

 export function FactoryTasksPage() {
   const [tasks, setTasks] = useState<FactoryTaskDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Create / Edit modal
   const [showModal, setShowModal] = useState(false);
   const [editTask, setEditTask] = useState<FactoryTaskDto | null>(null);
   const [form, setForm] = useState<TaskFormState>(emptyTaskForm());
   const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   // Status filter
   const [statusFilter, setStatusFilter] = useState<string>('');

   const loadTasks = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await factoryApi.getFactoryTasks();
       setTasks(data);
     } catch {
       setError("Couldn't load factory tasks.");
     } finally {
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     void loadTasks();
   }, [loadTasks]);

   function openCreate() {
     setEditTask(null);
     setForm(emptyTaskForm());
     setFormErrors({});
     setSubmitError(null);
     setShowModal(true);
   }

   function openEdit(task: FactoryTaskDto) {
     setEditTask(task);
     setForm(taskToForm(task));
     setFormErrors({});
     setSubmitError(null);
     setShowModal(true);
   }

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const errors = validateTaskForm(form);
     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       return;
     }
     setFormErrors({});
     setIsSubmitting(true);
     setSubmitError(null);

     const request: FactoryTaskRequest = {
       title: form.title.trim(),
       description: form.description.trim() || undefined,
       assignee: form.assignee.trim() || undefined,
       priority: form.priority,
       status: form.status,
       dueDate: form.dueDate || undefined,
     };

     try {
       if (editTask) {
         await factoryApi.updateFactoryTask(editTask.id, request);
       } else {
         await factoryApi.createFactoryTask(request);
       }
       setShowModal(false);
       void loadTasks();
     } catch {
       setSubmitError(editTask
         ? 'Failed to update task. Please try again.'
         : 'Failed to create task. Please try again.');
     } finally {
       setIsSubmitting(false);
     }
   }

   // Apply local filter
   const filteredTasks = statusFilter
     ? tasks.filter((t) => t.status === statusFilter)
     : tasks;

   // ── Table columns ────────────────────────────────────────────────────────

   const columns: Column<FactoryTaskDto>[] = [
     {
       id: 'id',
       header: 'ID',
       accessor: (row) => (
         <span className="font-mono text-[12px] text-[var(--color-text-tertiary)]">
           #{row.id}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'title',
       header: 'Task',
       accessor: (row) => (
         <div>
           <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
             {row.title ?? '—'}
           </p>
           {row.description && (
             <p className="text-[11px] text-[var(--color-text-tertiary)] truncate max-w-[280px]">
               {row.description}
             </p>
           )}
         </div>
       ),
       sortable: true,
       sortAccessor: (row) => row.title ?? '',
     },
     {
       id: 'assignee',
       header: 'Assignee',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {row.assignee ?? '—'}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'priority',
       header: 'Priority',
       accessor: (row) => (
         <Badge variant={priorityVariant(row.priority)} dot>
           {row.priority ?? '—'}
         </Badge>
       ),
       hideOnMobile: true,
     },
     {
       id: 'status',
       header: 'Status',
       accessor: (row) => (
         <Badge variant={statusVariant(row.status)} dot>
           {row.status === 'IN_PROGRESS' ? 'In Progress' : (row.status ?? '—')}
         </Badge>
       ),
     },
     {
       id: 'dueDate',
       header: 'Due Date',
       accessor: (row) => (
         <span className="text-[13px] text-[var(--color-text-secondary)]">
           {fmtDate(row.dueDate)}
         </span>
       ),
       hideOnMobile: true,
     },
     {
       id: 'actions',
       header: '',
       accessor: (row) => (
         <button
           type="button"
           onClick={() => openEdit(row)}
           className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
           aria-label="Edit task"
         >
           <Pencil size={14} />
         </button>
       ),
       align: 'right',
     },
   ];

   return (
     <div className="space-y-5">
       {/* Header */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight">
             Factory Tasks
           </h1>
           <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
             Manage and track factory floor tasks by assignee, priority, and status.
           </p>
         </div>
         <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
           New Task
         </Button>
       </div>

       {/* Status filter pills */}
       <div className="flex items-center gap-2 flex-wrap">
         {['', 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((s) => (
           <button
             key={s}
             type="button"
             onClick={() => setStatusFilter(s)}
             className={`h-7 px-3 rounded-lg text-[12px] font-medium transition-colors ${
               statusFilter === s
                 ? 'bg-[var(--color-neutral-900)] text-white'
                 : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
             }`}
           >
             {s === '' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
           </button>
         ))}
       </div>

       {error && (
         <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border-subtle)] rounded-xl text-[13px] text-[var(--color-error)]">
           <span>{error}</span>
           <button type="button" onClick={loadTasks} className="font-medium underline-offset-2 hover:underline">
             Retry
           </button>
         </div>
       )}

       <DataTable
         columns={columns}
         data={filteredTasks}
         keyExtractor={(row) => row.id}
         isLoading={isLoading}
         searchable
         searchPlaceholder="Search tasks..."
         searchFilter={(row, q) => {
           const query = q.toLowerCase();
           return (
             (row.title ?? '').toLowerCase().includes(query) ||
             (row.assignee ?? '').toLowerCase().includes(query) ||
             (row.description ?? '').toLowerCase().includes(query)
           );
         }}
         emptyMessage="No factory tasks found. Create your first task to start tracking work."
         pageSize={15}
       />

       {/* Create / Edit Modal */}
       <Modal
         isOpen={showModal}
         onClose={() => setShowModal(false)}
         title={editTask ? 'Edit Task' : 'New Factory Task'}
         size="md"
         footer={
           <>
             <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
             <Button
               isLoading={isSubmitting}
               onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
             >
               {editTask ? 'Save Changes' : 'Create Task'}
             </Button>
           </>
         }
       >
         <form onSubmit={handleSubmit} className="space-y-4" noValidate>
           {submitError && (
             <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
           )}

           <Input
             label="Title"
             value={form.title}
             onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
             error={formErrors.title}
             placeholder="e.g. Inspect production line"
             required
           />

           <div className="space-y-1.5">
             <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
               Description (optional)
             </label>
             <textarea
               rows={2}
               value={form.description}
               onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
               placeholder="Add task details..."
               className="w-full px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-neutral-300)]"
             />
           </div>

           <Input
             label="Assignee (optional)"
             value={form.assignee}
             onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
             placeholder="Operator or team member name"
           />

           <div className="grid grid-cols-2 gap-3">
             <Select
               label="Priority"
               value={form.priority}
               onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as FactoryTaskPriority }))}
               options={PRIORITY_OPTIONS}
             />
             <Select
               label="Status"
               value={form.status}
               onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FactoryTaskStatus }))}
               options={STATUS_OPTIONS}
             />
           </div>

           <Input
             label="Due Date (optional)"
             type="date"
             value={form.dueDate}
             onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
           />
         </form>
       </Modal>
     </div>
   );
 }
