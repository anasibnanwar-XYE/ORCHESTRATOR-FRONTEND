import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Stepper({ steps, currentStep, orientation = 'horizontal', className }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={twMerge(
      'flex',
      orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div 
            key={step.id} 
            className={clsx(
              'relative flex',
              orientation === 'horizontal' ? 'flex-1 flex-col items-center text-center' : 'flex-row gap-4'
            )}
          >
            {/* Connecting Line */}
            {!isLast && (
              <div 
                className={clsx(
                  'absolute bg-[var(--color-border-default)]',
                  orientation === 'horizontal' 
                    ? 'top-4 left-[50%] right-[-50%] h-px -translate-y-1/2' 
                    : 'top-8 left-4 bottom-[-8px] w-px -translate-x-1/2',
                  isCompleted && 'bg-[var(--color-neutral-900)]' // Highlight line if completed
                )} 
              />
            )}

            {/* Step Icon */}
            <div 
              className={clsx(
                'relative z-10 flex items-center justify-center shrink-0 w-8 h-8 rounded-full border-2 transition-colors',
                isCompleted ? 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-900)] text-white' :
                isCurrent ? 'bg-[var(--color-surface-primary)] border-[var(--color-neutral-900)] text-[var(--color-neutral-900)]' :
                'bg-[var(--color-surface-primary)] border-[var(--color-border-default)] text-[var(--color-text-tertiary)]'
              )}
            >
              {isCompleted ? (
                <Check size={16} className="stroke-[3px]" />
              ) : (
                <span className="text-[12px] font-bold">{index + 1}</span>
              )}
            </div>

            {/* Step Text */}
            <div className={clsx(
              orientation === 'horizontal' ? 'mt-3 px-2' : 'pb-8 pt-1'
            )}>
              <div className={clsx(
                'text-[13px] font-semibold',
                (isCompleted || isCurrent) ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'
              )}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
