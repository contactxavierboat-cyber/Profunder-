import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s` }}>
      {children}
    </div>
  );
}

function AnimCounter({ end, suffix = "", prefix = "", dur = 2200 }: { end: number; suffix?: string; prefix?: string; dur?: number }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let n = 0;
    const step = end / (dur / 16);
    const t = setInterval(() => { n += step; if (n >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(n)); }, 16);
    return () => clearInterval(t);
  }, [visible, end, dur]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => { setTimeout(() => setHeroVisible(true), 150); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
    if (!input?.value) return;
    setIsLoading(true);
    try { await login(input.value); } catch { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-12 h-[72px]">
          <span className="text-[18px] font-bold tracking-[-0.02em]">MentXr<span className="text-[10px] align-super text-white/40">®</span></span>
          <button onClick={() => document.getElementById('cta-email')?.focus()} className="h-10 px-6 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors">
            Get Free Access
          </button>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[100vh] flex items-center pt-[72px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(46,125,50,0.08),transparent)]" />
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-12 w-full py-20">
          <div className="max-w-[900px] mx-auto text-center">
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.1s' }}>
              <p className="text-[13px] sm:text-[14px] text-white/40 tracking-[0.15em] uppercase mb-8 font-medium">AI-Powered Capital Readiness</p>
            </div>
            <h1
              className="text-[40px] sm:text-[64px] md:text-[80px] lg:text-[100px] font-bold leading-[0.95] tracking-[-0.04em] mb-8"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(30px)', transition: 'all 1s ease 0.2s' }}
              data-testid="text-hero-headline"
            >
              Know Where<br />You Stand<br /><span className="italic font-light text-white/60">Before You Apply</span>
            </h1>
            <p
              className="text-[16px] sm:text-[18px] text-white/50 leading-[1.7] max-w-[560px] mx-auto mb-12"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.4s' }}
            >
              MentXr® runs your financial profile through real underwriting logic — the same criteria banks use to approve or deny you.
            </p>
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.5s' }}>
              <form onSubmit={handleLogin} className="max-w-[460px] mx-auto mb-6">
                <div className="flex items-center bg-white/[0.07] border border-white/10 rounded-full h-[56px] pl-6 pr-1.5 hover:border-white/20 transition-colors">
                  <input
                    id="cta-email"
                    data-testid="input-email"
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    data-testid="button-join"
                    type="submit"
                    disabled={isLoading}
                    className="h-[44px] px-7 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all shrink-0"
                  >
                    {isLoading ? "..." : "Get Started"}
                  </button>
                </div>
              </form>
              <p className="text-[13px] text-white/25 tracking-wide">Free forever · No credit card · No credit pull</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ STATS BAR ══════ */}
      <section className="relative py-20 sm:py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { end: 12500, suffix: "+", label: "Founders Analyzed" },
              { end: 47, prefix: "$", suffix: "M+", label: "Capital Deployed" },
              { end: 89, suffix: "%", label: "Approval Rate" },
              { end: 300, suffix: "+", label: "Happy Clients" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} className="text-center">
                <p className="text-[40px] sm:text-[56px] font-bold tracking-[-0.03em] text-white mb-2">
                  <AnimCounter end={s.end} prefix={s.prefix || ""} suffix={s.suffix} />
                </p>
                <p className="text-[13px] text-white/40 tracking-wide">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ 3-STEP BLUEPRINT ══════ */}
      <section className="relative py-24 sm:py-32 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-20">
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-6">What You Get</p>
            <h2 className="text-[32px] sm:text-[48px] md:text-[60px] font-bold leading-[1.0] tracking-[-0.03em]">
              <span className="italic font-light text-white/60">Our 3-Step Blueprint To</span><br />
              Capital Readiness
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                num: "#1",
                title: "Upload & Analyze",
                desc: "Drop in your credit report and bank statement. Our AI extracts 40+ data points automatically — no manual entry. We evaluate your Capital Strength, Credit Quality, Management, Cash Flow, Liquidity, and Risk Signals.",
              },
              {
                num: "#2",
                title: "Score & Simulate",
                desc: "Get your Capital Readiness Score (0–100), exposure ceiling using 2.5x logic, and tier eligibility (Prime, Mid-Tier, or Alternative). Our denial simulation flags every trigger that would cause a real lender to decline your file.",
              },
              {
                num: "#3",
                title: "Repair & Apply",
                desc: "Receive auto-generated dispute letters for all 3 bureaus, a step-by-step repair timeline, AI mentor guidance, and a personalized action plan. Fix what needs fixing, then apply with confidence.",
              },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 0.15} className="group">
                <div className="relative h-full p-8 sm:p-10 rounded-[20px] bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-500">
                  <span className="text-[48px] sm:text-[56px] font-bold text-white/[0.06] absolute top-6 right-8 leading-none">{item.num}</span>
                  <div className="relative">
                    <p className="text-[12px] text-green-400/80 tracking-[0.15em] uppercase mb-4 font-medium">{item.num}</p>
                    <h3 className="text-[22px] sm:text-[26px] font-bold text-white mb-5 tracking-[-0.02em]">{item.title}</h3>
                    <p className="text-[15px] text-white/45 leading-[1.8]">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ ABOUT / FOUNDER STORY ══════ */}
      <section className="relative py-24 sm:py-32 bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="relative">
                <div className="w-full aspect-[4/5] rounded-[24px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                  <div className="text-center px-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-white/10 mx-auto mb-6 flex items-center justify-center">
                      <span className="text-[36px] font-bold text-white/80">M</span>
                    </div>
                    <p className="text-[14px] text-white/30 leading-[1.8]">
                      Built by entrepreneurs, for entrepreneurs. MentXr combines real underwriting intelligence with AI mentorship to level the playing field.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-[12px] text-green-400/80 tracking-[0.15em] uppercase mb-6 font-medium">The Mission</p>
              <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.03em] mb-8">
                73% of funding applications get denied.<br />
                <span className="italic font-light text-white/50">We built MentXr to change that.</span>
              </h2>
              <p className="text-[16px] text-white/40 leading-[1.9] mb-8">
                Most founders walk into a lender's office blind — no idea how they'll be evaluated, what triggers a denial, or what products they actually qualify for. Every rejection adds an inquiry, making the next application even harder.
              </p>
              <p className="text-[16px] text-white/40 leading-[1.9] mb-10">
                MentXr gives you the same underwriting intelligence that banks use internally. Upload your documents, get your score, fix the issues, and apply once — with confidence. No guessing. No wasted applications. No surprises.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { val: "$80K", label: "Avg Funding" },
                  { val: "6.2x", label: "Score Improvement" },
                  { val: "67", label: "Days to Funded" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] text-white">{s.val}</p>
                    <p className="text-[11px] text-white/30 tracking-wide mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="relative py-24 sm:py-32 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-20">
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-6">Platform Features</p>
            <h2 className="text-[32px] sm:text-[48px] md:text-[60px] font-bold leading-[1.0] tracking-[-0.03em]">
              Everything You Need To<br />
              <span className="italic font-light text-white/60">Get Funded</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Capital Readiness Score", desc: "0–100 composite based on 6 weighted underwriting components that real lenders use", icon: "◎" },
              { title: "2.5x Exposure Ceiling", desc: "Maximum fundable amount calculated with dynamic multiplier adjustments", icon: "⬡" },
              { title: "Tier Eligibility Report", desc: "Know if you qualify for Prime, Mid-Tier, or Alternative capital products", icon: "◈" },
              { title: "Denial Simulation", desc: "Pre-screen every trigger that would cause a real lender to decline your file", icon: "⊘" },
              { title: "AI Credit Repair", desc: "Auto-generated dispute letters for all 3 bureaus with repair timeline", icon: "◇" },
              { title: "7 AI Mentors", desc: "Specialized bots for sales, investing, marketing, leadership, and more", icon: "△" },
              { title: "Operating Mode Engine", desc: "Pre-Funding or Repair mode with tailored action sequences", icon: "▣" },
              { title: "Risk Signal Detection", desc: "Identifies liens, judgments, utilization spikes, and velocity flags", icon: "◐" },
              { title: "Document AI Analysis", desc: "Upload credit reports & bank statements — AI extracts 40+ data points", icon: "⬢" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="h-full p-7 rounded-[16px] bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-500 group">
                  <span className="text-[24px] text-white/20 group-hover:text-green-400/60 transition-colors duration-500 block mb-5">{item.icon}</span>
                  <h3 className="text-[17px] font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-[14px] text-white/35 leading-[1.7]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ SCORING BREAKDOWN ══════ */}
      <section className="relative py-24 sm:py-32 bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-20">
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-6">Scoring Engine</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.0] tracking-[-0.03em]">
              Six Components.<br /><span className="italic font-light text-white/60">One Score. Complete Clarity.</span>
            </h2>
          </Reveal>

          <div className="max-w-[800px] mx-auto space-y-0">
            {[
              { name: "Capital Strength", pts: "0–20", desc: "Revenue, assets, collateral position, and business capitalization", pct: 85 },
              { name: "Credit Quality", pts: "0–20", desc: "FICO, payment history, derogatory marks, utilization ratios", pct: 90 },
              { name: "Management & Structure", pts: "0–15", desc: "Entity type, years in business, ownership structure, EIN status", pct: 75 },
              { name: "Earnings & Cash Flow", pts: "0–15", desc: "Monthly revenue trends, DSCR, cash reserves, deposit consistency", pct: 70 },
              { name: "Liquidity & Leverage", pts: "0–15", desc: "Debt-to-income, current ratio, available credit, obligations", pct: 65 },
              { name: "Risk Signals", pts: "0–15", desc: "Liens, judgments, NSFs, velocity flags, inquiries, collections", pct: 80 },
            ].map((c, i) => (
              <Reveal key={c.name} delay={i * 0.08}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 py-7 border-b border-white/[0.06]">
                  <div className="sm:w-[220px] shrink-0">
                    <h3 className="text-[16px] font-semibold text-white">{c.name}</h3>
                  </div>
                  <span className="text-[14px] font-mono text-white/50 sm:w-[70px] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.pts}</span>
                  <div className="flex-1">
                    <p className="text-[13px] text-white/35 leading-[1.6]">{c.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-12 text-center">
            <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[18px] font-bold text-white">Total: 0–100 pts</span>
              <span className="text-[13px] text-white/40">→ Qualification Range: $25K – $5M+</span>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ TIERS ══════ */}
      <section className="relative py-24 sm:py-32 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-20">
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-6">Tier System</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.0] tracking-[-0.03em]">
              Three Tiers.<br /><span className="italic font-light text-white/60">Know Which One You Belong To.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {[
              { tier: "Tier 1", name: "Prime Capital", score: "75–100", products: "SBA 7(a) & 504, Conventional LOC, Term Loans, Equipment Finance", highlight: true },
              { tier: "Tier 2", name: "Mid-Tier", score: "50–74", products: "Revenue-Based Lending, Invoice Factoring, Merchant Cash Advance, Bridge Loans", highlight: false },
              { tier: "Tier 3", name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builder Programs, Community Development Loans", highlight: false },
            ].map((t, i) => (
              <Reveal key={t.tier} delay={i * 0.12}>
                <div className={`h-full p-8 sm:p-10 rounded-[20px] border transition-all duration-500 ${t.highlight ? 'bg-white/[0.05] border-green-500/20 hover:border-green-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'}`}>
                  <p className="text-[11px] text-white/30 tracking-[0.15em] uppercase font-mono mb-2">{t.tier}</p>
                  <h3 className="text-[24px] sm:text-[28px] font-bold text-white mb-2 tracking-[-0.02em]">{t.name}</h3>
                  <p className="text-[16px] font-mono text-white/50 mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Score: {t.score}</p>
                  <p className="text-[14px] text-white/35 leading-[1.8]">{t.products}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ BEFORE / AFTER ══════ */}
      <section className="relative py-24 sm:py-32 bg-[#0A0A0A]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.0] tracking-[-0.03em]">
              Stop Guessing.<br /><span className="italic font-light text-white/60">Start Knowing.</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Reveal>
              <div className="h-full p-8 rounded-[20px] bg-white/[0.02] border border-red-500/10">
                <p className="text-[12px] text-red-400/70 tracking-[0.15em] uppercase font-semibold mb-6">Without MentXr</p>
                <ul className="space-y-4">
                  {["Guess at eligibility", "Apply to multiple lenders", "Accumulate hard inquiries", "Get denied without explanation", "Repeat the cycle"].map(t => (
                    <li key={t} className="flex items-start gap-3 text-[15px] text-white/40 leading-[1.5]">
                      <span className="text-red-400/60 mt-0.5 shrink-0 text-[12px]">✕</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full p-8 rounded-[20px] bg-white/[0.02] border border-green-500/15">
                <p className="text-[12px] text-green-400/70 tracking-[0.15em] uppercase font-semibold mb-6">With MentXr</p>
                <ul className="space-y-4">
                  {["Know your exact tier & ceiling", "Fix issues before applying", "Apply once, with confidence", "Get approved on first try", "Build on momentum"].map(t => (
                    <li key={t} className="flex items-start gap-3 text-[15px] text-white/40 leading-[1.5]">
                      <span className="text-green-400/70 mt-0.5 shrink-0 text-[12px]">→</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ CASE STUDY ══════ */}
      <section className="relative py-24 sm:py-32 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-20">
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-6">Case Study</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.0] tracking-[-0.03em]">
              From Score 38 To Funded<br /><span className="italic font-light text-white/60">In 67 Days.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-[1100px] mx-auto">
            {[
              { day: "Day 1", title: "Analysis", score: "38", detail: "4 denial triggers flagged. 78% utilization. 2 collections. Tier 3." },
              { day: "Day 3", title: "Repair Plan", score: "—", detail: "6 dispute letters generated. Utilization plan. EIN registration." },
              { day: "Day 30", title: "Checkpoint", score: "52", detail: "1 collection removed. Utilization 45%. Ceiling: $85K. Tier 2." },
              { day: "Day 67", title: "Funded", score: "71", detail: "$175K LOC approved. 0 denial triggers. Utilization: 22%." },
            ].map((step, i) => (
              <Reveal key={step.day} delay={i * 0.1}>
                <div className="h-full p-7 rounded-[16px] bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500">
                  <p className="text-[11px] font-mono text-white/30 mb-4">{step.day}</p>
                  <p className="text-[36px] font-bold text-white/90 mb-3 tracking-[-0.02em]">{step.score}</p>
                  <h3 className="text-[16px] font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-[13px] text-white/35 leading-[1.7]">{step.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ FAQ ══════ */}
      <section className="relative py-24 sm:py-32 bg-[#0A0A0A]">
        <div className="max-w-[700px] mx-auto px-6 sm:px-12">
          <Reveal className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.0] tracking-[-0.03em]">
              Questions?<br /><span className="italic font-light text-white/60">Answers.</span>
            </h2>
          </Reveal>
          <div className="space-y-0">
            {[
              { q: "Do I need perfect credit?", a: "No. MentXr works for all credit profiles — thin files to complex portfolios. Our engine evaluates 6 components and places you in the right tier with a clear action plan." },
              { q: "How is this different from credit monitoring?", a: "Credit monitoring shows a score. MentXr tells you what that score means to a lender, what you qualify for, what will get you denied, and how to fix it." },
              { q: "What documents do I need?", a: "Start with your credit report (any bureau) and most recent bank statement. AI extracts 40+ data points automatically." },
              { q: "How accurate is the denial simulation?", a: "Our engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials." },
              { q: "Is my data secure?", a: "All data is encrypted in transit and at rest. We never share your information with lenders, brokers, or third parties." },
              { q: "What's included free?", a: "Full Capital Readiness Score, 6-component breakdown, tier eligibility, denial simulation, AI mentors, and credit repair recommendations — 30 analyses per month." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="border-b border-white/[0.06]">
                  <button
                    data-testid={`button-faq-${i}`}
                    className="w-full flex items-center justify-between py-6 text-left group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-[16px] font-semibold text-white/80 group-hover:text-white transition-colors pr-4">{item.q}</span>
                    <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:border-white/20" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>
                      <span className="text-[14px] text-white/40">+</span>
                    </span>
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                    <p className="pb-6 text-[14px] text-white/35 leading-[1.8]">{item.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="relative py-32 sm:py-40 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(46,125,50,0.08),transparent)]" />
        <div className="relative max-w-[700px] mx-auto text-center px-6 sm:px-12">
          <Reveal>
            <p className="text-[13px] text-white/40 tracking-[0.15em] uppercase mb-8">Get Started Today</p>
            <h2 className="text-[36px] sm:text-[56px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.04em] mb-6" data-testid="text-final-cta">
              Stop Guessing.<br /><span className="italic font-light text-white/60">Start Knowing.</span>
            </h2>
            <p className="text-[16px] sm:text-[18px] text-white/40 leading-[1.7] mb-12 max-w-[480px] mx-auto">
              Get your Capital Readiness Score, tier eligibility, and denial simulation — free. No credit card. No credit pull. No commitment.
            </p>
            <form onSubmit={handleLogin} className="max-w-[460px] mx-auto mb-6">
              <div className="flex items-center bg-white/[0.07] border border-white/10 rounded-full h-[56px] pl-6 pr-1.5 hover:border-white/20 transition-colors">
                <input
                  data-testid="input-email-bottom"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none"
                  defaultValue=""
                  required
                  disabled={isLoading}
                />
                <button
                  data-testid="button-join-bottom"
                  type="submit"
                  disabled={isLoading}
                  className="h-[44px] px-7 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all shrink-0"
                >
                  {isLoading ? "..." : "Get Started"}
                </button>
              </div>
            </form>
            <p className="text-[13px] text-white/20">Join 12,500+ founders already using MentXr®</p>
          </Reveal>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative bg-black border-t border-white/[0.06] px-6 sm:px-12 py-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
            <span className="text-[16px] font-bold text-white/80">MentXr<span className="text-[10px] align-super text-white/30">®</span></span>
            <div className="flex flex-wrap gap-6">
              {["Privacy", "Terms", "Contact", "Support"].map(link => (
                <span key={link} className="text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer">{link}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
            <p className="text-[13px] text-white/20">&copy; 2026 MentXr® by CMD Supply. All rights reserved.</p>
            <p className="text-[11px] text-white/15 max-w-[400px] leading-[1.6]">
              MentXr is not a lender, broker, or financial advisor. All analyses are for informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
