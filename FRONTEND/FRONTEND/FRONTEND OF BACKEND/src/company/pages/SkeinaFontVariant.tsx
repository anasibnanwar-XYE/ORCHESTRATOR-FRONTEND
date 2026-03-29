import { SkeinaNav, SkeinaFooter, SectionLabel, Reveal, GlobalStyles, ThemeProvider, useColors } from '../components/SkeinaShared';

function FontVariantInner() {
  const c = useColors();
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: c.bg, color: c.text }}>
      <style>{`
        @font-face { font-family: 'OpenAI Sans'; font-weight: 400; font-style: normal; src: url('/fonts/OpenAISans-Regular.woff2') format('woff2'); font-display: swap; }
        @font-face { font-family: 'OpenAI Sans'; font-weight: 500; font-style: normal; src: url('/fonts/OpenAISans-Medium.woff2') format('woff2'); font-display: swap; }
        @font-face { font-family: 'OpenAI Sans'; font-weight: 600; font-style: normal; src: url('/fonts/OpenAISans-Semibold.woff2') format('woff2'); font-display: swap; }
        @font-face { font-family: 'OpenAI Sans'; font-weight: 700; font-style: normal; src: url('/fonts/OpenAISans-Bold.woff2') format('woff2'); font-display: swap; }
        .oai-font { font-family: 'OpenAI Sans', system-ui, sans-serif; }
      `}</style>
      <GlobalStyles />
      <SkeinaNav />

      <section className="pt-28 pb-16 md:pt-44 md:pb-24 px-5 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionLabel>Font Variant</SectionLabel>
            <h1 className="oai-font text-[clamp(40px,8vw,82px)] font-normal leading-[1.02] tracking-[-0.045em]" style={{ color: c.text }}>
              OpenAI Sans
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] max-w-[540px]" style={{ color: c.textSecondary }}>
              This page demonstrates the Skeina website using OpenAI Sans as an alternative typeface.
              Compare with the Inter-based default to see which fits the brand better.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Type specimen */}
      <section className="px-5 sm:px-6 pb-24" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="mx-auto max-w-[1400px] py-24">
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* OpenAI Sans column */}
              <div className="oai-font">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-5 h-px" style={{ backgroundColor: c.text, opacity: 0.15 }} />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: c.textTertiary }}>OpenAI Sans</span>
                </div>
                <h2 className="text-[48px] font-normal leading-[1.05] tracking-[-0.04em] mb-6" style={{ color: c.text }}>
                  We build software that moves business.
                </h2>
                <p className="text-[16px] leading-[1.75] mb-8" style={{ color: c.textSecondary }}>
                  Skeina is a design-led software studio. We craft products, platforms,
                  and digital experiences for companies that refuse to settle for ordinary.
                </p>
                <div className="space-y-4">
                  {[400, 500, 600, 700].map((w) => (
                    <div key={w}>
                      <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: c.textMuted }}>{w}</span>
                      <p className="text-[20px] tracking-[-0.02em]" style={{ fontWeight: w, color: c.text }}>
                        The quick brown fox jumps over the lazy dog.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inter column */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-5 h-px" style={{ backgroundColor: c.text, opacity: 0.15 }} />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: c.textTertiary }}>Inter (Current)</span>
                </div>
                <h2 className="text-[48px] font-normal leading-[1.05] tracking-[-0.04em] mb-6" style={{ color: c.text, fontFeatureSettings: '"cv02","cv03","cv04","cv11"' }}>
                  We build software that moves business.
                </h2>
                <p className="text-[16px] leading-[1.75] mb-8" style={{ color: c.textSecondary }}>
                  Skeina is a design-led software studio. We craft products, platforms,
                  and digital experiences for companies that refuse to settle for ordinary.
                </p>
                <div className="space-y-4">
                  {[400, 500, 600, 700].map((w) => (
                    <div key={w}>
                      <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: c.textMuted }}>{w}</span>
                      <p className="text-[20px] tracking-[-0.02em]" style={{ fontWeight: w, color: c.text }}>
                        The quick brown fox jumps over the lazy dog.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Sample cards in OpenAI Sans */}
          <Reveal>
            <div className="mt-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-5 h-px" style={{ backgroundColor: c.text, opacity: 0.15 }} />
                <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: c.textTertiary }}>Sample UI in OpenAI Sans</span>
              </div>
              <div className="oai-font grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { n: '01', title: 'Product Design', desc: 'End-to-end UI/UX design systems, interfaces, and prototypes.' },
                  { n: '02', title: 'Web Development', desc: 'High-performance web applications and marketing sites.' },
                  { n: '03', title: 'Enterprise Systems', desc: 'Custom ERP, CRM, and operational platforms tailored to you.' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6 md:p-8"
                    style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>{s.n}</span>
                    <h3 className="text-[17px] font-medium tracking-[-0.01em] mt-3" style={{ color: c.text }}>{s.title}</h3>
                    <p className="mt-2 text-[13px] leading-[1.7]" style={{ color: c.textSecondary }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Sample hero in OpenAI Sans */}
          <Reveal>
            <div className="mt-24 oai-font rounded-3xl p-10 md:p-20 relative overflow-hidden" style={{ backgroundColor: c.invertBg }}>
              <div className="relative z-10 max-w-[600px]">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] mb-6" style={{ color: c.dark ? c.textTertiary : '#555' }}>OpenAI Sans Hero</p>
                <h2 className="text-[clamp(32px,6vw,56px)] font-normal leading-[1.05] tracking-[-0.04em]" style={{ color: c.invertText }}>
                  Orchestrator ERP
                </h2>
                <p className="mt-5 text-[16px] leading-[1.75] max-w-[440px]" style={{ color: c.dark ? '#666' : '#888' }}>
                  The enterprise resource planning platform that unifies inventory, accounting,
                  sales, and dispatch into one calm, precise system.
                </p>
                <button
                  className="mt-8 text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full"
                  style={{ backgroundColor: c.dark ? c.accentBg : '#fff', color: c.dark ? c.accentText : '#0a0a0a' }}
                >
                  Start free trial
                </button>
              </div>
              <div className="absolute inset-0" style={{ opacity: 0.03, backgroundImage: `linear-gradient(to right, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px), linear-gradient(to bottom, ${c.dark ? '#000' : '#fff'} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
            </div>
          </Reveal>
        </div>
      </section>

      <SkeinaFooter />
    </div>
  );
}

export function SkeinaFontVariant() {
  return (
    <ThemeProvider>
      <FontVariantInner />
    </ThemeProvider>
  );
}
