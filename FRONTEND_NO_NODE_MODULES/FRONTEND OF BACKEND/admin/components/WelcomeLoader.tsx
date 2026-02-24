import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

interface WelcomeLoaderProps {
  displayName: string;
  onFinished?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const TOTAL_DURATION_MS = 2400;

export default function WelcomeLoader({ displayName, onFinished }: WelcomeLoaderProps) {
  const [stage, setStage] = useState<'enter' | 'hold' | 'exit'>('enter');
  const finishedRef = useRef(false);

  const greeting = useMemo(() => getGreeting(), []);
  const name = displayName?.trim() || 'there';

  useEffect(() => {
    let cancelled = false;

    // Enter -> hold after mount
    const enterTimer = setTimeout(() => {
      if (!cancelled) setStage('hold');
    }, 80);

    // Hold -> exit
    const exitTimer = setTimeout(() => {
      if (!cancelled) setStage('exit');
    }, TOTAL_DURATION_MS - 600);

    // Fire onFinished after exit transition
    const finishTimer = setTimeout(() => {
      if (!cancelled && !finishedRef.current) {
        finishedRef.current = true;
        onFinished?.();
      }
    }, TOTAL_DURATION_MS);

    // Hard fallback - never hang
    const hardFallback = setTimeout(() => {
      if (!cancelled && !finishedRef.current) {
        finishedRef.current = true;
        onFinished?.();
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearTimeout(hardFallback);
    };
  }, [onFinished]);

  const isVisible = stage === 'hold';
  const isExiting = stage === 'exit';

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'px-6 sm:px-8',
        'bg-background',
        'overflow-hidden touch-none select-none',
        'transition-all duration-500 ease-out',
        isExiting && 'opacity-0 scale-[1.02]',
      )}
      style={{
        minHeight: '100dvh',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Brand identifier */}
      <p
        className={clsx(
          'mb-6 sm:mb-8 font-brand text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-tertiary',
          'transition-all duration-700 ease-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5',
        )}
      >
        Orchestrator
      </p>

      {/* Greeting */}
      <h1
        className={clsx(
          'font-display text-center text-primary',
          'text-[22px] leading-tight sm:text-3xl md:text-4xl',
          'font-medium tracking-tight',
          'transition-all duration-700 ease-out delay-100',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        )}
      >
        {greeting}, {name}
      </h1>

      {/* Subtitle */}
      <p
        className={clsx(
          'mt-3 sm:mt-4 font-sans text-sm sm:text-base text-secondary text-center',
          'transition-all duration-700 ease-out delay-200',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        )}
      >
        Preparing your workspace
      </p>

      {/* Progress bar */}
      <div
        className={clsx(
          'mt-8 sm:mt-10 h-[2px] w-40 sm:w-48 overflow-hidden rounded-full bg-border',
          'transition-all duration-700 ease-out delay-300',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="welcome-progress-bar h-full rounded-full" />
      </div>
    </div>
  );
}
