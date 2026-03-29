import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps {
  title: string;
  description?: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: boolean;
  onClose?: () => void;
  className?: string;
  action?: ReactNode;
}

const variantStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800 [&_svg]:text-blue-600',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 [&_svg]:text-emerald-600',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 [&_svg]:text-amber-600',
  danger: 'bg-red-50 border-red-200 text-red-800 [&_svg]:text-red-600',
};

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function Alert({ 
  title, 
  description, 
  variant = 'info', 
  icon = true, 
  onClose,
  action,
  className 
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div className={twMerge(
      'relative flex items-start gap-3 p-4 border rounded-xl shadow-sm text-[13px]',
      variantStyles[variant],
      className
    )}>
      {icon && <Icon size={18} className="shrink-0 mt-0.5" />}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-0.5">{title}</h4>
        {description && (
          <div className="opacity-90 leading-relaxed text-[12px]">
            {description}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          className="shrink-0 p-1 -m-1 opacity-60 hover:opacity-100 transition-opacity rounded-md hover:bg-black/5"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
