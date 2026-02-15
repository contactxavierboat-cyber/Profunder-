import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/store";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)', transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>
      {children}
    </div>
  );
}

function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function FloatingOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;
    const orbs = [
      { bx: 0.7, by: 0.2, r: 400, c: [46, 125, 50, 0.12], sx: 0.0004, sy: 0.0003, px: 0, py: 1 },
      { bx: 0.2, by: 0.5, r: 350, c: [8, 145, 178, 0.10], sx: 0.0003, sy: 0.0005, px: 2, py: 0.5 },
      { bx: 0.8, by: 0.7, r: 300, c: [168, 85, 247, 0.08], sx: 0.0005, sy: 0.0003, px: 1, py: 3 },
    ];
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = canvas.parentElement!.scrollHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      const w = window.innerWidth;
      const h = canvas.parentElement!.scrollHeight;
      ctx.clearRect(0, 0, w, h);
      t++;
      orbs.forEach(o => {
        const x = (o.bx + Math.sin(t * o.sx + o.px) * 0.1) * w;
        const y = (o.by + Math.sin(t * o.sy + o.py) * 0.08) * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, o.r);
        g.addColorStop(0, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${o.c[3]})`);
        g.addColorStop(0.5, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${o.c[3] * 0.4})`);
        g.addColorStop(1, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      animId = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

const faqItems = [
  { q: "Do I need perfect credit to use MentXr?", a: "No. MentXr works for all credit profiles — from thin files to complex portfolios. Our engine evaluates 6 capital components and places you in the right tier with a clear action plan." },
  { q: "How is this different from a credit monitoring app?", a: "Credit monitoring shows you a score. MentXr tells you what that score means to a lender, what you qualify for, what will get you denied, and how to fix it." },
  { q: "What documents do I need?", a: "Start with your credit report and bank statement. Our AI extracts 40+ data points automatically — no manual entry." },
  { q: "How accurate is the denial simulation?", a: "Our denial engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials." },
  { q: "Is my data secure?", a: "All data is encrypted. We never share your information with lenders, brokers, or third parties." },
  { q: "What's included free?", a: "Full Capital Readiness Score, 6-component breakdown, tier eligibility, denial simulation, AI mentors, credit repair — 30 analyses per month." },
];

const proofMessages = [
  "Jay just sought out tax advice from Marcus Allen.",
  "$50K just funded",
  "Sofia connected with branding expert Elena Cruz.",
  "$100K just funded",
  "David started a strategy session with Ryan Cole.",
  "$75K just funded",
  "$200K just funded",
  "$35K just funded",
  "$150K just funded",
  "$250K just funded",
  "$300K just funded",
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login } = useAuth();
  const [proofIndex, setProofIndex] = useState(0);
  const [proofVisible, setProofVisible] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  useEffect(() => {
    const cycle = setInterval(() => {
      setProofVisible(false);
      setTimeout(() => {
        setProofIndex((i) => (i + 1) % proofMessages.length);
        setProofVisible(true);
      }, 600);
    }, 3500);
    return () => clearInterval(cycle);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
    if (!input?.value) return;
    setIsLoading(true);
    try { await login(input.value); } catch { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen bg-white text-[#1A1A1A] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      <div
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-[#E5E7EB] shadow-lg"
        style={{ transition: "opacity 0.5s ease, transform 0.5s ease", opacity: proofVisible ? 1 : 0, transform: proofVisible ? "translateY(0)" : "translateY(8px)" }}
      >
        <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse shrink-0"></span>
        <span className="text-[12px] text-[#333] font-medium whitespace-nowrap">{proofMessages[proofIndex]}</span>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB]/60">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 sm:px-10 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#0891B2] flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">M</span>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.02em] text-[#1A1A1A]">MentXr<span className="text-[10px] align-super text-[#999]">&reg;</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#666] hidden sm:block">Free forever</span>
            <button onClick={() => document.getElementById('hero-email')?.focus()} className="h-9 px-5 rounded-full bg-[#1A1A1A] text-white text-[13px] font-medium hover:bg-[#333] transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(46,125,50,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(8,145,178,0.06),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(168,85,247,0.05),transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 w-full">
          <div className="max-w-[820px]">
            <div style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s' }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                <span className="text-[12px] text-[#666] font-medium">AI-Powered Capital Intelligence</span>
              </div>
            </div>

            <h1
              style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s' }}
              className="text-[42px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-bold leading-[0.92] tracking-[-0.04em] mb-8"
              data-testid="text-hero-headline"
            >
              <span className="text-[#1A1A1A]">Know your</span><br />
              <span className="bg-gradient-to-r from-[#2E7D32] via-[#0891B2] to-[#7C3AED] bg-clip-text text-transparent">funding power</span><br />
              <span className="text-[#1A1A1A]">before you apply.</span>
            </h1>

            <p
              className="text-[17px] sm:text-[19px] text-[#666] leading-[1.7] max-w-[540px] mb-10"
              style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s' }}
            >
              MentXr&reg; analyzes your financial profile using real underwriting logic. Get your Capital Readiness Score, exposure ceiling, and denial risk — all free.
            </p>

            <div style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s' }}>
              <form onSubmit={handleLogin} className="w-full max-w-[480px] mb-6">
                <div className="flex items-center bg-white border border-[#E5E7EB] rounded-2xl h-[56px] pl-5 pr-1.5 shadow-lg shadow-black/5">
                  <input
                    id="hero-email"
                    data-testid="input-email"
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent text-[15px] text-[#1A1A1A] placeholder:text-[#999] outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    data-testid="button-join"
                    type="submit"
                    disabled={isLoading}
                    className="h-[44px] px-7 rounded-xl bg-[#1A1A1A] text-white text-[14px] font-semibold hover:bg-[#333] transition-all duration-200 shrink-0 hover:shadow-lg"
                  >
                    {isLoading ? "..." : "Get Free Access"}
                  </button>
                </div>
              </form>
              <div className="flex items-center gap-5 text-[13px] text-[#999]">
                <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Free forever</span>
                <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>No credit card</span>
                <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>No credit pull</span>
              </div>
            </div>
          </div>

          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block"
            style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateX(0)' : 'translateX(40px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.6s' }}
          >
            <div className="relative w-[320px]">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E5E7EB] shadow-2xl shadow-black/8 p-8">
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#F1F3F5" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="82" className="score-ring-glow" style={{ '--ring-color': 'rgba(46,125,50,0.3)' } as any} />
                      <defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E7D32"/><stop offset="100%" stopColor="#0891B2"/></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[36px] font-bold tracking-[-0.02em] text-[#1A1A1A]">75</span>
                      <span className="text-[10px] text-[#999] uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">Capital Readiness</p>
                  <p className="text-[11px] text-[#2E7D32] font-medium mt-1">Tier 1 — Prime Eligible</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Exposure Ceiling", value: "$210K" },
                    { label: "Credit Quality", value: "17/20" },
                    { label: "Risk Signals", value: "Clear" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-t border-[#F1F3F5]">
                      <span className="text-[12px] text-[#666]">{item.label}</span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E5E7EB] shadow-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1A1A1A]">0 Denial Triggers</p>
                  <p className="text-[10px] text-[#999]">Ready to apply</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LOGOS / TRUST BAR ═══════════ */}
      <RevealSection className="relative z-10 py-16 border-t border-[#F1F3F5]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <p className="text-center text-[11px] text-[#999] uppercase tracking-[0.2em] mb-8">Trusted by founders nationwide</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { val: "12,500+", label: "Founders Analyzed", icon: "👥" },
              { val: "$47M+", label: "Capital Deployed", icon: "💰" },
              { val: "89%", label: "Approval Rate", icon: "✓" },
              { val: "6.2x", label: "Score Improvement", icon: "📈" },
            ].map((s, i) => (
              <RevealSection key={s.label} delay={i * 0.1} className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#E5E7EB]/60 shadow-sm">
                <p className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] text-[#1A1A1A] mb-1">{s.val}</p>
                <p className="text-[12px] text-[#999] font-medium">{s.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════ PROBLEM ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="max-w-[700px] mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">The Problem</p>
            <h2 className="text-[32px] sm:text-[48px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              73% of funding<br />applications get <span className="text-[#DC2626]">denied.</span>
            </h2>
            <p className="text-[17px] text-[#666] leading-[1.7]">Most founders never find out why until it's too late. Every denial adds an inquiry. Every inquiry makes the next one harder.</p>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", icon: "🎯", text: "You apply with no idea how lenders actually evaluate you" },
              { num: "02", icon: "📊", text: "Credit scores alone don't reveal what products you qualify for" },
              { num: "03", icon: "⚠️", text: "Hidden risk signals silently kill your application" },
              { num: "04", icon: "🔄", text: "Every denial makes the next application harder" },
            ].map((item, i) => (
              <RevealSection key={item.num} delay={i * 0.1} className="group p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <span className="text-[28px] mb-4 block">{item.icon}</span>
                <span className="text-[11px] font-mono text-[#999] mb-3 block">{item.num}</span>
                <p className="text-[14px] text-[#333] leading-[1.6]">{item.text}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOLUTION ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#FAFBFC]">
        <FloatingOrbs />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="max-w-[700px] mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">The Solution</p>
            <h2 className="text-[32px] sm:text-[48px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A] mb-6">
              AI-powered underwriting intelligence.
            </h2>
            <p className="text-[17px] text-[#666] leading-[1.7]">MentXr analyzes your profile using the same 6-component framework real lenders use. Know exactly what to fix — before you apply.</p>
          </RevealSection>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Capital Score", val: "0–100", desc: "6-component composite" },
              { label: "Exposure Ceiling", val: "2.5x", desc: "Dynamic multiplier" },
              { label: "Tier Eligibility", val: "3 Tiers", desc: "Prime / Mid / Alt" },
              { label: "Denial Sim", val: "Pre-Screen", desc: "Real triggers" },
              { label: "AI Mentors", val: "7 Bots", desc: "Specialized guidance" },
              { label: "Credit Repair", val: "Auto", desc: "Dispute letters" },
            ].map((item, i) => (
              <RevealSection key={item.label} delay={i * 0.08} className="group p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E5E7EB] shadow-sm hover:shadow-lg transition-all duration-300">
                <p className="text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] text-[#1A1A1A] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</p>
                <p className="text-[14px] text-[#333] font-medium mb-1">{item.label}</p>
                <p className="text-[12px] text-[#999]">{item.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-20">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">How It Works</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Four steps to clarity.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {[
              { step: "01", title: "Upload", desc: "Drop in your credit report and bank statement. AI extracts 40+ data points.", color: "from-[#2E7D32] to-[#4CAF50]" },
              { step: "02", title: "Analyze", desc: "6-component scoring: Capital, Credit, Management, Cash Flow, Liquidity, Risk.", color: "from-[#0891B2] to-[#22D3EE]" },
              { step: "03", title: "Simulate", desc: "See your tier, ceiling, and every trigger that would cause a denial.", color: "from-[#7C3AED] to-[#A78BFA]" },
              { step: "04", title: "Fix & Apply", desc: "Auto-generated dispute letters, repair timeline, and application strategy.", color: "from-[#EA580C] to-[#FB923C]" },
            ].map((item, i) => (
              <RevealSection key={item.step} delay={i * 0.15} className="relative p-8 text-center">
                {i < 3 && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#E5E7EB] to-transparent" />}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mx-auto mb-6 flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-[18px] font-bold">{item.step}</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-[13px] text-[#666] leading-[1.7] max-w-[220px] mx-auto">{item.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#FAFBFC]">
        <FloatingOrbs />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">Everything You Need</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Walk into any lender's office with confidence.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "◎", title: "Capital Readiness Score", desc: "0–100 composite based on 6 weighted underwriting components", gradient: "from-[#2E7D32] to-[#4CAF50]" },
              { icon: "⬡", title: "2.5x Exposure Ceiling", desc: "Maximum fundable amount with dynamic multiplier adjustments", gradient: "from-[#0891B2] to-[#22D3EE]" },
              { icon: "◈", title: "Tier Eligibility Report", desc: "Prime, Mid-Tier, or Alternative capital product matching", gradient: "from-[#7C3AED] to-[#A78BFA]" },
              { icon: "⊘", title: "Denial Simulation", desc: "Pre-screen every trigger that would cause a real denial", gradient: "from-[#DC2626] to-[#EF4444]" },
              { icon: "◇", title: "Credit Repair Plan", desc: "AI-parsed issues with auto-generated dispute letters", gradient: "from-[#EA580C] to-[#FB923C]" },
              { icon: "△", title: "AI Mentor Access", desc: "7 specialized mentors for sales, investing, marketing & more", gradient: "from-[#0284C7] to-[#38BDF8]" },
            ].map((item, i) => (
              <RevealSection key={item.title} delay={i * 0.08} className="group relative p-7 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-md`}>
                  <span className="text-white text-[18px]">{item.icon}</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#666] leading-[1.7]">{item.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BEFORE/AFTER ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">The Difference</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Stop guessing. Start knowing.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[800px] mx-auto">
            <RevealSection delay={0} className="p-8 rounded-2xl border-2 border-red-100 bg-red-50/40">
              <p className="text-[12px] font-bold tracking-wider uppercase text-red-400 mb-6">Without MentXr</p>
              <ul className="space-y-4">
                {["Guess at eligibility", "Apply to multiple lenders", "Accumulate hard inquiries", "Get denied without explanation", "Repeat the cycle"].map(t => (
                  <li key={t} className="flex items-start gap-3 text-[14px] text-[#666] leading-[1.5]">
                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5"><span className="text-red-500 text-[11px]">✕</span></span>{t}
                  </li>
                ))}
              </ul>
            </RevealSection>
            <RevealSection delay={0.15} className="p-8 rounded-2xl border-2 border-green-100 bg-green-50/40">
              <p className="text-[12px] font-bold tracking-wider uppercase text-[#2E7D32] mb-6">With MentXr</p>
              <ul className="space-y-4">
                {["Know your exact tier & ceiling", "Fix issues before applying", "Apply once, with confidence", "Get approved on first try", "Build on momentum"].map(t => (
                  <li key={t} className="flex items-start gap-3 text-[14px] text-[#666] leading-[1.5]">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></span>{t}
                  </li>
                ))}
              </ul>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════ CASE STUDY ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#1A1A1A] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(46,125,50,0.15),transparent)]" />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-16">
            <p className="text-[13px] text-[#4CAF50] font-semibold tracking-wide uppercase mb-4">Case Study</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em]">
              From score 38 to funded in 67 days.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-[1000px] mx-auto">
            {[
              { day: "Day 1", title: "Analysis", score: "38", detail: "4 denial triggers. 78% utilization. 2 collections.", color: "from-red-500 to-red-600" },
              { day: "Day 3", title: "Repair Plan", score: "38", detail: "6 dispute letters. Utilization plan. EIN registration.", color: "from-orange-500 to-orange-600" },
              { day: "Day 30", title: "Checkpoint", score: "52", detail: "1 collection removed. Utilization 45%. Ceiling $85K.", color: "from-yellow-500 to-yellow-600" },
              { day: "Day 67", title: "Funded", score: "71", detail: "$175K LOC approved. 0 denial triggers. 22% utilization.", color: "from-green-500 to-green-600" },
            ].map((step, i) => (
              <RevealSection key={step.day} delay={i * 0.12} className="p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 text-center">
                <p className="text-[11px] text-white/50 font-mono mb-3">{step.day}</p>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-[18px] font-bold">{step.score}</span>
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2">{step.title}</h3>
                <p className="text-[12px] text-white/60 leading-[1.6]">{step.detail}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6 COMPONENTS ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">Scoring Engine</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Six components. One score.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[900px] mx-auto">
            {[
              { name: "Capital Strength", pts: "0–20", desc: "Revenue, assets, collateral", color: "#2E7D32" },
              { name: "Credit Quality", pts: "0–20", desc: "FICO, payment history, utilization", color: "#0891B2" },
              { name: "Management", pts: "0–15", desc: "Entity type, structure, EIN", color: "#7C3AED" },
              { name: "Cash Flow", pts: "0–15", desc: "Revenue trends, DSCR, reserves", color: "#EA580C" },
              { name: "Liquidity", pts: "0–15", desc: "DTI, current ratio, obligations", color: "#DC2626" },
              { name: "Risk Signals", pts: "0–15", desc: "Liens, judgments, inquiries", color: "#0284C7" },
            ].map((c, i) => (
              <RevealSection key={c.name} delay={i * 0.08} className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[15px] font-bold text-[#1A1A1A]">{c.name}</span>
                </div>
                <p className="text-[24px] font-bold font-mono text-[#1A1A1A] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.pts}</p>
                <p className="text-[13px] text-[#666]">{c.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TIERS ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32 bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center max-w-[600px] mx-auto mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">Tier System</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Three tiers. Know yours.
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {[
              { tier: "Tier 1", name: "Prime", score: "75–100", products: "SBA 7(a), Conventional LOC, Term Loans", gradient: "from-[#2E7D32] to-[#4CAF50]", border: "border-[#2E7D32]/20" },
              { tier: "Tier 2", name: "Mid-Tier", score: "50–74", products: "Revenue Lending, Invoice Factoring, Bridge Loans", gradient: "from-[#0891B2] to-[#22D3EE]", border: "border-[#0891B2]/20" },
              { tier: "Tier 3", name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builders", gradient: "from-[#7C3AED] to-[#A78BFA]", border: "border-[#7C3AED]/20" },
            ].map((t, i) => (
              <RevealSection key={t.tier} delay={i * 0.12} className={`p-8 rounded-2xl bg-white border-2 ${t.border} shadow-sm hover:shadow-lg transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-5 shadow-md`}>
                  <span className="text-white text-[14px] font-bold">{i + 1}</span>
                </div>
                <span className="text-[11px] text-[#999] uppercase tracking-wider font-mono">{t.tier}</span>
                <h3 className="text-[24px] font-bold text-[#1A1A1A] mt-1 mb-2">{t.name}</h3>
                <p className="text-[15px] font-mono text-[#666] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.score}</p>
                <p className="text-[13px] text-[#999] leading-[1.7]">{t.products}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-[700px] mx-auto px-6 sm:px-10">
          <RevealSection className="text-center mb-16">
            <p className="text-[13px] text-[#2E7D32] font-semibold tracking-wide uppercase mb-4">FAQ</p>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A]">
              Questions? Answers.
            </h2>
          </RevealSection>
          <div className="space-y-0">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-[#E5E7EB]">
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-6 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[15px] sm:text-[16px] font-semibold text-[#1A1A1A] group-hover:text-[#2E7D32] transition-colors pr-4">{item.q}</span>
                  <span className="w-8 h-8 rounded-full bg-[#F1F3F5] flex items-center justify-center shrink-0 transition-all duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    <span className="text-[16px] text-[#666] leading-none">+</span>
                  </span>
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                  <p className="pb-6 text-[14px] text-[#666] leading-[1.8]">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative z-10 py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(46,125,50,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(8,145,178,0.15),transparent)]" />
        <div className="relative max-w-[700px] mx-auto text-center px-6 sm:px-10">
          <RevealSection>
            <h2 className="text-[36px] sm:text-[56px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.04em] text-white mb-6" data-testid="text-final-cta">
              Ready to get<br /><span className="bg-gradient-to-r from-[#4CAF50] via-[#22D3EE] to-[#A78BFA] bg-clip-text text-transparent">funded?</span>
            </h2>
            <p className="text-[17px] text-white/60 leading-[1.7] mb-10 max-w-[480px] mx-auto">
              Get your Capital Readiness Score, tier eligibility, and denial simulation — free. No credit card. No credit pull.
            </p>
            <form onSubmit={handleLogin} className="w-full max-w-[480px] mx-auto mb-6">
              <div className="flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl h-[56px] pl-5 pr-1.5">
                <input
                  data-testid="input-email-bottom"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 outline-none"
                  defaultValue=""
                  required
                  disabled={isLoading}
                />
                <button
                  data-testid="button-join-bottom"
                  type="submit"
                  disabled={isLoading}
                  className="h-[44px] px-7 rounded-xl bg-white text-[#1A1A1A] text-[14px] font-semibold hover:bg-white/90 transition-all shrink-0"
                >
                  {isLoading ? "..." : "Get Free Access"}
                </button>
              </div>
            </form>
            <p className="text-[13px] text-white/30">
              Join 12,500+ founders already using MentXr&reg;
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 bg-[#1A1A1A] border-t border-white/10 px-6 sm:px-10 py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#0891B2] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">M</span>
              </div>
              <span className="text-[15px] font-bold text-white">MentXr<span className="text-[10px] align-super text-white/40">&reg;</span></span>
            </div>
            <div className="flex flex-wrap gap-6">
              {["Privacy", "Terms", "Contact", "Support"].map(link => (
                <span key={link} className="text-[13px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">{link}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-white/10">
            <p className="text-[13px] text-white/30">&copy; 2026 MentXr&reg; by CMD Supply. All rights reserved.</p>
            <p className="text-[11px] text-white/20 max-w-[400px] leading-[1.6]">
              MentXr is not a lender, broker, or financial advisor. All analyses are for informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
