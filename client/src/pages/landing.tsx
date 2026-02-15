import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function HeroBlobs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement!.clientWidth;
      const h = canvas.parentElement!.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const metaball = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, t: number, seed: number) => {
      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const n1 = Math.sin(a * 2 + t * 1.2 + seed) * 0.22;
        const n2 = Math.cos(a * 3 + t * 0.9 + seed * 1.7) * 0.15;
        const n3 = Math.sin(a * 5 + t * 0.6 + seed * 0.5) * 0.08;
        const n4 = Math.cos(a * 1.5 + t * 1.5 + seed * 2.1) * 0.12;
        const r = radius * (1 + n1 + n2 + n3 + n4);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const blobs = [
      { bx: 0.25, by: 0.45, r: 0.28, seed: 0, alpha: 0.55, sx: 0.3, sy: 0.25 },
      { bx: 0.55, by: 0.30, r: 0.22, seed: 2.5, alpha: 0.45, sx: 0.4, sy: 0.35 },
      { bx: 0.70, by: 0.65, r: 0.18, seed: 5, alpha: 0.40, sx: 0.35, sy: 0.4 },
      { bx: 0.40, by: 0.70, r: 0.24, seed: 7.5, alpha: 0.50, sx: 0.25, sy: 0.3 },
      { bx: 0.15, by: 0.25, r: 0.15, seed: 10, alpha: 0.35, sx: 0.45, sy: 0.2 },
    ];

    const draw = () => {
      const w = canvas.parentElement!.clientWidth;
      const h = canvas.parentElement!.clientHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      ctx.fillStyle = '#0b1f19';
      ctx.fillRect(0, 0, w, h);

      const dim = Math.min(w, h);

      blobs.forEach(b => {
        const cx = (b.bx + Math.sin(time * b.sx + b.seed) * 0.04) * w;
        const cy = (b.by + Math.cos(time * b.sy + b.seed) * 0.03) * h;
        const r = b.r * dim;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.3);
        grad.addColorStop(0, `rgba(75, 210, 170, ${b.alpha})`);
        grad.addColorStop(0.4, `rgba(55, 185, 150, ${b.alpha * 0.6})`);
        grad.addColorStop(0.7, `rgba(35, 155, 125, ${b.alpha * 0.3})`);
        grad.addColorStop(1, `rgba(15, 120, 95, 0)`);

        ctx.save();
        metaball(ctx, cx, cy, r, time, b.seed);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = 'rgba(11, 31, 25, 0.08)';
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

function TopoPattern() {
  const paths: string[] = [];
  for (let i = 0; i < 20; i++) {
    const y = 30 + i * 35;
    const a1 = 55 + Math.sin(i * 0.6) * 25;
    const a2 = 45 + Math.cos(i * 0.4) * 20;
    const o = Math.sin(i * 0.9) * 40;
    paths.push(`M-100 ${y + o} Q200 ${y - a1 + o} 450 ${y + o} Q700 ${y + a2 + o} 950 ${y + o} Q1150 ${y - a1 + o} 1400 ${y + o}`);
  }
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
      {paths.map((d, i) => <path key={i} d={d} stroke="#a8d4c6" strokeWidth="1" opacity="0.45" />)}
    </svg>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { login } = useAuth();
  const [vis, setVis] = useState(false);

  useEffect(() => { setTimeout(() => setVis(true), 150); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try { await login(email); } catch { setIsLoading(false); }
  };

  const serif = "'Georgia', 'Times New Roman', serif";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1f19]">

      {/* ══ NAV ══ exactly matching: white bg, logo left, links + green pill button right */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white" style={{ borderBottom: '1px solid #ececec' }}>
        <div className="flex items-center justify-between px-5 sm:px-8 lg:px-12 h-[60px] max-w-[1440px] mx-auto">
          {/* Left: logo icon + brand name */}
          <div className="flex items-center gap-2">
            {/* Two-circle icon — like Hyperliquid's overlapping glasses */}
            <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
              <circle cx="10" cy="10" r="8.5" fill="#0b1f19" />
              <circle cx="22" cy="10" r="8.5" fill="#0b1f19" />
            </svg>
            <span style={{ fontFamily: serif, fontSize: 18, letterSpacing: -0.3 }}>
              <span style={{ color: '#0b1f19' }}>Ment</span>
              <span style={{ color: '#5ee8c5', fontStyle: 'italic' }}>Xr</span>
            </span>
          </div>

          {/* Right: nav links + Launch App button */}
          <div className="flex items-center gap-5 sm:gap-7">
            <span className="text-[14px] text-[#0b1f19]/70 cursor-pointer hover:text-[#0b1f19] transition-colors hidden sm:inline" style={{ fontFamily: serif }}>Stats</span>
            <span className="text-[14px] cursor-pointer hover:opacity-80 transition-colors hidden sm:inline" style={{ fontFamily: serif, color: '#5ee8c5' }}>Docs</span>
            <span className="text-[14px] text-[#0b1f19]/70 cursor-pointer hover:text-[#0b1f19] transition-colors hidden sm:inline" style={{ fontFamily: serif }}>Ecosystem</span>
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-full flex items-center justify-center"
              style={{ height: 38, paddingLeft: 20, paddingRight: 20, backgroundColor: '#5ee8c5', color: '#0b1f19', fontSize: 14, fontWeight: 500, fontFamily: serif, border: 'none', cursor: 'pointer' }}
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* ══ LOGIN MODAL ══ */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-[400px] mx-4" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 className="mb-2" style={{ fontFamily: serif, fontSize: 22, color: '#0b1f19' }}>Launch App</h3>
            <p style={{ fontSize: 14, color: '#0b1f19', opacity: 0.45, marginBottom: 24 }}>Enter your email to get free access.</p>
            <form onSubmit={handleLogin}>
              <input
                data-testid="input-email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
                style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid #e0e0e0', fontSize: 15, color: '#0b1f19', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: '#5ee8c5', color: '#0b1f19', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                {isLoading ? "Loading..." : "Get Free Access"}
              </button>
            </form>
            <p style={{ fontSize: 12, color: '#0b1f19', opacity: 0.25, marginTop: 16, textAlign: 'center' }}>Free forever. No credit card.</p>
          </div>
        </div>
      )}

      {/* ══ HERO ══ dark green bg, animated liquid blobs, centered text */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '100vh', paddingTop: 60, background: '#0b1f19' }}>
        <HeroBlobs />
        {/* Top gradient fade for smooth nav transition */}
        <div className="absolute top-0 left-0 right-0 h-[120px] pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(11,31,25,0.6) 0%, transparent 100%)' }} />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(11,31,25,0.8) 0%, transparent 100%)' }} />

        <div className="relative z-10 text-center px-6" style={{ maxWidth: 880 }}>
          {/* White circle icon — exactly like Hyper's */}
          <div
            style={{
              width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.88)',
              margin: '0 auto 48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
              opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.6s ease 0.1s',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#5ee8c5' }} />
          </div>

          {/* Headline — thin serif, large, exactly matching */}
          <h1
            data-testid="text-hero-headline"
            style={{
              fontFamily: serif, fontWeight: 300, color: 'white',
              fontSize: 'clamp(42px, 8vw, 94px)', lineHeight: 1.08, letterSpacing: '-0.02em',
              marginBottom: 36,
              opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.9s ease 0.2s',
            }}
          >
            The Platform To<br />House All Finance
          </h1>

          {/* Subtitle — centered, muted */}
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.45)', maxWidth: 440, margin: '0 auto 40px',
            opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s ease 0.4s',
          }}>
            Funding is fragmented today, but it doesn't need to be.
            For the first time, analyze your credit, build your score, and
            access mentorship on the same hyper-intelligent platform.
          </p>

          {/* Two buttons — outlined pills, side by side, exactly like "Start Trading" + "Start Building" */}
          <div
            style={{
              display: 'flex', justifyContent: 'center', gap: 12,
              opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.7s ease 0.5s',
            }}
          >
            <button
              data-testid="button-start-analyzing"
              onClick={() => setShowLogin(true)}
              style={{
                height: 44, padding: '0 28px', borderRadius: 22,
                border: '1px solid rgba(94,232,197,0.35)', background: 'transparent',
                color: '#5ee8c5', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(94,232,197,0.08)'; (e.target as HTMLElement).style.borderColor = 'rgba(94,232,197,0.55)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.borderColor = 'rgba(94,232,197,0.35)'; }}
            >
              Start Analyzing
            </button>
            <button
              data-testid="button-start-building"
              onClick={() => setShowLogin(true)}
              style={{
                height: 44, padding: '0 28px', borderRadius: 22,
                border: '1px solid rgba(94,232,197,0.35)', background: 'transparent',
                color: '#5ee8c5', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(94,232,197,0.08)'; (e.target as HTMLElement).style.borderColor = 'rgba(94,232,197,0.55)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.borderColor = 'rgba(94,232,197,0.35)'; }}
            >
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* ══ FEATURES — white bg, spaced green letters, app card center, 4 features ══ */}
      <section style={{ background: '#ffffff', padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Title with spaced mint letters */}
          <p style={{ textAlign: 'center', marginBottom: 80, fontFamily: serif, fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#0b1f19', lineHeight: 1.5 }}>
            The flagship application: the premier{' '}
            <span style={{ color: '#5ee8c5', letterSpacing: '0.25em' }}>CAPITAL READINESS</span>
            {' '}engine
          </p>

          {/* 3-column: left features, center card, right features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 48, alignItems: 'center' }} className="max-lg:!grid-cols-1">
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexDirection: 'row-reverse', textAlign: 'right' }} className="max-lg:!flex-row max-lg:!text-left">
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #d8d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5ee8c5" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 17, color: '#0b1f19', marginBottom: 6, fontStyle: 'italic' }}>Zero Manual Entry</h3>
                  <p style={{ fontSize: 14, color: '#0b1f19', opacity: 0.4, lineHeight: 1.65 }}>AI extracts 40+ data points<br />from your documents automatically.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexDirection: 'row-reverse', textAlign: 'right' }} className="max-lg:!flex-row max-lg:!text-left">
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #d8d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5ee8c5" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 17, color: '#0b1f19', marginBottom: 6, fontStyle: 'italic' }}>2.5x Exposure Logic</h3>
                  <p style={{ fontSize: 14, color: '#0b1f19', opacity: 0.4, lineHeight: 1.65 }}>Maximum fundable amount with<br />dynamic multiplier adjustments.</p>
                </div>
              </div>
            </div>

            {/* Center — dark app preview card */}
            <div style={{ width: 340, borderRadius: 16, background: '#0e2a22', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} className="max-lg:!mx-auto">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>MentXr® — Capital Readiness</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ee8c5' }} />
              </div>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <svg viewBox="0 0 100 100" width="96" height="96" style={{ display: 'block', margin: '0 auto 12px', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4.5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#5ee8c5" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="66" style={{ filter: 'drop-shadow(0 0 8px rgba(94,232,197,0.3))' }} />
                </svg>
                <span style={{ fontSize: 30, fontWeight: 700, color: 'white', fontFamily: "'JetBrains Mono', monospace", display: 'block' }}>75</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Capital Score</span>
              </div>
              <div style={{ padding: '0 24px 20px' }}>
                {[
                  { l: 'Tier', v: 'Prime', g: true },
                  { l: 'Ceiling', v: '$210K', g: false },
                  { l: 'Credit', v: '17/20', g: false },
                  { l: 'Risk', v: 'Clear', g: true },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>{r.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: r.g ? '#5ee8c5' : 'rgba(255,255,255,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #d8d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5ee8c5" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 17, color: '#0b1f19', marginBottom: 6, fontStyle: 'italic' }}>Transparent</h3>
                  <p style={{ fontSize: 14, color: '#0b1f19', opacity: 0.4, lineHeight: 1.65 }}>See exactly how every component<br />of your score is calculated.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #d8d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5ee8c5" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 17, color: '#0b1f19', marginBottom: 6, fontStyle: 'italic' }}>Seamless</h3>
                  <p style={{ fontSize: 14, color: '#0b1f19', opacity: 0.4, lineHeight: 1.65 }}>Upload, analyze, and get your<br />action plan — all in one flow.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ THE STACK — dark bg ══ */}
      <section style={{ background: '#0b1f19', padding: '100px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(36px, 5vw, 68px)', color: 'white', textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 64 }}>
            The <span style={{ color: '#5ee8c5', fontStyle: 'italic' }}>MentXr</span> Stack
          </h2>

          {/* Isometric columns visualization */}
          <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto', height: 360 }}>
            {/* Base layers */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) perspective(600px) rotateX(50deg) rotateZ(-45deg)', width: 400, height: 200, background: 'rgba(94,232,197,0.04)', border: '1px solid rgba(94,232,197,0.08)', borderRadius: 6 }} />
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%) perspective(600px) rotateX(50deg) rotateZ(-45deg)', width: 340, height: 160, background: 'rgba(94,232,197,0.06)', border: '1px solid rgba(94,232,197,0.1)', borderRadius: 6 }} />
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%) perspective(600px) rotateX(50deg) rotateZ(-45deg)', width: 280, height: 120, background: 'rgba(94,232,197,0.08)', border: '1px solid rgba(94,232,197,0.12)', borderRadius: 6 }} />

            {/* Column bars */}
            <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {[
                { h: 80, l: 'Capital' }, { h: 100, l: 'Credit' }, { h: 130, l: 'Scoring' },
                { h: 150, l: 'Denial\nSim' }, { h: 120, l: 'Repair' }, { h: 110, l: 'Mentors' },
                { h: 90, l: 'Risk' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: c.h, borderRadius: '3px 3px 0 0',
                    background: `linear-gradient(180deg, rgba(94,232,197,0.55) 0%, rgba(94,232,197,0.15) 100%)`,
                    border: '1px solid rgba(94,232,197,0.25)', borderBottom: 'none',
                    boxShadow: '0 0 12px rgba(94,232,197,0.08)',
                  }} />
                  <span style={{ fontSize: 8, color: 'rgba(94,232,197,0.35)', fontFamily: "'JetBrains Mono', monospace", marginTop: 4, textAlign: 'center', whiteSpace: 'pre-line' as const, lineHeight: 1.2 }}>{c.l}</span>
                </div>
              ))}
            </div>

            {/* Layer labels */}
            <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 40, fontSize: 9, color: 'rgba(94,232,197,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Intelligence Engine</span>
              <span>AI Layer</span>
              <span>Data Core</span>
            </div>
          </div>

          {/* 4 corner text blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 64px', marginTop: 48, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }} className="max-sm:!grid-cols-1">
            <p style={{ fontSize: 14, color: 'rgba(94,232,197,0.65)', lineHeight: 1.85 }}>
              Capital scoring and AI mentorship are two flagship applications built on MentXr's engine. But they are just the tip of the iceberg.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.85 }}>
              High performance analysis is built natively. These financial primitives on the intelligence engine are accessible to all features. The scoring engine and AI layer exist as one unified state, unlocking applications that simultaneously require performance, accuracy, and programmability.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(94,232,197,0.65)', lineHeight: 1.85 }}>
              Credit repair, denial simulation, and 7 AI mentors interact seamlessly with the engine to let anyone analyze, repair, and apply, all in one place.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.85 }}>
              The foundation of MentXr is its 6-component underwriting engine, which processes your financial profile through real bank criteria. The state comprises all applications, built on the intelligence engine and the AI layer.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 72, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 48 }} className="max-sm:!grid-cols-2">
            {[
              { l: 'Score Components', v: '6' },
              { l: 'AI Mentors', v: '7' },
              { l: 'Data Points', v: '40+' },
              { l: 'Approval Rate', v: '89%' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 400, color: 'white', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{s.v}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY FIRST — light mint, topo lines ══ */}
      <section style={{ background: '#e4f4ee', padding: '140px 0 100px', position: 'relative', overflow: 'hidden' }}>
        <TopoPattern />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontFamily: serif, fontSize: 17, color: '#0b1f19', opacity: 0.55, marginBottom: 12 }}>
            No gatekeepers. No hidden fees. No credit pull.
          </p>
          <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(52px, 8vw, 100px)', color: '#0b1f19', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
            Community first.
          </h2>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ background: '#e4f4ee', padding: '0 0 80px', position: 'relative' }}>
        <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 540, margin: '0 auto' }}>
          <p style={{ fontFamily: serif, fontSize: 15, color: '#0b1f19', opacity: 0.4, lineHeight: 1.75, marginBottom: 12 }}>
            Anyone can access, analyze, and improve their Capital Readiness through MentXr — completely free.
          </p>
          <p style={{ fontFamily: serif, fontSize: 15, color: '#0b1f19', opacity: 0.28, marginBottom: 36 }}>
            Own your funding journey today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              data-testid="button-join-bottom"
              onClick={() => setShowLogin(true)}
              style={{ height: 44, padding: '0 28px', borderRadius: 22, border: '1px solid rgba(11,31,25,0.18)', background: 'transparent', color: '#0b1f19', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Start Analyzing
            </button>
            <button
              onClick={() => setShowLogin(true)}
              style={{ height: 44, padding: '0 28px', borderRadius: 22, border: '1px solid rgba(11,31,25,0.18)', background: 'transparent', color: '#0b1f19', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* ══ GIANT BRAND ══ */}
      <section style={{ background: '#e4f4ee', padding: '60px 0 40px', position: 'relative' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(60px, 14vw, 200px)', color: '#0b1f19', textAlign: 'center', lineHeight: 0.95, letterSpacing: '-0.04em' }}>
            Ment<span style={{ color: '#5ee8c5', fontStyle: 'italic' }}>Xr</span><span style={{ opacity: 0.15 }}>®</span>
          </h2>
          {/* Logo + social row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 32 }}>
            <svg width="30" height="18" viewBox="0 0 30 18"><circle cx="8" cy="9" r="7" fill="#5ee8c5" /><circle cx="22" cy="9" r="7" fill="#5ee8c5" /></svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 12, paddingBottom: 8 }}>
            {/* X */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0b1f19"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            {/* Discord */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0b1f19"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
            {/* GitHub */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0b1f19"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            {/* Telegram */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0b1f19"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
          </div>
        </div>
      </section>

      {/* ══ FOOTER — dark bar ══ */}
      <footer style={{ background: '#091610', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>2026</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>Privacy Policy</span>
          </div>
          <svg width="24" height="14" viewBox="0 0 24 14"><circle cx="6" cy="7" r="5.5" fill="#5ee8c5" /><circle cx="18" cy="7" r="5.5" fill="#5ee8c5" /></svg>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>Contact</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
