import { type FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { X, Check, Copy, Loader2, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/authApi';
import { resolveError } from '@/lib/error-resolver';
import { useToast } from '@/components/ui/Toast';
import { PASSWORD_RULES, checkPasswordRules, isPasswordValid } from '@/utils/passwordRules';
import type { MfaSetupResponse, Profile } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes pm-backdrop { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pm-card { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes pm-card-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes pm-sub { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes pm-sub-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes pm-pulse { 0%,100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @media (prefers-reduced-motion: reduce) {
    .pm-card, .pm-sub, .pm-backdrop { animation: none !important; }
  }

  /* ── Backdrop ── */
  .pm-backdrop {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 2vw, 24px);
    animation: pm-backdrop 180ms ease forwards;
  }

  /* ── Main card ── */
  .pm-card {
    position: relative;
    width: 100%;
    max-width: clamp(440px, 50vw, 580px);
    max-height: min(720px, 90vh);
    display: flex; flex-direction: column;
    background: var(--color-surface-primary);
    border: 1px solid var(--color-border-default);
    border-radius: 16px;
    box-shadow: 0 24px 80px -16px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08);
    animation: pm-card 220ms cubic-bezier(0.22,1,0.36,1) forwards;
    overflow: hidden;
  }

  /* ── Card header ── */
  .pm-header {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: clamp(16px, 1.67vw, 22px) clamp(18px, 1.94vw, 26px) 0;
  }
  .pm-header-title {
    margin: 0;
    font-size: clamp(0.9375rem, 1.11vw, 1rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-text-primary);
  }
  .pm-close {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border: 0; border-radius: 7px; background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: color 140ms ease, background 140ms ease;
  }
  .pm-close:hover { color: var(--color-text-primary); background: var(--color-surface-tertiary); }

  /* ── Tab strip ── */
  .pm-tabs {
    flex-shrink: 0;
    display: flex; gap: 0;
    padding: 0 clamp(18px, 1.94vw, 26px);
    border-bottom: 1px solid var(--color-border-default);
    margin-top: clamp(14px, 1.39vw, 18px);
    overflow-x: auto; scrollbar-width: none;
  }
  .pm-tabs::-webkit-scrollbar { display: none; }
  .pm-tab {
    position: relative; flex-shrink: 0;
    padding: clamp(8px, 0.69vw, 10px) clamp(10px, 1.11vw, 14px);
    border: 0; background: transparent;
    font-family: inherit;
    font-size: clamp(0.75rem, 0.83vw, 0.8125rem);
    font-weight: 500; color: var(--color-text-tertiary);
    cursor: pointer; white-space: nowrap;
    transition: color 140ms ease;
  }
  .pm-tab:hover { color: var(--color-text-secondary); }
  .pm-tab.active { color: var(--color-text-primary); }
  .pm-tab.active::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
    height: 2px; background: var(--color-text-primary); border-radius: 2px 2px 0 0;
  }

  /* ── Scrollable body ── */
  .pm-body {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: clamp(18px, 1.94vw, 26px);
    display: flex; flex-direction: column; gap: clamp(14px, 1.39vw, 18px);
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-default) transparent;
  }
  .pm-body::-webkit-scrollbar { width: 4px; }
  .pm-body::-webkit-scrollbar-track { background: transparent; }
  .pm-body::-webkit-scrollbar-thumb { background: var(--color-border-default); border-radius: 4px; }

  /* ── Sections within body ── */
  .pm-section { display: flex; flex-direction: column; gap: clamp(12px, 1.18vw, 16px); }
  .pm-section-title {
    margin: 0;
    font-size: clamp(0.6875rem, 0.76vw, 0.75rem);
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--color-text-tertiary);
    padding-bottom: clamp(8px, 0.83vw, 12px);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  /* ── Field ── */
  .pm-field { display: grid; gap: 5px; }
  .pm-label {
    font-size: clamp(0.6875rem, 0.69vw, 0.6875rem);
    font-weight: 500; color: var(--color-text-primary);
  }
  .pm-input {
    width: 100%;
    height: clamp(34px, 2.5vw, 38px);
    padding: 0 clamp(10px, 0.83vw, 12px);
    border-radius: 8px;
    border: 1px solid var(--color-border-default);
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    font-size: clamp(0.75rem, 0.83vw, 0.8125rem);
    font-family: inherit; outline: none;
    transition: border-color 140ms ease, box-shadow 140ms ease;
    box-sizing: border-box;
  }
  .pm-input::placeholder { color: var(--color-text-tertiary); }
  .pm-input:focus { border-color: var(--color-text-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
  .pm-input:disabled { opacity: 0.4; cursor: not-allowed; background: var(--color-surface-tertiary); }
  .dark .pm-input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.05); }

  .pm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.11vw, 14px); }

  /* ── Read-only info ── */
  .pm-readonly {
    display: flex; flex-direction: column; gap: 2px;
  }
  .pm-readonly-label {
    font-size: clamp(0.5625rem, 0.63vw, 0.625rem);
    font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--color-text-tertiary);
  }
  .pm-readonly-value {
    font-size: clamp(0.75rem, 0.83vw, 0.8125rem);
    color: var(--color-text-secondary); font-weight: 500;
  }
  .pm-readonly-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.11vw, 14px); }

  /* ── Buttons ── */
  .pm-btn {
    height: clamp(32px, 2.22vw, 36px);
    padding: 0 clamp(12px, 1.25vw, 16px);
    border: 0; border-radius: 8px;
    background: var(--color-text-primary); color: var(--color-text-inverse);
    font-size: clamp(0.6875rem, 0.76vw, 0.75rem); font-weight: 500; font-family: inherit;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: opacity 140ms ease; white-space: nowrap; flex-shrink: 0;
  }
  .pm-btn:hover:not(:disabled) { opacity: 0.82; }
  .pm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .pm-btn-outline {
    background: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-secondary);
  }
  .pm-btn-outline:hover:not(:disabled) { border-color: var(--color-border-strong); color: var(--color-text-primary); opacity: 1; }

  .pm-btn-danger {
    background: #dc2626; color: #fff;
  }
  .pm-btn-danger:hover:not(:disabled) { background: #b91c1c; opacity: 1; }

  .pm-btn-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* ── Divider ── */
  .pm-divider { border: 0; border-top: 1px solid var(--color-border-subtle); margin: 0; }

  /* ── Password rules ── */
  .pm-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; }
  .pm-rule {
    display: flex; align-items: center; gap: 5px;
    font-size: clamp(0.5625rem, 0.63vw, 0.625rem);
    color: var(--color-text-tertiary); transition: color 140ms ease;
  }
  .pm-rule.ok { color: var(--color-success); }
  .pm-rule-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

  /* ── MFA status row ── */
  .pm-mfa-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: clamp(10px, 1vw, 14px) clamp(12px, 1.25vw, 16px);
    border-radius: 10px;
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-default);
  }
  .pm-mfa-status {
    font-size: clamp(0.5625rem, 0.63vw, 0.625rem);
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 2px 7px; border-radius: 999px;
  }
  .pm-mfa-on { background: #dcfce7; color: #166534; }
  .pm-mfa-off { background: var(--color-surface-tertiary); color: var(--color-text-tertiary); }
  .dark .pm-mfa-on { background: #052e16; color: #4ade80; }

  /* ── Account info cells ── */
  .pm-account-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.11vw, 14px); }
  .pm-account-cell {
    padding: clamp(12px, 1.11vw, 14px);
    border-radius: 10px;
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  /* ── Success flash ── */
  .pm-saved { display: flex; align-items: center; gap: 5px; font-size: clamp(0.625rem, 0.69vw, 0.6875rem); color: var(--color-success); font-weight: 500; }

  /* ── Skeleton ── */
  .pm-skel { border-radius: 8px; background: var(--color-surface-tertiary); animation: pm-pulse 1.6s ease-in-out infinite; }

  /* ── MFA Sub-modal ── */
  .pm-sub-backdrop {
    position: fixed; inset: 0; z-index: 310;
    background: rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 2vw, 24px);
    animation: pm-backdrop 160ms ease forwards;
  }
  .pm-sub {
    width: 100%;
    max-width: clamp(380px, 45vw, 480px);
    max-height: min(680px, 90vh);
    display: flex; flex-direction: column;
    background: var(--color-surface-primary);
    border: 1px solid var(--color-border-default);
    border-radius: 14px;
    box-shadow: 0 20px 60px -12px rgba(0,0,0,0.22);
    animation: pm-sub 200ms cubic-bezier(0.22,1,0.36,1) forwards;
    overflow: hidden;
  }
  .pm-sub-header {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: clamp(14px, 1.39vw, 18px) clamp(16px, 1.67vw, 22px);
    border-bottom: 1px solid var(--color-border-default);
  }
  .pm-sub-title {
    margin: 0;
    font-size: clamp(0.8125rem, 0.9vw, 0.875rem);
    font-weight: 600; color: var(--color-text-primary);
  }
  .pm-sub-body {
    flex: 1; overflow-y: auto;
    padding: clamp(16px, 1.67vw, 22px);
    display: flex; flex-direction: column; gap: clamp(14px, 1.39vw, 18px);
  }

  /* ── QR ── */
  .pm-qr { display: flex; justify-content: center; }
  .pm-qr-inner { padding: 10px; background: #fff; border-radius: 10px; border: 1px solid var(--color-border-default); }

  /* ── Recovery codes ── */
  .pm-rc-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
    padding: clamp(10px, 1vw, 14px);
    border-radius: 8px;
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-default);
    font-family: ui-monospace, monospace;
  }
  .pm-rc-code { font-size: clamp(0.6875rem, 0.76vw, 0.75rem); color: var(--color-text-primary); letter-spacing: 0.04em; }

  /* ── TOTP input ── */
  .pm-totp {
    width: 100%; height: clamp(40px, 3.33vw, 46px);
    text-align: center;
    font-family: ui-monospace, monospace;
    letter-spacing: 0.35em;
    font-size: clamp(1rem, 1.39vw, 1.25rem);
    border-radius: 8px;
    border: 1px solid var(--color-border-default);
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 140ms ease;
    box-sizing: border-box;
  }
  .pm-totp:focus { border-color: var(--color-text-primary); }
  .pm-totp:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Mobile sheet (≤ 540px) ── */
  @media (max-width: 540px) {
    /* Backdrop: align children at bottom */
    .pm-backdrop {
      align-items: flex-end;
      padding: 0;
    }
    /* Card: full-width bottom sheet */
    .pm-card {
      max-width: 100%;
      width: 100%;
      max-height: 92dvh;
      border-radius: 18px 18px 0 0;
      border-bottom: none;
      animation: pm-card-sheet 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      /* iOS home-indicator clearance */
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    /* Sub-modal: same pattern */
    .pm-sub-backdrop { align-items: flex-end; padding: 0; }
    .pm-sub {
      max-width: 100%; width: 100%;
      max-height: 88dvh;
      border-radius: 16px 16px 0 0;
      border-bottom: none;
      animation: pm-sub-sheet 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    /* Collapse all two-column grids to single column */
    .pm-field-row,
    .pm-readonly-grid,
    .pm-account-grid { grid-template-columns: 1fr; }
    .pm-rules { grid-template-columns: 1fr 1fr; }
  }

  /* ── Very small screens (≤ 380px) ── */
  @media (max-width: 380px) {
    .pm-rules { grid-template-columns: 1fr; }
    .pm-header { padding-top: 14px; }
    .pm-body { padding: 14px; gap: 12px; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function errMsg(err: unknown, fallback: string) {
  const r = resolveError(err);
  return 'message' in r ? r.message : fallback;
}

type Tab = 'profile' | 'security' | 'account';

// ─────────────────────────────────────────────────────────────────────────────
// MFA setup sub-modal
// ─────────────────────────────────────────────────────────────────────────────

function MfaSetupModal({ onClose, onActivated }: { onClose: () => void; onActivated: () => void }) {
  const toast = useToast();
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [acked, setAcked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const startSetup = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const d = await authApi.setupMfa();
      setSetup(d);
      setTimeout(() => codeRef.current?.focus(), 80);
    } catch (err) {
      setLoadError(errMsg(err, 'Failed to start MFA setup. Check your connection and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (!setup?.secret) return;
    navigator.clipboard.writeText(setup.secret).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const activate = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || !acked || isActivating) return;
    setIsActivating(true);
    try {
      await authApi.activateMfa(code);
      toast.success('MFA enabled', 'Two-factor authentication is now active.');
      onActivated();
    } catch (err) {
      toast.error(errMsg(err, 'Invalid code — check your authenticator'));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="pm-sub-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-sub">
        <div className="pm-sub-header">
          <h3 className="pm-sub-title">Set up two-factor authentication</h3>
          <button className="pm-close" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="pm-sub-body">
          {/* Initial / error state — shown before setup starts */}
          {!setup && !isLoading && (
            <>
              <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.75rem)', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                Use Google Authenticator, Authy, or any TOTP-compatible app to add a second factor to your account.
              </p>
              {loadError && (
                <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.75rem)', color: 'var(--color-error)', lineHeight: 1.5 }}>
                  {loadError}
                </p>
              )}
              <div className="pm-btn-row">
                <button className="pm-btn" onClick={() => void startSetup()}>
                  Begin setup
                </button>
                <button className="pm-btn pm-btn-outline" onClick={onClose}>Cancel</button>
              </div>
            </>
          )}

          {isLoading && (
            <>
              <div className="pm-skel" style={{ height: 160 }} />
              <div className="pm-skel" style={{ height: 38 }} />
              <div className="pm-skel" style={{ height: 80 }} />
            </>
          )}

          {setup && (
            <>
              <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.75rem)', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                Scan with Google Authenticator, Authy, or any TOTP app.
              </p>

              <div className="pm-qr">
                <div className="pm-qr-inner">
                  <QRCodeSVG value={setup.qrUri} size={140} level="M" />
                </div>
              </div>

              {/* Manual key */}
              <div className="pm-field">
                <span className="pm-label">Manual entry key</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    readOnly
                    className="pm-input"
                    value={setup.secret}
                    style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(0.625rem, 0.69vw, 0.6875rem)', letterSpacing: '0.1em', cursor: 'text' }}
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={copySecret}
                    className="pm-btn pm-btn-outline"
                    style={{ flexShrink: 0, padding: '0 10px' }}
                    aria-label="Copy"
                  >
                    {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Recovery codes */}
              <div className="pm-field">
                <span className="pm-label">Recovery codes — save these now</span>
                <p style={{ margin: '0 0 6px', fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                  Each code can only be used once. Store them somewhere safe.
                </p>
                <div className="pm-rc-grid">
                  {setup.recoveryCodes.map((c) => (
                    <span key={c} className="pm-rc-code">{c}</span>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={acked}
                    onChange={(e) => setAcked(e.target.checked)}
                    style={{ marginTop: 2, width: 13, height: 13, accentColor: 'var(--color-text-primary)' }}
                  />
                  <span style={{ fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    I have saved my recovery codes
                  </span>
                </label>
              </div>

              {/* Activation */}
              <form onSubmit={activate} className="pm-field">
                <label className="pm-label" htmlFor="mfa-code">Enter code to activate</label>
                <input
                  ref={codeRef}
                  id="mfa-code"
                  className="pm-totp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isActivating}
                  placeholder="000000"
                />
                <div className="pm-btn-row" style={{ marginTop: 4 }}>
                  <button
                    type="submit"
                    className="pm-btn"
                    disabled={code.length < 6 || !acked || isActivating}
                    title={!acked ? 'Save your recovery codes first' : undefined}
                  >
                    {isActivating ? <><Loader2 size={12} className="animate-spin" />Activating…</> : 'Activate MFA'}
                  </button>
                  <button type="button" className="pm-btn pm-btn-outline" onClick={onClose}>Cancel</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MFA disable sub-modal
// ─────────────────────────────────────────────────────────────────────────────

function MfaDisableModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const recoveryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => (useRecovery ? recoveryRef : codeRef).current?.focus(), 50);
  }, [useRecovery]);

  const disable = async () => {
    setIsLoading(true);
    try {
      await authApi.disableMfa(useRecovery ? { recoveryCode: recovery.trim() } : { code });
      toast.success('MFA disabled');
      onDisabled();
    } catch (err) {
      toast.error(errMsg(err, 'Incorrect code — try again'));
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = useRecovery ? recovery.trim().length > 0 : code.length === 6;

  return (
    <div className="pm-sub-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}>
      <div className="pm-sub" style={{ maxWidth: 'clamp(320px, 38vw, 400px)' }}>
        <div className="pm-sub-header">
          <h3 className="pm-sub-title">Disable two-factor authentication</h3>
          <button className="pm-close" onClick={onClose} disabled={isLoading} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="pm-sub-body">
          <p style={{ margin: 0, fontSize: 'clamp(0.6875rem, 0.76vw, 0.75rem)', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Turning off MFA reduces your account security. Enter your current verification code to confirm.
          </p>

          {!useRecovery ? (
            <div className="pm-field">
              <label className="pm-label" htmlFor="dis-code">Authenticator code</label>
              <input
                ref={codeRef}
                id="dis-code"
                className="pm-totp"
                type="text" inputMode="numeric" maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                placeholder="000000"
                onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 6) void disable(); }}
              />
            </div>
          ) : (
            <div className="pm-field">
              <label className="pm-label" htmlFor="dis-recovery">Recovery code</label>
              <input
                ref={recoveryRef}
                id="dis-recovery"
                className="pm-input"
                type="text" autoComplete="off"
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                disabled={isLoading}
                placeholder="xxxx-xxxx-xxxx"
                style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && recovery.trim()) void disable(); }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => { setUseRecovery((v) => !v); setCode(''); setRecovery(''); }}
            disabled={isLoading}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)', width: 'fit-content', textAlign: 'left' }}
          >
            {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}
          </button>

          <div className="pm-btn-row">
            <button className="pm-btn pm-btn-danger" onClick={() => void disable()} disabled={!canSubmit || isLoading}>
              {isLoading ? <><Loader2 size={12} className="animate-spin" />Disabling…</> : 'Disable MFA'}
            </button>
            <button className="pm-btn pm-btn-outline" onClick={onClose} disabled={isLoading}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile tab
// ─────────────────────────────────────────────────────────────────────────────

function ProfileTab({
  profile,
  isLoading,
  user,
  onSaved,
}: {
  profile: Profile | null;
  isLoading: boolean;
  user: ReturnType<typeof useAuth>['user'];
  onSaved: (p: Profile) => void;
}) {
  const toast = useToast();
  const { updateUser } = useAuth();
  const [form, setForm] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const set = (field: keyof Profile, value: string) =>
    setForm((p) => (p ? { ...p, [field]: value } : p));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        displayName: form.displayName,
        preferredName: form.preferredName || undefined,
        jobTitle: form.jobTitle || undefined,
        phoneSecondary: form.phoneSecondary || undefined,
        secondaryEmail: form.secondaryEmail || undefined,
      });
      if (user) updateUser({ ...user, displayName: updated.displayName });
      onSaved(updated);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to save profile'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pm-section">
        <div className="pm-skel" style={{ height: 36 }} />
        <div className="pm-field-row">
          <div className="pm-skel" style={{ height: 36 }} />
          <div className="pm-skel" style={{ height: 36 }} />
        </div>
        <div className="pm-field-row">
          <div className="pm-skel" style={{ height: 36 }} />
          <div className="pm-skel" style={{ height: 36 }} />
        </div>
      </div>
    );
  }

  if (!form) return (
    <p style={{ fontSize: 'clamp(0.75rem, 0.83vw, 0.8125rem)', color: 'var(--color-text-tertiary)' }}>
      Could not load profile.
    </p>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="pm-section">
        <div className="pm-field">
          <label className="pm-label" htmlFor="pf-name">Display name</label>
          <input id="pf-name" className="pm-input" value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            required disabled={isSaving} placeholder="Your name" />
        </div>

        <div className="pm-field-row">
          <div className="pm-field">
            <label className="pm-label" htmlFor="pf-preferred">Preferred name</label>
            <input id="pf-preferred" className="pm-input" value={form.preferredName ?? ''}
              onChange={(e) => set('preferredName', e.target.value)}
              disabled={isSaving} placeholder="Nickname" />
          </div>
          <div className="pm-field">
            <label className="pm-label" htmlFor="pf-title">Job title</label>
            <input id="pf-title" className="pm-input" value={form.jobTitle ?? ''}
              onChange={(e) => set('jobTitle', e.target.value)}
              disabled={isSaving} placeholder="e.g. Finance Manager" />
          </div>
        </div>

        <div className="pm-field-row">
          <div className="pm-field">
            <label className="pm-label" htmlFor="pf-phone">Phone</label>
            <input id="pf-phone" className="pm-input" type="tel" value={form.phoneSecondary ?? ''}
              onChange={(e) => set('phoneSecondary', e.target.value)}
              disabled={isSaving} placeholder="+1 555 000 0000" />
          </div>
          <div className="pm-field">
            <label className="pm-label" htmlFor="pf-email2">Secondary email</label>
            <input id="pf-email2" className="pm-input" type="email" value={form.secondaryEmail ?? ''}
              onChange={(e) => set('secondaryEmail', e.target.value)}
              disabled={isSaving} placeholder="backup@example.com" />
          </div>
        </div>

        <hr className="pm-divider" />

        <div className="pm-readonly-grid">
          <div className="pm-readonly">
            <span className="pm-readonly-label">Email</span>
            <span className="pm-readonly-value">{form.email}</span>
          </div>
          {user && (
            <div className="pm-readonly">
              <span className="pm-readonly-label">Roles</span>
              <span className="pm-readonly-value">{user.roles.map((r) => r.replace('ROLE_', '')).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="pm-btn-row">
          <button type="submit" className="pm-btn" disabled={isSaving || !form.displayName.trim()}>
            {isSaving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : 'Save changes'}
          </button>
          {saved && <span className="pm-saved"><Check size={12} />Saved</span>}
        </div>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security tab
// ─────────────────────────────────────────────────────────────────────────────

function SecurityTab({
  profile,
  user,
  onOpenSetupMfa,
  onOpenDisableMfa,
}: {
  profile: Profile | null;
  user: ReturnType<typeof useAuth>['user'];
  onOpenSetupMfa: () => void;
  onOpenDisableMfa: () => void;
}) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const rules = checkPasswordRules(next);
  const valid = isPasswordValid(next);
  const matches = next === confirm;
  const canSubmit = current.trim() && valid && matches && !isSaving;

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      setCurrent(''); setNext(''); setConfirm('');
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to update password'));
    } finally {
      setIsSaving(false);
    }
  };

  const mfaEnabled = profile?.mfaEnabled ?? user?.mfaEnabled ?? false;

  return (
    <>
      {/* Change password */}
      <div className="pm-section">
        <p className="pm-section-title">Change password</p>

        <form onSubmit={changePw} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1vw, 14px)' }}>
          <div className="pm-field">
            <label className="pm-label" htmlFor="pw-cur">Current password</label>
            <input id="pw-cur" className="pm-input" type="password" value={current}
              onChange={(e) => setCurrent(e.target.value)}
              disabled={isSaving} autoComplete="current-password" placeholder="••••••••••" />
          </div>
          <div className="pm-field">
            <label className="pm-label" htmlFor="pw-new">New password</label>
            <input id="pw-new" className="pm-input" type="password" value={next}
              onChange={(e) => setNext(e.target.value)}
              disabled={isSaving} autoComplete="new-password" placeholder="••••••••••" />
            {next && (
              <div className="pm-rules">
                {PASSWORD_RULES.map((rule) => (
                  <span key={rule.id} className={clsx('pm-rule', rules[rule.id] && 'ok')}>
                    <span className="pm-rule-dot" />{rule.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="pm-field">
            <label className="pm-label" htmlFor="pw-confirm">Confirm new password</label>
            <input id="pw-confirm" className="pm-input" type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isSaving} autoComplete="new-password" placeholder="••••••••••" />
            {confirm && !matches && (
              <span style={{ fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-error)' }}>
                Passwords do not match
              </span>
            )}
          </div>
          <div className="pm-btn-row">
            <button type="submit" className="pm-btn" disabled={!canSubmit}>
              {isSaving ? <><Loader2 size={12} className="animate-spin" />Updating…</> : 'Update password'}
            </button>
            {pwSaved && <span className="pm-saved"><Check size={12} />Updated</span>}
          </div>
        </form>
      </div>

      {/* MFA */}
      {user && (
        <div className="pm-section">
          <p className="pm-section-title">Two-factor authentication</p>
          <div className="pm-mfa-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 'clamp(0.75rem, 0.83vw, 0.8125rem)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {mfaEnabled ? 'MFA active' : 'MFA not enabled'}
              </p>
              <p style={{ margin: 0, fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                {mfaEnabled
                  ? 'Your account requires a verification code on each sign-in.'
                  : 'Add a verification step to secure your account.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className={clsx('pm-mfa-status', mfaEnabled ? 'pm-mfa-on' : 'pm-mfa-off')}>
                {mfaEnabled ? 'On' : 'Off'}
              </span>
              <button
                className="pm-btn pm-btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => mfaEnabled ? onOpenDisableMfa() : onOpenSetupMfa()}
              >
                {mfaEnabled ? 'Disable' : 'Set up'}
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account tab
// ─────────────────────────────────────────────────────────────────────────────

function AccountTab({
  profile,
  isLoading,
  user,
}: {
  profile: Profile | null;
  isLoading: boolean;
  user: ReturnType<typeof useAuth>['user'];
}) {
  if (isLoading) {
    return (
      <div className="pm-section">
        <div className="pm-account-grid">
          <div className="pm-skel" style={{ height: 68 }} />
          <div className="pm-skel" style={{ height: 68 }} />
        </div>
        <div className="pm-skel" style={{ height: 52 }} />
      </div>
    );
  }
  if (!profile) return (
    <p style={{ fontSize: 'clamp(0.75rem, 0.83vw, 0.8125rem)', color: 'var(--color-text-tertiary)' }}>
      Could not load account information.
    </p>
  );

  return (
    <div className="pm-section">
      <div className="pm-account-grid">
        <div className="pm-account-cell">
          <p className="pm-readonly-label">Account created</p>
          <p className="pm-readonly-value" style={{ marginTop: 4 }}>
            {profile.createdAt ? format(new Date(profile.createdAt), 'MMM d, yyyy') : '—'}
          </p>
          {profile.createdAt && (
            <p style={{ margin: '1px 0 0', fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)' }}>
              {format(new Date(profile.createdAt), 'h:mm a')}
            </p>
          )}
        </div>
        <div className="pm-account-cell">
          <p className="pm-readonly-label">Companies</p>
          <p className="pm-readonly-value" style={{ marginTop: 4 }}>
            {profile.companies?.length ?? 0} {(profile.companies?.length ?? 0) === 1 ? 'company' : 'companies'}
          </p>
          {profile.companies && profile.companies.length > 0 && (
            <p style={{ margin: '1px 0 0', fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.companies.join(', ')}
            </p>
          )}
        </div>
      </div>

      {(profile.publicId || user) && (
        <>
          <hr className="pm-divider" />
          <div className="pm-readonly-grid">
            {profile.publicId && (
              <div className="pm-readonly">
                <span className="pm-readonly-label">User ID</span>
                <span className="pm-readonly-value" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(0.6875rem, 0.69vw, 0.6875rem)', wordBreak: 'break-all' }}>
                  {profile.publicId}
                </span>
              </div>
            )}
            {user && (
              <div className="pm-readonly">
                <span className="pm-readonly-label">Roles</span>
                <span className="pm-readonly-value">
                  {user.roles.map((r) => r.replace('ROLE_', '')).join(', ')}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfilePage — modal overlay at /profile
// ─────────────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaModal, setMfaModal] = useState<'setup' | 'disable' | null>(null);

  useEffect(() => {
    authApi.getProfile()
      .then(setProfile)
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const handleMfaToggled = () => {
    authApi.getProfile().then((p) => {
      setProfile(p);
      if (user) updateUser({ ...user, mfaEnabled: p.mfaEnabled });
    }).catch(() => {});
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'Account';
  const initials = user?.displayName ? getInitials(user.displayName) : '?';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <>
      <style>{STYLES}</style>

      <div className="pm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) navigate(-1); }}>
        <div className="pm-card" role="dialog" aria-modal="true" aria-label="Settings">

          {/* Header */}
          <div className="pm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1vw, 14px)' }}>
              {/* Avatar initials */}
              <div
                aria-hidden="true"
                style={{
                  width: 'clamp(30px, 2.5vw, 34px)',
                  height: 'clamp(30px, 2.5vw, 34px)',
                  borderRadius: 8,
                  background: 'var(--color-neutral-900)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(0.625rem, 0.69vw, 0.6875rem)',
                  fontWeight: 600, letterSpacing: '0.02em', flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <p className="pm-header-title">{firstName}</p>
                {user && (
                  <p style={{ margin: 0, fontSize: 'clamp(0.5625rem, 0.63vw, 0.625rem)', color: 'var(--color-text-tertiary)' }}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <button className="pm-close" onClick={() => navigate(-1)} aria-label="Close settings">
              <X size={14} />
            </button>
          </div>

          {/* Tab strip */}
          <nav className="pm-tabs" aria-label="Settings sections">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                className={clsx('pm-tab', tab === id && 'active')}
                onClick={() => setTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Scrollable body */}
          <div className="pm-body">
            {tab === 'profile' && (
              <ProfileTab profile={profile} isLoading={isLoading} user={user} onSaved={setProfile} />
            )}
            {tab === 'security' && (
              <SecurityTab
                profile={profile}
                user={user}
                onOpenSetupMfa={() => setMfaModal('setup')}
                onOpenDisableMfa={() => setMfaModal('disable')}
              />
            )}
            {tab === 'account' && (
              <AccountTab profile={profile} isLoading={isLoading} user={user} />
            )}
          </div>
        </div>
      </div>

      {/* Portalled into document.body — fully escapes all parent stacking contexts */}
      {mfaModal === 'setup' && createPortal(
        <MfaSetupModal
          onClose={() => setMfaModal(null)}
          onActivated={() => { setMfaModal(null); handleMfaToggled(); }}
        />,
        document.body
      )}
      {mfaModal === 'disable' && createPortal(
        <MfaDisableModal
          onClose={() => setMfaModal(null)}
          onDisabled={() => { setMfaModal(null); handleMfaToggled(); }}
        />,
        document.body
      )}
    </>
  );
}
