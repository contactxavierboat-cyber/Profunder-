import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function GreenBlobBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;

    const blobs = [
      { x: 0.45, y: 0.4, r: 280, phase: 0 },
      { x: 0.55, y: 0.55, r: 220, phase: 2 },
      { x: 0.35, y: 0.6, r: 200, phase: 4 },
      { x: 0.6, y: 0.35, r: 180, phase: 1 },
      { x: 0.5, y: 0.5, r: 300, phase: 3 },
    ];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const w = canvas.parentElement!.getBoundingClientRect().width;
      const h = canvas.parentElement!.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);
      t += 0.008;

      blobs.forEach(b => {
        const bx = (b.x + Math.sin(t + b.phase) * 0.08) * w;
        const by = (b.y + Math.cos(t * 0.7 + b.phase) * 0.06) * h;
        const r = b.r + Math.sin(t * 1.2 + b.phase) * 30;

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0, 'rgba(92, 236, 198, 0.35)');
        g.addColorStop(0.3, 'rgba(72, 200, 170, 0.2)');
        g.addColorStop(0.6, 'rgba(50, 160, 140, 0.1)');
        g.addColorStop(1, 'rgba(30, 120, 100, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();

        const points = 8;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const wobble = 1 + Math.sin(angle * 3 + t * 2 + b.phase) * 0.15 + Math.cos(angle * 2 + t * 1.5) * 0.1;
          const px = bx + Math.cos(angle) * r * wobble;
          const py = by + Math.sin(angle) * r * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      });

      ctx.fillStyle = 'rgba(30, 50, 45, 0.15)';
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

function TopoLines() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 1000 600" preserveAspectRatio="none">
      {[...Array(12)].map((_, i) => {
        const y = 100 + i * 35;
        const amp = 40 + i * 5;
        return (
          <path key={i} d={`M0 ${y} Q250 ${y - amp} 500 ${y} Q750 ${y + amp} 1000 ${y}`} fill="none" stroke="#3a7a6a" strokeWidth="1" />
        );
      })}
    </svg>
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
    <div className="min-h-screen bg-[#0d1f1a] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1f1a]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-12 h-[68px]">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#5CECC6"/><circle cx="10" cy="12" r="3" fill="#0d1f1a"/><circle cx="18" cy="12" r="3" fill="#0d1f1a"/></svg>
            <span className="text-[17px] tracking-[-0.01em]" style={{ fontFamily: "'Georgia', serif" }}>
              Ment<span className="text-[#5CECC6] italic">Xr</span>
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              <span className="text-[14px] text-white/50 hover:text-white/80 transition-colors cursor-pointer">Stats</span>
              <span className="text-[14px] text-white/50 hover:text-white/80 transition-colors cursor-pointer">Features</span>
              <span className="text-[14px] text-white/50 hover:text-white/80 transition-colors cursor-pointer">How It Works</span>
            </div>
            <button onClick={() => document.getElementById('hero-input')?.focus()} className="h-10 px-6 rounded-full bg-[#5CECC6]/10 border border-[#5CECC6]/30 text-[#5CECC6] text-[14px] font-medium hover:bg-[#5CECC6]/20 transition-colors">
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <GreenBlobBg />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f1a]/30 via-transparent to-[#0d1f1a]" />

        <div className="relative z-10 text-center px-6 sm:px-12 max-w-[900px] mx-auto">
          <div style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(15px)', transition: 'all 0.7s ease 0.1s' }}>
            <div className="w-12 h-12 rounded-full bg-white mx-auto mb-10 flex items-center justify-center shadow-lg shadow-white/10">
              <div className="w-3 h-3 rounded-full bg-[#5CECC6]" />
            </div>
          </div>

          <h1
            className="mb-8"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(25px)', transition: 'all 0.9s ease 0.2s', fontFamily: "'Georgia', 'Times New Roman', serif" }}
            data-testid="text-hero-headline"
          >
            <span className="block text-[42px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-normal leading-[1.0] tracking-[-0.03em] text-white">
              The Platform To
            </span>
            <span className="block text-[42px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-normal leading-[1.0] tracking-[-0.03em] text-white">
              House All Finance
            </span>
          </h1>

          <p
            className="text-[15px] sm:text-[17px] text-white/45 leading-[1.75] max-w-[480px] mx-auto mb-12"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(18px)', transition: 'all 0.7s ease 0.4s' }}
          >
            Funding is fragmented today, but it doesn't need to be.<br />
            For the first time, analyze your credit, build your score, and<br />
            access mentorship on the same hyper-intelligent platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap" style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(15px)', transition: 'all 0.7s ease 0.5s' }}>
            <form onSubmit={handleLogin} className="contents">
              <input
                id="hero-input"
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="h-[48px] w-[240px] sm:w-[280px] bg-transparent border border-white/15 rounded-full px-5 text-[14px] text-white placeholder:text-white/25 outline-none hover:border-white/25 focus:border-[#5CECC6]/40 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[48px] px-8 rounded-full bg-[#5CECC6]/10 border border-[#5CECC6]/30 text-[#5CECC6] text-[14px] font-medium hover:bg-[#5CECC6]/20 transition-all"
              >
                {isLoading ? "..." : "Get Started"}
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-[48px] px-8 rounded-full border border-white/15 text-white/60 text-[14px] font-medium hover:border-white/25 hover:text-white/80 transition-all"
              >
                Learn More
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════ FLAGSHIP SECTION ══════ */}
      <section id="features-section" className="relative py-24 sm:py-32 bg-[#0d1f1a]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center mb-20">
            <p className="text-[15px] sm:text-[17px] text-white/40 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              The flagship application: the premier
            </p>
            <div className="flex items-center justify-center gap-[6px] sm:gap-[10px] my-4">
              {"CAPITAL READINESS".split("").map((ch, i) => (
                <span key={i} className="text-[28px] sm:text-[42px] md:text-[52px] tracking-[0.1em] font-normal" style={{ fontFamily: "'Georgia', serif", color: ch === " " ? "transparent" : "#5CECC6" }}>
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </div>
            <p className="text-[15px] sm:text-[17px] text-white/40" style={{ fontFamily: "'Georgia', serif" }}>engine</p>
          </div>

          <div className="relative max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-y-0 items-center">
              {/* Left features */}
              <div className="space-y-12 md:space-y-16">
                <div className="flex items-start gap-4 md:flex-row-reverse md:text-right">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-medium text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>Zero Manual Entry</h3>
                    <p className="text-[14px] text-white/35 leading-[1.7]">AI extracts 40+ data points<br />from your documents automatically.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 md:flex-row-reverse md:text-right">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-medium text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>2.5x Exposure Logic</h3>
                    <p className="text-[14px] text-white/35 leading-[1.7]">Maximum fundable amount with<br />dynamic multiplier adjustments.</p>
                  </div>
                </div>
              </div>

              {/* Center preview card */}
              <div className="flex justify-center">
                <div className="w-[280px] sm:w-[320px] rounded-[20px] bg-[#111f1a] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-white/30 font-mono">Capital Readiness</span>
                    <span className="w-2 h-2 rounded-full bg-[#5CECC6] animate-pulse" />
                  </div>
                  <div className="p-6 text-center">
                    <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto mb-3 -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#5CECC6" strokeWidth="5" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="78" style={{ filter: 'drop-shadow(0 0 6px rgba(92,236,198,0.3))' }} />
                    </svg>
                    <p className="text-[32px] font-bold text-white mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>75</p>
                    <p className="text-[10px] text-white/25 tracking-wider uppercase">Score</p>
                  </div>
                  <div className="px-5 pb-5 space-y-3">
                    {[
                      { l: "Tier", v: "Prime", c: true },
                      { l: "Ceiling", v: "$210K", c: false },
                      { l: "Risk", v: "Clear", c: true },
                    ].map(r => (
                      <div key={r.l} className="flex items-center justify-between py-1.5 border-t border-white/[0.04]">
                        <span className="text-[12px] text-white/25">{r.l}</span>
                        <span className={`text-[13px] font-medium ${r.c ? 'text-[#5CECC6]' : 'text-white/60'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right features */}
              <div className="space-y-12 md:space-y-16">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-medium text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>Transparent</h3>
                    <p className="text-[14px] text-white/35 leading-[1.7]">See exactly how every component<br />of your score is calculated.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-medium text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>Seamless</h3>
                    <p className="text-[14px] text-white/35 leading-[1.7]">Upload, analyze, and get your<br />action plan — all in one flow.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ THE MENTXR STACK ══════ */}
      <section className="relative py-24 sm:py-32 bg-[#0d1f1a] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[56px] md:text-[72px] font-normal tracking-[-0.02em]" style={{ fontFamily: "'Georgia', serif" }}>
              The <span className="text-[#5CECC6] italic">MentXr</span> Stack
            </h2>
          </div>

          <div className="relative max-w-[1000px] mx-auto">
            {/* 3D-ish isometric stack visualization */}
            <div className="relative h-[400px] sm:h-[500px] flex items-end justify-center">
              {/* Base platform */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[60px] bg-gradient-to-t from-[#5CECC6]/5 to-[#5CECC6]/10 rounded-lg border border-[#5CECC6]/10" style={{ transform: 'translateX(-50%) perspective(800px) rotateX(45deg)', transformOrigin: 'bottom center' }}>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-[#5CECC6]/40 font-mono whitespace-nowrap">Intelligence Engine</span>
              </div>

              {/* Columns */}
              <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 flex items-end justify-center gap-3 sm:gap-5">
                {[
                  { h: 120, label: "Capital\nStrength", color: 0.6 },
                  { h: 160, label: "Credit\nQuality", color: 0.7 },
                  { h: 200, label: "Scoring\nEngine", color: 0.9 },
                  { h: 180, label: "Denial\nSim", color: 0.8 },
                  { h: 140, label: "Repair\nPlan", color: 0.65 },
                  { h: 160, label: "AI\nMentors", color: 0.75 },
                  { h: 130, label: "Risk\nSignals", color: 0.6 },
                ].map((col, i) => (
                  <div key={i} className="flex flex-col items-center group">
                    <div
                      className="w-[40px] sm:w-[60px] md:w-[80px] rounded-t-md transition-all duration-500 group-hover:brightness-125"
                      style={{
                        height: col.h,
                        background: `linear-gradient(180deg, rgba(92,236,198,${col.color * 0.5}) 0%, rgba(92,236,198,${col.color * 0.2}) 100%)`,
                        border: `1px solid rgba(92,236,198,${col.color * 0.3})`,
                        borderBottom: 'none',
                        boxShadow: `0 0 20px rgba(92,236,198,${col.color * 0.1})`,
                      }}
                    />
                    <p className="text-[9px] sm:text-[10px] text-[#5CECC6]/50 text-center mt-2 leading-tight whitespace-pre-line font-mono">{col.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corner text blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
              <div className="max-w-[320px]">
                <p className="text-[14px] text-[#5CECC6]/60 leading-[1.8]">
                  Capital scoring and AI mentorship are two flagship features built on MentXr's engine. But they are just the tip of the iceberg.
                </p>
              </div>
              <div className="max-w-[360px] sm:ml-auto">
                <p className="text-[14px] text-white/35 leading-[1.8]">
                  High-performance financial analysis is built natively. The 6-component underwriting engine evaluates Capital Strength, Credit Quality, Management, Cash Flow, Liquidity, and Risk Signals — all accessible through one unified platform.
                </p>
              </div>
              <div className="max-w-[320px]">
                <p className="text-[14px] text-[#5CECC6]/60 leading-[1.8]">
                  Credit repair automation, denial simulation, and 7 specialized AI mentors work seamlessly to let anyone analyze, repair, and apply — all in one place.
                </p>
              </div>
              <div className="max-w-[360px] sm:ml-auto">
                <p className="text-[14px] text-white/35 leading-[1.8]">
                  The foundation of MentXr is its intelligence engine, which processes your financial profile through real underwriting logic — the same criteria banks use to approve or deny you.
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-[800px] mx-auto">
            {[
              { label: "Components", value: "6" },
              { label: "AI Mentors", value: "7" },
              { label: "Data Points", value: "40+" },
              { label: "Approval Rate", value: "89%" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[32px] sm:text-[40px] font-normal text-white mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                <p className="text-[12px] text-white/25 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ COMMUNITY FIRST ══════ */}
      <section className="relative py-32 sm:py-44 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d1f1a 0%, #e0f7ef 15%, #e8fff5 50%, #e0f7ef 85%, #0d1f1a 100%)' }}>
        <TopoLines />
        <div className="relative z-10 max-w-[900px] mx-auto text-center px-6 sm:px-12">
          <p className="text-[15px] sm:text-[17px] text-[#2a5a4a] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            No gatekeepers. No hidden fees. No credit pull.
          </p>
          <h2 className="text-[48px] sm:text-[72px] md:text-[96px] font-normal leading-[1.0] tracking-[-0.03em] text-[#0d1f1a]" style={{ fontFamily: "'Georgia', serif" }}>
            Community first.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#3a7a6a] mt-8 max-w-[460px] mx-auto leading-[1.7]" style={{ fontFamily: "'Georgia', serif" }}>
            Anyone can access, analyze, and improve their<br />
            Capital Readiness through MentXr — completely free.
          </p>
          <p className="text-[15px] text-[#5a9a8a] mt-4 mb-12" style={{ fontFamily: "'Georgia', serif" }}>
            Own your funding journey today.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <form onSubmit={handleLogin} className="contents">
              <button
                data-testid="button-join-mid"
                type="button"
                onClick={() => document.getElementById('hero-input')?.focus()}
                className="h-[48px] px-8 rounded-full bg-[#0d1f1a]/10 border border-[#0d1f1a]/20 text-[#0d1f1a] text-[14px] font-medium hover:bg-[#0d1f1a]/20 transition-colors"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-[48px] px-8 rounded-full border border-[#0d1f1a]/20 text-[#0d1f1a]/60 text-[14px] font-medium hover:text-[#0d1f1a] hover:border-[#0d1f1a]/30 transition-all"
              >
                Explore Features
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════ LARGE BRAND / FOOTER AREA ══════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d1f1a 0%, #e0f7ef 30%, #e8fff5 100%)' }}>
        <div className="relative py-20 sm:py-32 max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center">
            <h2 className="text-[60px] sm:text-[100px] md:text-[140px] lg:text-[180px] font-normal leading-none tracking-[-0.04em] text-[#0d1f1a]" style={{ fontFamily: "'Georgia', serif" }}>
              Ment<span className="text-[#5CECC6] italic">Xr</span><span className="text-[#0d1f1a]/20">®</span>
            </h2>
          </div>
          <div className="flex items-center justify-end gap-4 mt-8">
            <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#5CECC6"/><circle cx="10" cy="12" r="3" fill="#0d1f1a"/><circle cx="18" cy="12" r="3" fill="#0d1f1a"/></svg>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="bg-[#0a1914] border-t border-white/[0.04] px-6 sm:px-12 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-[13px] text-white/20">2026</span>
            <span className="text-[13px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">Terms of Service</span>
            <span className="text-[13px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">Privacy Policy</span>
          </div>
          <div className="flex items-center gap-4">
            <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#5CECC6"/><circle cx="7" cy="9" r="2" fill="#0d1f1a"/><circle cx="13" cy="9" r="2" fill="#0d1f1a"/></svg>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[13px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">Contact</span>
            <span className="text-[13px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">Support</span>
          </div>
        </div>
        <p className="text-[10px] text-white/10 mt-6 max-w-[500px]">
          MentXr® by CMD Supply. Not a lender, broker, or financial advisor. For informational purposes only.
        </p>
      </footer>
    </div>
  );
}
