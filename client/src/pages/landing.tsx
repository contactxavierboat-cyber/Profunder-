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

    interface Star {
      x: number; y: number; z: number;
      size: number; brightness: number;
      twinkleSpeed: number; twinklePhase: number;
      color: [number, number, number];
    }

    interface ShootingStar {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
    }

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let time = 0;

    const starColors: [number, number, number][] = [
      [255, 255, 255],
      [200, 220, 255],
      [255, 240, 220],
      [180, 200, 255],
      [255, 210, 180],
      [220, 230, 255],
    ];

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
      const count = Math.min(Math.floor((w * h) / 2000), 800);
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          size: z < 0.3 ? Math.random() * 0.8 + 0.3 : z < 0.7 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1,
          brightness: Math.random() * 0.6 + 0.4,
          twinkleSpeed: Math.random() * 0.04 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = document.documentElement.scrollHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      stars.forEach(s => {
        const twinkle = Math.sin(time * s.twinkleSpeed * 60 + s.twinklePhase) * 0.4 + 0.6;
        const alpha = s.brightness * twinkle;
        const [r, g, b] = s.color;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        if (s.z > 0.7 && s.size > 1.5) {
          const glowR = s.size * 4;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
          grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.05})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.beginPath();
          ctx.fillStyle = grad;
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          ctx.fill();

          if (s.size > 2) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(s.x - s.size * 3, s.y);
            ctx.lineTo(s.x + s.size * 3, s.y);
            ctx.moveTo(s.x, s.y - s.size * 3);
            ctx.lineTo(s.x, s.y + s.size * 3);
            ctx.stroke();
          }
        }
      });

      if (Math.random() < 0.003) {
        const startX = Math.random() * w;
        const startY = Math.random() * h * 0.5;
        const angle = Math.random() * 0.8 + 0.3;
        shootingStars.push({
          x: startX, y: startY,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          life: 0, maxLife: 40 + Math.random() * 30,
          size: Math.random() * 1.5 + 1,
        });
      }

      shootingStars = shootingStars.filter(ss => {
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;
        const progress = ss.life / ss.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : 1 - progress;

        const tailLen = 8;
        for (let i = 0; i < tailLen; i++) {
          const t = i / tailLen;
          const tx = ss.x - ss.vx * t * 3;
          const ty = ss.y - ss.vy * t * 3;
          const ta = alpha * (1 - t) * 0.6;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${ta})`;
          ctx.arc(tx, ty, ss.size * (1 - t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(ss.x, ss.y, ss.size, 0, Math.PI * 2);
        ctx.fill();

        return ss.life < ss.maxLife;
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
      style={{ zIndex: 1 }}
    />
  );
}

const gradientText = (dir = '180deg', from = 0.85, to = 0.5) => ({
  background: `linear-gradient(${dir}, rgba(255,255,255,${from}) 0%, rgba(255,255,255,${to}) 100%)`,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
});

const sectionBg = { background: 'linear-gradient(180deg, rgba(2,0,16,0.92) 0%, rgba(5,0,26,0.85) 60%, rgba(10,0,37,0.75) 100%)' };

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[11px] tracking-[0.2em] uppercase mb-6 sm:mb-8 text-white/75">{children}</p>
);

const faqItems = [
  { q: "Do I need perfect credit to use MentXr?", a: "No. MentXr works for all credit profiles — from thin files to complex portfolios. Our engine evaluates 6 capital components and places you in the right tier with a clear action plan, whether you're Prime-eligible or in Repair mode." },
  { q: "How is this different from a credit monitoring app?", a: "Credit monitoring shows you a score. MentXr tells you what that score means to a lender, what products you actually qualify for, what will get you denied, and exactly how to fix it. It's underwriting intelligence, not a dashboard." },
  { q: "What documents do I need to upload?", a: "Start with your credit report (from any bureau) and your most recent bank statement. Our AI extracts over 40 data points automatically — no manual entry required." },
  { q: "How accurate is the denial simulation?", a: "Our denial engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials before you ever submit an application." },
  { q: "Is my financial data secure?", a: "All data is encrypted in transit and at rest. We never share your financial information with lenders, brokers, or third parties. Your data is used solely to generate your Capital Readiness analysis." },
  { q: "What's included with free access?", a: "Free access includes your full Capital Readiness Score, 6-component breakdown, tier eligibility, operating mode analysis, denial simulation, AI mentor chat, and credit repair recommendations — all 30 analyses per month." },
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
    const target = e.currentTarget as HTMLFormElement;
    const input = target.querySelector('input[type="email"]') as HTMLInputElement;
    const val = input?.value;
    if (!val) return;
    setIsLoading(true);
    try {
      await login(val);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #020010 0%, #05001a 15%, #0a0025 30%, #080020 50%, #050015 70%, #03000d 85%, #010008 100%)' }}>
      <SpaceBackground />

      <div
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#111]/98 border border-[#1a1a3a] shadow-lg shadow-black/60 backdrop-blur-none"
        style={{
          transition: "opacity 0.5s ease, transform 0.5s ease",
          opacity: proofVisible ? 1 : 0,
          transform: proofVisible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse shrink-0"></span>
        <span className="text-[12px] sm:text-[13px] text-white/80 font-medium whitespace-nowrap">{proofMessages[proofIndex]}</span>
      </div>

      <div className="sticky top-0 z-50 w-full flex justify-center px-6 sm:px-10 pt-4" data-testid="nav-top">
        <nav className="flex items-center justify-between w-full max-w-[900px] h-[52px] bg-white/95 rounded-full px-2.5 pl-3 shadow-lg shadow-black/15">
          <div className="flex items-center gap-2 bg-[#f0f0f8] rounded-full px-3.5 py-1.5" data-testid="nav-logo">
            <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#4a3aff] to-[#1a0a5e] flex items-center justify-center animate-logo-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
            <span className="text-[12.5px] font-semibold tracking-[0.03em] text-[#1a0a3e]">MentXr<span className="text-[8px] align-super">®</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#1a0a3e] transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#features" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#1a0a3e] transition-colors" data-testid="link-features">Features</a>
            <a href="#results" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#1a0a3e] transition-colors" data-testid="link-results">Results</a>
            <a href="#faq" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#1a0a3e] transition-colors" data-testid="link-faq">FAQ</a>
          </div>

          <button
            onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-email"]')?.focus()}
            className="rounded-full px-5 py-2 text-[12.5px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4a3aff 0%, #1a0a5e 100%)' }}
            data-testid="button-get-started"
          >
            Get Started Free
          </button>
        </nav>
      </div>

      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-6 sm:px-12 md:px-20 lg:px-28 py-20 text-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(2,0,16,0.9) 0%, rgba(5,0,26,0.6) 50%, transparent 100%)' }} />
        <div className="relative max-w-[900px] mx-auto">
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/60 mb-6" data-testid="text-hero-label">Digital Underwriting Engine</p>
          <h1
            className="text-[38px] sm:text-[56px] md:text-[72px] lg:text-[88px] uppercase leading-[0.95] mb-8"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em', ...gradientText('180deg', 1, 0.6) }}
            data-testid="text-hero-headline"
          >
            Know Exactly<br />Where You Stand<br />Before You Apply
          </h1>
          <p className="text-[15px] sm:text-[17px] text-white/65 leading-[1.8] max-w-[560px] mx-auto mb-10">
            MentXr&reg; runs your financial profile through real underwriting logic — the same criteria banks use to approve or deny you. Get your Capital Readiness Score, exposure ceiling, tier eligibility, and denial risk before you ever submit an application.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#0c0c24] border border-[#1a1a3a] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/75 outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0 border-t border-[#303030] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
              >
                {isLoading ? "..." : "GET FREE ACCESS"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/45 tracking-wide">
            <span>Free forever</span>
            <span className="w-1 h-1 rounded-full bg-white/25"></span>
            <span>No credit card</span>
            <span className="w-1 h-1 rounded-full bg-white/25"></span>
            <span>30 analyses / month</span>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM / PAIN ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-10 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            73% of funding applications get denied. Most founders never find out why until it's too late.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { num: "01", text: "You apply for funding with no idea how a lender actually evaluates you" },
              { num: "02", text: "Credit scores alone don't tell you what products you qualify for" },
              { num: "03", text: "Hidden risk signals silently kill your application before a human reviews it" },
              { num: "04", text: "Every denial leaves an inquiry on your report, making the next application harder" },
            ].map((item) => (
              <div key={item.num} className="flex gap-4 items-start p-5 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <span className="text-[11px] font-mono text-white/45 shrink-0 mt-0.5">{item.num}</span>
                <p className="text-[13px] sm:text-[14px] text-white/65 leading-[1.7]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. SOLUTION OVERVIEW ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            AI-powered underwriting intelligence that tells you exactly what to fix — before you apply.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/60 leading-[1.8] mb-12 max-w-[640px] mx-auto">
            MentXr® analyzes your credit report and bank statements using the same 6-component framework real lenders use. You get a Capital Readiness Score, tier placement, exposure ceiling, denial simulation, and a step-by-step action plan — all powered by AI.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Capital Readiness Score", val: "0–100" },
              { label: "Exposure Ceiling", val: "2.5x Logic" },
              { label: "Tier Eligibility", val: "3 Tiers" },
              { label: "Denial Simulation", val: "Pre-Screen" },
              { label: "AI Mentor Chat", val: "7 Bots" },
              { label: "Credit Repair", val: "Auto Letters" },
            ].map((item) => (
              <div key={item.label} className="p-4 sm:p-5 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <p className="text-[20px] sm:text-[24px] font-mono text-white/75 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</p>
                <p className="text-[11px] text-white/45 tracking-wide uppercase">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Four steps from unknown to underwriting-ready.
          </h2>
          <div className="space-y-0">
            {[
              { step: "01", title: "Upload Your Documents", desc: "Drop in your credit report and bank statement. Our AI extracts 40+ data points automatically — no manual entry." },
              { step: "02", title: "Get Your Capital Readiness Score", desc: "We evaluate 6 components: Capital Strength, Credit Quality, Management & Structure, Cash Flow, Liquidity, and Risk Signals." },
              { step: "03", title: "See Your Tier & Exposure Ceiling", desc: "Find out if you're Prime, Mid-Tier, or Alternative eligible — and your maximum fundable amount using 2.5x exposure logic." },
              { step: "04", title: "Run Denial Simulation & Fix Issues", desc: "Our engine flags every underwriting trigger that would cause a denial. Get auto-generated dispute letters and a repair timeline." },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 sm:gap-8 items-start py-8 border-t border-[#1a1a3a] first:border-t-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#10102a] border border-[#1a1a3a] flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-mono text-white/65">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-[18px] text-white/80 font-medium mb-2">{item.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-white/75 leading-[1.7] max-w-[500px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. FUNDING OUTCOMES ═══════════════ */}
      <section id="features" className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Everything you need to walk into a lender's office with confidence.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div key={item.title} className="p-5 sm:p-6 rounded-xl bg-[#0a0a20] border border-[#1a1a3a] group hover:bg-[#10102a] transition-colors">
                <span className="text-[20px] text-white/45 mb-4 block">{item.icon}</span>
                <h3 className="text-[14px] sm:text-[15px] text-white/80 font-medium mb-2">{item.title}</h3>
                <p className="text-[12px] sm:text-[13px] text-white/75 leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. SOCIAL PROOF ═══════════════ */}
      <section id="results" className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Results</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Founders are getting funded with clarity, not luck.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
            {[
              { val: "12,500+", label: "Founders Analyzed" },
              { val: "$47M+", label: "Capital Deployed" },
              { val: "89%", label: "Approval Rate" },
              { val: "6.2x", label: "Avg Score Improvement" },
            ].map((s) => (
              <div key={s.label} className="text-center p-5 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <p className="text-[24px] sm:text-[30px] font-mono text-white/75 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
                <p className="text-[10px] sm:text-[11px] text-white/45 tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Marcus T.", role: "E-commerce Founder", quote: "I went from a 42 to a 78 Capital Readiness Score in 60 days. Got approved for a $250K line of credit on the first try." },
              { name: "Aisha K.", role: "Real Estate Investor", quote: "The denial simulation caught 3 triggers I didn't know existed. Fixed them all before applying — approved same week." },
              { name: "David L.", role: "SaaS Startup CEO", quote: "MentXr showed me I was Mid-Tier when I thought I was Prime. After following the repair plan, I moved up and saved 4% on rates." },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <p className="text-[13px] text-white/60 leading-[1.8] mb-5 italic">"{t.quote}"</p>
                <div>
                  <p className="text-[13px] text-white/75 font-medium">{t.name}</p>
                  <p className="text-[11px] text-white/45">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. RISK REVERSAL ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>No More Guessing</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            Stop applying blind. Start applying ready.
          </h2>
          <p className="text-[15px] text-white/60 leading-[1.8] mb-12 max-w-[600px] mx-auto">
            Every denied application costs you: hard inquiries, wasted time, damaged confidence. MentXr eliminates the guesswork by showing you exactly what a lender sees — before you ever submit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-red-400/30 mb-4">Without MentXr</p>
              <ul className="space-y-3">
                {["Guess at eligibility", "Apply to multiple lenders", "Accumulate hard inquiries", "Get denied without explanation", "Repeat the cycle"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-white/75 leading-[1.6]">
                    <span className="text-red-400/25 mt-0.5 shrink-0">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-[#1a1a3a] bg-[#0a0a20]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-white/60 mb-4">With MentXr</p>
              <ul className="space-y-3">
                {["Know your exact tier & ceiling", "Fix issues before applying", "Apply once, with confidence", "Get approved on first submission", "Build on momentum"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-white/65 leading-[1.6]">
                    <span className="text-white/60 mt-0.5 shrink-0">→</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 8. FEATURE BREAKDOWN ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Feature Breakdown</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Six components. One score. Complete clarity.
          </h2>
          <div className="space-y-3">
            {[
              { name: "Capital Strength", weight: "0–20 pts", desc: "Revenue, assets, collateral position, and business capitalization" },
              { name: "Credit Quality", weight: "0–20 pts", desc: "FICO, payment history, derogatory marks, utilization ratios" },
              { name: "Management & Structure", weight: "0–15 pts", desc: "Entity type, years in business, ownership structure, EIN status" },
              { name: "Earnings & Cash Flow", weight: "0–15 pts", desc: "Monthly revenue trends, DSCR, cash reserves, deposit consistency" },
              { name: "Liquidity & Leverage", weight: "0–15 pts", desc: "Debt-to-income, current ratio, available credit, existing obligations" },
              { name: "Risk Signals", weight: "0–15 pts", desc: "Liens, judgments, NSFs, velocity flags, recent inquiries, collections" },
            ].map((c) => (
              <div key={c.name} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-5 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <div className="flex items-center gap-4 sm:w-[200px] shrink-0">
                  <span className="text-[14px] sm:text-[15px] text-white/75 font-medium">{c.name}</span>
                </div>
                <span className="text-[12px] font-mono text-white/75 sm:w-[80px] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.weight}</span>
                <p className="text-[12px] sm:text-[13px] text-white/45 leading-[1.6]">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-[#10102a] border border-[#1a1a3a]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
              <span className="text-[15px] text-white/80 font-medium">Total: 0–100 pts</span>
              <span className="text-[12px] text-white/45">→ Qualification Range: $25K – $5M+ based on composite score and tier placement</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 9. MODE DIFFERENTIATION ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Operating Modes</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Two modes. One goal: get you funded.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/60">Pre-Funding Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-white/80 font-light mb-4 tracking-[-0.02em]">Score 60+</h3>
              <p className="text-[13px] text-white/75 leading-[1.8] mb-6">
                You're fundable. This mode focuses on optimization — maximizing your ceiling, refining your tier placement, and identifying the best products for your profile.
              </p>
              <ul className="space-y-2.5">
                {["Tier 1–2 product matching", "Exposure ceiling maximization", "Application timing strategy", "Rate optimization guidance"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-white/60">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 sm:p-8 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-white/25 border border-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/60">Repair Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-white/80 font-light mb-4 tracking-[-0.02em]">Score &lt;60</h3>
              <p className="text-[13px] text-white/75 leading-[1.8] mb-6">
                You need work before applying. This mode focuses on fixing issues — dispute letters, payment optimization, structure corrections, and timeline to fundability.
              </p>
              <ul className="space-y-2.5">
                {["Auto-generated dispute letters", "Credit issue prioritization", "90-day repair timeline", "Score impact projections"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-white/60">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 10. TIER POSITIONING ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px] mx-auto">
          <SectionLabel>Tier Eligibility</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Three tiers. Know which one you belong to.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "Tier 1", name: "Prime Capital", score: "75–100", products: "SBA 7(a) & 504, Conventional LOC, Term Loans, Equipment Finance", color: "border-[#3C3C3C]" },
              { tier: "Tier 2", name: "Mid-Tier", score: "50–74", products: "Revenue-Based Lending, Invoice Factoring, Merchant Cash Advance, Bridge Loans", color: "border-[#303030]" },
              { tier: "Tier 3", name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builder Programs, Community Development Loans", color: "border-[#404040]" },
            ].map((t) => (
              <div key={t.tier} className={`p-6 rounded-xl bg-[#0a0a20] border ${t.color}`}>
                <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">{t.tier}</span>
                <h3 className="text-[18px] sm:text-[20px] text-white/80 font-medium mt-2 mb-1">{t.name}</h3>
                <p className="text-[13px] font-mono text-white/60 mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Score: {t.score}</p>
                <p className="text-[12px] text-white/45 leading-[1.7]">{t.products}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11. CASE STUDY ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px] mx-auto">
          <SectionLabel>Example Walkthrough</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            How a 38-score founder became funding-ready in 67 days.
          </h2>

          <div className="space-y-0">
            {[
              { day: "Day 1", title: "Initial Analysis", detail: "Score: 38/100. Tier 3 (Alternative). 4 denial triggers flagged: high utilization (78%), 2 collections, thin business file, no EIN separation." },
              { day: "Day 3", title: "Repair Plan Generated", detail: "MentXr auto-generated 6 dispute letters (2 per bureau), created a 90-day utilization reduction plan, and recommended EIN registration + business bank account." },
              { day: "Day 30", title: "First Checkpoint", detail: "Score: 52/100. Moved to Tier 2. 1 collection removed. Utilization down to 45%. Business structure improved. Exposure ceiling: $85K." },
              { day: "Day 67", title: "Funding Ready", detail: "Score: 71/100. Tier 2 (upper). 0 denial triggers. Utilization: 22%. Clean business file. Exposure ceiling: $210K. Applied for $175K LOC — approved in 5 days." },
            ].map((step) => (
              <div key={step.day} className="flex gap-6 sm:gap-8 py-7 border-t border-[#1a1a3a] first:border-t-0">
                <div className="w-[70px] shrink-0">
                  <span className="text-[12px] font-mono text-white/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step.day}</span>
                </div>
                <div>
                  <h3 className="text-[15px] text-white/80 font-medium mb-2">{step.title}</h3>
                  <p className="text-[13px] text-white/75 leading-[1.7]">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 12. FAQ / OBJECTION HANDLING ═══════════════ */}
      <section id="faq" className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a] text-center">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[700px] mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Common questions, straight answers.
          </h2>
          <div className="space-y-0">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-[#404040]">
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] sm:text-[15px] font-medium text-white/70 group-hover:text-white/80 transition-colors pr-4">{item.q}</span>
                  <span className="text-[18px] text-white/40 shrink-0 leading-none transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="pb-5">
                    <p className="text-[13px] text-white/75 leading-[1.8]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 13. TRUST & COMPLIANCE ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-[#1a1a3a]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>Trust & Security</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Your data. Your control. Always.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⬡", title: "Encrypted", desc: "AES-256 encryption at rest and TLS 1.3 in transit" },
              { icon: "◎", title: "Private", desc: "We never share data with lenders, brokers, or third parties" },
              { icon: "◇", title: "Compliant", desc: "FCRA-aligned analysis and dispute letter generation" },
              { icon: "▣", title: "No Credit Pull", desc: "We analyze your uploaded reports — zero impact on your score" },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl bg-[#0a0a20] border border-[#1a1a3a]">
                <span className="text-[18px] text-white/45 mb-3 block">{item.icon}</span>
                <h3 className="text-[13px] text-white/75 font-medium mb-1.5">{item.title}</h3>
                <p className="text-[11px] text-white/45 leading-[1.6]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 14. FINAL CTA ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-24 sm:py-36 border-t border-[#1a1a3a]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(2,0,16,0.95) 0%, rgba(5,0,26,0.7) 50%, rgba(10,0,37,0.4) 100%)' }} />
        <div className="relative max-w-[700px] mx-auto text-center">
          <h2
            className="text-[30px] sm:text-[44px] md:text-[56px] leading-[1.05] mb-6 tracking-[-0.04em]"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, ...gradientText('180deg', 1, 0.55) }}
            data-testid="text-final-cta"
          >
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[15px] text-white/60 leading-[1.8] mb-10 max-w-[480px] mx-auto">
            Get your Capital Readiness Score, tier eligibility, exposure ceiling, and denial simulation — free. No credit card. No credit pull. No commitment.
          </p>
          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#0c0c24] border border-[#1a1a3a] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/75 outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                defaultValue=""
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join-bottom"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0 border-t border-[#303030] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
              >
                {isLoading ? "..." : "GET FREE ACCESS"}
              </button>
            </div>
          </form>
          <p className="text-[11px] text-white/12 tracking-wide">
            Join 12,500+ founders already using MentXr&reg;
          </p>
        </div>
      </section>

      {/* ═══════════════ 15. FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-[#1a1a3a] px-6 sm:px-12 md:px-20 py-10 sm:py-14 text-center">
        <div className="absolute inset-0" style={{ background: 'rgba(2,0,16,0.9)' }} />
        <div className="relative max-w-[900px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
              </div>
              <span className="text-[13px] font-bold tracking-[0.08em] text-white/80 uppercase">MentXr</span>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {["Privacy Policy", "Terms of Service", "Contact", "Support"].map((link) => (
                <span key={link} className="text-[11px] text-white/45 tracking-wide uppercase cursor-pointer hover:text-white/65 transition-colors">{link}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#1a1a3a]">
            <p className="text-[11px] text-white/40">
              &copy; 2026 MentXr&reg; by <span className="text-white/45 font-medium">CMD Supply</span>. All rights reserved.
            </p>
            <p className="text-[10px] text-white/8 max-w-[400px] leading-[1.6]">
              MentXr is not a lender, broker, or financial advisor. All analyses are for informational purposes only and do not constitute financial advice or guaranteed lending outcomes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
