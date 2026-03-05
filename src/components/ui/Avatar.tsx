import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  displayName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-[12px]',
  lg: 'h-12 w-12 text-[14px]',
};

const imgSizes = {
  xs: 'h-6 w-6',
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

function getInitials(name: string) {
  const words = (name ?? '').trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) || '') + (words[words.length - 1].charAt(0) || '');
  }
  return words[0]?.charAt(0) || '';
}

function getColor(name: string) {
  const colors = [
    'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]',
    'bg-[var(--color-neutral-700)] text-[var(--color-text-inverse)]',
    'bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, displayName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(displayName).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={displayName}
        className={clsx('rounded-full object-cover', imgSizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
        sizeStyles[size],
        getColor(displayName),
        className,
      )}
    >
      {initials}
    </div>
  );
}
