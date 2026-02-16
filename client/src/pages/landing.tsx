import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    interface Blob {
      x: number; y: number;
      vx: number; vy: number;
      radius: number;
      opacity: number;
      phase: number;
      wobbleSpeed: number;
      wobbleAmp: number;
      points: number;
      squeezePhase: number;
      squeezeSpeed: number;
      squeezeAmount: number;
    }

    let blobs: Blob[] = [];
    let time = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const init = () => {
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight;

      const blobCount = Math.min(Math.floor((w * h) / 40000), 50);
      blobs = [];
      for (let i = 0; i < blobCount; i++) {
        const speed = Math.random() * 1.0 + 0.5;
        const angle = Math.random() * Math.PI * 2;
        blobs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 100 + 50,
          opacity: Math.random() * 0.18 + 0.1,
          phase: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 1.2 + 0.5,
          wobbleAmp: Math.random() * 0.35 + 0.15,
          points: Math.floor(Math.random() * 4) + 6,
          squeezePhase: Math.random() * Math.PI * 2,
          squeezeSpeed: Math.random() * 1.5 + 0.6,
          squeezeAmount: Math.random() * 0.4 + 0.25,
        });
      }
    };

    const drawBlob = (b: Blob) => {
      const breathe = Math.sin(time * 0.6 + b.phase) * 0.12 + 1;
      const r = b.radius * breathe;

      const sqz = Math.sin(time * b.squeezeSpeed + b.squeezePhase) * b.squeezeAmount;
      const scaleX = 1 + sqz;
      const scaleY = 1 - sqz;

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < b.points; i++) {
        const a = (Math.PI * 2 / b.points) * i;
        const wobble = Math.sin(time * b.wobbleSpeed + b.phase + i * 1.3) * b.wobbleAmp;
        const dist = r * (1 + wobble);
        pts.push({
          x: b.x + Math.cos(a) * dist * scaleX,
          y: b.y + Math.sin(a) * dist * scaleY,
        });
      }

      ctx.beginPath();
      ctx.moveTo(
        (pts[pts.length - 1].x + pts[0].x) / 2,
        (pts[pts.length - 1].y + pts[0].y) / 2
      );
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + next.x) / 2, (pts[i].y + next.y) / 2);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 1.3);
      grad.addColorStop(0, `rgba(155, 155, 172, ${b.opacity * 1.5})`);
      grad.addColorStop(0.35, `rgba(145, 145, 165, ${b.opacity * 1.1})`);
      grad.addColorStop(0.65, `rgba(135, 135, 155, ${b.opacity * 0.55})`);
      grad.addColorStop(1, `rgba(125, 125, 145, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      const edgeGrad = ctx.createRadialGradient(b.x, b.y, r * 0.6, b.x, b.y, r * 1.1);
      edgeGrad.addColorStop(0, `rgba(170, 170, 185, 0)`);
      edgeGrad.addColorStop(0.7, `rgba(165, 165, 182, ${b.opacity * 0.45})`);
      edgeGrad.addColorStop(1, `rgba(165, 165, 182, 0)`);
      ctx.fillStyle = edgeGrad;
      ctx.fill();
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        const margin = b.radius * 2;
        if (b.x < -margin) b.x = w + margin;
        if (b.x > w + margin) b.x = -margin;
        if (b.y < -margin) b.y = h + margin;
        if (b.y > h + margin) b.y = -margin;
        drawBlob(b);
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    const resizeHandler = () => { resize(); init(); };
    window.addEventListener('resize', resizeHandler);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}

const gradientText = (dir = '180deg', _from = 0.85, _to = 0.5) => ({
  backgroundImage: `linear-gradient(${dir}, #000000 0%, #2a2a4a 45%, #6a6a8a 100%)`,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
  fontStyle: 'italic' as const,
  lineHeight: '0.95',
});

const sectionBg = { background: 'transparent' };

const contentBlockStyle = "relative z-30 rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 sm:p-8";

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[11px] tracking-[0.2em] uppercase mb-6 sm:mb-8 text-[#7a7a9a]">{children}</p>
);

const SubscribeButton = ({ className = "" }: { className?: string }) => (
  <button
    onClick={() => window.location.href = '/subscription'}
    className={`inline-flex items-center justify-center h-[44px] px-8 rounded-full text-white text-[13px] font-bold tracking-wide hover:opacity-90 transition-all hover:scale-[1.02] shadow-sm ${className}`}
    style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
    data-testid="button-subscribe"
  >
    SUBSCRIBE NOW
  </button>
);

const ScrollArrow = ({ targetId }: { targetId: string }) => (
  <button
    onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })}
    className="relative z-30 flex justify-center w-full mt-10 group cursor-pointer"
    aria-label="Scroll to next section"
    data-testid={`arrow-to-${targetId}`}
  >
    <div className="w-10 h-10 flex items-center justify-center rounded-full border border-[#d0d0de] bg-white/80 hover:bg-white transition-colors shadow-sm animate-bounce-slow">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3.5V14.5M9 14.5L4 9.5M9 14.5L14 9.5" stroke="#7a7a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </button>
);

const faqItems = [
  { q: "Do I need perfect credit to use MentXr?", a: "No. MentXr works for all credit profiles — from thin files to complex portfolios. Our engine evaluates 6 capital components and places you in the right tier with a clear action plan, whether you're Prime-eligible or in Repair mode." },
  { q: "How is this different from a credit monitoring app?", a: "Credit monitoring shows you a score. MentXr tells you what that score means to a lender, what products you actually qualify for, what will get you denied, and exactly how to fix it. It's underwriting intelligence, not a dashboard." },
  { q: "What documents do I need to upload?", a: "Start with your credit report (from any bureau) and your most recent bank statement. Our AI extracts over 40 data points automatically — no manual entry required." },
  { q: "How accurate is the denial simulation?", a: "Our denial engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials before you ever submit an application." },
  { q: "Is my financial data secure?", a: "All data is encrypted in transit and at rest. We never share your financial information with lenders, brokers, or third parties. Your data is used solely to generate your Capital Readiness analysis." },
  { q: "What's included with a subscription?", a: "Your subscription includes your full Capital Readiness Score, 6-component breakdown, tier eligibility, operating mode analysis, denial simulation, AI mentor chat, and credit repair recommendations — all 30 analyses per month." },
  { q: "Can I use this to prepare for an SBA loan?", a: "Absolutely. MentXr evaluates you against SBA 7(a) and 504 underwriting criteria. You'll see exactly where you stand, what flags exist, and what to fix before applying." },
];

const proofMessages = [
  "Jay just sought out tax advice from Marcus Allen.",
  "$50K just funded",
  "Sofia connected with branding expert Elena Cruz.",
  "$100K just funded",
  "David started a strategy session with Ryan Cole.",
  "Mia asked investment insights from Andre Thompson.",
  "$75K just funded",
  "Liam requested growth advice from Chloe Bennett.",
  "Aisha connected with startup mentor Victor Hale.",
  "$200K just funded",
  "Noah sought marketing guidance from Isabella Reed.",
  "Emma started a leadership conversation with Daniel Brooks.",
  "$35K just funded",
  "Lucas tapped into real estate insights from Carter Hayes.",
  "Ava requested funding strategy from Marcus Allen.",
  "$150K just funded",
  "Ethan connected with e-commerce expert Natalie Shaw.",
  "Olivia sought content strategy advice from Jordan Blake.",
  "Mason started a business scaling session with Priya Desai.",
  "$90K just funded",
  "$250K just funded",
  "$120K just funded",
  "$300K just funded",
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login } = useAuth();
  const [proofIndex, setProofIndex] = useState(0);
  const [proofVisible, setProofVisible] = useState(true);

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
    if (!email) return;
    setIsLoading(true);
    try {
      await login(email);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-[#1a1a2e] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #ffffff 0%, #f5f5fc 12%, #eef0fa 25%, #f8f8ff 40%, #f2f0fb 55%, #f6f5fc 70%, #f0eff8 85%, #eceaf5 100%)' }}>
      <SpaceBackground />

      <div
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#e0e0e8] shadow-lg shadow-black/8"
        style={{
          transition: "opacity 0.5s ease, transform 0.5s ease",
          opacity: proofVisible ? 1 : 0,
          transform: proofVisible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-[#2a2a2a] animate-pulse shrink-0"></span>
        <span className="text-[12px] sm:text-[13px] text-[#3a3a5a] font-medium whitespace-nowrap">{proofMessages[proofIndex]}</span>
      </div>

      <div className="sticky top-0 z-50 w-full flex justify-center px-6 sm:px-10 pt-4" data-testid="nav-top">
        <nav className="flex items-center justify-between w-full max-w-[900px] h-[52px] bg-white/95 rounded-full px-2.5 pl-3 shadow-lg shadow-black/15">
          <div className="flex items-center gap-2 bg-[#f0f0f8] rounded-full px-3.5 py-1.5" data-testid="nav-logo">
            <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center animate-logo-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
            <span className="text-[12.5px] font-semibold tracking-[0.03em] text-[#1a1a1a]">MentXr<span className="text-[8px] align-super">®</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#features" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-features">Features</a>
            <a href="#results" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-results">Results</a>
            <a href="#faq" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-faq">FAQ</a>
          </div>

          <button
            onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-email"]')?.focus()}
            className="rounded-full px-5 py-2 text-[12.5px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
            data-testid="button-get-started"
          >
            Subscribe
          </button>
        </nav>
      </div>

      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section id="sec-hero" className="relative z-20 min-h-[90vh] flex flex-col items-center justify-center px-6 sm:px-12 md:px-20 lg:px-28 py-20 text-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)' }} />
        <div className="relative max-w-[900px] mx-auto">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#6a6a8a] mb-6" data-testid="text-hero-label">Digital Underwriting Engine</p>
          <h1
            className="text-[38px] sm:text-[56px] md:text-[72px] lg:text-[88px] uppercase italic leading-[0.85] mb-8"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em', backgroundImage: 'linear-gradient(180deg, #000000 0%, #3a3a5a 50%, #7a7a9a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            data-testid="text-hero-headline"
          >
            Know Exactly<br />Where You Stand<br />Before You Apply
          </h1>
          <p className="text-[13px] sm:text-[17px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.8] max-w-[560px] mx-auto mb-10 text-justify-smart-center">
            MentXr&reg; runs your financial profile through real underwriting logic — the same criteria banks use to approve or deny you. Get your Capital Readiness Score, exposure ceiling, tier eligibility, and denial risk before you ever submit an application.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#f5f5fa] border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab0] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 border-t border-[#e0e0ea] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
                style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
              >
                {isLoading ? "..." : "SUBSCRIBE"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#8a8aa5] tracking-wide">
            <span>Full platform access</span>
            <span className="w-1 h-1 rounded-full bg-[#c0c0d0]"></span>
            <span>Cancel anytime</span>
            <span className="w-1 h-1 rounded-full bg-[#c0c0d0]"></span>
            <span>30 analyses / month</span>
          </div>
          <ScrollArrow targetId="sec-problem" />
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM / PAIN ═══════════════ */}
      <section id="sec-problem" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-10 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            73% of funding applications get denied. Most founders never find out why until it's too late.
          </h2>
          <div className={`${contentBlockStyle} !p-5 sm:!p-6`}><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { num: "01", text: "You apply for funding with no idea how a lender actually evaluates you" },
              { num: "02", text: "Credit scores alone don't tell you what products you qualify for" },
              { num: "03", text: "Hidden risk signals silently kill your application before a human reviews it" },
              { num: "04", text: "Every denial leaves an inquiry on your report, making the next application harder" },
            ].map((item) => (
              <div key={item.num} className="flex gap-4 items-start p-5 rounded-xl bg-[#f8f8fc] border border-[#e0e0ea]">
                <span className="text-[11px] font-mono text-[#8a8aa5] shrink-0 mt-0.5">{item.num}</span>
                <p className="text-[11px] sm:text-[14px] text-[#5a5a7a] leading-[1.6] sm:leading-[1.7] text-justify-smart">{item.text}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-solution" />
        </div>
      </section>

      {/* ═══════════════ 3. SOLUTION OVERVIEW ═══════════════ */}
      <section id="sec-solution" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            AI-powered underwriting intelligence that tells you exactly what to fix — before you apply.
          </h2>
          <p className="text-[12px] sm:text-[16px] text-[#6a6a8a] leading-[1.6] sm:leading-[1.8] mb-12 max-w-[640px] mx-auto text-justify-smart-center">
            MentXr® analyzes your credit report and bank statements using the same 6-component framework real lenders use. You get a Capital Readiness Score, tier placement, exposure ceiling, denial simulation, and a step-by-step action plan — all powered by AI.
          </p>
          <div className={contentBlockStyle}><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Capital Readiness Score", val: "0–100" },
              { label: "Exposure Ceiling", val: "2.5x Logic" },
              { label: "Tier Eligibility", val: "3 Tiers" },
              { label: "Denial Simulation", val: "Pre-Screen" },
              { label: "AI Mentor Chat", val: "7 Bots" },
              { label: "Credit Repair", val: "Auto Letters" },
            ].map((item) => (
              <div key={item.label} className="p-4 sm:p-5 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
                <p className="text-[20px] sm:text-[24px] font-mono text-[#3a3a5a] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</p>
                <p className="text-[11px] text-[#8a8aa5] tracking-wide uppercase">{item.label}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="how-it-works" />
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Four steps from unknown to underwriting-ready.
          </h2>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { step: "01", title: "Upload Your Documents", desc: "Drop in your credit report and bank statement. Our AI extracts 40+ data points automatically — no manual entry." },
              { step: "02", title: "Get Your Capital Readiness Score", desc: "We evaluate 6 components: Capital Strength, Credit Quality, Management & Structure, Cash Flow, Liquidity, and Risk Signals." },
              { step: "03", title: "See Your Tier & Exposure Ceiling", desc: "Find out if you're Prime, Mid-Tier, or Alternative eligible — and your maximum fundable amount using 2.5x exposure logic." },
              { step: "04", title: "Run Denial Simulation & Fix Issues", desc: "Our engine flags every underwriting trigger that would cause a denial. Get auto-generated dispute letters and a repair timeline." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-6 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
                <div className="w-12 h-12 rounded-full bg-[#f2f2f8] border border-[#e0e0ea] flex items-center justify-center mb-4">
                  <span className="text-[13px] font-mono text-[#5a5a7a]">{item.step}</span>
                </div>
                <h3 className="text-[16px] sm:text-[18px] text-[#1a1a2e] font-medium mb-2">{item.title}</h3>
                <p className="text-[11px] sm:text-[14px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.7] text-justify-smart-center">{item.desc}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="features" />
        </div>
      </section>

      {/* ═══════════════ 5. FUNDING OUTCOMES ═══════════════ */}
      <section id="features" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Everything you need to walk into a lender's office with confidence.
          </h2>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "◎", title: "Capital Readiness Score", desc: "A 0–100 composite score based on 6 weighted underwriting components" },
              { icon: "⬡", title: "2.5x Exposure Ceiling", desc: "Your maximum fundable amount calculated with dynamic multiplier adjustments" },
              { icon: "◈", title: "Tier Eligibility Report", desc: "Know if you qualify for Prime, Mid-Tier, or Alternative capital products" },
              { icon: "⊘", title: "Denial Simulation", desc: "Pre-screen every trigger that would cause a real lender to decline your file" },
              { icon: "◇", title: "Credit Repair Plan", desc: "AI-parsed issues with auto-generated dispute letters for all 3 bureaus" },
              { icon: "△", title: "AI Mentor Access", desc: "7 specialized AI mentors for sales, investing, marketing, leadership, and more" },
              { icon: "▣", title: "Operating Mode Engine", desc: "Pre-Funding or Repair mode with tailored action sequences" },
              { icon: "◐", title: "Risk Signal Detection", desc: "Identifies liens, judgments, utilization spikes, and velocity flags" },
              { icon: "⬢", title: "Personalized Next Steps", desc: "AI-generated action plan prioritized by impact on your fundability" },
            ].map((item) => (
              <div key={item.title} className="p-5 sm:p-6 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50 group hover:bg-[#f2f2f8]/70 transition-colors">
                <span className="text-[20px] text-[#8a8aa5] mb-4 block">{item.icon}</span>
                <h3 className="text-[14px] sm:text-[15px] text-[#1a1a2e] font-medium mb-2">{item.title}</h3>
                <p className="text-[11px] sm:text-[13px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.7] text-justify-smart">{item.desc}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="results" />
        </div>
      </section>

      {/* ═══════════════ 6. SOCIAL PROOF ═══════════════ */}
      <section id="results" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Results</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Founders are getting funded with clarity, not luck.
          </h2>

          <div className={`${contentBlockStyle} mb-14`}><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: "12,500+", label: "Founders Analyzed" },
              { val: "$47M+", label: "Capital Deployed" },
              { val: "89%", label: "Approval Rate" },
              { val: "6.2x", label: "Avg Score Improvement" },
            ].map((s) => (
              <div key={s.label} className="text-center p-5 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
                <p className="text-[24px] sm:text-[30px] font-mono text-[#3a3a5a] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
                <p className="text-[10px] sm:text-[11px] text-[#8a8aa5] tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div></div>

          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Marcus T.", role: "E-commerce Founder", quote: "I went from a 42 to a 78 Capital Readiness Score in 60 days. Got approved for a $250K line of credit on the first try." },
              { name: "Aisha K.", role: "Real Estate Investor", quote: "The denial simulation caught 3 triggers I didn't know existed. Fixed them all before applying — approved same week." },
              { name: "David L.", role: "SaaS Startup CEO", quote: "MentXr showed me I was Mid-Tier when I thought I was Prime. After following the repair plan, I moved up and saved 4% on rates." },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
                <p className="text-[11px] sm:text-[13px] text-[#6a6a8a] leading-[1.6] sm:leading-[1.8] mb-5 italic text-justify-smart">"{t.quote}"</p>
                <div>
                  <p className="text-[13px] text-[#3a3a5a] font-medium">{t.name}</p>
                  <p className="text-[11px] text-[#8a8aa5]">{t.role}</p>
                </div>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-risk" />
        </div>
      </section>

      {/* ═══════════════ 7. RISK REVERSAL ═══════════════ */}
      <section id="sec-risk" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>No More Guessing</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            Stop applying blind. Start applying ready.
          </h2>
          <p className="text-[12px] sm:text-[15px] text-[#6a6a8a] leading-[1.6] sm:leading-[1.8] mb-12 max-w-[600px] mx-auto text-justify-smart-center">
            Every denied application costs you: hard inquiries, wasted time, damaged confidence. MentXr eliminates the guesswork by showing you exactly what a lender sees — before you ever submit.
          </p>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-red-400/30 mb-4">Without MentXr</p>
              <ul className="space-y-3">
                {["Guess at eligibility", "Apply to multiple lenders", "Accumulate hard inquiries", "Get denied without explanation", "Repeat the cycle"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-[#3a3a5a] leading-[1.6]">
                    <span className="text-red-400/25 mt-0.5 shrink-0">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-[#e0e0ea]/50 bg-[#f8f8fc]/60">
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#6a6a8a] mb-4">With MentXr</p>
              <ul className="space-y-3">
                {["Know your exact tier & ceiling", "Fix issues before applying", "Apply once, with confidence", "Get approved on first submission", "Build on momentum"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-[#5a5a7a] leading-[1.6]">
                    <span className="text-[#6a6a8a] mt-0.5 shrink-0">→</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-breakdown" />
        </div>
      </section>

      {/* ═══════════════ 8. FEATURE BREAKDOWN ═══════════════ */}
      <section id="sec-breakdown" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Feature Breakdown</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Six components. One score. Complete clarity.
          </h2>
          <div className={contentBlockStyle}><div className="space-y-3">
            {[
              { name: "Capital Strength", weight: "0–20 pts", desc: "Revenue, assets, collateral position, and business capitalization" },
              { name: "Credit Quality", weight: "0–20 pts", desc: "FICO, payment history, derogatory marks, utilization ratios" },
              { name: "Management & Structure", weight: "0–15 pts", desc: "Entity type, years in business, ownership structure, EIN status" },
              { name: "Earnings & Cash Flow", weight: "0–15 pts", desc: "Monthly revenue trends, DSCR, cash reserves, deposit consistency" },
              { name: "Liquidity & Leverage", weight: "0–15 pts", desc: "Debt-to-income, current ratio, available credit, existing obligations" },
              { name: "Risk Signals", weight: "0–15 pts", desc: "Liens, judgments, NSFs, velocity flags, recent inquiries, collections" },
            ].map((c) => (
              <div key={c.name} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-5 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
                <div className="flex items-center gap-4 sm:w-[200px] shrink-0">
                  <span className="text-[14px] sm:text-[15px] text-[#3a3a5a] font-medium">{c.name}</span>
                </div>
                <span className="text-[12px] font-mono text-[#3a3a5a] sm:w-[80px] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.weight}</span>
                <p className="text-[10px] sm:text-[13px] text-[#8a8aa5] leading-[1.5] sm:leading-[1.6] text-justify-smart">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-[#f2f2f8]/60 border border-[#e0e0ea]/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
              <span className="text-[15px] text-[#1a1a2e] font-medium">Total: 0–100 pts</span>
              <span className="text-[12px] text-[#8a8aa5]">→ Qualification Range: $25K – $5M+ based on composite score and tier placement</span>
            </div>
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-modes" />
        </div>
      </section>

      {/* ═══════════════ 9. MODE DIFFERENTIATION ═══════════════ */}
      <section id="sec-modes" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Operating Modes</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Two modes. One goal: get you funded.
          </h2>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-[#6a6a8a]">Pre-Funding Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-[#1a1a2e] font-light mb-4 tracking-[-0.02em]">Score 60+</h3>
              <p className="text-[11px] sm:text-[13px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.8] mb-6 text-justify-smart">
                You're fundable. This mode focuses on optimization — maximizing your ceiling, refining your tier placement, and identifying the best products for your profile.
              </p>
              <ul className="space-y-2.5">
                {["Tier 1–2 product matching", "Exposure ceiling maximization", "Application timing strategy", "Rate optimization guidance"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-[#6a6a8a]">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 sm:p-8 rounded-xl bg-[#f8f8fc]/60 border border-[#e0e0ea]/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#c0c0d0] border border-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-[#6a6a8a]">Repair Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-[#1a1a2e] font-light mb-4 tracking-[-0.02em]">Score &lt;60</h3>
              <p className="text-[11px] sm:text-[13px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.8] mb-6 text-justify-smart">
                You need work before applying. This mode focuses on fixing issues — dispute letters, payment optimization, structure corrections, and timeline to fundability.
              </p>
              <ul className="space-y-2.5">
                {["Auto-generated dispute letters", "Credit issue prioritization", "90-day repair timeline", "Score impact projections"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-[#6a6a8a]">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-tiers" />
        </div>
      </section>

      {/* ═══════════════ 10. TIER POSITIONING ═══════════════ */}
      <section id="sec-tiers" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Tier Eligibility</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Three tiers. Know which one you belong to.
          </h2>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "Tier 1", name: "Prime Capital", score: "75–100", products: "SBA 7(a) & 504, Conventional LOC, Term Loans, Equipment Finance", color: "border-[#3C3C3C]/30" },
              { tier: "Tier 2", name: "Mid-Tier", score: "50–74", products: "Revenue-Based Lending, Invoice Factoring, Merchant Cash Advance, Bridge Loans", color: "border-[#303030]/30" },
              { tier: "Tier 3", name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builder Programs, Community Development Loans", color: "border-[#404040]/30" },
            ].map((t) => (
              <div key={t.tier} className={`p-6 rounded-xl bg-[#f8f8fc]/60 border ${t.color}`}>
                <span className="text-[10px] font-mono text-[#8a8aa5] tracking-wider uppercase">{t.tier}</span>
                <h3 className="text-[18px] sm:text-[20px] text-[#1a1a2e] font-medium mt-2 mb-1">{t.name}</h3>
                <p className="text-[13px] font-mono text-[#6a6a8a] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Score: {t.score}</p>
                <p className="text-[10px] sm:text-[12px] text-[#8a8aa5] leading-[1.5] sm:leading-[1.7] text-justify-smart">{t.products}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-case" />
        </div>
      </section>

      {/* ═══════════════ 11. CASE STUDY ═══════════════ */}
      <section id="sec-case" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>Example Walkthrough</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            How a 38-score founder became funding-ready in 67 days.
          </h2>

          <div className={contentBlockStyle}><div className="space-y-0">
            {[
              { day: "Day 1", title: "Initial Analysis", detail: "Score: 38/100. Tier 3 (Alternative). 4 denial triggers flagged: high utilization (78%), 2 collections, thin business file, no EIN separation." },
              { day: "Day 3", title: "Repair Plan Generated", detail: "MentXr auto-generated 6 dispute letters (2 per bureau), created a 90-day utilization reduction plan, and recommended EIN registration + business bank account." },
              { day: "Day 30", title: "First Checkpoint", detail: "Score: 52/100. Moved to Tier 2. 1 collection removed. Utilization down to 45%. Business structure improved. Exposure ceiling: $85K." },
              { day: "Day 67", title: "Funding Ready", detail: "Score: 71/100. Tier 2 (upper). 0 denial triggers. Utilization: 22%. Clean business file. Exposure ceiling: $210K. Applied for $175K LOC — approved in 5 days." },
            ].map((step) => (
              <div key={step.day} className="flex gap-6 sm:gap-8 py-7 border-t border-[#e8e8f0] first:border-t-0">
                <div className="w-[70px] shrink-0">
                  <span className="text-[12px] font-mono text-[#6a6a8a]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step.day}</span>
                </div>
                <div>
                  <h3 className="text-[15px] text-[#1a1a2e] font-medium mb-2">{step.title}</h3>
                  <p className="text-[11px] sm:text-[13px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.7] text-justify-smart">{step.detail}</p>
                </div>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="faq" />
        </div>
      </section>

      {/* ═══════════════ 12. FAQ / OBJECTION HANDLING ═══════════════ */}
      <section id="faq" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[700px] mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Common questions, straight answers.
          </h2>
          <div className={contentBlockStyle}><div className="space-y-0">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-[#404040]">
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] sm:text-[15px] font-medium text-[#3a3a5a] group-hover:text-[#1a1a2e] transition-colors pr-4">{item.q}</span>
                  <span className="text-[18px] text-[#9a9ab0] shrink-0 leading-none transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="pb-5">
                    <p className="text-[11px] sm:text-[13px] text-[#3a3a5a] leading-[1.6] sm:leading-[1.8] text-justify-smart">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-trust" />
        </div>
      </section>

      {/* ═══════════════ 13. TRUST & COMPLIANCE ═══════════════ */}
      <section id="sec-trust" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#e8e8f0] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>Trust & Security</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Your data. Your control. Always.
          </h2>
          <div className={contentBlockStyle}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⬡", title: "Encrypted", desc: "AES-256 encryption at rest and TLS 1.3 in transit" },
              { icon: "◎", title: "Private", desc: "We never share data with lenders, brokers, or third parties" },
              { icon: "◇", title: "Compliant", desc: "FCRA-aligned analysis and dispute letter generation" },
              { icon: "▣", title: "No Credit Pull", desc: "We analyze your uploaded reports — zero impact on your score" },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl bg-[#f8f8fc] border border-[#e0e0ea]">
                <span className="text-[18px] text-[#8a8aa5] mb-3 block">{item.icon}</span>
                <h3 className="text-[13px] text-[#3a3a5a] font-medium mb-1.5">{item.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#8a8aa5] leading-[1.5] sm:leading-[1.6] text-justify-smart">{item.desc}</p>
              </div>
            ))}
          </div></div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-cta" />
        </div>
      </section>

      {/* ═══════════════ 14. FINAL CTA ═══════════════ */}
      <section id="sec-cta" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 border-t border-[#e8e8f0]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[700px] mx-auto text-center">
          <h2
            className="text-[30px] sm:text-[44px] md:text-[56px] leading-[0.9] mb-6 tracking-[-0.04em]"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, ...gradientText('180deg', 1, 0.55) }}
            data-testid="text-final-cta"
          >
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[12px] sm:text-[15px] text-[#6a6a8a] leading-[1.6] sm:leading-[1.8] mb-10 max-w-[480px] mx-auto text-justify-smart-center">
            Get your Capital Readiness Score, tier eligibility, exposure ceiling, and denial simulation. Subscribe today and unlock the full platform.
          </p>
          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#f5f5fa] border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab0] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join-bottom"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 border-t border-[#e0e0ea] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
                style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
              >
                {isLoading ? "..." : "SUBSCRIBE"}
              </button>
            </div>
          </form>
          <p className="text-[11px] text-[#b0b0c0] tracking-wide">
            Join 12,500+ founders already using MentXr&reg;
          </p>
          <SubscribeButton className="mt-6" />
        </div>
      </section>

      {/* ═══════════════ 15. FOOTER ═══════════════ */}
      <footer className="relative z-20 border-t border-[#e8e8f0] px-6 sm:px-12 md:px-20 py-10 sm:py-14 text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full border-2 border-[#c0c0d0] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a8aa5]"></span>
              </div>
              <span className="text-[13px] font-bold tracking-[0.08em] text-[#1a1a2e] uppercase">MentXr</span>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {["Privacy Policy", "Terms of Service", "Contact", "Support"].map((link) => (
                <span key={link} className="text-[11px] text-[#8a8aa5] tracking-wide uppercase cursor-pointer hover:text-[#5a5a7a] transition-colors">{link}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#e8e8f0]">
            <p className="text-[11px] text-[#9a9ab0]">
              &copy; 2026 MentXr&reg; by <span className="text-[#8a8aa5] font-medium">CMD Supply</span>. All rights reserved.
            </p>
            <p className="text-[10px] text-[#b0b0c0] max-w-[400px] leading-[1.6]">
              MentXr is not a lender, broker, or financial advisor. All analyses are for informational purposes only and do not constitute financial advice or guaranteed lending outcomes.
          
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
