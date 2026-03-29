import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode, type CSSProperties } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

/* ════════════════════════════════════════════
   THEME
   ════════════════════════════════════════════ */

type Theme = 'dark' | 'light';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });
export const useSkTheme = () => useContext(ThemeCtx);

export function SkThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('sk-theme') as Theme) || 'dark';
  });
  useEffect(() => {
    localStorage.setItem('sk-theme', theme);
    document.documentElement.setAttribute('data-sk', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

/* ════════════════════════════════════════════
   LOADING SCREEN
   ════════════════════════════════════════════ */

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'reveal' | 'wipe' | 'done'>('reveal');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('wipe'), 600);
    const t2 = setTimeout(() => { setPhase('done'); onDone(); }, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div className="sk-loader" style={{ transform: phase === 'wipe' ? 'translateY(-100%)' : 'translateY(0)' }}>
      <span className="sk-loader__text" style={{ clipPath: phase === 'reveal' || phase === 'wipe' ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}>
        Skeina
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════
   LOGO — pure text
   ════════════════════════════════════════════ */

export function SkeinaLogo({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <span className="sk-logo" style={{ fontSize: size, color: color || undefined }}>
      Skeina
    </span>
  );
}

/* ════════════════════════════════════════════
   MAGNETIC BUTTON
   ════════════════════════════════════════════ */

export function MagButton({
  children,
  className = '',
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * 0.2;
    const dy = (e.clientY - cy) * 0.2;
    setOffset({ x: dx, y: dy });
  }, []);

  const handleLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return (
    <button
      ref={ref}
      className={`sk-mag-btn ${className}`}
      style={{ ...style, transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════
   NAV
   ════════════════════════════════════════════ */

const NAV = [
  { label: 'Product', to: '/skeina/product' },
  { label: 'Pricing', to: '/skeina/pricing' },
  { label: 'Company', to: '/skeina#company' },
];

export function SkeinaNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggle } = useSkTheme();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className={`sk-nav ${scrolled ? 'sk-nav--scrolled' : ''}`}>
        <div className="sk-nav__inner">
          <Link to="/skeina" className="sk-nav__logo"><SkeinaLogo /></Link>
          <nav className="sk-nav__links">
            {NAV.map(n => (
              <Link key={n.label} to={n.to} className={`sk-nav__link ${pathname === n.to ? 'sk-nav__link--active' : ''}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="sk-nav__right">
            <button onClick={toggle} className="sk-nav__theme" aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="15" height="15" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5v1.5m0 10v1.5m-5-6.5h1.5m10 0h1.5M3.4 3.4l1.06 1.06m7.08 7.08 1.06 1.06M3.4 12.6l1.06-1.06m7.08-7.08 1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="15" height="15" fill="none" viewBox="0 0 16 16"><path d="M13.5 9.2A5.5 5.5 0 0 1 6.8 2.5 5.5 5.5 0 1 0 13.5 9.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              )}
            </button>
            <button onClick={() => navigate('/login')} className="sk-nav__link sk-nav__link--login">Log in</button>
            <MagButton className="sk-btn sk-btn--accent sk-btn--sm" onClick={() => navigate('/skeina/pricing')}>Get started</MagButton>
          </div>
          <div className="sk-nav__mobile-right">
            <button onClick={toggle} className="sk-nav__theme" aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="15" height="15" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5v1.5m0 10v1.5m-5-6.5h1.5m10 0h1.5M3.4 3.4l1.06 1.06m7.08 7.08 1.06 1.06M3.4 12.6l1.06-1.06m7.08-7.08 1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="15" height="15" fill="none" viewBox="0 0 16 16"><path d="M13.5 9.2A5.5 5.5 0 0 1 6.8 2.5 5.5 5.5 0 1 0 13.5 9.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              )}
            </button>
            <button className="sk-hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
              <span className={`sk-hamburger__line ${open ? 'sk-hamburger__line--top' : ''}`} />
              <span className={`sk-hamburger__line ${open ? 'sk-hamburger__line--bot' : ''}`} />
            </button>
          </div>
        </div>
      </header>
      <div className={`sk-mobile ${open ? 'sk-mobile--open' : ''}`}>
        <div className="sk-mobile__inner">
          {NAV.map(n => (
            <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="sk-mobile__link">{n.label}</Link>
          ))}
          <div className="sk-mobile__actions">
            <button onClick={() => { navigate('/login'); setOpen(false); }} className="sk-btn sk-btn--ghost">Log in</button>
            <button onClick={() => { navigate('/skeina/pricing'); setOpen(false); }} className="sk-btn sk-btn--accent">Get started</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════ */

export function SkeinaFooter() {
  const cols = [
    { title: 'Product', links: ['Orchestrator ERP', 'Pricing', 'Changelog'] },
    { title: 'Resources', links: ['Documentation', 'API Reference', 'Status'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact', 'Privacy'] },
  ];
  return (
    <footer className="sk-footer">
      <div className="sk-container">
        <div className="sk-footer__grid">
          <div className="sk-footer__brand">
            <SkeinaLogo />
            <p className="sk-footer__desc">Software built with precision and care.<br />Based in India, building globally.</p>
          </div>
          {cols.map(col => (
            <div key={col.title} className="sk-footer__col">
              <h4 className="sk-footer__heading">{col.title}</h4>
              <ul>{col.links.map(l => <li key={l}><span className="sk-footer__link">{l}</span></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="sk-footer__bottom">
          <span>&copy; {new Date().getFullYear()} Skeina</span>
          <div className="sk-footer__social">
            {['X', 'LinkedIn', 'GitHub'].map(s => <span key={s}>{s}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════
   REVEAL (clip-path wipe)
   ════════════════════════════════════════════ */

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.unobserve(el); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sk-reveal ${vis ? 'sk-reveal--vis' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   MARQUEE
   ════════════════════════════════════════════ */

export function Marquee({ words }: { words: string[] }) {
  return (
    <div className="sk-marquee">
      <div className="sk-marquee__track">
        {[0, 1].map(j => (
          <div key={j} className="sk-marquee__group">
            {words.map((w, i) => (
              <span key={`${j}-${i}`} className="sk-marquee__word">
                {w}<span className="sk-marquee__dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BACKWARD COMPAT (for Product/Pricing pages)
   ════════════════════════════════════════════ */

export const ThemeProvider = SkThemeProvider;
export const useColors = () => {
  const { theme } = useSkTheme();
  const d = theme === 'dark';
  return {
    dark: d,
    bg: d ? '#09090b' : '#fafaf9', surface: d ? '#141416' : '#fff',
    surfaceAlt: d ? '#1c1c20' : '#f4f4f5', border: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    text: d ? '#f4f4f5' : '#09090b', textSecondary: d ? '#a1a1aa' : '#52525b',
    textTertiary: d ? '#52525b' : '#a1a1aa', textMuted: d ? '#3f3f46' : '#d4d4d8',
    accent: d ? '#f4f4f5' : '#09090b', accentBg: d ? '#f4f4f5' : '#09090b',
    accentText: d ? '#09090b' : '#f4f4f5', invertBg: d ? '#fafaf9' : '#09090b',
    invertText: d ? '#09090b' : '#f4f4f5', invertBorder: d ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)',
  };
};
export function SectionLabel({ children }: { children: string }) { return <p className="sk-label">{children}</p>; }
export function GlobalStyles() { return <SkeinaStyles />; }

/* ════════════════════════════════════════════
   GLOBAL STYLES
   ════════════════════════════════════════════ */

export function SkeinaStyles() {
  return (
    <style>{`
      @font-face { font-family: 'Satoshi'; font-weight: 400; src: url('/fonts/Satoshi-Regular.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'Satoshi'; font-weight: 500; src: url('/fonts/Satoshi-Medium.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'Satoshi'; font-weight: 700; src: url('/fonts/Satoshi-Bold.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'Satoshi'; font-weight: 900; src: url('/fonts/Satoshi-Black.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'OpenAI Sans'; font-weight: 400; src: url('/fonts/OpenAISans-Regular.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'OpenAI Sans'; font-weight: 500; src: url('/fonts/OpenAISans-Medium.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'OpenAI Sans'; font-weight: 600; src: url('/fonts/OpenAISans-Semibold.woff2') format('woff2'); font-display: swap; }
      @font-face { font-family: 'OpenAI Sans'; font-weight: 700; src: url('/fonts/OpenAISans-Bold.woff2') format('woff2'); font-display: swap; }

      :root {
        --sk-font: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;
        --sk-bg: #09090b; --sk-surface: #141416; --sk-surface-2: #1c1c20;
        --sk-text: #f4f4f5; --sk-text-2: #a1a1aa; --sk-text-3: #52525b; --sk-text-4: #3f3f46;
        --sk-border: rgba(255,255,255,0.06); --sk-border-s: rgba(255,255,255,0.1);
        --sk-accent: #f4f4f5; --sk-accent-glow: rgba(255,255,255,0.06);
      }
      [data-sk="light"] {
        --sk-bg: #fafaf9; --sk-surface: #ffffff; --sk-surface-2: #f4f4f5;
        --sk-text: #09090b; --sk-text-2: #52525b; --sk-text-3: #a1a1aa; --sk-text-4: #d4d4d8;
        --sk-border: rgba(0,0,0,0.06); --sk-border-s: rgba(0,0,0,0.1);
        --sk-accent: #09090b; --sk-accent-glow: rgba(0,0,0,0.04);
      }

      /* ── Page reset ── */
      .sk-page { font-family: var(--sk-font); background: var(--sk-bg); color: var(--sk-text); -webkit-font-smoothing: antialiased; position: relative; }
      .sk-page::before {
        content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.35;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        background-size: 200px 200px;
      }
      .sk-page > * { position: relative; z-index: 1; }
      .sk-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      @media (min-width: 640px) { .sk-container { padding: 0 32px; } }

      /* ── Loading ── */
      .sk-loader {
        position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
        background: var(--sk-bg); transition: transform 0.5s cubic-bezier(0.77,0,0.175,1);
      }
      .sk-loader__text {
        font-family: var(--sk-font); font-size: clamp(32px, 6vw, 56px); font-weight: 700;
        letter-spacing: -0.04em; color: var(--sk-text);
        clip-path: inset(0 100% 0 0); transition: clip-path 0.5s cubic-bezier(0.77,0,0.175,1);
      }

      /* ── Reveal ── */
      .sk-reveal {
        opacity: 0; transform: translateY(32px);
        transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
      }
      .sk-reveal--vis { opacity: 1; transform: translateY(0); }

      /* ── Buttons ── */
      .sk-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        font-family: var(--sk-font); font-size: 13px; font-weight: 500;
        padding: 11px 24px; border-radius: 999px; border: none; cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16,1,0.3,1); outline: none;
      }
      .sk-btn:active { transform: scale(0.96); }
      .sk-btn--accent { background: var(--sk-accent); color: var(--sk-bg); }
      .sk-btn--accent:hover { opacity: 0.85; }
      .sk-btn--primary { background: var(--sk-text); color: var(--sk-bg); }
      .sk-btn--primary:hover { opacity: 0.88; }
      .sk-btn--secondary { background: transparent; color: var(--sk-text-2); border: 1px solid var(--sk-border-s); }
      .sk-btn--secondary:hover { border-color: var(--sk-text-3); color: var(--sk-text); }
      .sk-btn--ghost { background: transparent; color: var(--sk-text-2); }
      .sk-btn--ghost:hover { color: var(--sk-text); }
      .sk-btn--sm { padding: 8px 18px; font-size: 12px; }
      .sk-btn--invert { background: var(--sk-bg); color: var(--sk-text); border: none; }
      .sk-btn--invert:hover { opacity: 0.88; }
      .sk-btn--ghost-invert { background: transparent; color: var(--sk-text-3); border: 1px solid var(--sk-border-s); }
      .sk-btn--ghost-invert:hover { color: var(--sk-text-2); border-color: var(--sk-text-3); }
      .sk-mag-btn { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s, opacity 0.25s; }

      /* ── Nav ── */
      .sk-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; border-bottom: 1px solid transparent; transition: all 0.3s; }
      .sk-nav--scrolled { background: color-mix(in srgb, var(--sk-bg) 80%, transparent); backdrop-filter: blur(20px) saturate(1.2); -webkit-backdrop-filter: blur(20px) saturate(1.2); border-bottom-color: var(--sk-border); }
      .sk-nav__inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
      @media (min-width: 640px) { .sk-nav__inner { padding: 0 32px; } }
      .sk-nav__logo { text-decoration: none; }
      .sk-logo { font-family: var(--sk-font); font-weight: 700; letter-spacing: -0.04em; color: var(--sk-text); user-select: none; }
      .sk-nav__links { display: none; align-items: center; gap: 28px; }
      @media (min-width: 768px) { .sk-nav__links { display: flex; } }
      .sk-nav__link { font-family: var(--sk-font); font-size: 13px; font-weight: 500; color: var(--sk-text-3); text-decoration: none; transition: color 0.2s; cursor: pointer; background: none; border: none; }
      .sk-nav__link:hover, .sk-nav__link--active { color: var(--sk-text); }
      .sk-nav__link--login { display: none; }
      @media (min-width: 768px) { .sk-nav__link--login { display: block; } }
      .sk-nav__right { display: none; align-items: center; gap: 8px; }
      @media (min-width: 768px) { .sk-nav__right { display: flex; } }
      .sk-nav__theme { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: none; border: none; cursor: pointer; color: var(--sk-text-3); transition: color 0.2s; }
      .sk-nav__theme:hover { color: var(--sk-text); }

      /* ── Mobile right (theme + hamburger) ── */
      .sk-nav__mobile-right { display: flex; align-items: center; gap: 2px; }
      @media (min-width: 768px) { .sk-nav__mobile-right { display: none; } }

      /* ── Hamburger ── */
      .sk-hamburger { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 40px; height: 40px; background: none; border: none; cursor: pointer; gap: 5px; padding: 0; }
      @media (min-width: 768px) { .sk-hamburger { display: none; } }
      .sk-hamburger__line { display: block; width: 18px; height: 1.5px; border-radius: 2px; background: var(--sk-text); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
      .sk-hamburger__line--top { transform: translateY(3.25px) rotate(45deg); }
      .sk-hamburger__line--bot { transform: translateY(-3.25px) rotate(-45deg); }

      /* ── Mobile ── */
      .sk-mobile { position: fixed; inset: 0; top: 56px; z-index: 90; background: var(--sk-bg); opacity: 0; visibility: hidden; transition: opacity 0.35s, visibility 0.35s; }
      .sk-mobile--open { opacity: 1; visibility: visible; }
      @media (min-width: 768px) { .sk-mobile { display: none !important; } }
      .sk-mobile__inner { padding: 32px 20px; }
      .sk-mobile__link { display: block; padding: 20px 0; font-family: var(--sk-font); font-size: 28px; font-weight: 700; letter-spacing: -0.03em; color: var(--sk-text); text-decoration: none; border-bottom: 1px solid var(--sk-border); opacity: 0; transform: translateY(12px); transition: opacity 0.4s, transform 0.4s; }
      .sk-mobile--open .sk-mobile__link { opacity: 1; transform: translateY(0); }
      .sk-mobile--open .sk-mobile__link:nth-child(1) { transition-delay: 0.05s; }
      .sk-mobile--open .sk-mobile__link:nth-child(2) { transition-delay: 0.1s; }
      .sk-mobile--open .sk-mobile__link:nth-child(3) { transition-delay: 0.15s; }
      .sk-mobile__actions { margin-top: 32px; display: flex; flex-direction: column; gap: 10px; opacity: 0; transform: translateY(12px); transition: opacity 0.4s 0.2s, transform 0.4s 0.2s; }
      .sk-mobile--open .sk-mobile__actions { opacity: 1; transform: translateY(0); }

      /* ── Footer ── */
      .sk-footer { padding: 80px 0; border-top: 1px solid var(--sk-border); }
      .sk-footer__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      @media (min-width: 768px) { .sk-footer__grid { grid-template-columns: 1.6fr 1fr 1fr 1fr; } }
      .sk-footer__brand { grid-column: span 2; }
      @media (min-width: 768px) { .sk-footer__brand { grid-column: span 1; } }
      .sk-footer__desc { margin-top: 16px; font-size: 13px; line-height: 1.7; color: var(--sk-text-3); max-width: 240px; }
      .sk-footer__heading { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sk-text); margin-bottom: 16px; }
      .sk-footer__col ul { list-style: none; padding: 0; margin: 0; }
      .sk-footer__col li { margin-bottom: 12px; }
      .sk-footer__link { font-size: 13px; color: var(--sk-text-3); cursor: pointer; transition: color 0.2s; }
      .sk-footer__link:hover { color: var(--sk-text); }
      .sk-footer__bottom { margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--sk-border); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--sk-text-4); }
      .sk-footer__social { display: flex; gap: 20px; }
      .sk-footer__social span { cursor: pointer; transition: color 0.2s; }
      .sk-footer__social span:hover { color: var(--sk-text-2); }

      /* ── Marquee ── */
      .sk-marquee { border-top: 1px solid var(--sk-border); border-bottom: 1px solid var(--sk-border); padding: 18px 0; overflow: hidden; position: relative; }
      .sk-marquee::before, .sk-marquee::after { content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none; }
      .sk-marquee::before { left: 0; background: linear-gradient(90deg, var(--sk-bg), transparent); }
      .sk-marquee::after { right: 0; background: linear-gradient(270deg, var(--sk-bg), transparent); }
      .sk-marquee__track { display: flex; width: max-content; animation: sk-scroll 30s linear infinite; }
      @keyframes sk-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .sk-marquee__group { display: flex; flex-shrink: 0; }
      .sk-marquee__word { font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sk-text-4); white-space: nowrap; padding: 0 16px; display: inline-flex; align-items: center; gap: 16px; }
      .sk-marquee__dot { width: 3px; height: 3px; border-radius: 50%; background: var(--sk-text-3); flex-shrink: 0; }

      /* ── Section label ── */
      .sk-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--sk-text-2); margin-bottom: 16px; }

      /* ── Animations ── */
      @keyframes sk-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sk-float { 0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); } 50% { transform: translateY(-6px); } }
      .sk-stagger > * { opacity: 0; animation: sk-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both; }
      .sk-stagger > *:nth-child(1) { animation-delay: 0ms; }
      .sk-stagger > *:nth-child(2) { animation-delay: 80ms; }
      .sk-stagger > *:nth-child(3) { animation-delay: 160ms; }
      .sk-stagger > *:nth-child(4) { animation-delay: 240ms; }
      .sk-stagger > *:nth-child(5) { animation-delay: 320ms; }
      .sk-stagger > *:nth-child(6) { animation-delay: 400ms; }
      .sk-stagger > *:nth-child(7) { animation-delay: 480ms; }
    `}</style>
  );
}
