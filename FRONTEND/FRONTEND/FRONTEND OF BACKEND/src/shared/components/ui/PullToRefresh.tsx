import { useRef, useState, useCallback, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  /** Threshold in px to trigger refresh */
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 70,
  className,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, isDragging: false });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.isDragging = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging || isRefreshing) return;
    const deltaY = e.touches[0].clientY - dragRef.current.startY;
    if (deltaY > 0) {
      const dampened = Math.min(deltaY * 0.4, threshold * 1.5);
      setPullDistance(dampened);
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={clsx('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={clsx(
          'absolute left-0 right-0 flex items-center justify-center',
          'pointer-events-none',
          'transition-opacity duration-200',
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          top: 0,
          height: `${pullDistance}px`,
          transition: dragRef.current.isDragging ? 'none' : 'height 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms',
        }}
      >
        <div
          className={clsx(
            'flex items-center justify-center',
            'h-8 w-8 rounded-full',
            'bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]',
            'shadow-sm',
          )}
        >
          {isRefreshing ? (
            <Loader2 size={14} className="text-[var(--color-text-tertiary)] animate-spin" />
          ) : (
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className={clsx(
                'text-[var(--color-text-tertiary)]',
                'transition-transform duration-200',
              )}
              style={{
                transform: `rotate(${progress >= 1 ? 180 : 0}deg)`,
              }}
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: dragRef.current.isDragging
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
