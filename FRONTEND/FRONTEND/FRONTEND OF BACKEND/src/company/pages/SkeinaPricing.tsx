import { useState } from 'react';
import { SkeinaNav, SkeinaFooter, SectionLabel, Reveal, GlobalStyles, ThemeProvider, useColors } from '../components/SkeinaShared';

const TIERS = [
  {
    name: 'Starter',
    price: { monthly: '4,999', annual: '3,999' },
    desc: 'For small businesses getting started with structured operations.',
    cta: 'Start free trial',
    highlighted: false,
    features: ['Up to 3 users', 'Inventory management', 'Basic accounting', 'Sales orders', '1 warehouse', 'Email support', 'Standard reports', '5GB storage'],
  },
  {
    name: 'Business',
    price: { monthly: '12,999', annual: '9,999' },
    desc: 'For growing companies that need the full ERP experience.',
    cta: 'Start free trial',
    highlighted: true,
    badge: 'Most Popular',
    features: ['Up to 25 users', 'All Starter features', 'Multi-warehouse', 'Dispatch management', 'Approval workflows', 'GST compliance', 'Custom reports', 'API access', 'Priority support', '50GB storage'],
  },
  {
    name: 'Enterprise',
    price: { monthly: 'Custom', annual: 'Custom' },
    desc: 'For large organizations with complex, multi-entity operations.',
    cta: 'Contact sales',
    highlighted: false,
    features: ['Unlimited users', 'All Business features', 'Multi-entity consolidation', 'Multi-currency', 'Custom integrations', 'Dedicated account manager', 'SSO & advanced security', 'SLA guarantee (99.99%)', 'On-premise option', 'Unlimited storage'],
  },
];

const FAQ = [
  { q: 'Can I try before I buy?', a: 'Yes. Every plan includes a 14-day free trial with full access. No credit card required.' },
  { q: 'What happens after my trial ends?', a: 'You can choose a plan or your account will be paused. Your data is preserved for 90 days.' },
  { q: 'Can I switch plans later?', a: 'Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.' },
  { q: 'Do you offer discounts for annual billing?', a: 'Yes. Annual billing saves you approximately 20% compared to monthly billing.' },
  { q: 'Is my data secure?', a: 'Yes. We use 256-bit AES encryption, SOC 2-ready infrastructure, and daily backups across multiple regions.' },
  { q: 'Can I export my data?', a: 'Always. Export everything via CSV, PDF, or our REST API. No lock-in, ever.' },
];

function PricingInner() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const c = useColors();

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: c.bg, color: c.text, fontFeatureSettings: '"cv02","cv03","cv04","cv11"' }}>
      <GlobalStyles />
      <SkeinaNav />

      {/* Hero */}
      <section className="relative pt-28 pb-6 md:pt-40 md:pb-10 px-5 sm:px-6">
        <div className="mx-auto max-w-[1400px] text-center">
          <div className="sk-stagger max-w-[600px] mx-auto">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] mb-6" style={{ color: c.textTertiary }}>Orchestrator ERP</p>
            <h1 className="text-[clamp(36px,7vw,64px)] font-normal leading-[1.05] tracking-[-0.04em]" style={{ color: c.text }}>
              Simple, transparent{' '}
              <span className="italic" style={{ color: c.textTertiary }}>pricing.</span>
            </h1>
            <p className="mt-5 text-[16px] leading-[1.7]" style={{ color: c.textSecondary }}>
              Start free. Scale as you grow. No hidden fees, no surprises.
            </p>
            <div className="mt-8 inline-flex items-center gap-0 rounded-full p-1" style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
              <button
                onClick={() => setAnnual(false)}
                className="text-[12px] font-medium tracking-[0.02em] px-4 py-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: !annual ? c.accentBg : 'transparent',
                  color: !annual ? c.accentText : c.textSecondary,
                }}
              >Monthly</button>
              <button
                onClick={() => setAnnual(true)}
                className="text-[12px] font-medium tracking-[0.02em] px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5"
                style={{
                  backgroundColor: annual ? c.accentBg : 'transparent',
                  color: annual ? c.accentText : c.textSecondary,
                }}
              >
                Annual
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: annual ? (c.dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)') : (c.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                    color: annual ? c.accentText : c.textSecondary,
                  }}
                >-20%</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10" style={{ opacity: c.dark ? 0.04 : 0.2, backgroundImage: `linear-gradient(to right, ${c.dark ? '#fff' : '#ccc'} 1px, transparent 1px), linear-gradient(to bottom, ${c.dark ? '#fff' : '#ccc'} 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      </section>

      {/* Tiers */}
      <section className="px-5 sm:px-6 py-16">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier, i) => {
              const isHL = tier.highlighted;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div
                    className="relative rounded-2xl p-7 md:p-8 flex flex-col"
                    style={{
                      backgroundColor: isHL ? c.invertBg : c.surface,
                      border: `1px solid ${isHL ? (c.dark ? 'rgba(245,245,240,0.1)' : '#333') : c.border}`,
                      color: isHL ? c.invertText : c.text,
                    }}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span
                          className="text-[9px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full"
                          style={{ backgroundColor: c.accentBg, color: c.accentText }}
                        >{tier.badge}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-[14px] font-semibold">{tier.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        {tier.price.monthly !== 'Custom' && <span className="text-[12px]" style={{ color: isHL ? (c.dark ? '#999' : '#888') : c.textTertiary }}>&#8377;</span>}
                        <span className="text-[36px] font-normal tracking-[-0.03em]">
                          {annual ? tier.price.annual : tier.price.monthly}
                        </span>
                        {tier.price.monthly !== 'Custom' && <span className="text-[12px]" style={{ color: isHL ? (c.dark ? '#999' : '#888') : c.textTertiary }}>/mo</span>}
                      </div>
                      <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: isHL ? (c.dark ? '#999' : '#888') : c.textSecondary }}>{tier.desc}</p>
                    </div>
                    <button
                      className="mt-6 w-full text-[12px] font-medium tracking-[0.02em] py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
                      style={{
                        backgroundColor: isHL ? (c.dark ? c.accentBg : '#fff') : c.accentBg,
                        color: isHL ? (c.dark ? c.accentText : '#0a0a0a') : c.accentText,
                      }}
                    >{tier.cta}</button>
                    <div className="mt-6 pt-6 space-y-3 flex-1" style={{ borderTop: `1px solid ${isHL ? c.invertBorder : c.borderSubtle}` }}>
                      {tier.features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5">
                          <span className="text-[10px]" style={{ color: isHL ? c.invertText : c.text }}>&#10003;</span>
                          <span className="text-[12px]" style={{ color: isHL ? (c.dark ? '#999' : '#ccc') : c.textSecondary }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise callout */}
      <section className="px-5 sm:px-6 pb-16">
        <div className="mx-auto max-w-[1100px]">
          <Reveal>
            <div
              className="rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
              style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="max-w-[480px]">
                <h3 className="text-[20px] font-medium tracking-[-0.02em]" style={{ color: c.text }}>Need a custom solution?</h3>
                <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: c.textSecondary }}>
                  For large teams with complex requirements, we offer custom deployments,
                  dedicated infrastructure, and hands-on implementation support.
                </p>
              </div>
              <button
                className="text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97] shrink-0"
                style={{ backgroundColor: c.accentBg, color: c.accentText }}
              >Talk to sales</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 sm:px-6 py-24" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="mx-auto max-w-[700px]">
          <Reveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-[clamp(24px,4vw,36px)] font-normal leading-[1.1] tracking-[-0.03em] mb-12" style={{ color: c.text }}>Common questions.</h2>
          </Reveal>
          <div className="space-y-0">
            {FAQ.map((item, i) => (
              <Reveal key={i} delay={i * 50}>
                <div style={{ borderBottom: `1px solid ${c.border}` }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-5 text-left group">
                    <span className="text-[15px] font-medium pr-4" style={{ color: c.text }}>{item.q}</span>
                    <span
                      className="text-[18px] transition-all duration-200 shrink-0"
                      style={{
                        color: c.textMuted,
                        transform: openFaq === i ? 'rotate(45deg)' : 'none',
                      }}
                    >+</span>
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? '200px' : '0px', opacity: openFaq === i ? 1 : 0 }}>
                    <p className="pb-5 text-[13px] leading-[1.7] max-w-[560px]" style={{ color: c.textSecondary }}>{item.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 pb-24">
        <div className="mx-auto max-w-[1100px]">
          <Reveal>
            <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden text-center" style={{ backgroundColor: c.invertBg }}>
              <div className="relative z-10 max-w-[450px] mx-auto">
                <h2 className="text-[clamp(24px,4vw,36px)] font-normal leading-[1.1] tracking-[-0.03em]" style={{ color: c.invertText }}>Start your free trial today.</h2>
                <p className="mt-3 text-[14px]" style={{ color: c.dark ? '#999' : '#666' }}>14 days free. No credit card required.</p>
                <button
                  className="mt-8 text-[12px] font-medium tracking-[0.02em] px-6 py-3 rounded-full transition-all duration-200 active:scale-[0.97]"
                  style={{ backgroundColor: c.dark ? c.accentBg : '#fff', color: c.dark ? c.accentText : '#0a0a0a' }}
                >Get started</button>
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

export function SkeinaPricing() {
  return (
    <ThemeProvider>
      <PricingInner />
    </ThemeProvider>
  );
}
