import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '../../shared/lib/haptics';

/* ────────────────────────────────────────────
   SKEINA — Company Landing Page
   Design spine: Factory.ai-grade typographic
   minimalism with emerald accent
──────────────────────────────────────────── */

const ACCENT = '#10b981';

function SkeinaLogo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="6" width="28" height="3" rx="1.5" fill="currentColor" />
        <rect x="6" y="14" width="20" height="3" rx="1.5" fill={ACCENT} />
        <rect x="2" y="22" width="28" height="3" rx="1.5" fill="currentColor" />
      </svg>
      {withText && (
        <span className="text-[15px] font-semibold tracking-[-0.03em] uppercase">Skeina</span>
      )}
    </span>
  );
}

const NAV_ITEMS = ['Product', 'Enterprise', 'Pricing', 'Company'];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#eeeeee]/80 backdrop-blur-xl border-b border-[#ddd]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 h-14 flex items-center justify-between">
        <SkeinaLogo size={24} />

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => haptic('light')}
              className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444] hover:text-[#020202] transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => { haptic('light'); navigate('/login'); }}
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444] hover:text-[#020202] transition-colors px-3 py-2"
          >
            Log In
          </button>
          <button
            onClick={() => haptic('medium')}
            className="text-[11px] font-medium uppercase tracking-[0.08em] bg-[#020202] text-white px-4 py-2 rounded-full hover:bg-[#333] transition-colors active:scale-[0.97]"
          >
            Contact Sales
          </button>
        </div>

        <button
          className="md:hidden h-9 w-9 flex items-center justify-center"
          onClick={() => { setMobileOpen(!mobileOpen); haptic('light'); }}
        >
          <div className="space-y-1.5">
            <div className={`w-5 h-[1.5px] bg-[#020202] transition-all ${mobileOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
            <div className={`w-5 h-[1.5px] bg-[#020202] transition-all ${mobileOpen ? '-rotate-45 -translate-y-[1.5px]' : ''}`} />
          </div>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#eeeeee] border-t border-[#ddd] px-6 py-6 space-y-4">
          {NAV_ITEMS.map((item) => (
            <button key={item} className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#444]">
              {item}
            </button>
          ))}
          <div className="pt-4 border-t border-[#ddd] flex flex-col gap-3">
            <button onClick={() => navigate('/login')} className="text-[12px] font-medium uppercase tracking-[0.08em]">Log In</button>
            <button className="text-[12px] font-medium uppercase tracking-[0.08em] bg-[#020202] text-white px-4 py-2.5 rounded-full">Contact Sales</button>
          </div>
        </div>
      )}
    </header>
  );
}

function SectionLabel({ children, color }: { children: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color || ACCENT }} />
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#777]">{children}</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="max-w-[800px]">
          <h1
            className="text-[clamp(36px,8vw,72px)] font-normal leading-[1.05] tracking-[-0.04em] text-[#020202]"
            style={{ animation: 'sk-fade-up 800ms cubic-bezier(0.22,1,0.36,1) forwards' }}
          >
            Enterprise operations,{' '}
            <span className="italic text-[#999]">orchestrated.</span>
          </h1>
          <p
            className="mt-6 text-[15px] md:text-[17px] leading-[1.7] text-[#666] max-w-[520px]"
            style={{ animation: 'sk-fade-up 800ms cubic-bezier(0.22,1,0.36,1) 200ms both' }}
          >
            Skeina builds frontier ERP software that unifies procurement, inventory,
            accounting, and dispatch into one calm, precise system.
          </p>
          <div
            className="mt-10 flex flex-wrap gap-3"
            style={{ animation: 'sk-fade-up 800ms cubic-bezier(0.22,1,0.36,1) 400ms both' }}
          >
            <button
              onClick={() => haptic('medium')}
              className="text-[11px] font-medium uppercase tracking-[0.08em] bg-[#020202] text-white px-6 py-3 rounded-full hover:bg-[#333] transition-all active:scale-[0.97]"
            >
              Request a Demo
            </button>
            <button
              onClick={() => haptic('light')}
              className="text-[11px] font-medium uppercase tracking-[0.08em] border border-[#ccc] text-[#333] px-6 py-3 rounded-full hover:border-[#999] transition-all active:scale-[0.97]"
            >
              Learn More &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ccc 1px, transparent 1px),
            linear-gradient(to bottom, #ccc 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </section>
  );
}

const PRODUCT_TABS = [
  {
    label: 'Inventory',
    title: 'Real-time inventory across every warehouse',
    desc: 'Track stock levels, movements, and valuations across unlimited locations. Automatic reorder points. Batch and serial tracking built in.',
    visual: 'inventory',
  },
  {
    label: 'Accounting',
    title: 'Double-entry ledger, zero configuration',
    desc: 'Every transaction auto-posts to your general ledger. Multi-currency, multi-entity, tax-ready. Your accountant will love it.',
    visual: 'accounting',
  },
  {
    label: 'Procurement',
    title: 'Purchase to payment, fully traced',
    desc: 'From requisition to PO to receipt to payment. Approval workflows, vendor scoring, and landed cost calculation.',
    visual: 'procurement',
  },
  {
    label: 'Dispatch',
    title: 'Ship with precision, track every mile',
    desc: 'Route-optimized dispatch, real-time tracking, proof of delivery. Integrates with your existing logistics partners.',
    visual: 'dispatch',
  },
];

function ProductVisual({ tab }: { tab: string }) {
  const colors: Record<string, string> = {
    inventory: ACCENT,
    accounting: '#6366f1',
    procurement: '#f59e0b',
    dispatch: '#ec4899',
  };
  const c = colors[tab] || ACCENT;

  return (
    <div className="relative w-full aspect-[4/3] bg-white rounded-2xl border border-[#e0e0e0] overflow-hidden">
      {/* Mock ERP UI wireframe */}
      <div className="absolute top-0 inset-x-0 h-10 bg-[#fafafa] border-b border-[#eee] flex items-center px-4 gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
        <div className="ml-4 h-2 w-24 bg-[#eee] rounded" />
      </div>
      <div className="absolute top-10 left-0 w-36 bottom-0 bg-[#fafafa] border-r border-[#eee] p-3 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded"
            style={{
              width: `${50 + Math.random() * 40}%`,
              backgroundColor: i === 1 ? c : '#eee',
              opacity: i === 1 ? 0.3 : 1,
            }}
          />
        ))}
      </div>
      <div className="absolute top-14 left-40 right-4 bottom-4 space-y-3">
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 h-16 bg-[#fafafa] rounded-lg border border-[#eee] p-2.5">
              <div className="h-1.5 w-10 bg-[#ddd] rounded mb-2" />
              <div className="h-4 w-14 rounded" style={{ backgroundColor: c, opacity: 0.15 }} />
            </div>
          ))}
        </div>
        <div className="bg-[#fafafa] rounded-lg border border-[#eee] flex-1 p-3">
          <div className="h-2 w-20 bg-[#eee] rounded mb-3" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c, opacity: 0.4 }} />
              <div className="h-2 rounded bg-[#eee]" style={{ width: `${30 + Math.random() * 50}%` }} />
              <div className="ml-auto h-2 w-12 rounded bg-[#f0f0f0]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setActiveIdx((p) => (p + 1) % PRODUCT_TABS.length), 6000);
  }, []);

  useEffect(() => {
    resetInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [resetInterval]);

  const tab = PRODUCT_TABS[activeIdx];

  return (
    <section className="py-24 md:py-36 px-6 border-t border-[#ddd]">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel>Product</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="text-[clamp(28px,5vw,48px)] font-normal leading-[1.1] tracking-[-0.03em] text-[#020202]">
              Everything your business runs on.{' '}
              <span className="text-[#999]">Nothing it doesn&rsquo;t.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-[#666] max-w-[440px]">
              Orchestrator is a modular ERP built for mid-market companies that
              refuse to compromise on design or capability.
            </p>

            {/* Tab stepper */}
            <div className="mt-10 flex items-center gap-1">
              {PRODUCT_TABS.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => { setActiveIdx(i); resetInterval(); haptic('light'); }}
                  className="relative h-1.5 flex-1 rounded-full overflow-hidden bg-[#ddd] transition-all"
                >
                  {i === activeIdx && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        backgroundColor: ACCENT,
                        animation: 'sk-progress 6s linear forwards',
                      }}
                    />
                  )}
                  {i < activeIdx && (
                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: ACCENT }} />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-6">
              {PRODUCT_TABS.map((t, i) => (
                <span
                  key={t.label}
                  className={`text-[10px] font-medium uppercase tracking-[0.08em] cursor-pointer transition-colors ${
                    i === activeIdx ? 'text-[#020202]' : 'text-[#bbb]'
                  }`}
                  onClick={() => { setActiveIdx(i); resetInterval(); haptic('light'); }}
                >
                  {String(i + 1).padStart(2, '0')} {t.label}
                </span>
              ))}
            </div>

            <div className="mt-8" key={activeIdx}>
              <h3
                className="text-[20px] font-medium tracking-[-0.02em] text-[#020202]"
                style={{ animation: 'sk-fade-up 500ms cubic-bezier(0.22,1,0.36,1) forwards' }}
              >
                {tab.title}
              </h3>
              <p
                className="mt-3 text-[14px] leading-[1.7] text-[#777] max-w-[400px]"
                style={{ animation: 'sk-fade-up 500ms cubic-bezier(0.22,1,0.36,1) 100ms both' }}
              >
                {tab.desc}
              </p>
              <button
                onClick={() => haptic('light')}
                className="mt-5 text-[11px] font-medium uppercase tracking-[0.08em] bg-[#020202] text-white px-5 py-2.5 rounded-full hover:bg-[#333] transition-all active:scale-[0.97]"
              >
                Learn More &rarr;
              </button>
            </div>
          </div>

          <div
            className="flex items-center"
            key={`visual-${activeIdx}`}
            style={{ animation: 'sk-fade-up 600ms cubic-bezier(0.22,1,0.36,1) forwards' }}
          >
            <ProductVisual tab={tab.visual} />
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Multi-entity, multi-currency',
    desc: 'Run unlimited companies from a single tenant. Consolidation and intercompany transactions built in.',
  },
  {
    title: 'Approval workflows',
    desc: 'Configurable approval chains for every document type. Role-based, amount-based, or rule-based routing.',
  },
  {
    title: 'Audit trail',
    desc: 'Every change is versioned and attributed. Full compliance-ready history without additional setup.',
  },
  {
    title: 'API-first architecture',
    desc: 'RESTful APIs for every module. Integrate with your existing tools, banks, and logistics partners.',
  },
  {
    title: 'Role-based access',
    desc: 'Granular permissions down to field level. Define exactly who sees what, when, and where.',
  },
  {
    title: 'Real-time dashboards',
    desc: 'Customizable analytics that update in real-time. No waiting for batch reports or data exports.',
  },
];

function FeaturesGrid() {
  return (
    <section className="py-24 md:py-36 px-6 border-t border-[#ddd]">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel>Capabilities</SectionLabel>
        <h2 className="text-[clamp(28px,5vw,48px)] font-normal leading-[1.1] tracking-[-0.03em] text-[#020202] max-w-[600px]">
          Built for the way real businesses work.
        </h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
          {FEATURES.map((f, i) => (
            <div key={i} className="group">
              <div className="text-[10px] font-mono text-[#bbb] mb-3">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-[16px] font-medium tracking-[-0.01em] text-[#020202] group-hover:text-[#333] transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-[#888]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnterpriseSection() {
  return (
    <section className="bg-[#0a0a0a] text-white py-24 md:py-36 px-6">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel color="#10b981">Enterprise</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <p className="text-[15px] leading-[1.7] text-[#999] max-w-[360px]">
              Skeina is built to meet the demands of modern enterprise teams
              &mdash; secure, scalable, and ready to integrate with your existing
              operations stack.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888] mb-4">
                Secure at Every Level
              </h3>
              <h4 className="text-[18px] font-medium tracking-[-0.01em] mb-3">
                Industry-grade security and compliance
              </h4>
              <p className="text-[13px] leading-[1.7] text-[#777]">
                SOC 2-ready architecture, encryption at rest and in transit, SSO,
                and granular audit logging. Your data stays yours.
              </p>
              <button
                onClick={() => haptic('light')}
                className="mt-5 text-[11px] font-medium uppercase tracking-[0.08em] border border-[#444] text-[#ccc] px-4 py-2 rounded-full hover:border-[#888] hover:text-white transition-all active:scale-[0.97]"
              >
                Learn More &rarr;
              </button>
            </div>
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888] mb-4">
                Designed to Scale
              </h3>
              <h4 className="text-[18px] font-medium tracking-[-0.01em] mb-3">
                Interface and infrastructure agnostic
              </h4>
              <p className="text-[13px] leading-[1.7] text-[#777]">
                Cloud-native or on-premise. Horizontal scaling, multi-region
                deployment, and vendor-agnostic integrations. Grows with you.
              </p>
              <button
                onClick={() => haptic('light')}
                className="mt-5 text-[11px] font-medium uppercase tracking-[0.08em] border border-[#444] text-[#ccc] px-4 py-2 rounded-full hover:border-[#888] hover:text-white transition-all active:scale-[0.97]"
              >
                Learn More &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsBar() {
  return (
    <section className="py-24 md:py-32 px-6 border-t border-[#ddd]">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { value: '99.99%', label: 'Uptime SLA' },
            { value: '<200ms', label: 'Avg. Response' },
            { value: '50+', label: 'Integrations' },
            { value: '10k+', label: 'Daily Transactions' },
          ].map((m) => (
            <div key={m.label} className="text-center md:text-left">
              <div className="text-[clamp(28px,5vw,44px)] font-normal tracking-[-0.03em] text-[#020202]">
                {m.value}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999] mt-1">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="bg-[#0a0a0a] rounded-3xl p-12 md:p-20 relative overflow-hidden">
          <SectionLabel color={ACCENT}>Build with us</SectionLabel>
          <div className="relative z-10">
            <h2 className="text-[clamp(24px,5vw,40px)] font-normal leading-[1.1] tracking-[-0.03em] text-white max-w-[500px]">
              Ready to run your operations on Skeina?
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => haptic('medium')}
                className="text-[11px] font-medium uppercase tracking-[0.08em] bg-white text-[#020202] px-6 py-3 rounded-full hover:bg-[#eee] transition-all active:scale-[0.97]"
              >
                Request a Demo &rarr;
              </button>
            </div>
          </div>
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#ddd] py-16 px-6">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel>Footer</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-12">
          <div>
            <SkeinaLogo size={28} />
          </div>
          {[
            { title: 'Resources', links: ['Documentation', 'API Reference', 'Status'] },
            { title: 'Company', links: ['About', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-semibold text-[#020202] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <button className="text-[13px] text-[#888] hover:text-[#020202] transition-colors">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t border-[#eee] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[12px] text-[#bbb]">
            &copy; Skeina {new Date().getFullYear()}. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            {['X (Twitter)', 'LinkedIn', 'GitHub'].map((s) => (
              <button key={s} className="text-[12px] text-[#bbb] hover:text-[#020202] transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SkeinaLanding() {
  return (
    <div
      className="min-h-screen bg-[#eeeeee] text-[#020202] font-sans"
      style={{ fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"' }}
    >
      <Nav />
      <Hero />
      <ProductSection />
      <FeaturesGrid />
      <EnterpriseSection />
      <MetricsBar />
      <CTASection />
      <Footer />

      <style>{`
        @keyframes sk-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sk-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
