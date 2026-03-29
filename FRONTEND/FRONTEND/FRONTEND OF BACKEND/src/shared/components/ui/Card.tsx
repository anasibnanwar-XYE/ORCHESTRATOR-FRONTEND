import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={twMerge(
        'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden shadow-sm',
        onClick && 'cursor-pointer hover:border-[var(--color-border-hover)] transition-colors active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={twMerge('px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={twMerge('p-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={twMerge('px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] text-[13px]', className)}>
      {children}
    </div>
  );
}
