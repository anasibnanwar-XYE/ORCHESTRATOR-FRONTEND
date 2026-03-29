import { useNavigate } from 'react-router-dom';
import { SkeinaNav, SkeinaFooter, SectionLabel, Reveal, GlobalStyles, ThemeProvider, useColors } from '../components/SkeinaShared';

function ProductHero() {
  const navigate = useNavigate();
  const c = useColors();
  return (
    <section className="relative pt-28 pb-16 md:pt-44 md:pb-24 px-5 sm:px-6 overflow-hidden" style={{ backgroundColor: c.invertBg }}>
      <div className="mx-auto max-w-[1400px] relative z-10">
        <div className="max-w-[800px] sk-stagger">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] mb-6" style={{ color: c.dark ? c.textTertiary : '#555' }}>By Skeina</p>
          <h1 className="text-[clamp(40px,8vw,76px)] font-normal leading-[1.02] tracking-[-0.045em]" style={{ color: c.invertText }}>
            Orchestrator<br />
            <span style={{ color: c.dark ? '#999' : '#555' }}>ERP</span>
          </h1>
          <p className="mt-7 text-[16px] md:text-[18px] leading-[1.75] max-w-[520px]" style={{ color: c.dark ? '#666' : '#888' }}>
            The enterprise resource planning platform that unifies inventory, accounting,
            sales, and dispatch into one calm, precise system. Built for mid-market companies
            that refuse to compromise.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              className="text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: c.dark ? c.accentBg : '#fff', color: c.dark ? c.accentText : '#0a0a0a' }}
            >
              Start free trial
            </button>
            <button
              onClick={() => navigate('/skeina/pricing')}
              className="text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
              style={{ border: `1px solid ${c.invertBorder}`, color: c.dark ? '#ccc' : '#ccc' }}
            >
              View pricing
            </button>
          </div>
          <p className="mt-4 text-[11px]" style={{ color: c.dark ? c.textMuted : '#555' }}>No credit card required. 14-day trial. Cancel anytime.</p>
        </div>
      </div>
      <div className="absolute inset-0" style={{ opacity: 0.03, backgroundImage: `linear-gradient(to right, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px), linear-gradient(to bottom, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
    </section>
  );
}

function DashboardSection() {
  const c = useColors();
  return (
    <section className="px-5 sm:px-6 -mt-2 pb-24" style={{ backgroundColor: c.invertBg }}>
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="relative bg-white rounded-2xl border border-[#d8d8d8] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="h-10 bg-[#fafafa] border-b border-[#eee] flex items-center px-4 gap-2">
              <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" /><div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" /><div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" /></div>
              <div className="ml-4 flex-1 max-w-[220px] h-5 bg-[#f0f0f0] rounded-md flex items-center justify-center"><span className="text-[9px] text-[#999]">orchestrator.skeina.io/dashboard</span></div>
            </div>
            <div className="flex min-h-[400px] md:min-h-[500px]">
              <div className="w-[180px] shrink-0 bg-[#fafafa] border-r border-[#eee] hidden md:block">
                <div className="p-3.5 border-b border-[#eee]"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-[#020202] flex items-center justify-center"><div className="w-2.5 h-[1.5px] bg-white" /></div><div className="h-2 w-16 bg-[#ccc] rounded" /></div><div className="h-1 w-10 bg-[#ddd] rounded mt-1.5 ml-7" /></div>
                <div className="p-2 space-y-0.5">
                  <div className="h-7 bg-[#020202] rounded-lg px-2.5 flex items-center"><div className="h-1.5 w-16 bg-white/40 rounded" /></div>
                  <div className="h-7 px-2.5 flex items-center justify-between"><div className="h-1.5 w-14 bg-[#ddd] rounded" /><div className="h-3.5 w-4 bg-[#f0f0f0] rounded text-[7px] flex items-center justify-center text-[#999]">3</div></div>
                  {[45, 55, 48, 62].map((w, i) => <div key={i} className="h-7 px-2.5 flex items-center"><div className="h-1.5 rounded bg-[#ddd]" style={{ width: `${w}%` }} /></div>)}
                  <div className="h-px bg-[#eee] my-2" />
                  <div className="px-2.5 mb-1"><div className="h-1 w-10 bg-[#ddd] rounded" /></div>
                  {[40, 55, 48].map((w, i) => <div key={i} className="h-7 px-2.5 flex items-center"><div className="h-1.5 rounded bg-[#ddd]" style={{ width: `${w}%` }} /></div>)}
                </div>
              </div>
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div><div className="h-1.5 w-10 bg-[#eee] rounded mb-1.5" /><div className="h-3 w-32 bg-[#020202] rounded opacity-80" /></div>
                  <div className="flex gap-2"><div className="h-7 w-16 bg-[#f5f5f5] border border-[#eee] rounded-lg" /><div className="h-7 w-20 bg-[#020202] rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {['#999', '#777', '#555', '#333'].map((clr, i) => (
                    <div key={i} className="bg-[#fafafa] border border-[#eee] rounded-xl p-3">
                      <div className="h-1.5 w-14 bg-[#ddd] rounded mb-2" />
                      <div className="text-[16px] font-semibold text-[#020202] tabular-nums tracking-tight">{['18.4L', '847', '3.2L', '67'][i]}</div>
                      <svg viewBox="0 0 80 20" className="w-full h-5 mt-1.5"><polyline fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" points="0,16 10,14 20,12 30,15 40,8 50,10 60,6 70,7 80,3" /></svg>
                    </div>
                  ))}
                </div>
                <div className="bg-[#fafafa] border border-[#eee] rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-[#eee] flex items-center justify-between">
                    <div className="h-2 w-20 bg-[#020202] rounded opacity-60" />
                    <div className="flex gap-1.5"><div className="h-5 px-2 bg-[#020202] rounded-md flex items-center"><div className="h-1 w-6 bg-white/50 rounded" /></div><div className="h-5 px-2 bg-[#f0f0f0] rounded-md" /><div className="h-5 px-2 bg-[#f0f0f0] rounded-md" /></div>
                  </div>
                  {[45, 60, 35, 70, 50, 55].map((w, i) => (
                    <div key={i} className="px-3.5 py-2.5 border-b border-[#f5f5f5] last:border-0 flex items-center gap-4">
                      <div className="h-1.5 w-12 bg-[#020202] rounded opacity-40" />
                      <div className="h-1.5 rounded bg-[#e5e5e5] flex-1" style={{ width: `${w}%` }} />
                      <div className="h-1.5 w-14 bg-[#020202] rounded opacity-30" />
                      <div className="h-4 w-14 rounded-full bg-[#f0f0f0]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const MODULES = [
  { n: '01', title: 'Inventory Management', desc: 'Real-time stock across unlimited warehouses. Batch tracking, reorder points, and multi-location transfers.', features: ['Multi-warehouse', 'Batch & serial tracking', 'Auto reorder', 'Stock valuations'] },
  { n: '02', title: 'Double-Entry Accounting', desc: 'Every transaction auto-posts to your general ledger. GST-ready, multi-currency, multi-entity consolidation.', features: ['Auto journal posting', 'Multi-currency', 'Tax compliance', 'Financial reports'] },
  { n: '03', title: 'Sales & Orders', desc: 'Quote to cash, fully automated. Pipeline tracking, dealer management, and commission workflows.', features: ['Sales orders', 'Dealer management', 'Credit limits', 'Commission tracking'] },
  { n: '04', title: 'Dispatch & Logistics', desc: 'Route-optimized dispatch with real-time tracking and proof of delivery.', features: ['Route optimization', 'Real-time tracking', 'Proof of delivery', 'Partner integration'] },
  { n: '05', title: 'Procurement', desc: 'From requisition to PO to receipt to payment. Approval workflows and vendor scoring built in.', features: ['Purchase orders', 'Vendor scoring', 'Approval chains', 'Landed cost'] },
  { n: '06', title: 'Reports & Analytics', desc: 'Customizable dashboards that update in real-time. Export to PDF, Excel, or connect via API.', features: ['Real-time dashboards', 'Custom reports', 'PDF/Excel export', 'API access'] },
];

function ModulesSection() {
  const c = useColors();
  return (
    <section className="py-24 md:py-36 px-5 sm:px-6" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <SectionLabel>Modules</SectionLabel>
          <h2 className="text-[clamp(28px,5vw,48px)] font-normal leading-[1.1] tracking-[-0.03em] max-w-[600px]" style={{ color: c.text }}>
            Every module your business needs.{' '}
            <span style={{ color: c.textTertiary }}>Nothing it doesn't.</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m, i) => (
            <Reveal key={i} delay={i * 80}>
              <div
                className="rounded-2xl p-6 md:p-8 transition-all duration-300 group"
                style={{
                  backgroundColor: c.surface,
                  border: `1px solid ${c.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = c.dark ? 'rgba(255,255,255,0.12)' : '#ccc';
                  e.currentTarget.style.boxShadow = c.dark ? '0 8px 30px -10px rgba(255,255,255,0.03)' : '0 8px 30px -10px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = c.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>{m.n}</span>
                <h3 className="text-[17px] font-medium tracking-[-0.01em] mt-3" style={{ color: c.text }}>{m.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.7]" style={{ color: c.textSecondary }}>{m.desc}</p>
                <div className="mt-5 pt-5 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${c.borderSubtle}` }}>
                  {m.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: c.text, opacity: 0.15 }} />
                      <span className="text-[11px]" style={{ color: c.textSecondary }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const c = useColors();
  const legacyItems = ['Months of implementation', 'Clunky, outdated interfaces', 'Rigid, one-size-fits-all', 'Expensive per-seat licensing', 'Vendor lock-in', 'Training-heavy'];
  const orchestratorItems = ['Live in days, not months', 'Clean, modern UI your team loves', 'Modular: use what you need', 'Transparent, fair pricing', 'API-first, export anything', 'Intuitive, minimal onboarding'];

  return (
    <section className="py-24 md:py-36 px-5 sm:px-6" style={{ backgroundColor: c.invertBg }}>
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-px bg-white opacity-20" />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: c.dark ? c.textTertiary : '#666' }}>Why Orchestrator</span>
          </div>
          <h2 className="text-[clamp(28px,5vw,48px)] font-normal leading-[1.1] tracking-[-0.03em] max-w-[600px] mb-16" style={{ color: c.invertText }}>
            Not another legacy ERP.{' '}
            <span style={{ color: c.dark ? '#999' : '#555' }}>A modern one.</span>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-0">
          <div className="pr-6 md:pr-12">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] mb-6" style={{ color: c.dark ? c.textTertiary : '#555' }}>Legacy ERPs</div>
            {legacyItems.map((item, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${c.invertBorder}` }}>
                  <span className="text-[10px]" style={{ color: c.dark ? c.textTertiary : '#555' }}>&times;</span>
                  <span className="text-[13px]" style={{ color: c.dark ? '#666' : '#666' }}>{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="pl-6 md:pl-12" style={{ borderLeft: `1px solid ${c.invertBorder}` }}>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] mb-6" style={{ color: c.invertText }}>Orchestrator</div>
            {orchestratorItems.map((item, i) => (
              <Reveal key={i} delay={i * 60 + 50}>
                <div className="py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${c.invertBorder}` }}>
                  <span className="text-[10px]" style={{ color: c.invertText }}>&#10003;</span>
                  <span className="text-[13px]" style={{ color: c.dark ? '#999' : '#ccc' }}>{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



function ProductCTA() {
  const navigate = useNavigate();
  const c = useColors();
  return (
    <section className="px-5 sm:px-6 py-24" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="rounded-3xl p-10 md:p-20 relative overflow-hidden text-center" style={{ backgroundColor: c.invertBg }}>
            <div className="relative z-10 max-w-[500px] mx-auto">
              <h2 className="text-[clamp(24px,5vw,40px)] font-normal leading-[1.1] tracking-[-0.03em]" style={{ color: c.invertText }}>
                Ready to orchestrate your operations?
              </h2>
              <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: c.dark ? '#999' : '#666' }}>Start free. No credit card. Scale when you're ready.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  className="text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
                  style={{ backgroundColor: c.dark ? c.accentBg : '#fff', color: c.dark ? c.accentText : '#0a0a0a' }}
                >
                  Start free trial
                </button>
                <button
                  onClick={() => navigate('/skeina/pricing')}
                  className="text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
                  style={{ border: `1px solid ${c.invertBorder}`, color: c.dark ? '#ccc' : '#ccc' }}
                >
                  View pricing
                </button>
              </div>
            </div>
            <div className="absolute inset-0" style={{ opacity: 0.03, backgroundImage: `linear-gradient(to right, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px), linear-gradient(to bottom, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SkeinaProductInner() {
  const c = useColors();
  return (
    <div className="min-h-screen font-sans" style={{ color: c.text, fontFeatureSettings: '"cv02","cv03","cv04","cv11"' }}>
      <GlobalStyles />
      <SkeinaNav />
      <ProductHero />
      <DashboardSection />
      <ModulesSection />
      <WhySection />
      <IntegrationsSection />
      <ProductCTA />
      <SkeinaFooter />
    </div>
  );
}

export function SkeinaProduct() {
  return (
    <ThemeProvider>
      <SkeinaProductInner />
    </ThemeProvider>
  );
}
