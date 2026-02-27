import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Structured error info extracted from API responses.
 * Works with both the generated client's ApiError.body and apiRequest errors.
 */
export type ApiErrorInfo = {
  message: string;
  body?: unknown;
};

type Props = {
  error: ApiErrorInfo | string | null;
  onDismiss?: () => void;
  className?: string;
};

/** Extract structured fields from an error body (matches backend error contract). */
function parseBody(body: unknown): {
  reason?: string;
  traceId?: string;
  code?: string;
  details?: Record<string, string>;
} {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;

  // Backend may nest under `data` or put fields at top-level
  const src = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>;

  const reason = typeof src.reason === 'string' ? src.reason : undefined;
  const traceId = typeof src.traceId === 'string' ? src.traceId : undefined;
  const code = typeof src.code === 'string' ? src.code : undefined;

  let details: Record<string, string> | undefined;
  if (src.details && typeof src.details === 'object' && !Array.isArray(src.details)) {
    details = {};
    for (const [k, v] of Object.entries(src.details as Record<string, unknown>)) {
      if (typeof v === 'string') details[k] = v;
    }
    if (Object.keys(details).length === 0) details = undefined;
  }

  return { reason, traceId, code, details };
}

/**
 * Displays API errors with structured backend info (reason, traceId, details).
 * Accepts either a plain string or an ApiErrorInfo object.
 */
export default function ApiErrorBanner({ error, onDismiss, className = '' }: Props) {
  if (!error) return null;

  const isString = typeof error === 'string';
  const message = isString ? error : error.message;
  const { reason, traceId, code, details } = isString ? {} as ReturnType<typeof parseBody> : parseBody(error.body);

  // If reason differs from message, show it as extra context
  const showReason = reason && reason !== message;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-status-error-text/20 bg-status-error-bg p-3 text-sm text-status-error-text ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-medium">{message}</p>

          {showReason && (
            <p className="text-xs opacity-80">{reason}</p>
          )}

          {details && (
            <ul className="mt-1 space-y-0.5 text-xs opacity-80">
              {Object.entries(details).map(([field, msg]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {msg}
                </li>
              ))}
            </ul>
          )}

          {(traceId || code) && (
            <p className="mt-1 text-xs opacity-60 font-mono">
              {code && <span>Code: {code}</span>}
              {code && traceId && <span> &middot; </span>}
              {traceId && <span>Trace: {traceId}</span>}
            </p>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded p-0.5 hover:bg-status-error-text/10 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
