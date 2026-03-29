/**
 * ModuleNotAvailablePage — shown when a user navigates to a route that
 * belongs to a module that is disabled for their company/tenant.
 *
 * Per VAL-SHELL-008: Must render a friendly message with a description
 * and a "Return to portal" button. NOT a 404, NOT a blank page.
 */

import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface ModuleNotAvailablePageProps {
  /** The portal home path to navigate back to. Defaults to '/hub'. */
  returnPath?: string;
  /** Human-readable module name for the message. */
  moduleName?: string;
}

export function ModuleNotAvailablePage({
  returnPath = '/hub',
  moduleName,
}: ModuleNotAvailablePageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-5">
        <Lock
          size={20}
          className="text-[var(--color-text-tertiary)]"
          strokeWidth={1.5}
        />
      </div>

      <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-2">
        {moduleName ? `${moduleName} is not available` : 'Module not available'}
      </h2>

      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 max-w-sm leading-relaxed">
        This feature is not enabled for your organisation. Contact your administrator
        if you believe this is a mistake.
      </p>

      <button
        type="button"
        onClick={() => navigate(returnPath)}
        className="btn-secondary text-[13px]"
      >
        Return to portal
      </button>
    </div>
  );
}
