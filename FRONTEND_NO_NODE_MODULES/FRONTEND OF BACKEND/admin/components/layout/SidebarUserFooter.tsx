interface SidebarUserFooterProps {
  displayName: string;
  email: string;
}

export default function SidebarUserFooter({ displayName, email }: SidebarUserFooterProps) {
  const initials = displayName?.slice(0, 2).toUpperCase() ?? '';

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3 rounded-lg p-2 bg-surface-highlight/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-action-bg text-action-text text-xs font-medium shadow-sm">
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-primary">{displayName}</p>
          <p className="truncate text-xs text-secondary">{email}</p>
        </div>
      </div>
    </div>
  );
}
