import { useRef, useState, useCallback, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface SwipeAction {
  id: string;
  label: string;
  color: string;
  icon?: ReactNode;
}

interface SwipeableCardProps {
  children: ReactNode;
  /** Actions revealed on swipe left */
  leftActions?: SwipeAction[];
  /** Actions revealed on swipe right */
  rightActions?: SwipeAction[];
  onAction?: (actionId: string) => void;
  onClick?: () => void;
  className?: string;
}

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  onAction,
  onClick,
  className,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, isDragging: false });
  const [translateX, setTranslateX] = useState(0);
  const [isSnapped, setIsSnapped] = useState<'left' | 'right' | null>(null);

  const maxSwipe = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current.startX = e.touches[0].clientX;
    dragRef.current.isDragging = true;
    setIsSnapped(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.touches[0].clientX - dragRef.current.startX;
    const hasLeft = leftActions.length > 0;
    const hasRight = rightActions.length > 0;

    if (deltaX > 0 && hasLeft) {
      setTranslateX(Math.min(deltaX * 0.6, maxSwipe));
    } else if (deltaX < 0 && hasRight) {
      setTranslateX(Math.max(deltaX * 0.6, -maxSwipe));
    }
  }, [leftActions, rightActions]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    if (Math.abs(translateX) > maxSwipe * 0.5) {
      setTranslateX(translateX > 0 ? maxSwipe : -maxSwipe);
      setIsSnapped(translateX > 0 ? 'left' : 'right');
    } else {
      setTranslateX(0);
    }
  }, [translateX]);

  const handleActionClick = useCallback((actionId: string) => {
    onAction?.(actionId);
    setTranslateX(0);
    setIsSnapped(null);
  }, [onAction]);

  const resetSwipe = useCallback(() => {
    setTranslateX(0);
    setIsSnapped(null);
  }, []);

  return (
    <div className={clsx('relative overflow-hidden rounded-xl', className)}>
      {/* Left actions (revealed on swipe right) */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-stretch">
          {leftActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className="flex items-center justify-center px-4 text-white text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: action.color, minWidth: `${maxSwipe}px` }}
            >
              {action.icon || action.label}
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed on swipe left) */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
          {rightActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className="flex items-center justify-center px-4 text-white text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: action.color, minWidth: `${maxSwipe}px` }}
            >
              {action.icon || action.label}
            </button>
          ))}
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        onClick={isSnapped ? resetSwipe : onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={clsx(
          'relative bg-[var(--color-surface-primary)]',
          'border border-[var(--color-border-default)]',
          'p-3 sm:p-4',
          'select-none',
          onClick && !isSnapped && 'cursor-pointer active:bg-[var(--color-surface-secondary)]',
        )}
        style={{
          transform: `translateX(${translateX}px)`,
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
