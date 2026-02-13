import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";

function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let mouseX = -1000;
    let mouseY = -1000;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; pulse: number; pulseSpeed: number;
      type: 'dot' | 'node' | 'accent';
      hue: number;
    }

    interface FloatingShape {
      x: number; y: number; vx: number; vy: number;
      size: number; rotation: number; rotSpeed: number;
      opacity: number; sides: number; hue: number;
      pulse: number; pulseSpeed: number;
    }

    interface GlowOrb {
      x: number; y: number; radius: number;
      vx: number; vy: number;
      hue: number; saturation: number;
      opacity: number; pulse: number; pulseSpeed: number;
    }

    interface AuroraWave {
      yBase: number; amplitude: number; frequency: number;
      speed: number; hue: number; opacity: number; phase: number;
    }

    let particles: Particle[] = [];
    let shapes: FloatingShape[] = [];
    let orbs: GlowOrb[] = [];
    let auroras: AuroraWave[] = [];

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const init = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const count = Math.min(Math.floor((w * h) / 4500), 350);
      particles = [];
      for (let i = 0; i < count; i++) {
        const r = Math.random();
        const type = r < 0.12 ? 'accent' : r < 0.25 ? 'node' : 'dot';
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: type === 'node' ? Math.random() * 2.8 + 1.5 : type === 'accent' ? Math.random() * 2.2 + 1 : Math.random() * 1.4 + 0.4,
          opacity: type === 'node' ? Math.random() * 0.35 + 0.25 : type === 'accent' ? Math.random() * 0.4 + 0.2 : Math.random() * 0.2 + 0.08,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.01,
          type,
          hue: type === 'accent' ? (Math.random() < 0.4 ? 210 + Math.random() * 30 : Math.random() < 0.7 ? 260 + Math.random() * 30 : 170 + Math.random() * 20) : 0,
        });
      }

      const shapeCount = Math.floor((w * h) / 120000) + 5;
      shapes = [];
      for (let i = 0; i < shapeCount; i++) {
        shapes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: Math.random() * 50 + 20,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.005,
          opacity: Math.random() * 0.07 + 0.03,
          sides: Math.floor(Math.random() * 4) + 3,
          hue: [210, 240, 270, 190, 300][Math.floor(Math.random() * 5)],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.015 + 0.005,
        });
      }

      const orbCount = Math.max(5, Math.floor((w * h) / 250000));
      orbs = [];
      for (let i = 0; i < orbCount; i++) {
        orbs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 300 + 150,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          hue: [210, 250, 280, 190, 320][i % 5],
          saturation: Math.random() * 40 + 50,
          opacity: Math.random() * 0.06 + 0.03,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.012 + 0.004,
        });
      }

      auroras = [];
      const auroraCount = 4;
      for (let i = 0; i < auroraCount; i++) {
        auroras.push({
          yBase: h * (0.15 + Math.random() * 0.7),
          amplitude: 40 + Math.random() * 80,
          frequency: 0.001 + Math.random() * 0.002,
          speed: 0.3 + Math.random() * 0.5,
          hue: [215, 260, 190, 300][i % 4],
          opacity: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawPolygon = (cx: number, cy: number, r: number, sides: number, rotation: number) => {
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i * 2 * Math.PI / sides) + rotation;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      auroras.forEach(a => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
          const y = a.yBase + Math.sin(x * a.frequency + time * a.speed + a.phase) * a.amplitude
                    + Math.sin(x * a.frequency * 2.3 + time * a.speed * 0.7) * a.amplitude * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const aGrad = ctx.createLinearGradient(0, a.yBase - a.amplitude * 2, 0, a.yBase + a.amplitude * 2);
        aGrad.addColorStop(0, `hsla(${a.hue}, 70%, 50%, 0)`);
        aGrad.addColorStop(0.3, `hsla(${a.hue}, 70%, 50%, ${a.opacity * (Math.sin(time * 0.5 + a.phase) * 0.4 + 0.6)})`);
        aGrad.addColorStop(0.5, `hsla(${a.hue + 20}, 60%, 45%, ${a.opacity * 0.7 * (Math.sin(time * 0.3 + a.phase) * 0.3 + 0.7)})`);
        aGrad.addColorStop(1, `hsla(${a.hue}, 70%, 40%, 0)`);
        ctx.fillStyle = aGrad;
        ctx.fill();
      });

      orbs.forEach(o => {
        o.x += o.vx;
        o.y += o.vy;
        o.pulse += o.pulseSpeed;
        if (o.x < -o.radius) o.x = w + o.radius;
        if (o.x > w + o.radius) o.x = -o.radius;
        if (o.y < -o.radius) o.y = h + o.radius;
        if (o.y > h + o.radius) o.y = -o.radius;

        const glow = Math.sin(o.pulse) * 0.5 + 0.5;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
        grad.addColorStop(0, `hsla(${o.hue}, ${o.saturation}%, 55%, ${o.opacity * glow})`);
        grad.addColorStop(0.3, `hsla(${o.hue + 10}, ${o.saturation}%, 45%, ${o.opacity * glow * 0.5})`);
        grad.addColorStop(0.7, `hsla(${o.hue - 10}, ${o.saturation}%, 35%, ${o.opacity * glow * 0.15})`);
        grad.addColorStop(1, `hsla(${o.hue}, ${o.saturation}%, 30%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
      });

      shapes.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;
        s.pulse += s.pulseSpeed;
        if (s.x < -80) s.x = w + 80;
        if (s.x > w + 80) s.x = -80;
        if (s.y < -80) s.y = h + 80;
        if (s.y > h + 80) s.y = -80;

        const glow = Math.sin(s.pulse) * 0.5 + 0.5;
        ctx.save();
        drawPolygon(s.x, s.y, s.size, s.sides, s.rotation);
        ctx.strokeStyle = `hsla(${s.hue}, 70%, 60%, ${s.opacity * glow})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const shapeGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
        shapeGrad.addColorStop(0, `hsla(${s.hue}, 70%, 55%, ${s.opacity * glow * 0.4})`);
        shapeGrad.addColorStop(0.6, `hsla(${s.hue}, 60%, 45%, ${s.opacity * glow * 0.1})`);
        shapeGrad.addColorStop(1, `hsla(${s.hue}, 60%, 40%, 0)`);
        ctx.fillStyle = shapeGrad;
        ctx.fill();
        ctx.restore();
      });

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        if (mouseDist < 200 && mouseDist > 0) {
          const force = (200 - mouseDist) / 200 * 0.015;
          p.vx += (dx / mouseDist) * force;
          p.vy += (dy / mouseDist) * force;
        }
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 0.8;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }
      });

      const connectionDist = 170;
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        if (pi.type === 'dot') continue;
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          if (Math.abs(dx) > connectionDist || Math.abs(dy) > connectionDist) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            const hasAccent = pi.type === 'accent' || pj.type === 'accent';
            ctx.beginPath();
            if (hasAccent) {
              const hue = pi.type === 'accent' ? pi.hue : pj.hue;
              ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${alpha * 1.5})`;
              ctx.lineWidth = 0.8;
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.7;
            }
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        const glow = Math.sin(p.pulse) * 0.4 + 0.6;
        const mouseDist = Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2);
        const mouseBoost = mouseDist < 200 ? 1 + (200 - mouseDist) / 200 * 1.5 : 1;
        const alpha = p.opacity * glow * mouseBoost;

        ctx.beginPath();
        if (p.type === 'accent') {
          ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${Math.min(alpha, 0.9)})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha, 0.8)})`;
        }
        ctx.arc(p.x, p.y, p.size * (mouseBoost > 1 ? mouseBoost * 0.6 + 0.4 : 1), 0, Math.PI * 2);
        ctx.fill();

        if (p.type === 'node' || p.type === 'accent') {
          ctx.beginPath();
          const glowRadius = p.size * (p.type === 'accent' ? 10 : 7) * (mouseBoost > 1 ? 1.3 : 1);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
          if (p.type === 'accent') {
            grad.addColorStop(0, `hsla(${p.hue}, 70%, 65%, ${Math.min(alpha * 0.35, 0.5)})`);
            grad.addColorStop(0.4, `hsla(${p.hue}, 60%, 50%, ${Math.min(alpha * 0.12, 0.3)})`);
          } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(alpha * 0.3, 0.4)})`);
            grad.addColorStop(0.4, `rgba(255, 255, 255, ${Math.min(alpha * 0.08, 0.2)})`);
          }
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.size > 0.7) {
          ctx.beginPath();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.15})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      for (let s = 0; s < 2; s++) {
        const scanSpeed = s === 0 ? 25 : 18;
        const scanY = ((time * scanSpeed + s * 500) % (h + 200)) - 100;
        const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
        const scanHue = s === 0 ? 220 : 270;
        scanGrad.addColorStop(0, `hsla(${scanHue}, 60%, 50%, 0)`);
        scanGrad.addColorStop(0.5, `hsla(${scanHue}, 60%, 50%, 0.025)`);
        scanGrad.addColorStop(1, `hsla(${scanHue}, 60%, 50%, 0)`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 60, w, 120);
      }

      if (mouseX > 0 && mouseY > 0) {
        const mGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250);
        mGrad.addColorStop(0, 'hsla(230, 60%, 60%, 0.04)');
        mGrad.addColorStop(0.5, 'hsla(260, 50%, 50%, 0.015)');
        mGrad.addColorStop(1, 'hsla(230, 60%, 40%, 0)');
        ctx.fillStyle = mGrad;
        ctx.fillRect(mouseX - 250, mouseY - 250, 500, 500);
      }

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
      window.removeEventListener('mousemove', onMouseMove);
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

const gradientText = (dir = '180deg', from = 0.6, to = 0.25) => ({
  background: `linear-gradient(${dir}, rgba(255,255,255,${from}) 0%, rgba(255,255,255,${to}) 100%)`,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
});

const sectionBg = { background: 'linear-gradient(180deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.72) 60%, rgba(8,8,8,0.45) 100%)' };

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[11px] tracking-[0.2em] uppercase mb-6 sm:mb-8 text-white/20">{children}</p>
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
    <div className="relative min-h-screen bg-[#080808] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TechBackground />

      <div
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#111]/90 border border-white/[0.06] shadow-lg shadow-black/60 backdrop-blur-sm"
        style={{
          transition: "opacity 0.5s ease, transform 0.5s ease",
          opacity: proofVisible ? 1 : 0,
          transform: proofVisible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse shrink-0"></span>
        <span className="text-[12px] sm:text-[13px] text-white/50 font-medium whitespace-nowrap">{proofMessages[proofIndex]}</span>
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 h-14 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border-2 border-white/60 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
          </div>
          <span className="text-[13px] font-bold tracking-[0.08em] text-white/80 uppercase">MentXr</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[12px] tracking-[0.08em] text-white/30 uppercase hidden sm:block">Private Access</span>
        </div>
      </nav>

      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="relative z-10 min-h-[90vh] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-28 py-20">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 30% 50%, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.6) 50%, transparent 100%)' }} />
        <div className="relative max-w-[900px]">
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 mb-6" data-testid="text-hero-label">Capital Readiness Engine</p>
          <h1
            className="text-[38px] sm:text-[56px] md:text-[72px] lg:text-[88px] uppercase leading-[0.95] mb-8"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em', ...gradientText('180deg', 0.9, 0.3) }}
            data-testid="text-hero-headline"
          >
            Know Exactly<br />Where You Stand<br />Before You Apply
          </h1>
          <p className="text-[15px] sm:text-[17px] text-white/30 leading-[1.8] max-w-[560px] mb-10">
            MentXr&reg; runs your financial profile through real underwriting logic — the same criteria banks use to approve or deny you. Get your Capital Readiness Score, exposure ceiling, tier eligibility, and denial risk before you ever submit an application.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-[440px] mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/20 outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0 border-t border-white/[0.06] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
              >
                {isLoading ? "..." : "GET FREE ACCESS"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-white/15 tracking-wide">
            <span>Free forever</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span>No credit card</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span>30 analyses / month</span>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM / PAIN ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-10 tracking-[-0.03em]" style={gradientText('180deg', 0.7, 0.25)}>
            73% of funding applications get denied. Most founders never find out why until it's too late.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { num: "01", text: "You apply for funding with no idea how a lender actually evaluates you" },
              { num: "02", text: "Credit scores alone don't tell you what products you qualify for" },
              { num: "03", text: "Hidden risk signals silently kill your application before a human reviews it" },
              { num: "04", text: "Every denial leaves an inquiry on your report, making the next application harder" },
            ].map((item) => (
              <div key={item.num} className="flex gap-4 items-start p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[11px] font-mono text-white/15 shrink-0 mt-0.5">{item.num}</span>
                <p className="text-[13px] sm:text-[14px] text-white/30 leading-[1.7]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. SOLUTION OVERVIEW ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.7, 0.25)}>
            AI-powered underwriting intelligence that tells you exactly what to fix — before you apply.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/25 leading-[1.8] mb-12 max-w-[640px]">
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
              <div key={item.label} className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[20px] sm:text-[24px] font-mono text-white/40 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</p>
                <p className="text-[11px] text-white/15 tracking-wide uppercase">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
            Four steps from unknown to underwriting-ready.
          </h2>
          <div className="space-y-0">
            {[
              { step: "01", title: "Upload Your Documents", desc: "Drop in your credit report and bank statement. Our AI extracts 40+ data points automatically — no manual entry." },
              { step: "02", title: "Get Your Capital Readiness Score", desc: "We evaluate 6 components: Capital Strength, Credit Quality, Management & Structure, Cash Flow, Liquidity, and Risk Signals." },
              { step: "03", title: "See Your Tier & Exposure Ceiling", desc: "Find out if you're Prime, Mid-Tier, or Alternative eligible — and your maximum fundable amount using 2.5x exposure logic." },
              { step: "04", title: "Run Denial Simulation & Fix Issues", desc: "Our engine flags every underwriting trigger that would cause a denial. Get auto-generated dispute letters and a repair timeline." },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 sm:gap-8 items-start py-8 border-t border-white/[0.04] first:border-t-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-mono text-white/30">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-[18px] text-white/50 font-medium mb-2">{item.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-white/20 leading-[1.7] max-w-[500px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. FUNDING OUTCOMES ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px]">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
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
              <div key={item.title} className="p-5 sm:p-6 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:bg-white/[0.03] transition-colors">
                <span className="text-[20px] text-white/15 mb-4 block">{item.icon}</span>
                <h3 className="text-[14px] sm:text-[15px] text-white/45 font-medium mb-2">{item.title}</h3>
                <p className="text-[12px] sm:text-[13px] text-white/18 leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. SOCIAL PROOF ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px]">
          <SectionLabel>Results</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
            Founders are getting funded with clarity, not luck.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
            {[
              { val: "12,500+", label: "Founders Analyzed" },
              { val: "$47M+", label: "Capital Deployed" },
              { val: "89%", label: "Approval Rate" },
              { val: "6.2x", label: "Avg Score Improvement" },
            ].map((s) => (
              <div key={s.label} className="text-center p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[24px] sm:text-[30px] font-mono text-white/40 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
                <p className="text-[10px] sm:text-[11px] text-white/15 tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Marcus T.", role: "E-commerce Founder", quote: "I went from a 42 to a 78 Capital Readiness Score in 60 days. Got approved for a $250K line of credit on the first try." },
              { name: "Aisha K.", role: "Real Estate Investor", quote: "The denial simulation caught 3 triggers I didn't know existed. Fixed them all before applying — approved same week." },
              { name: "David L.", role: "SaaS Startup CEO", quote: "MentXr showed me I was Mid-Tier when I thought I was Prime. After following the repair plan, I moved up and saved 4% on rates." },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[13px] text-white/25 leading-[1.8] mb-5 italic">"{t.quote}"</p>
                <div>
                  <p className="text-[13px] text-white/40 font-medium">{t.name}</p>
                  <p className="text-[11px] text-white/15">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. RISK REVERSAL ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>No More Guessing</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.7, 0.25)}>
            Stop applying blind. Start applying ready.
          </h2>
          <p className="text-[15px] text-white/25 leading-[1.8] mb-12 max-w-[600px]">
            Every denied application costs you: hard inquiries, wasted time, damaged confidence. MentXr eliminates the guesswork by showing you exactly what a lender sees — before you ever submit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-red-400/30 mb-4">Without MentXr</p>
              <ul className="space-y-3">
                {["Guess at eligibility", "Apply to multiple lenders", "Accumulate hard inquiries", "Get denied without explanation", "Repeat the cycle"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-white/20 leading-[1.6]">
                    <span className="text-red-400/25 mt-0.5 shrink-0">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <p className="text-[11px] tracking-[0.15em] uppercase text-white/25 mb-4">With MentXr</p>
              <ul className="space-y-3">
                {["Know your exact tier & ceiling", "Fix issues before applying", "Apply once, with confidence", "Get approved on first submission", "Build on momentum"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[13px] text-white/30 leading-[1.6]">
                    <span className="text-white/25 mt-0.5 shrink-0">→</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 8. FEATURE BREAKDOWN ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px]">
          <SectionLabel>Feature Breakdown</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
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
              <div key={c.name} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-4 sm:w-[200px] shrink-0">
                  <span className="text-[14px] sm:text-[15px] text-white/40 font-medium">{c.name}</span>
                </div>
                <span className="text-[12px] font-mono text-white/20 sm:w-[80px] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.weight}</span>
                <p className="text-[12px] sm:text-[13px] text-white/15 leading-[1.6]">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
              <span className="text-[15px] text-white/45 font-medium">Total: 0–100 pts</span>
              <span className="text-[12px] text-white/15">→ Qualification Range: $25K – $5M+ based on composite score and tier placement</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 9. MODE DIFFERENTIATION ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px]">
          <SectionLabel>Operating Modes</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
            Two modes. One goal: get you funded.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/25">Pre-Funding Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-white/50 font-light mb-4 tracking-[-0.02em]">Score 60+</h3>
              <p className="text-[13px] text-white/20 leading-[1.8] mb-6">
                You're fundable. This mode focuses on optimization — maximizing your ceiling, refining your tier placement, and identifying the best products for your profile.
              </p>
              <ul className="space-y-2.5">
                {["Tier 1–2 product matching", "Exposure ceiling maximization", "Application timing strategy", "Rate optimization guidance"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-white/25">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 sm:p-8 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20"></div>
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/25">Repair Mode</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] text-white/50 font-light mb-4 tracking-[-0.02em]">Score &lt;60</h3>
              <p className="text-[13px] text-white/20 leading-[1.8] mb-6">
                You need work before applying. This mode focuses on fixing issues — dispute letters, payment optimization, structure corrections, and timeline to fundability.
              </p>
              <ul className="space-y-2.5">
                {["Auto-generated dispute letters", "Credit issue prioritization", "90-day repair timeline", "Score impact projections"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[12px] text-white/25">
                    <span className="w-1 h-1 rounded-full bg-white/15"></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 10. TIER POSITIONING ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[900px]">
          <SectionLabel>Tier Eligibility</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
            Three tiers. Know which one you belong to.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "Tier 1", name: "Prime Capital", score: "75–100", products: "SBA 7(a) & 504, Conventional LOC, Term Loans, Equipment Finance", color: "border-white/[0.1]" },
              { tier: "Tier 2", name: "Mid-Tier", score: "50–74", products: "Revenue-Based Lending, Invoice Factoring, Merchant Cash Advance, Bridge Loans", color: "border-white/[0.06]" },
              { tier: "Tier 3", name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builder Programs, Community Development Loans", color: "border-white/[0.04]" },
            ].map((t) => (
              <div key={t.tier} className={`p-6 rounded-xl bg-white/[0.02] border ${t.color}`}>
                <span className="text-[10px] font-mono text-white/15 tracking-wider uppercase">{t.tier}</span>
                <h3 className="text-[18px] sm:text-[20px] text-white/45 font-medium mt-2 mb-1">{t.name}</h3>
                <p className="text-[13px] font-mono text-white/25 mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Score: {t.score}</p>
                <p className="text-[12px] text-white/15 leading-[1.7]">{t.products}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11. CASE STUDY ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>Example Walkthrough</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-14 tracking-[-0.03em]" style={gradientText('180deg', 0.65, 0.2)}>
            How a 38-score founder became funding-ready in 67 days.
          </h2>

          <div className="space-y-0">
            {[
              { day: "Day 1", title: "Initial Analysis", detail: "Score: 38/100. Tier 3 (Alternative). 4 denial triggers flagged: high utilization (78%), 2 collections, thin business file, no EIN separation." },
              { day: "Day 3", title: "Repair Plan Generated", detail: "MentXr auto-generated 6 dispute letters (2 per bureau), created a 90-day utilization reduction plan, and recommended EIN registration + business bank account." },
              { day: "Day 30", title: "First Checkpoint", detail: "Score: 52/100. Moved to Tier 2. 1 collection removed. Utilization down to 45%. Business structure improved. Exposure ceiling: $85K." },
              { day: "Day 67", title: "Funding Ready", detail: "Score: 71/100. Tier 2 (upper). 0 denial triggers. Utilization: 22%. Clean business file. Exposure ceiling: $210K. Applied for $175K LOC — approved in 5 days." },
            ].map((step) => (
              <div key={step.day} className="flex gap-6 sm:gap-8 py-7 border-t border-white/[0.04] first:border-t-0">
                <div className="w-[70px] shrink-0">
                  <span className="text-[12px] font-mono text-white/25" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step.day}</span>
                </div>
                <div>
                  <h3 className="text-[15px] text-white/45 font-medium mb-2">{step.title}</h3>
                  <p className="text-[13px] text-white/20 leading-[1.7]">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 12. FAQ / OBJECTION HANDLING ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[700px]">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.6, 0.2)}>
            Common questions, straight answers.
          </h2>
          <div className="space-y-0">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-white/[0.04]">
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] sm:text-[15px] font-medium text-white/35 group-hover:text-white/50 transition-colors pr-4">{item.q}</span>
                  <span className="text-[18px] text-white/10 shrink-0 leading-none transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="pb-5">
                    <p className="text-[13px] text-white/20 leading-[1.8]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 13. TRUST & COMPLIANCE ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={sectionBg} />
        <div className="relative max-w-[800px]">
          <SectionLabel>Trust & Security</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] mb-12 tracking-[-0.03em]" style={gradientText('180deg', 0.6, 0.2)}>
            Your data. Your control. Always.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⬡", title: "Encrypted", desc: "AES-256 encryption at rest and TLS 1.3 in transit" },
              { icon: "◎", title: "Private", desc: "We never share data with lenders, brokers, or third parties" },
              { icon: "◇", title: "Compliant", desc: "FCRA-aligned analysis and dispute letter generation" },
              { icon: "▣", title: "No Credit Pull", desc: "We analyze your uploaded reports — zero impact on your score" },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[18px] text-white/15 mb-3 block">{item.icon}</span>
                <h3 className="text-[13px] text-white/40 font-medium mb-1.5">{item.title}</h3>
                <p className="text-[11px] text-white/15 leading-[1.6]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 14. FINAL CTA ═══════════════ */}
      <section className="relative z-10 px-6 sm:px-12 md:px-20 py-24 sm:py-36 border-t border-white/[0.04]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.7) 50%, rgba(8,8,8,0.4) 100%)' }} />
        <div className="relative max-w-[700px] mx-auto text-center">
          <h2
            className="text-[30px] sm:text-[44px] md:text-[56px] leading-[1.05] mb-6 tracking-[-0.04em]"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, ...gradientText('180deg', 0.85, 0.3) }}
            data-testid="text-final-cta"
          >
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[15px] text-white/25 leading-[1.8] mb-10 max-w-[480px] mx-auto">
            Get your Capital Readiness Score, tier eligibility, exposure ceiling, and denial simulation — free. No credit card. No credit pull. No commitment.
          </p>
          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/20 outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                defaultValue=""
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join-bottom"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0 border-t border-white/[0.06] sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
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
      <footer className="relative z-10 border-t border-white/[0.04] px-6 sm:px-12 md:px-20 py-10 sm:py-14">
        <div className="absolute inset-0" style={{ background: 'rgba(8,8,8,0.85)' }} />
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
              </div>
              <span className="text-[13px] font-bold tracking-[0.08em] text-white/50 uppercase">MentXr</span>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {["Privacy Policy", "Terms of Service", "Contact", "Support"].map((link) => (
                <span key={link} className="text-[11px] text-white/15 tracking-wide uppercase cursor-pointer hover:text-white/30 transition-colors">{link}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/[0.04]">
            <p className="text-[11px] text-white/10">
              &copy; 2026 MentXr&reg; by <span className="text-white/15 font-medium">CMD Supply</span>. All rights reserved.
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
