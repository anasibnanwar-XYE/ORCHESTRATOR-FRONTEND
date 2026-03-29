import { clsx } from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface PageLoaderProps {
  message?: string;
}

interface WelcomeLoaderProps {
  brandName?: string;
  tagline?: string;
}

export function Loader({ size = 'md', className }: LoaderProps) {
  const dim = { sm: 16, md: 20, lg: 32 };
  const s = dim[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      className={clsx('text-[var(--color-neutral-900)]', className)}
    >
      {/* Three bars that pulse in sequence -- mirrors the Orchestrator logo mark */}
      <rect x="4" y="6" width="24" height="2.5" rx="1.25" fill="currentColor">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" begin="0s" />
      </rect>
      <rect x="4" y="14.75" width="18" height="2.5" rx="1.25" fill="currentColor">
        <animate attributeName="opacity" values="0.55;0.1;0.55" dur="1.2s" repeatCount="indefinite" begin="0.15s" />
      </rect>
      <rect x="4" y="23.5" width="12" height="2.5" rx="1.25" fill="currentColor">
        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
      </rect>
    </svg>
  );
}

export function PageLoader({ message = 'Loading' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div
        style={{
          animation: 'o-breathe 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      >
        <Loader size="lg" />
      </div>
      <p className="text-[12px] font-medium tracking-wide text-[var(--color-text-tertiary)] uppercase">
        {message}
      </p>

      <style>{`
        @keyframes o-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.96); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export function WelcomeLoader({
  brandName = 'Orchestrator',
  tagline = 'Preparing your workspace',
}: WelcomeLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-surface-primary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 o-welcome-container">
        {/* Logo mark -- the three bars draw in sequentially */}
        <div className="o-welcome-mark">
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            fill="none"
            className="text-[var(--color-neutral-900)]"
          >
            <rect x="4" y="6" width="24" height="2.5" rx="1.25" fill="currentColor"
              className="o-bar" style={{ animationDelay: '300ms' }} />
            <rect x="4" y="14.75" width="18" height="2.5" rx="1.25" fill="currentColor"
              className="o-bar" style={{ animationDelay: '480ms', opacity: 0.55 }} />
            <rect x="4" y="23.5" width="12" height="2.5" rx="1.25" fill="currentColor"
              className="o-bar" style={{ animationDelay: '660ms', opacity: 0.25 }} />
          </svg>
        </div>

        {/* Brand name */}
        <div className="text-center space-y-2">
          <h1
            className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)] o-welcome-text"
            style={{ animationDelay: '600ms' }}
          >
            {brandName}
          </h1>
          <p
            className="text-[12px] font-medium tracking-wide uppercase text-[var(--color-text-tertiary)] o-welcome-text"
            style={{ animationDelay: '780ms' }}
          >
            {tagline}
          </p>
        </div>

        {/* Progress -- thin, elegant, eased */}
        <div
          className="w-28 h-[1.5px] bg-[var(--color-neutral-100)] rounded-full overflow-hidden o-welcome-text"
          style={{ animationDelay: '900ms' }}
        >
          <div className="h-full bg-[var(--color-neutral-900)] rounded-full o-welcome-progress" />
        </div>
      </div>

      <style>{`
        .o-welcome-container {
          animation: o-wc-enter 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        @keyframes o-wc-enter {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .o-bar {
          animation: o-bar-draw 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: left center;
        }
        @keyframes o-bar-draw {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); }
        }

        .o-welcome-text {
          animation: o-text-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes o-text-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .o-welcome-progress {
          animation: o-progress 2.2s 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          width: 0%;
        }
        @keyframes o-progress {
          0% { width: 0%; }
          40% { width: 55%; }
          70% { width: 80%; }
          100% { width: 100%; }
        }

        .o-welcome-mark {
          animation: o-mark-pulse 3s 1.5s ease-in-out infinite;
        }
        @keyframes o-mark-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }
      `}</style>
    </div>
  );
}
