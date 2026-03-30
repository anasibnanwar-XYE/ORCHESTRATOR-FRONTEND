import type { ReactNode } from 'react';

const BRAND_BARS: { widthRem: number; opacity: number; delay: string }[] = [
  { widthRem: 2.5,  opacity: 1,    delay: '0s'    },
  { widthRem: 1.75, opacity: 0.78, delay: '0.18s' },
  { widthRem: 1,    opacity: 0.24, delay: '0.36s' },
];

const STYLES = `
  /* ── Keyframes ── */
  @keyframes lp-mark-pulse {
    0%,100% { opacity:1; transform:scaleX(1) translateX(0); filter:brightness(1); }
    20%      { opacity:1; transform:scaleX(1) translateX(0); filter:brightness(1); }
    38%      { opacity:0.86; transform:scaleX(0.92) translateX(1px); filter:brightness(0.96); }
    52%      { opacity:1; transform:scaleX(1.04) translateX(0); filter:brightness(1.08); }
    68%      { opacity:0.96; transform:scaleX(0.98) translateX(0); filter:brightness(1); }
  }
  .lp-bar { animation: lp-mark-pulse 4.8s cubic-bezier(0.22,1,0.36,1) infinite; }
  @media (prefers-reduced-motion: reduce) { .lp-bar { animation: none; } }

  /* ── Shell: two-column, left panel fixed at 44.44% (640/1440) ── */
  .lp-shell {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: 44.444% 1fr;
  }

  /* ── Brand panel ── */
  .lp-brand {
    min-height: 100dvh;
    position: relative;
    background: #171717;
    color: #f5f5f5;
    overflow: hidden;
    /* Fluid horizontal padding: 4.17vw = 60px at 1440px */
    padding: 0 clamp(20px, 4.17vw, 60px);
  }

  .lp-brand-block {
    position: relative;
    z-index: 1;
    /* Fluid vertical offset: 35.5% of viewport height */
    margin-top: clamp(120px, 35.5vh, 380px);
    max-width: clamp(220px, 28vw, 400px);
  }

  .lp-brand-block h1 {
    margin: 0;
    /* Fluid: 24px → 32px */
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #f5f5f5;
    line-height: 1.15;
  }

  .lp-brand-tagline {
    margin: clamp(2px, 0.4vw, 6px) 0 0;
    max-width: clamp(180px, 18vw, 260px);
    /* Fluid: 13px → 16px */
    font-size: clamp(0.8125rem, 1.11vw, 1rem);
    color: #999;
    line-height: 1.5;
  }

  .lp-brand-bars {
    display: grid;
    gap: clamp(5px, 0.49vw, 7px);
    margin-bottom: clamp(24px, 2.57vw, 37px);
    width: fit-content;
  }

  .lp-bar {
    display: block;
    height: clamp(3px, 0.35vw, 5px);
    border-radius: 999px;
    transform-origin: left center;
  }

  .lp-quote {
    position: absolute;
    left: clamp(20px, 4.17vw, 60px);
    bottom: clamp(32px, 5.5vh, 80px);
    max-width: clamp(200px, 25vw, 360px);
    color: #808080;
    margin: 0;
    padding: 0;
  }

  .lp-quote p {
    margin: 0;
    /* Fluid: 11px → 13px */
    font-size: clamp(0.6875rem, 0.9vw, 0.8125rem);
    line-height: 1.6;
  }

  .lp-quote footer {
    margin-top: clamp(10px, 1.1vw, 16px);
    font-size: clamp(0.625rem, 0.76vw, 0.6875rem);
    font-weight: 500;
    color: #666;
  }

  /* ── Form panel ── */
  .lp-form-panel {
    min-height: 100dvh;
    background: #fafafa;
    display: flex;
    align-items: center;
    /* Fluid padding — top/bottom account for mobile browser chrome */
    padding: clamp(40px, 5.5vh, 80px) clamp(24px, 5vw, 80px);
    /* iOS safe area (notch/home indicator) */
    padding-left: max(clamp(24px, 5vw, 80px), env(safe-area-inset-left));
    padding-right: max(clamp(24px, 5vw, 80px), env(safe-area-inset-right));
  }

  .lp-form-wrap {
    width: 100%;
    max-width: clamp(280px, 23.6vw, 340px);
    /* Push form toward the Figma position: ~220px from left of right panel */
    margin-left: clamp(0px, 15.3vw, 220px);
  }

  /* ── Form heading ── */
  .lp-form-title {
    margin: 0;
    /* Fluid: 18px → 24px */
    font-size: clamp(1.125rem, 1.67vw, 1.5rem);
    font-weight: 600;
    color: #171717;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .lp-form-subtitle {
    margin: clamp(3px, 0.28vw, 4px) 0 0;
    /* Fluid: 12px → 13px */
    font-size: clamp(0.75rem, 0.9vw, 0.8125rem);
    color: #737373;
    line-height: 1.5;
    max-width: clamp(240px, 20.8vw, 300px);
  }

  /* ── Inputs ── */
  .lp-input {
    width: 100%;
    /* Fluid height: 40px → 44px */
    height: clamp(40px, 3.05vw, 44px);
    padding: 0 clamp(10px, 0.83vw, 12px);
    border-radius: 8px;
    border: 1px solid #e5e5e5;
    background: #fff;
    outline: none;
    color: #171717;
    /* Fluid: 12px → 13px */
    font-size: clamp(0.75rem, 0.9vw, 0.8125rem);
    font-family: inherit;
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }
  .lp-input::placeholder { color: #737373; }
  .lp-input:focus { border-color: #171717; box-shadow: 0 0 0 3px rgba(23,23,23,0.06); }
  .lp-input:disabled { opacity: 0.45; cursor: not-allowed; background: #f5f5f5; }
  .lp-input-mono { text-transform: uppercase; letter-spacing: 0.1em; font-family: ui-monospace, monospace; }

  /* ── Field label ── */
  .lp-label {
    display: grid;
    gap: clamp(6px, 0.56vw, 8px);
    color: #171717;
    font-weight: 500;
    font-size: clamp(0.75rem, 0.9vw, 0.8125rem);
    font-family: inherit;
  }

  /* ── Form grid ── */
  .lp-form-grid {
    display: grid;
    gap: clamp(14px, 1.18vw, 17px);
  }

  /* ── Submit button ── */
  .lp-btn {
    width: 100%;
    height: clamp(40px, 2.78vw, 40px);
    border: 0;
    border-radius: 8px;
    background: #171717;
    color: #fff;
    font-size: clamp(0.75rem, 0.9vw, 0.8125rem);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
  }
  .lp-btn:hover:not(:disabled) {
    background: #0e0e0e;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(0,0,0,0.14);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { background: #525252; cursor: not-allowed; }

  /* ── Ghost button (secondary actions) ── */
  .lp-btn-ghost {
    width: 100%;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #737373;
    font-size: clamp(0.6875rem, 0.83vw, 0.75rem);
    font-weight: 400;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: color 180ms ease;
  }
  .lp-btn-ghost:hover:not(:disabled) { color: #171717; }
  .lp-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Forgot link ── */
  .lp-forgot {
    font-size: clamp(0.6875rem, 0.83vw, 0.75rem) !important;
    font-weight: 400;
    color: #737373;
    text-decoration: none;
    transition: color 180ms ease;
    white-space: nowrap;
  }
  .lp-forgot:hover { color: #171717 !important; }

  /* ── Remember me ── */
  .lp-remember {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #525252;
    font-size: clamp(0.6875rem, 0.83vw, 0.75rem);
    font-weight: 400;
    cursor: pointer;
    margin-top: -2px;
    font-family: inherit;
    user-select: none;
  }

  /* ── Tablet: 768px–1100px ── */
  @media (max-width: 1100px) {
    .lp-form-wrap { margin-left: clamp(0px, 8vw, 80px); }
  }

  /* ── Mobile: stack vertically ── */
  @media (max-width: 768px) {
    .lp-shell { grid-template-columns: 1fr; min-height: 100dvh; }
    .lp-brand {
      min-height: auto;
      padding: clamp(36px, 8vh, 80px) clamp(20px, 6vw, 40px) clamp(28px, 5vh, 48px);
      padding-left: max(clamp(20px, 6vw, 40px), env(safe-area-inset-left));
      padding-right: max(clamp(20px, 6vw, 40px), env(safe-area-inset-right));
    }
    .lp-brand-block { margin-top: 0; max-width: 100%; }
    .lp-quote { display: none; }
    .lp-form-panel {
      min-height: auto;
      align-items: flex-start;
      padding: clamp(28px, 5vh, 48px) clamp(20px, 6vw, 40px) max(clamp(40px, 8vh, 64px), env(safe-area-inset-bottom, 24px));
      padding-left: max(clamp(20px, 6vw, 40px), env(safe-area-inset-left));
      padding-right: max(clamp(20px, 6vw, 40px), env(safe-area-inset-right));
    }
    .lp-form-wrap { max-width: 100%; margin-left: 0; }
  }

  /* ── Small mobile (≤ 400px) ── */
  @media (max-width: 400px) {
    /* Prevent iOS zoom on input focus by using 16px+ */
    .lp-input { height: 48px; font-size: 16px; }
    .lp-btn { height: 48px; font-size: 15px; }
  }
`;

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{STYLES}</style>

      <main className="lp-shell">
        {/* ── Brand panel ── */}
        <section className="lp-brand">
          <div className="lp-brand-block">
            <div className="lp-brand-bars" aria-hidden="true">
              {BRAND_BARS.map(({ widthRem, opacity, delay }) => (
                <span
                  key={widthRem}
                  className="lp-bar"
                  style={{
                    width: `${widthRem}rem`,
                    background: `rgba(245,245,245,${opacity})`,
                    animationDelay: delay,
                  }}
                />
              ))}
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 600, letterSpacing: '-0.01em', color: '#f5f5f5', lineHeight: 1.15 }}>
              Orchestrator
            </h1>
            <p className="lp-brand-tagline">
              Enterprise resource planning,<br />designed for clarity.
            </p>
          </div>

          <blockquote className="lp-quote">
            <p>"The cleanest ERP we've ever used.</p>
            <p>It just works."</p>
            <footer>— CFO, Manufacturing Co.</footer>
          </blockquote>
        </section>

        {/* ── Form panel ── */}
        <section className="lp-form-panel">
          <div className="lp-form-wrap">
            {children}
          </div>
        </section>
      </main>
    </>
  );
}
