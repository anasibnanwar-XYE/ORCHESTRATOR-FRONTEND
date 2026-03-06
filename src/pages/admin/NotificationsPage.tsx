 /**
  * NotificationsPage — Admin Notifications
  *
  * Features:
  *  - Send notification form: user selector (from admin user list) + message textarea
  *  - Sent notifications history (local state)
  */
 
 import { useEffect, useState, useCallback } from 'react';
 import {
   Bell,
   Send,
   AlertCircle,
   Users,
   Check,
 } from 'lucide-react';
 import { clsx } from 'clsx';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { useToast } from '@/components/ui/Toast';
 import { adminApi } from '@/lib/adminApi';
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 interface AdminUser {
   id: number;
   email: string;
   displayName: string;
   roles: string[];
   enabled: boolean;
 }
 
 interface SentRecord {
   id: number;
   userId: number;
   userDisplayName: string;
   message: string;
   sentAt: Date;
 }
 
 // ─────────────────────────────────────────────────────────────────────────────
 // NotificationsPage
 // ─────────────────────────────────────────────────────────────────────────────
 
 export function NotificationsPage() {
  const { success, error: toastError } = useToast();
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
   const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
   const [isSending, setIsSending] = useState(false);
   const [sent, setSent] = useState<SentRecord[]>([]);
   const [sentPulse, setSentPulse] = useState(false);
 
   const load = useCallback(async () => {
     setIsLoading(true);
     try {
       const data = await adminApi.getUsers();
       // Cast to our local type
      setUsers(
        (data as unknown as AdminUser[]).filter((u) => u.enabled !== false)
      );
     } catch {
       // Non-blocking, still show the form
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => { load(); }, [load]);
 
   const selectedUser = users.find((u) => u.id === selectedUserId);
 
   const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedUserId || !message.trim()) return;
     setIsSending(true);
     try {
      await adminApi.sendNotification({
        to: selectedUser?.email ?? String(selectedUserId),
        subject: subject.trim() || 'Notification from Admin',
        body: message.trim(),
      });
       const record: SentRecord = {
         id: Date.now(),
         userId: selectedUserId as number,
         userDisplayName: selectedUser?.displayName ?? String(selectedUserId),
         message: message.trim(),
         sentAt: new Date(),
       };
       setSent((prev) => [record, ...prev]);
       setMessage('');
      setSubject('');
       setSelectedUserId('');
       setSentPulse(true);
       setTimeout(() => setSentPulse(false), 2000);
      success('Notification sent', `Message delivered to ${record.userDisplayName}.`);
     } catch (err) {
      toastError('Failed to send', err instanceof Error ? err.message : 'Failed to send notification');
     } finally {
       setIsSending(false);
     }
   };
 
   return (
     <div className="space-y-5">
       {/* Header */}
       <div>
         <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
           Send Notification
         </h1>
         <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
           Send a direct message to a user
         </p>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
         {/* Compose form */}
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
             <Bell size={15} className="text-[var(--color-text-tertiary)]" />
             <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
               Compose
             </h2>
           </div>
           <form onSubmit={handleSend} className="p-5 space-y-4">
             {/* User selector */}
             <div className="space-y-1.5">
               <label className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-primary)]">
                 <Users size={13} />
                 Recipient
               </label>
               {isLoading ? (
                 <Skeleton height={36} />
               ) : (
                 <select
                   value={selectedUserId}
                   onChange={(e) =>
                     setSelectedUserId(e.target.value ? Number(e.target.value) : '')
                   }
                   required
                   className={clsx(
                     'w-full h-9 rounded-lg border border-[var(--color-border-default)] px-3',
                     'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                     'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
                   )}
                 >
                   <option value="">Select a user...</option>
                   {users.map((u) => (
                     <option key={u.id} value={u.id}>
                       {u.displayName} — {u.email}
                     </option>
                   ))}
                 </select>
               )}
             </div>
 
             {/* Message */}
             <div className="space-y-1.5">
               <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                Subject
               </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject..."
                className={clsx(
                  'w-full h-9 rounded-lg border border-[var(--color-border-default)] px-3',
                  'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                  'placeholder:text-[var(--color-text-tertiary)]',
                  'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
                )}
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
                Body
              </label>
               <textarea
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 required
                 placeholder="Enter your message here..."
                 rows={5}
                 className={clsx(
                   'w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2.5',
                   'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
                   'placeholder:text-[var(--color-text-tertiary)] resize-none',
                   'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
                 )}
               />
               <p className="text-[11px] text-[var(--color-text-tertiary)] text-right">
                 {message.length} characters
               </p>
             </div>
 
             <Button
               type="submit"
               disabled={isSending || !selectedUserId || !message.trim()}
               className="w-full"
             >
               {sentPulse ? (
                 <>
                   <Check size={14} className="mr-1.5" /> Sent
                 </>
               ) : (
                 <>
                   <Send size={14} className="mr-1.5" />
                   {isSending ? 'Sending...' : 'Send Notification'}
                 </>
               )}
             </Button>
           </form>
         </div>
 
         {/* Sent history */}
         <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] overflow-hidden">
           <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
             <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
               Sent This Session
             </h2>
             <span className="text-[11px] text-[var(--color-text-tertiary)]">
               {sent.length} sent
             </span>
           </div>
           <div className="divide-y divide-[var(--color-border-subtle)]">
             {sent.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 gap-2">
                 <AlertCircle size={20} className="text-[var(--color-text-tertiary)]" />
                 <p className="text-[13px] text-[var(--color-text-tertiary)]">
                   No notifications sent yet
                 </p>
               </div>
             ) : (
               sent.map((record) => (
                 <div key={record.id} className="px-5 py-3.5">
                   <div className="flex items-start justify-between gap-2">
                     <div className="min-w-0">
                       <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">
                         {record.userDisplayName}
                       </p>
                       <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                         {record.message}
                       </p>
                     </div>
                     <p className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">
                       {record.sentAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
       </div>
     </div>
   );
 }
