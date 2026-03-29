import type { ReactNode } from 'react';

const BRAND_BARS: { width: number; opacity: number; delay: string }[] = [
  { width: 40, opacity: 1,    delay: '0s'    },
  { width: 24, opacity: 0.78, delay: '0.18s' },
  { width: 12, opacity: 0.24, delay: '0.36s' },
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
    width:100%; height:40px; padding:0 12px;
    border-radius:8px; border:1px solid #e5e5e5;
    background:#fff; outline:none; color:#171717;
    font-size:13px; font-family:inherit;
    transition: border-color 180ms ease;
  }
  .lp-input::placeholder { color:#737373; }
  .lp-input:focus { border-color:#171717; }
  .lp-input:disabled { opacity:0.45; cursor:not-allowed; }
  .lp-input-mono { text-transform:uppercase; letter-spacing:0.1em; font-family:monospace; }

  .lp-btn {
    width:100%; height:40px; border:0; border-radius:8px;
    background:#171717; color:#fff; font-size:13px; font-weight:500;
    font-family:inherit; cursor:pointer; margin-top:2px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
  }
  .lp-btn:hover:not(:disabled) {
    background:#0e0e0e;
    transform:translateY(-1px);
    box-shadow:0 8px 18px rgba(0,0,0,0.12);
  }
  .lp-btn:active:not(:disabled) { transform:translateY(0); }
  .lp-btn:disabled { background:#525252; cursor:not-allowed; }

  .lp-btn-ghost {
    width:100%; height:36px; border:0; border-radius:8px;
    background:transparent; color:#737373; font-size:12px; font-weight:400;
    font-family:inherit; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:6px;
    transition: color 180ms ease;
  }
  .lp-btn-ghost:hover:not(:disabled) { color:#171717; }
  .lp-btn-ghost:disabled { opacity:0.45; cursor:not-allowed; }

  .lp-forgot:hover { color:#171717 !important; }

  @media (max-width: 900px) {
    .lp-shell { grid-template-columns: 1fr !important; }
    .lp-brand { min-height: auto !important; padding: 0 20px !important; }
    .lp-brand-block { margin-top: 154px !important; max-width: 240px !important; padding-bottom: 48px !important; }
    .lp-quote { display: none !important; }
    .lp-form-panel { min-height: auto !important; padding: 0 16px 40px !important; }
    .lp-form-wrap { width: 100% !important; margin-left: 0 !important; margin-top: 48px !important; }
  }
  @media (max-width: 520px) {
    .lp-brand-block h1 { font-size: 24px !important; }
    .lp-input { height: 48px !important; }
    .lp-btn { height: 48px !important; }
  }
`;

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{STYLES}</style>

      <main
        className="lp-shell"
        style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '640px minmax(0,1fr)' }}
      >
        {/* ── Brand panel (dark) ── */}
        <section
          className="lp-brand"
          style={{ minHeight: '100vh', position: 'relative', background: '#171717', color: '#f5f5f5', padding: '0 60px', overflow: 'hidden' }}
        >
          <div
            className="lp-brand-block"
            style={{ position: 'relative', zIndex: 1, marginTop: 320, maxWidth: 400 }}
          >
            <div aria-hidden="true" style={{ display: 'grid', gap: 7, marginBottom: 37, width: 'fit-content' }}>
              {BRAND_BARS.map(({ width, opacity, delay }) => (
                <span
                  key={width}
                  className="lp-bar"
                  style={{ display: 'block', width, height: 5, borderRadius: 2.5, background: `rgba(245,245,245,${opacity})`, transformOrigin: 'left center', animationDelay: delay }}
                />
              ))}
            </div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: 0, fontFamily: 'inherit' }}>
              Orchestrator
            </h1>
            <p style={{ margin: '1px 0 0', maxWidth: 260, fontSize: 16, color: '#999', fontFamily: 'inherit' }}>
              Enterprise resource planning, designed for clarity.
            </p>
          </div>

          <blockquote
            className="lp-quote"
            style={{ position: 'absolute', left: 60, top: 760, maxWidth: 360, color: '#808080', margin: 0, padding: 0 }}
          >
            <p style={{ margin: 0, fontSize: 13 }}>"The cleanest ERP we've ever used.</p>
            <p style={{ margin: 0, fontSize: 13 }}>It just works."</p>
            <footer style={{ marginTop: 16, fontSize: 11, fontWeight: 500, color: '#666' }}>
              — CFO, Manufacturing Co.
            </footer>
          </blockquote>
        </section>

        {/* ── Form panel (light) ── */}
        <section
          className="lp-form-panel"
          style={{ minHeight: '100vh', background: '#fafafa' }}
        >
          <div className="lp-form-wrap" style={{ width: 340, marginLeft: 220, marginTop: 320 }}>
            {children}
          </div>
        </section>
      </main>
    </>
  );
}
