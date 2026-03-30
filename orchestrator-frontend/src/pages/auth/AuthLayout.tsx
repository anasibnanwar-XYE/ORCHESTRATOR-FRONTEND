import type { ReactNode } from 'react';

const BRAND_BARS: { width: string; opacity: number; delay: string }[] = [
  { width: 'clamp(28px, 2.8vw, 44px)', opacity: 1,    delay: '0s'    },
  { width: 'clamp(18px, 1.7vw, 26px)', opacity: 0.78, delay: '0.18s' },
  { width: 'clamp(9px, 0.9vw, 14px)',  opacity: 0.24, delay: '0.36s' },
];

const STYLES = `
  @keyframes lp-mark-pulse {
    0%,100% { opacity:1; transform:scaleX(1) translateX(0); filter:brightness(1); }
    20%      { opacity:1; transform:scaleX(1) translateX(0); filter:brightness(1); }
    38%      { opacity:0.86; transform:scaleX(0.92) translateX(1px); filter:brightness(0.96); }
    52%      { opacity:1; transform:scaleX(1.04) translateX(0); filter:brightness(1.08); }
    68%      { opacity:0.96; transform:scaleX(0.98) translateX(0); filter:brightness(1); }
  }
  .lp-bar { animation: lp-mark-pulse 4.8s cubic-bezier(0.22,1,0.36,1) infinite; }
  @media (prefers-reduced-motion: reduce) { .lp-bar { animation: none; } }

  .lp-input {
    width:100%;
    height: clamp(40px, 3.5vw, 52px);
    padding: 0 clamp(10px, 0.9vw, 14px);
    border-radius:8px; border:1px solid var(--color-border-default);
    background:var(--color-surface-primary); outline:none; color:var(--color-text-primary);
    font-size: clamp(13px, 1vw, 15px);
    font-family:inherit;
    transition: border-color 180ms ease;
  }
  .lp-input::placeholder { color:var(--color-text-tertiary); }
  .lp-input:focus { border-color:var(--color-neutral-900); }
  .lp-input:disabled { opacity:0.45; cursor:not-allowed; }
  .lp-input-mono { text-transform:uppercase; letter-spacing:0.1em; font-family:monospace; }

  .lp-btn {
    width:100%;
    height: clamp(40px, 3.5vw, 52px);
    border:0; border-radius:8px;
    background:var(--color-neutral-900); color:var(--color-text-inverse);
    font-size: clamp(13px, 1vw, 15px);
    font-weight:500;
    font-family:inherit; cursor:pointer; margin-top:2px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
  }
  .lp-btn:hover:not(:disabled) {
    background:var(--color-neutral-800);
    transform:translateY(-1px);
    box-shadow:0 8px 18px rgba(0,0,0,0.12);
  }
  .lp-btn:active:not(:disabled) { transform:translateY(0); }
  .lp-btn:disabled { background:var(--color-neutral-600); cursor:not-allowed; }

  .lp-btn-ghost {
    width:100%; height:36px; border:0; border-radius:8px;
    background:transparent; color:var(--color-text-tertiary);
    font-size: clamp(12px, 0.9vw, 14px);
    font-weight:400;
    font-family:inherit; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:6px;
    transition: color 180ms ease;
  }
  .lp-btn-ghost:hover:not(:disabled) { color:var(--color-text-primary); }
  .lp-btn-ghost:disabled { opacity:0.45; cursor:not-allowed; }

  .lp-label {
    font-size: clamp(13px, 1vw, 15px);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
    display: block;
  }

  .lp-forgot:hover { color:var(--color-text-primary) !important; }

  /* Mobile breakpoint */
  @media (max-width: 900px) {
    .lp-shell { grid-template-columns: 1fr !important; }
    .lp-brand { min-height: auto !important; padding: 0 20px !important; }
    .lp-brand-block { margin-top: 154px !important; max-width: 240px !important; padding-bottom: 48px !important; }
    .lp-quote { display: none !important; }
    .lp-form-panel { min-height: auto !important; padding: 0 16px 40px !important; }
    .lp-form-wrap { width: 100% !important; max-width: 100% !important; }
  }

  /* Small mobile breakpoint */
  @media (max-width: 520px) {
    .lp-brand-block h1 { font-size: 24px !important; }
    .lp-input { height: 48px !important; }
    .lp-btn { height: 48px !important; }
  }

  /* Large screen breakpoint (>1600px) */
  @media (min-width: 1600px) {
    .lp-form-wrap { max-width: 460px !important; }
    .lp-form-panel { padding: 0 48px !important; }
    .lp-brand { padding: 0 clamp(48px, 4vw, 80px) !important; }
  }
`;

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{STYLES}</style>

      <main
        className="lp-shell"
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 35vw) 1fr'
        }}
      >
        {/* ── Brand panel (dark) ── */}
        <section
          className="lp-brand"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-neutral-900)',
            color: 'var(--color-neutral-100)',
            padding: 'clamp(32px, 4vw, 60px)',
            overflow: 'hidden'
          }}
        >
          <div
            className="lp-brand-block"
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 'clamp(120px, 22vh, 320px)',
              maxWidth: 'clamp(280px, 25vw, 400px)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                display: 'grid',
                gap: 'clamp(5px, 0.6vw, 7px)',
                marginBottom: 'clamp(24px, 3.2vw, 37px)',
                width: 'fit-content'
              }}
            >
              {BRAND_BARS.map(({ width, opacity, delay }, index) => (
                <span
                  key={index}
                  className="lp-bar"
                  style={{
                    display: 'block',
                    width,
                    height: 'clamp(4px, 0.4vw, 5px)',
                    borderRadius: '9999px',
                    background: `rgba(245,245,245,${opacity})`,
                    transformOrigin: 'left center',
                    animationDelay: delay
                  }}
                />
              ))}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(24px, 2.5vw, 40px)',
                fontWeight: 600,
                letterSpacing: 0,
                fontFamily: 'inherit'
              }}
            >
              Orchestrator
            </h1>
            <p
              style={{
                margin: '1px 0 0',
                maxWidth: 'clamp(200px, 18vw, 260px)',
                fontSize: 'clamp(14px, 1.2vw, 18px)',
                color: 'var(--color-neutral-400)',
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            >
              Enterprise resource planning, designed for clarity.
            </p>
          </div>

          {/* Spacer to push quote to bottom */}
          <div style={{ flex: 1, minHeight: '48px' }} />

          <blockquote
            className="lp-quote"
            style={{
              position: 'relative',
              maxWidth: 'clamp(280px, 22vw, 360px)',
              color: 'var(--color-neutral-500)',
              margin: 0,
              padding: 0,
              marginTop: 'auto'
            }}
          >
            <p style={{ margin: 0, fontSize: 'clamp(12px, 1vw, 13px)' }}>"The cleanest ERP we've ever used.</p>
            <p style={{ margin: 0, fontSize: 'clamp(12px, 1vw, 13px)' }}>It just works."</p>
            <footer style={{ marginTop: 'clamp(12px, 1.2vw, 16px)', fontSize: 'clamp(10px, 0.9vw, 11px)', fontWeight: 500, color: 'var(--color-neutral-500)' }}>
              — CFO, Manufacturing Co.
            </footer>
          </blockquote>
        </section>

        {/* ── Form panel (light) ── */}
        <section
          className="lp-form-panel"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-surface-secondary)',
            padding: 'clamp(24px, 3vw, 48px)'
          }}
        >
          <div
            className="lp-form-wrap"
            style={{
              width: 'min(420px, 85%)',
              maxWidth: '100%'
            }}
          >
            {children}
          </div>
        </section>
      </main>
    </>
  );
}
