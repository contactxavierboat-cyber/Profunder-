import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function HeroBlobCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const p = canvas.parentElement!;
      canvas.width = p.clientWidth * dpr;
      canvas.height = p.clientHeight * dpr;
      canvas.style.width = p.clientWidth + 'px';
      canvas.style.height = p.clientHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const blobs = [
      { cx: 0.3, cy: 0.5, r: 320, px: 0, py: 0 },
      { cx: 0.55, cy: 0.35, r: 250, px: 2, py: 1 },
      { cx: 0.7, cy: 0.6, r: 200, px: 1, py: 3 },
      { cx: 0.4, cy: 0.7, r: 280, px: 3, py: 2 },
      { cx: 0.2, cy: 0.3, r: 180, px: 4, py: 1 },
    ];

    const drawBlob = (cx: number, cy: number, r: number, phase: number) => {
      ctx.beginPath();
      const pts = 64;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const n1 = Math.sin(a * 3 + t * 1.5 + phase) * 0.18;
        const n2 = Math.cos(a * 2 + t * 1.1 + phase * 0.7) * 0.12;
        const n3 = Math.sin(a * 5 + t * 0.8 + phase * 1.3) * 0.08;
        const rr = r * (1 + n1 + n2 + n3);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const draw = () => {
      const w = canvas.parentElement!.clientWidth;
      const h = canvas.parentElement!.clientHeight;
      ctx.clearRect(0, 0, w, h);
      t += 0.006;

      ctx.fillStyle = '#0f2922';
      ctx.fillRect(0, 0, w, h);

      blobs.forEach(b => {
        const bx = (b.cx + Math.sin(t * 0.4 + b.px) * 0.05) * w;
        const by = (b.cy + Math.cos(t * 0.3 + b.py) * 0.04) * h;
        const r = b.r * (Math.min(w, 1400) / 1400);

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r * 1.2);
        g.addColorStop(0, 'rgba(60, 200, 160, 0.45)');
        g.addColorStop(0.3, 'rgba(50, 180, 145, 0.3)');
        g.addColorStop(0.6, 'rgba(40, 160, 130, 0.15)');
        g.addColorStop(1, 'rgba(30, 140, 110, 0)');

        ctx.save();
        drawBlob(bx, by, r, b.px + b.py);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { login } = useAuth();
  const [heroVis, setHeroVis] = useState(false);

  useEffect(() => { setTimeout(() => setHeroVis(true), 200); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try { await login(email); } catch { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════ NAV — white bg exactly like Hyper ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e8e8e8]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-12 h-[64px]">
          <div className="flex items-center gap-2.5">
            <svg width="30" height="18" viewBox="0 0 30 18">
              <circle cx="8" cy="9" r="7" fill="#0f2922"/>
              <circle cx="22" cy="9" r="7" fill="#0f2922"/>
            </svg>
            <span className="text-[17px] text-[#0f2922] tracking-[-0.01em]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Ment<span className="text-[#5CECC6] italic">Xr</span>
            </span>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <span className="text-[14px] text-[#0f2922]/60 hover:text-[#0f2922] transition-colors cursor-pointer hidden sm:block">Stats</span>
            <span className="text-[14px] text-[#5CECC6] hover:text-[#4ad4b0] transition-colors cursor-pointer hidden sm:block">Docs</span>
            <span className="text-[14px] text-[#0f2922]/60 hover:text-[#0f2922] transition-colors cursor-pointer hidden sm:block">Ecosystem</span>
            <button
              onClick={() => setShowLogin(true)}
              className="h-[38px] px-5 rounded-full bg-[#5CECC6] text-[#0f2922] text-[14px] font-medium hover:bg-[#4ad4b0] transition-colors"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* ══════ LOGIN MODAL ══════ */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-[400px] w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[22px] text-[#0f2922] mb-2 font-medium" style={{ fontFamily: "'Georgia', serif" }}>Launch App</h3>
            <p className="text-[14px] text-[#0f2922]/50 mb-6">Enter your email to get free access.</p>
            <form onSubmit={handleLogin}>
              <input
                data-testid="input-email"
                type="email"
                placeholder="you@email.com"
                className="w-full h-[48px] px-4 rounded-xl border border-[#e0e0e0] text-[15px] text-[#0f2922] placeholder:text-[#0f2922]/30 outline-none focus:border-[#5CECC6] transition-colors mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="w-full h-[48px] rounded-xl bg-[#5CECC6] text-[#0f2922] text-[15px] font-semibold hover:bg-[#4ad4b0] transition-colors"
              >
                {isLoading ? "Loading..." : "Get Free Access"}
              </button>
            </form>
            <p className="text-[12px] text-[#0f2922]/30 mt-4 text-center">Free forever. No credit card required.</p>
          </div>
        </div>
      )}

      {/* ══════ HERO — dark green bg with animated blobs ══════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#0f2922]" style={{ paddingTop: 64 }}>
        <HeroBlobCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2922]/20 via-transparent to-[#0f2922]/60 pointer-events-none" />

        <div className="relative z-10 text-center px-6 sm:px-12 max-w-[900px] mx-auto">
          {/* White circle icon */}
          <div
            className="w-[48px] h-[48px] rounded-full bg-white/90 mx-auto mb-12 flex items-center justify-center shadow-lg"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(15px)', transition: 'all 0.6s ease 0.1s' }}
          >
            <div className="w-[14px] h-[14px] rounded-full bg-[#5CECC6]" />
          </div>

          {/* Main headline — serif, elegant, large */}
          <h1
            className="text-white mb-10"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(25px)', transition: 'all 0.9s ease 0.2s', fontFamily: "'Georgia', 'Times New Roman', serif" }}
            data-testid="text-hero-headline"
          >
            <span className="block text-[40px] sm:text-[60px] md:text-[76px] lg:text-[92px] font-normal leading-[1.05] tracking-[-0.02em]">
              The Platform To
            </span>
            <span className="block text-[40px] sm:text-[60px] md:text-[76px] lg:text-[92px] font-normal leading-[1.05] tracking-[-0.02em]">
              House All Finance
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-[15px] sm:text-[16px] text-white/50 leading-[1.75] max-w-[440px] mx-auto mb-10"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(18px)', transition: 'all 0.7s ease 0.4s' }}
          >
            Funding is fragmented today, but it doesn't need to be.<br />
            For the first time, analyze your credit, build your score, and<br />
            access mentorship on the same hyper-intelligent platform.
          </p>

          {/* Two CTA buttons — outlined, side by side */}
          <div
            className="flex items-center justify-center gap-4"
            style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(15px)', transition: 'all 0.7s ease 0.5s' }}
          >
            <button
              data-testid="button-start-analyzing"
              onClick={() => setShowLogin(true)}
              className="h-[46px] px-7 rounded-full border border-[#5CECC6]/40 text-[#5CECC6] text-[14px] font-medium hover:bg-[#5CECC6]/10 hover:border-[#5CECC6]/60 transition-all"
            >
              Start Analyzing
            </button>
            <button
              data-testid="button-start-building"
              onClick={() => setShowLogin(true)}
              className="h-[46px] px-7 rounded-full border border-[#5CECC6]/40 text-[#5CECC6] text-[14px] font-medium hover:bg-[#5CECC6]/10 hover:border-[#5CECC6]/60 transition-all"
            >
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* ══════ FEATURES — WHITE bg, like Screenshot 2 ══════ */}
      <section className="relative bg-white py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
          {/* Title line with green spaced letters */}
          <div className="text-center mb-20">
            <p className="text-[18px] sm:text-[22px] md:text-[28px] text-[#0f2922] leading-[1.4]" style={{ fontFamily: "'Georgia', serif" }}>
              The flagship application: the premier{" "}
              <span className="tracking-[0.25em] text-[#5CECC6] font-normal">CAPITAL READINESS</span>
              {" "}engine
            </p>
          </div>

          {/* Features layout: 2 left, screenshot center, 2 right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 items-center">
            {/* Left features */}
            <div className="space-y-16">
              <div className="flex items-start gap-5 lg:flex-row-reverse lg:text-right">
                <div className="w-[56px] h-[56px] rounded-full border border-[#d0d0d0] flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <h3 className="text-[18px] text-[#0f2922] mb-2 font-medium" style={{ fontFamily: "'Georgia', serif" }}>Zero Manual Entry</h3>
                  <p className="text-[14px] text-[#0f2922]/45 leading-[1.65]">AI extracts 40+ data points<br />from your documents automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-5 lg:flex-row-reverse lg:text-right">
                <div className="w-[56px] h-[56px] rounded-full border border-[#d0d0d0] flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <div>
                  <h3 className="text-[18px] text-[#0f2922] mb-2 font-medium" style={{ fontFamily: "'Georgia', serif" }}>2.5x Exposure Logic</h3>
                  <p className="text-[14px] text-[#0f2922]/45 leading-[1.65]">Maximum fundable amount with<br />dynamic multiplier adjustments.</p>
                </div>
              </div>
            </div>

            {/* Center — app preview card (dark) */}
            <div className="flex justify-center">
              <div className="w-full max-w-[380px] rounded-[16px] bg-[#0f2922] border border-[#1a3d33] shadow-2xl shadow-black/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5CECC6]" />
                  <span className="text-[11px] text-white/30 font-mono">Capital Readiness Score</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] text-white/25">MentXr®</span>
                    <span className="text-[11px] text-[#5CECC6]/60 font-mono">LIVE</span>
                  </div>
                  {/* Score ring */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-[100px] h-[100px]">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#5CECC6" strokeWidth="4" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="66" style={{ filter: 'drop-shadow(0 0 6px rgba(92,236,198,0.3))' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[28px] font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>75</span>
                        <span className="text-[9px] text-white/25 uppercase tracking-wider">Score</span>
                      </div>
                    </div>
                  </div>
                  {/* Data rows */}
                  <div className="space-y-0">
                    {[
                      { l: "Tier", v: "Prime", green: true },
                      { l: "Ceiling", v: "$210K", green: false },
                      { l: "Credit Quality", v: "17/20", green: false },
                      { l: "Risk Signals", v: "Clear", green: true },
                      { l: "Mode", v: "Pre-Funding", green: false },
                    ].map(r => (
                      <div key={r.l} className="flex items-center justify-between py-2.5 border-t border-white/[0.04]">
                        <span className="text-[12px] text-white/25">{r.l}</span>
                        <span className={`text-[12px] font-medium ${r.green ? 'text-[#5CECC6]' : 'text-white/60'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right features */}
            <div className="space-y-16">
              <div className="flex items-start gap-5">
                <div className="w-[56px] h-[56px] rounded-full border border-[#d0d0d0] flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>
                </div>
                <div>
                  <h3 className="text-[18px] text-[#0f2922] mb-2 font-medium" style={{ fontFamily: "'Georgia', serif" }}>Transparent</h3>
                  <p className="text-[14px] text-[#0f2922]/45 leading-[1.65]">See exactly how every component<br />of your score is calculated.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-[56px] h-[56px] rounded-full border border-[#d0d0d0] flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5CECC6" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div>
                  <h3 className="text-[18px] text-[#0f2922] mb-2 font-medium" style={{ fontFamily: "'Georgia', serif" }}>Seamless</h3>
                  <p className="text-[14px] text-[#0f2922]/45 leading-[1.65]">Upload, analyze, and get your<br />action plan — all in one flow.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ THE STACK — dark bg, isometric visualization ══════ */}
      <section className="relative bg-[#0f2922] py-24 sm:py-32 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[52px] md:text-[68px] font-normal text-white tracking-[-0.02em]" style={{ fontFamily: "'Georgia', serif" }}>
              The <span className="text-[#5CECC6] italic">MentXr</span> Stack
            </h2>
          </div>

          {/* Isometric 3D columns */}
          <div className="relative max-w-[700px] mx-auto" style={{ perspective: '800px' }}>
            <div className="relative" style={{ transform: 'rotateX(55deg) rotateZ(-45deg)', transformStyle: 'preserve-3d', height: 320 }}>
              {/* Base platforms */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[220px] rounded-md" style={{ background: 'rgba(92,236,198,0.06)', border: '1px solid rgba(92,236,198,0.1)', transform: 'translateZ(0px)' }} />
              <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-[360px] h-[180px] rounded-md" style={{ background: 'rgba(92,236,198,0.08)', border: '1px solid rgba(92,236,198,0.12)', transform: 'translateZ(30px)' }} />
              <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[300px] h-[140px] rounded-md" style={{ background: 'rgba(92,236,198,0.1)', border: '1px solid rgba(92,236,198,0.15)', transform: 'translateZ(60px)' }} />

              {/* Columns */}
              {[
                { x: -100, y: -20, h: 90, label: "Capital" },
                { x: -60, y: -30, h: 120, label: "Credit" },
                { x: -20, y: -10, h: 150, label: "Scoring" },
                { x: 20, y: -25, h: 130, label: "Denial" },
                { x: 60, y: -15, h: 110, label: "Repair" },
                { x: 100, y: -35, h: 100, label: "Mentors" },
                { x: 140, y: -20, h: 80, label: "Risk" },
              ].map((col, i) => (
                <div key={i} className="absolute" style={{
                  left: `calc(50% + ${col.x}px)`,
                  bottom: `${90 + col.y}px`,
                  width: 32,
                  height: col.h,
                  background: `linear-gradient(180deg, rgba(92,236,198,0.5) 0%, rgba(92,236,198,0.15) 100%)`,
                  border: '1px solid rgba(92,236,198,0.3)',
                  borderRadius: 3,
                  transform: `translateZ(${70 + i * 5}px)`,
                  boxShadow: '0 0 15px rgba(92,236,198,0.1)',
                }}>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-[#5CECC6]/40 font-mono whitespace-nowrap" style={{ transform: 'translateX(-50%) rotate(45deg)', transformOrigin: 'top center' }}>{col.label}</span>
                </div>
              ))}
            </div>

            {/* Platform labels */}
            <div className="flex justify-center gap-12 mt-4 text-[10px] font-mono text-[#5CECC6]/30">
              <span>Intelligence Engine</span>
              <span>AI Layer</span>
              <span>Data Core</span>
            </div>
          </div>

          {/* Four corner text blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-8 mt-16 max-w-[900px] mx-auto">
            <p className="text-[14px] text-[#5CECC6]/70 leading-[1.8]">
              Capital scoring and AI mentorship are two flagship applications built on MentXr's engine. But they are just the tip of the iceberg.
            </p>
            <p className="text-[14px] text-white/40 leading-[1.8]">
              High performance analysis is built natively. These financial primitives on the intelligence engine are accessible to all features, which support familiar financial tooling. The scoring engine and AI layer exist as one unified state, unlocking applications that simultaneously require performance, accuracy, and programmability.
            </p>
            <p className="text-[14px] text-[#5CECC6]/70 leading-[1.8]">
              Credit repair, denial simulation, and 7 AI mentors interact seamlessly with the scoring engine to let anyone analyze, repair, and apply, all in one place.
            </p>
            <p className="text-[14px] text-white/40 leading-[1.8]">
              The foundation of MentXr is its 6-component underwriting engine, which processes your financial profile through real bank criteria. The state comprises all applications, built on the intelligence engine and the AI layer.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-[800px] mx-auto border-t border-white/[0.06] pt-12">
            {[
              { label: "Score Components", value: "6" },
              { label: "AI Mentors", value: "7" },
              { label: "Max TPS", value: "40+" },
              { label: "Approval Rate", value: "89%" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[32px] sm:text-[40px] font-normal text-white mb-1 tracking-[-0.02em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                <p className="text-[12px] text-white/25">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ COMMUNITY FIRST — light mint bg with topo lines ══════ */}
      <section className="relative py-36 sm:py-48 overflow-hidden" style={{ background: '#e5f5f0' }}>
        {/* Topographic contour lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
          {[...Array(18)].map((_, i) => {
            const y = 50 + i * 38;
            const amp = 60 + Math.sin(i * 0.5) * 30;
            const off = Math.sin(i * 0.8) * 50;
            return (
              <path key={i} d={`M-100 ${y + off} Q200 ${y - amp + off} 400 ${y + off} Q600 ${y + amp + off} 800 ${y + off} Q1000 ${y - amp + off} 1300 ${y + off}`} stroke="#b0d8cc" strokeWidth="1" opacity="0.5" />
            );
          })}
        </svg>

        <div className="relative z-10 max-w-[900px] mx-auto text-center px-6 sm:px-12">
          <p className="text-[16px] sm:text-[18px] text-[#0f2922]/60 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            No gatekeepers. No hidden fees. No credit pull.
          </p>
          <h2 className="text-[52px] sm:text-[80px] md:text-[100px] font-normal text-[#0f2922] leading-[1.0] tracking-[-0.03em]" style={{ fontFamily: "'Georgia', serif" }}>
            Community first.
          </h2>
        </div>
      </section>

      {/* ══════ CTA + buttons ══════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden" style={{ background: '#e5f5f0' }}>
        <div className="relative z-10 max-w-[600px] mx-auto text-center px-6 sm:px-12">
          <p className="text-[15px] text-[#0f2922]/45 leading-[1.75] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            Anyone can access, analyze, and improve their Capital Readiness through MentXr — completely free.
          </p>
          <p className="text-[15px] text-[#0f2922]/35 mb-10" style={{ fontFamily: "'Georgia', serif" }}>
            Own your funding journey today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              data-testid="button-join-bottom"
              onClick={() => setShowLogin(true)}
              className="h-[46px] px-7 rounded-full border border-[#0f2922]/20 text-[#0f2922] text-[14px] font-medium hover:border-[#0f2922]/40 transition-all"
            >
              Start Analyzing
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="h-[46px] px-7 rounded-full border border-[#0f2922]/20 text-[#0f2922] text-[14px] font-medium hover:border-[#0f2922]/40 transition-all"
            >
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* ══════ GIANT BRAND WATERMARK — light mint bg ══════ */}
      <section className="relative overflow-hidden pb-0" style={{ background: '#e5f5f0' }}>
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 pb-8">
          {/* Giant brand name */}
          <div className="text-center py-16 sm:py-24">
            <h2 className="text-[60px] sm:text-[100px] md:text-[150px] lg:text-[200px] font-normal leading-none tracking-[-0.04em] text-[#0f2922] select-none" style={{ fontFamily: "'Georgia', serif" }}>
              Ment<span className="text-[#5CECC6] italic">Xr</span>
            </h2>
          </div>
          {/* Small logo icon top right like screenshot */}
          <div className="flex justify-end mb-4">
            <svg width="36" height="22" viewBox="0 0 36 22">
              <circle cx="10" cy="11" r="8" fill="#5CECC6"/>
              <circle cx="26" cy="11" r="8" fill="#5CECC6"/>
            </svg>
          </div>
          {/* Social icons row */}
          <div className="flex items-center justify-end gap-5 pb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f2922"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0f2922"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f2922"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f2922"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER — dark bar ══════ */}
      <footer className="bg-[#0a1914] px-6 sm:px-12 py-6">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-[13px] text-white/25">2026</span>
            <span className="text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer">Terms of Service</span>
            <span className="text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer">Privacy Policy</span>
          </div>
          <svg width="24" height="14" viewBox="0 0 24 14">
            <circle cx="6" cy="7" r="5.5" fill="#5CECC6"/>
            <circle cx="18" cy="7" r="5.5" fill="#5CECC6"/>
          </svg>
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer">Contact</span>
            <span className="text-[13px] text-white/25 hover:text-white/50 transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
