import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function GreenBlob({ className = "", size = 500, opacity = 0.35 }: { className?: string; size?: number; opacity?: number }) {
  return (
    <div className={`absolute pointer-events-none ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full animate-pulse" style={{
        background: `radial-gradient(circle, rgba(0,255,136,${opacity}) 0%, rgba(0,255,100,${opacity * 0.5}) 30%, rgba(0,200,80,${opacity * 0.2}) 50%, transparent 70%)`,
        filter: 'blur(60px)',
        animation: 'blobFloat 8s ease-in-out infinite',
      }} />
    </div>
  );
}

function TickerText() {
  const text = "CAPITAL READINESS";
  const letters = text.split("");
  return (
    <div className="flex items-center justify-center gap-[2px] sm:gap-1 overflow-hidden py-8 sm:py-12">
      {letters.map((ch, i) => (
        <span key={i} className="relative inline-flex flex-col overflow-hidden h-[48px] sm:h-[72px] md:h-[96px]">
          <span className="text-[48px] sm:text-[72px] md:text-[96px] font-bold tracking-[-0.02em] leading-none text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.15)' }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
          <span className="absolute inset-0 text-[48px] sm:text-[72px] md:text-[96px] font-bold tracking-[-0.02em] leading-none text-white" style={{
            animation: `tickerSlide 3s ease-in-out ${i * 0.08}s infinite`,
          }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        </span>
      ))}
    </div>
  );
}

function LiveStat({ label, value, suffix = "" }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-[32px] sm:text-[48px] md:text-[56px] font-bold tracking-[-0.03em] text-white leading-none mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value}<span className="text-white/40">{suffix}</span>
      </p>
      <p className="text-[12px] sm:text-[13px] text-white/30 tracking-wide">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [heroVis, setHeroVis] = useState(false);

  useEffect(() => { setTimeout(() => setHeroVis(true), 200); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
    if (!input?.value) return;
    setIsLoading(true);
    try { await login(input.value); } catch { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes tickerSlide {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-section { opacity: 0; animation: fadeUp 0.8s ease forwards; }
      `}</style>

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-12 h-[64px]">
          <div className="flex items-center gap-8">
            <span className="text-[16px] font-bold tracking-[-0.01em] text-white">
              <span className="text-[#00FF88]">●</span> MentXr
            </span>
            <div className="hidden md:flex items-center gap-6">
              <span className="text-[13px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">Stats</span>
              <span className="text-[13px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">Features</span>
              <span className="text-[13px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">How It Works</span>
            </div>
          </div>
          <button onClick={() => document.getElementById('hero-input')?.focus()} className="h-9 px-5 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-[13px] font-medium hover:bg-[#00FF88]/20 transition-colors">
            Launch App
          </button>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <GreenBlob className="-top-[200px] -left-[200px]" size={700} opacity={0.25} />
        <GreenBlob className="-bottom-[150px] -right-[150px]" size={500} opacity={0.15} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,255,136,0.04), transparent)' }} />

        <div className="relative z-10 text-center px-6 sm:px-12 max-w-[1000px] mx-auto">
          <div style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.1s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              <span className="text-[12px] text-white/50 font-medium">AI-Powered Capital Intelligence</span>
            </div>
          </div>

          <h1
            className="text-[44px] sm:text-[72px] md:text-[88px] lg:text-[110px] font-bold leading-[0.92] tracking-[-0.04em] mb-8"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(30px)', transition: 'all 1s ease 0.2s' }}
            data-testid="text-hero-headline"
          >
            The Platform To<br />
            <span className="text-[#00FF88]">House All</span> Finance
          </h1>

          <p
            className="text-[16px] sm:text-[18px] text-white/40 leading-[1.7] max-w-[520px] mx-auto mb-4"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.35s' }}
          >
            Funding is fragmented today, but it doesn't need to be.
          </p>
          <p
            className="text-[15px] sm:text-[17px] text-white/30 leading-[1.7] max-w-[520px] mx-auto mb-12"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.4s' }}
          >
            For the first time, analyze your credit, get your score, and<br className="hidden sm:block" />
            access mentorship on the same hyper-intelligent platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap" style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.5s' }}>
            <form onSubmit={handleLogin} className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-full h-[52px] pl-5 pr-1.5 hover:border-white/[0.15] transition-colors w-full max-w-[420px]">
              <input
                id="hero-input"
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[40px] px-6 rounded-full bg-[#00FF88] text-black text-[13px] font-bold hover:bg-[#00FF99] transition-all shrink-0"
              >
                {isLoading ? "..." : "Get Started"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════ TICKER ══════ */}
      <section className="relative border-t border-b border-white/[0.04] overflow-hidden">
        <TickerText />
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <LiveStat label="Founders Analyzed" value="12,500" suffix="+" />
            <LiveStat label="Capital Deployed" value="$47M" suffix="+" />
            <LiveStat label="Approval Rate" value="89" suffix="%" />
            <LiveStat label="Avg Funding" value="$80K" />
          </div>
        </div>
      </section>

      {/* ══════ FLAGSHIP APP ══════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <GreenBlob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={600} opacity={0.08} />
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center mb-20">
            <p className="text-[13px] text-white/30 tracking-[0.15em] uppercase mb-6">The flagship application: the premier</p>
            <TickerText />
            <p className="text-[13px] text-white/30 tracking-[0.15em] uppercase mt-4">engine</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[1000px] mx-auto">
            {[
              { icon: "◎", title: "Zero Manual Entry", desc: "AI extracts 40+ data points from your documents automatically." },
              { icon: "⬡", title: "2.5x Exposure Logic", desc: "Maximum fundable amount with dynamic multiplier adjustments." },
              { icon: "◈", title: "Fully Transparent", desc: "See exactly how every component of your score is calculated." },
              { icon: "⊘", title: "Seamless", desc: "Upload, analyze, and get your action plan — all in one flow." },
            ].map((item, i) => (
              <div key={item.title} className="p-8 rounded-[20px] bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-500 group">
                <span className="text-[28px] text-[#00FF88]/30 group-hover:text-[#00FF88]/60 transition-colors duration-500 block mb-5">{item.icon}</span>
                <h3 className="text-[18px] font-bold text-white mb-3">{item.title}</h3>
                <p className="text-[14px] text-white/35 leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SCREENSHOT / PREVIEW CARD ══════ */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-[900px] mx-auto px-6 sm:px-12">
          <div className="relative rounded-[24px] bg-white/[0.02] border border-white/[0.06] p-8 sm:p-12 overflow-hidden">
            <GreenBlob className="-top-[100px] -right-[100px]" size={300} opacity={0.1} />
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[11px] text-[#00FF88]/60 tracking-[0.15em] uppercase mb-4">Live Preview</p>
                <div className="relative w-full aspect-square rounded-[16px] bg-black/50 border border-white/[0.06] flex items-center justify-center">
                  <div className="text-center">
                    <svg viewBox="0 0 120 120" className="w-28 h-28 mx-auto -rotate-90 mb-4">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#00FF88" strokeWidth="6" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="78" style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' }} />
                    </svg>
                    <p className="text-[40px] font-bold text-white tracking-[-0.02em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>75</p>
                    <p className="text-[11px] text-white/30 tracking-wider uppercase mt-1">Capital Score</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="space-y-6">
                  {[
                    { label: "Tier Eligibility", value: "Tier 1 — Prime", color: "text-[#00FF88]" },
                    { label: "Exposure Ceiling", value: "$210,000" },
                    { label: "Credit Quality", value: "17 / 20" },
                    { label: "Risk Signals", value: "0 Triggers" },
                    { label: "Operating Mode", value: "Pre-Funding" },
                    { label: "Denial Risk", value: "Clear" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <span className="text-[13px] text-white/35">{item.label}</span>
                      <span className={`text-[14px] font-semibold ${item.color || 'text-white/80'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ THE STACK ══════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center mb-6">
            <p className="text-[13px] text-white/30 tracking-[0.15em] uppercase mb-4">The</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[#00FF88] text-[24px]">●</span>
              <h2 className="text-[36px] sm:text-[56px] font-bold tracking-[-0.03em]">MentXr Stack</h2>
            </div>
          </div>

          <div className="max-w-[800px] mx-auto mt-12">
            <p className="text-[15px] text-white/35 leading-[1.9] text-center mb-16">
              Capital Readiness scoring and AI mentorship are two flagship features built on MentXr's intelligence engine. But they are just the tip of the iceberg. Credit repair automation, denial simulation, and 7 specialized AI mentors work seamlessly to give you a complete funding readiness platform. High-performance financial analysis is built natively. The foundation of MentXr is its 6-component underwriting engine, evaluating Capital Strength, Credit Quality, Management, Cash Flow, Liquidity, and Risk Signals in real time.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Components", value: "6" },
                { label: "AI Mentors", value: "7" },
                { label: "Data Points", value: "40+" },
                { label: "Score Range", value: "0–100" },
              ].map(s => (
                <div key={s.label} className="p-5 rounded-[16px] bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-[28px] sm:text-[36px] font-bold text-white tracking-[-0.02em] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                  <p className="text-[11px] text-white/30 tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMMUNITY / CTA ══════ */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <GreenBlob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={800} opacity={0.12} />
        <div className="relative z-10 max-w-[800px] mx-auto text-center px-6 sm:px-12">
          <p className="text-[13px] text-white/30 tracking-[0.15em] uppercase mb-6">No gatekeepers. No hidden fees. No surprises.</p>
          <h2 className="text-[32px] sm:text-[48px] md:text-[64px] font-bold leading-[1.0] tracking-[-0.03em] mb-6">
            Community first.
          </h2>
          <p className="text-[16px] sm:text-[18px] text-white/35 leading-[1.7] mb-6 max-w-[520px] mx-auto">
            Anyone can access, analyze, and improve their<br className="hidden sm:block" />
            Capital Readiness through MentXr — completely free.
          </p>
          <p className="text-[15px] text-white/25 leading-[1.7] mb-12 max-w-[480px] mx-auto">
            Own your funding journey today.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <form onSubmit={handleLogin} className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-full h-[52px] pl-5 pr-1.5 hover:border-white/[0.15] transition-colors w-full max-w-[420px]">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
                defaultValue=""
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join-bottom"
                type="submit"
                disabled={isLoading}
                className="h-[40px] px-6 rounded-full bg-[#00FF88] text-black text-[13px] font-bold hover:bg-[#00FF99] transition-all shrink-0"
              >
                {isLoading ? "..." : "Get Started"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════ LARGE LOGO ══════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <span className="text-[80px] sm:text-[120px] md:text-[180px] font-bold tracking-[-0.04em] text-white/[0.03] select-none leading-none">MentXr®</span>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative border-t border-white/[0.04] px-6 sm:px-12 py-10">
        <GreenBlob className="-bottom-[200px] left-1/2 -translate-x-1/2" size={400} opacity={0.06} />
        <div className="relative max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <span className="text-[14px] text-white/30">
                <span className="text-[#00FF88]">●</span> MentXr
              </span>
              <span className="text-[13px] text-white/15">2026</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {["Terms of Service", "Privacy Policy"].map(link => (
                <span key={link} className="text-[13px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">{link}</span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/10 mt-6 max-w-[500px]">
            MentXr® by CMD Supply. Not a lender, broker, or financial advisor. All analyses are for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
