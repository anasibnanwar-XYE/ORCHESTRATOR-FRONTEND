import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SkeinaNav, SkeinaFooter, SkeinaStyles, SkThemeProvider,
  Reveal, Marquee, MagButton, LoadingScreen,
} from '../components/SkeinaShared';

/* ════════════════════ HERO ════════════════════ */

function WordReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="sk-word-wrap">
      {text.split(' ').map((word, i) => (
        <span key={i} className="sk-word" style={{ animationDelay: `${delay + i * 70}ms` }}>
          {word}&nbsp;
        </span>
      ))}
    </span>
  );
}

function TiltMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const x = ((e.clientY - cy) / r.height) * -6;
    const y = ((e.clientX - cx) / r.width) * 6;
    setTilt({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [handleMove]);

  return (
    <div ref={ref} className="sk-tilt-wrap">
      <div className="sk-mockup" style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="sk-mockup__chrome">
          <div className="sk-mockup__dots"><span /><span /><span /></div>
          <div className="sk-mockup__url" />
        </div>
        <div className="sk-mockup__body">
          <div className="sk-mockup__sidebar">
            <div className="sk-mockup__sb-active" />
            {[42, 56, 35, 48, 40].map((w, i) => <div key={i} className="sk-mockup__sb-item" style={{ width: `${w}%` }} />)}
          </div>
          <div className="sk-mockup__main">
            <div className="sk-mockup__toolbar"><div className="sk-mockup__tb-title" /><div className="sk-mockup__tb-btn" /></div>
            <div className="sk-mockup__kpis">
              {[0,1,2,3].map(i => (
                <div key={i} className="sk-mockup__kpi">
                  <div className="sk-mockup__kpi-label" />
                  <div className="sk-mockup__kpi-val" />
                  <svg viewBox="0 0 60 14" className="sk-mockup__kpi-line">
                    <polyline fill="none" stroke="var(--sk-text-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
                      points={`0,12 10,${9-i*2} 20,${11-i} 30,${7+i} 40,${5-i} 50,${8+i} 60,3`} />
                  </svg>
                </div>
              ))}
            </div>
            <div className="sk-mockup__table">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sk-mockup__row">
                  <div className="sk-mockup__cell" style={{ width: '18%' }} />
                  <div className="sk-mockup__cell sk-mockup__cell--grow" />
                  <div className="sk-mockup__badge" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sk-mockup__glow" />
      </div>
    </div>
  );
}

function Hero({ show }: { show: boolean }) {
  const navigate = useNavigate();

  return (
    <section className="sk-hero">
      <div className="sk-container sk-hero__inner">
        <div className="sk-hero__left">
          {show && (
            <div className="sk-stagger">
              <div className="sk-hero__badge">
                <span className="sk-hero__badge-dot" />
                <span>Now building Orchestrator ERP</span>
              </div>
              <h1 className="sk-hero__title">
                <WordReveal text="We build software" delay={100} />
                <br />
                <WordReveal text="that outlasts its era." delay={300} />
              </h1>
              <p className="sk-hero__sub">
                Design and engineering studio crafting enterprise software
                with the precision of a product lab and the soul of a startup.
              </p>
              <div className="sk-hero__actions">
                <MagButton className="sk-btn sk-btn--accent" onClick={() => navigate('/skeina/product')}>
                  See our work
                </MagButton>
                <MagButton className="sk-btn sk-btn--secondary">
                  Get in touch
                </MagButton>
              </div>
              <div className="sk-hero__stats">
                {[{ v: '2024', l: 'Founded' }, { v: '4', l: 'Products' }, { v: 'India', l: 'Based in' }].map(s => (
                  <div key={s.l} className="sk-hero__stat">
                    <span className="sk-hero__stat-v">{s.v}</span>
                    <span className="sk-hero__stat-l">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="sk-hero__right">
          {show && <TiltMockup />}
        </div>
      </div>
      <div className="sk-hero__dots" />
    </section>
  );
}

/* ════════════════════ ABOUT ════════════════════ */

function About() {
  return (
    <section className="sk-section" id="company">
      <div className="sk-container">
        <div className="sk-about">
          <Reveal className="sk-about__left">
            <p className="sk-label">Who we are</p>
            <h2 className="sk-h2">We're Skeina.</h2>
            <p className="sk-body">
              A young software company from India building enterprise tools that don't
              feel like enterprise tools. We obsess over every pixel, every API response
              time, every user flow -- because our users deserve software that respects
              their time.
            </p>
            <p className="sk-body sk-body--muted">
              No VC funding. No fake metrics. Just a team that ships.
            </p>
          </Reveal>
          <Reveal delay={120} className="sk-about__right">
            <div className="sk-about__nums">
              {[{ v: '2024', l: 'Year founded' }, { v: '4', l: 'Products shipped' }, { v: 'India', l: 'Headquarters' }, { v: '∞', l: 'Ambition' }].map(n => (
                <div key={n.l} className="sk-about__num">
                  <span className="sk-about__num-v">{n.v}</span>
                  <span className="sk-about__num-l">{n.l}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ SERVICES ════════════════════ */

const SERVICES = [
  { n: '01', title: 'Enterprise Software', desc: 'Custom ERP, CRM, and operational platforms. Tailored to your workflows, built to last decades.' },
  { n: '02', title: 'Product Engineering', desc: 'Full-cycle SaaS development. Architecture, engineering, infrastructure, and launch.' },
  { n: '03', title: 'Design Systems', desc: 'End-to-end UI/UX design systems that scale across products and teams.' },
  { n: '04', title: 'Web Platforms', desc: 'High-performance web applications. React, Next.js, and modern stacks built for scale.' },
];

function Services() {
  return (
    <section className="sk-section sk-section--border">
      <div className="sk-container">
        <Reveal>
          <p className="sk-label">What we build</p>
          <h2 className="sk-h2">Four verticals. <span className="sk-h2--muted">One standard.</span></h2>
        </Reveal>
        <div className="sk-services">
          {SERVICES.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="sk-svc">
                <span className="sk-svc__n">{s.n}</span>
                <div className="sk-svc__body">
                  <h3 className="sk-svc__title">{s.title}</h3>
                  <p className="sk-svc__desc">{s.desc}</p>
                </div>
                <span className="sk-svc__arrow">&#8599;</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ FLAGSHIP ════════════════════ */

function Flagship() {
  const navigate = useNavigate();
  return (
    <section className="sk-flagship">
      <div className="sk-container">
        <div className="sk-flagship__grid">
          <Reveal>
            <div>
              <p className="sk-label">Flagship product</p>
              <h2 className="sk-h2 sk-h2--light">Orchestrator ERP</h2>
              <p className="sk-flagship__desc">
                Inventory, accounting, sales, procurement, and dispatch. Unified into one
                system designed yesterday, built to run for decades.
              </p>
              <div className="sk-flagship__metrics">
                {[{ v: '99.9%', l: 'Uptime' }, { v: '<200ms', l: 'Response' }, { v: '50+', l: 'Integrations' }, { v: '∞', l: 'Scalability' }].map(m => (
                  <div key={m.l} className="sk-flagship__m">
                    <span className="sk-flagship__m-v">{m.v}</span>
                    <span className="sk-flagship__m-l">{m.l}</span>
                  </div>
                ))}
              </div>
              <div className="sk-flagship__actions">
                <MagButton className="sk-btn sk-btn--accent" onClick={() => navigate('/skeina/product')}>Explore Orchestrator</MagButton>
                <MagButton className="sk-btn sk-btn--ghost-invert" onClick={() => navigate('/skeina/pricing')}>View pricing</MagButton>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <TiltMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ PROCESS ════════════════════ */

const STEPS = [
  { n: '01', title: 'Discover', desc: 'We sit with your team, map your workflows, and understand the real problem before touching a pixel.' },
  { n: '02', title: 'Design', desc: 'Systems-first design. Flexible, scalable design systems that grow with your product.' },
  { n: '03', title: 'Engineer', desc: 'Clean architecture, tested code, performance-first. Built to last, not just to ship.' },
  { n: '04', title: 'Launch', desc: 'Ship, measure, refine. We stay with you through launch and beyond.' },
];

function Process() {
  return (
    <section className="sk-section sk-section--border">
      <div className="sk-container">
        <Reveal>
          <p className="sk-label">How we work</p>
          <h2 className="sk-h2">Precision at every stage.</h2>
        </Reveal>
        <div className="sk-process">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="sk-process__step">
                <div className="sk-process__indicator">
                  <div className="sk-process__dot" />
                  {i < STEPS.length - 1 && <div className="sk-process__connector" />}
                </div>
                <div className="sk-process__content">
                  <span className="sk-process__n">{s.n}</span>
                  <h3 className="sk-process__title">{s.title}</h3>
                  <p className="sk-process__desc">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ CTA ════════════════════ */

function CTA() {
  return (
    <section className="sk-section">
      <div className="sk-container">
        <Reveal>
          <div className="sk-cta">
            <div className="sk-cta__glow" />
            <div className="sk-cta__inner">
              <h2 className="sk-cta__title">
                Have a project?<br />
                <span className="sk-cta__title--muted">Let's build something remarkable.</span>
              </h2>
              <p className="sk-cta__desc">
                Whether it's an ERP from scratch, a design system overhaul, or a
                product launch -- we're ready.
              </p>
              <div className="sk-cta__actions">
                <MagButton className="sk-btn sk-btn--accent">Start a project</MagButton>
                <MagButton className="sk-btn sk-btn--ghost-invert">hello@skeina.io</MagButton>
              </div>
            </div>
            <div className="sk-cta__rings">
              {[80, 140, 200, 260].map(r => <div key={r} className="sk-cta__ring" style={{ width: r, height: r }} />)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════ PAGE STYLES ════════════════════ */

function PageStyles() {
  return (
    <style>{`
      /* ── Typography ── */
      .sk-h2 { font-size: clamp(28px, 5vw, 44px); font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; color: var(--sk-text); max-width: 520px; }
      .sk-h2--muted { color: var(--sk-text-3); }
      .sk-h2--light { color: var(--sk-text); }
      .sk-body { font-size: 15px; line-height: 1.75; color: var(--sk-text-2); max-width: 440px; margin-top: 16px; }
      .sk-body--muted { color: var(--sk-text-3); font-size: 14px; }
      .sk-section { padding: 100px 0; }
      @media (min-width: 768px) { .sk-section { padding: 140px 0; } }
      .sk-section--border { border-top: 1px solid var(--sk-border); }

      /* ── Word reveal ── */
      .sk-word-wrap { display: inline; }
      .sk-word { display: inline-block; opacity: 0; animation: sk-word-in 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
      @keyframes sk-word-in { from { opacity: 0; transform: translateY(20px) rotateX(-40deg); filter: blur(4px); } to { opacity: 1; transform: translateY(0) rotateX(0); filter: blur(0); } }

      /* ── Hero ── */
      .sk-hero { position: relative; min-height: 100svh; display: flex; align-items: center; padding: 100px 0 60px; overflow: hidden; }
      .sk-hero__inner { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
      @media (min-width: 1024px) { .sk-hero__inner { grid-template-columns: 1fr 1fr; gap: 40px; } }
      .sk-hero__badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--sk-border); font-size: 11px; font-weight: 500; color: var(--sk-text-2); margin-bottom: 28px; }
      .sk-hero__badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sk-accent); animation: sk-pulse 2s ease-in-out infinite; }
      @keyframes sk-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      .sk-hero__title { font-size: clamp(36px, 6.5vw, 64px); font-weight: 900; line-height: 1.06; letter-spacing: -0.04em; color: var(--sk-text); perspective: 600px; }
      .sk-hero__sub { margin-top: 24px; font-size: 16px; line-height: 1.75; color: var(--sk-text-2); max-width: 420px; }
      .sk-hero__actions { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 10px; }
      .sk-hero__stats { margin-top: 52px; display: flex; gap: 32px; }
      .sk-hero__stat { display: flex; flex-direction: column; }
      .sk-hero__stat-v { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: var(--sk-text); }
      .sk-hero__stat-l { font-size: 11px; font-weight: 500; color: var(--sk-text-3); margin-top: 2px; }
      .sk-hero__right { display: none; }
      @media (min-width: 1024px) { .sk-hero__right { display: block; } }
      .sk-hero__dots {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background-image: radial-gradient(var(--sk-text-4) 1px, transparent 1px);
        background-size: 32px 32px;
        mask-image: radial-gradient(ellipse 50% 50% at 70% 50%, black 10%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse 50% 50% at 70% 50%, black 10%, transparent 70%);
        opacity: 0.3;
      }

      /* ── Tilt mockup ── */
      .sk-tilt-wrap { perspective: 1200px; }
      .sk-mockup {
        width: 100%; border-radius: 14px; overflow: hidden; position: relative;
        background: var(--sk-surface); border: 1px solid var(--sk-border-s);
        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.4);
        transition: transform 0.15s ease-out;
      }
      .sk-mockup__glow {
        position: absolute; inset: -1px; border-radius: 14px; pointer-events: none;
        border: 1px solid var(--sk-text); opacity: 0.04;
      }
      .sk-mockup__chrome { height: 30px; display: flex; align-items: center; padding: 0 12px; gap: 8px; background: var(--sk-surface-2); border-bottom: 1px solid var(--sk-border); }
      .sk-mockup__dots { display: flex; gap: 5px; }
      .sk-mockup__dots span { width: 7px; height: 7px; border-radius: 50%; }
      .sk-mockup__dots span:nth-child(1) { background: #ff5f57; }
      .sk-mockup__dots span:nth-child(2) { background: #ffbd2e; }
      .sk-mockup__dots span:nth-child(3) { background: #28c840; }
      .sk-mockup__url { height: 14px; width: 100px; border-radius: 4px; background: var(--sk-border); margin-left: 8px; }
      .sk-mockup__body { display: flex; min-height: 200px; }
      @media (min-width: 640px) { .sk-mockup__body { min-height: 260px; } }
      .sk-mockup__sidebar { width: 18%; padding: 8px 5px; flex-shrink: 0; border-right: 1px solid var(--sk-border); display: flex; flex-direction: column; gap: 2px; }
      .sk-mockup__sb-active { height: 14px; border-radius: 4px; background: var(--sk-text); opacity: 0.8; }
      .sk-mockup__sb-item { height: 14px; border-radius: 4px; background: var(--sk-border); }
      .sk-mockup__main { flex: 1; padding: 10px; overflow: hidden; }
      .sk-mockup__toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .sk-mockup__tb-title { height: 7px; width: 70px; border-radius: 3px; background: var(--sk-text); opacity: 0.2; }
      .sk-mockup__tb-btn { height: 18px; width: 50px; border-radius: 5px; background: var(--sk-text); opacity: 0.7; }
      .sk-mockup__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 10px; }
      .sk-mockup__kpi { padding: 6px; border-radius: 6px; border: 1px solid var(--sk-border); background: var(--sk-surface-2); }
      .sk-mockup__kpi-label { height: 3px; width: 55%; border-radius: 2px; background: var(--sk-border); margin-bottom: 5px; }
      .sk-mockup__kpi-val { height: 6px; width: 45%; border-radius: 2px; background: var(--sk-text); opacity: 0.35; }
      .sk-mockup__kpi-line { width: 100%; height: 10px; margin-top: 4px; }
      .sk-mockup__table { border-radius: 6px; border: 1px solid var(--sk-border); overflow: hidden; }
      .sk-mockup__row { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-bottom: 1px solid var(--sk-border); }
      .sk-mockup__row:last-child { border-bottom: none; }
      .sk-mockup__cell { height: 3px; border-radius: 2px; background: var(--sk-border); }
      .sk-mockup__cell--grow { flex: 1; }
      .sk-mockup__badge { width: 28px; height: 10px; border-radius: 999px; background: var(--sk-text); opacity: 0.08; margin-left: auto; flex-shrink: 0; }

      /* ── About ── */
      .sk-about { display: grid; grid-template-columns: 1fr; gap: 48px; }
      @media (min-width: 768px) { .sk-about { grid-template-columns: 1.3fr 1fr; gap: 64px; align-items: start; } }
      .sk-about__nums { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
      .sk-about__num-v { display: block; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: var(--sk-text); }
      .sk-about__num-l { display: block; font-size: 12px; font-weight: 500; color: var(--sk-text-3); margin-top: 4px; }

      /* ── Services ── */
      .sk-services { margin-top: 48px; display: flex; flex-direction: column; }
      .sk-svc {
        display: flex; align-items: flex-start; gap: 20px; padding: 28px 0;
        border-bottom: 1px solid var(--sk-border);
        transition: padding-left 0.3s cubic-bezier(0.16,1,0.3,1); cursor: pointer; position: relative;
      }
      .sk-svc:first-child { border-top: 1px solid var(--sk-border); }
      .sk-svc:hover { padding-left: 12px; }
      .sk-svc:hover::before {
        content: ''; position: absolute; left: 0; top: 28px; bottom: 28px; width: 2px;
        background: var(--sk-accent); border-radius: 2px;
      }
      .sk-svc__n { font-size: 11px; font-weight: 500; color: var(--sk-text-4); min-width: 28px; padding-top: 4px; font-variant-numeric: tabular-nums; }
      .sk-svc__body { flex: 1; }
      .sk-svc__title { font-size: 18px; font-weight: 700; color: var(--sk-text); letter-spacing: -0.02em; }
      .sk-svc__desc { font-size: 14px; line-height: 1.7; color: var(--sk-text-2); margin-top: 6px; max-width: 480px; }
      .sk-svc__arrow { font-size: 16px; color: var(--sk-text-3); opacity: 0; transform: translate(-4px, 4px); transition: opacity 0.25s, transform 0.25s; margin-top: 2px; }
      .sk-svc:hover .sk-svc__arrow { opacity: 1; transform: translate(0, 0); }

      /* ── Flagship ── */
      .sk-flagship { background: var(--sk-surface); padding: 100px 0; border-top: 1px solid var(--sk-border); border-bottom: 1px solid var(--sk-border); position: relative; overflow: hidden; }
      .sk-flagship::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 40% at 20% 50%, var(--sk-accent-glow), transparent); pointer-events: none; }
      .sk-flagship__grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; position: relative; z-index: 1; }
      @media (min-width: 1024px) { .sk-flagship__grid { grid-template-columns: 1fr 1.2fr; gap: 56px; } }
      .sk-flagship__desc { margin-top: 16px; font-size: 15px; line-height: 1.8; color: var(--sk-text-2); max-width: 400px; }
      .sk-flagship__metrics { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 280px; }
      .sk-flagship__m-v { display: block; font-size: 24px; font-weight: 900; letter-spacing: -0.03em; color: var(--sk-text); }
      .sk-flagship__m-l { display: block; font-size: 11px; font-weight: 500; color: var(--sk-text-3); margin-top: 2px; }
      .sk-flagship__actions { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 10px; }

      /* ── Process ── */
      .sk-process { margin-top: 56px; display: flex; flex-direction: column; gap: 0; }
      .sk-process__step { display: flex; gap: 20px; }
      .sk-process__indicator { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 20px; }
      .sk-process__dot {
        width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        border: 2px solid var(--sk-text-3); background: var(--sk-bg);
      }
      .sk-process__connector { width: 1px; flex: 1; min-height: 40px; background: var(--sk-border-s); }
      .sk-process__content { padding-bottom: 40px; }
      .sk-process__step:last-child .sk-process__content { padding-bottom: 0; }
      .sk-process__n { font-size: 11px; font-weight: 500; color: var(--sk-text-4); display: block; margin-bottom: 4px; font-variant-numeric: tabular-nums; }
      .sk-process__title { font-size: 18px; font-weight: 700; color: var(--sk-text); letter-spacing: -0.02em; }
      .sk-process__desc { font-size: 14px; line-height: 1.7; color: var(--sk-text-2); margin-top: 6px; max-width: 400px; }

      /* ── CTA ── */
      .sk-cta {
        background: var(--sk-surface); border-radius: 24px; padding: 56px 28px;
        position: relative; overflow: hidden; border: 1px solid var(--sk-border-s);
      }
      @media (min-width: 768px) { .sk-cta { padding: 80px 64px; } }
      .sk-cta__glow { position: absolute; top: -40%; right: -20%; width: 60%; height: 180%; background: radial-gradient(ellipse, var(--sk-accent-glow), transparent 70%); pointer-events: none; }
      .sk-cta__inner { position: relative; z-index: 1; }
      .sk-cta__title { font-size: clamp(24px, 4.5vw, 38px); font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: var(--sk-text); }
      .sk-cta__title--muted { color: var(--sk-text-3); }
      .sk-cta__desc { margin-top: 16px; font-size: 14px; line-height: 1.75; color: var(--sk-text-2); max-width: 400px; }
      .sk-cta__actions { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 10px; }
      .sk-cta__rings { position: absolute; top: 50%; right: 10%; transform: translateY(-50%); pointer-events: none; z-index: 0; display: none; }
      @media (min-width: 768px) { .sk-cta__rings { display: block; } }
      .sk-cta__ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; border: 1px solid var(--sk-accent); opacity: 0.06; animation: sk-ring-pulse 4s ease-in-out infinite; }
      .sk-cta__ring:nth-child(2) { animation-delay: 0.5s; }
      .sk-cta__ring:nth-child(3) { animation-delay: 1s; }
      .sk-cta__ring:nth-child(4) { animation-delay: 1.5s; }
      @keyframes sk-ring-pulse { 0%, 100% { opacity: 0.04; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.05); } }
    `}</style>
  );
}

/* ════════════════════ MAIN ════════════════════ */

function Inner() {
  const [loaded, setLoaded] = useState(false);
  const onDone = useCallback(() => setLoaded(true), []);

  return (
    <div className="sk-page">
      <SkeinaStyles />
      <PageStyles />
      <LoadingScreen onDone={onDone} />
      <SkeinaNav />
      <Hero show={loaded} />
      <Marquee words={['Enterprise', 'Design', 'Engineering', 'Craft', 'Scale', 'Precision']} />
      <About />
      <Services />
      <Flagship />
      <Process />
      <CTA />
      <SkeinaFooter />
    </div>
  );
}

export function SkeinaHome() {
  return (
    <SkThemeProvider>
      <Inner />
    </SkThemeProvider>
  );
}
