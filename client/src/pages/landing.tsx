import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/store";
import { CalendarDays } from "lucide-react";

function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; pulse: number; pulseSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const initParticles = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.floor((w * h) / 8000);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      });

      const connectionDist = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        const glow = Math.sin(p.pulse) * 0.3 + 0.7;
        const alpha = p.opacity * glow;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.size > 1.2) {
          ctx.beginPath();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', () => { resize(); initParticles(); });
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

const faqItems = [
  {
    q: "What is MentXr?",
    a: "MentXr® is a digital underwriting engine that evaluates your credit profile and determines your fundability using a proprietary 3-phase system: Structure, Scale, and Sequence."
  },
  {
    q: "What's included in my membership?",
    a: "Your membership includes 30 AI-powered fundability analyses per month, bank-level underwriting logic, document verification & storage, and priority support."
  },
  {
    q: "How does the fundability analysis work?",
    a: "Upload your credit profile data and financial documents. Our AI engine analyzes your information using real bank-level underwriting logic to generate a Fundability Index Score from 0-100."
  },
  {
    q: "Is there support available?",
    a: "Yes, all members have access to priority support. Reach out anytime via the in-app chat or contact our support team directly."
  },
  {
    q: "How much will this cost?",
    a: "MentXr® is available for $50/month, giving you full access to all features including AI-powered analyses, document verification, and more."
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login } = useAuth();

  const getTimeLeft = () => {
    const release = new Date("2028-01-01T00:00:00").getTime();
    const now = Date.now();
    const diff = Math.max(0, release - now);
    const totalDays = diff / (1000 * 60 * 60 * 24);
    const months = Math.floor(totalDays / 30.44);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { months, hours, minutes };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

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
    "Harper requested wealth-building insights from Andre Thompson.",
    "Elijah connected with tech founder Ryan Cole.",
    "Zoe sought negotiation advice from Elena Cruz.",
    "$250K just funded",
    "Benjamin tapped into sales strategy from Victor Hale.",
    "Aria started a mindset session with Chloe Bennett.",
    "Henry requested portfolio guidance from Daniel Brooks.",
    "$60K just funded",
    "Layla connected with fintech strategist Carter Hayes.",
    "Sofia requested brand positioning insight from Isabella Reed.",
    "David connected with investment mentor Andre Thompson.",
    "$120K just funded",
    "Mia asked pricing strategy advice from Natalie Shaw.",
    "Liam started a capital planning session with Victor Hale.",
    "Aisha sought content monetization guidance from Jordan Blake.",
    "$175K just funded",
    "Noah requested growth tactics from Ryan Cole.",
    "Emma connected with leadership coach Priya Desai.",
    "Lucas tapped into venture funding insight from Marcus Allen.",
    "$80K just funded",
    "Ava started a marketing optimization session with Elena Cruz.",
    "Ethan sought real estate analysis from Carter Hayes.",
    "Olivia connected with business strategist Daniel Brooks.",
    "$300K just funded",
    "Mason requested tax structure advice from Marcus Allen.",
    "Harper started a brand audit session with Isabella Reed.",
    "Elijah sought capital deployment insight from Andre Thompson.",
    "$45K just funded",
    "Zoe connected with scaling mentor Ryan Cole.",
    "Benjamin requested sales funnel guidance from Natalie Shaw.",
  ];
  const [proofIndex, setProofIndex] = useState(0);
  const [proofVisible, setProofVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
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
    if (!email) return;
    setIsLoading(true);
    try {
      await login(email);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

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

      <div className="relative bg-black overflow-hidden">
        <TechBackground />

        <div className="relative z-10 flex flex-col min-h-[85vh] sm:min-h-[90vh] justify-center px-6 sm:px-12 md:px-20 lg:px-28">

          <div className="mb-12 sm:mb-16 md:mb-20">
            <div>
              <h1
                className="text-[52px] sm:text-[80px] md:text-[110px] lg:text-[140px] xl:text-[160px] uppercase"
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 400,
                  lineHeight: 0.95,
                  letterSpacing: '-0.07em',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                data-testid="text-hero-line-1"
              >
                MENTORSHIP
              </h1>
              <h1
                className="text-[52px] sm:text-[80px] md:text-[110px] lg:text-[140px] xl:text-[160px] uppercase"
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 400,
                  lineHeight: 0.95,
                  letterSpacing: '-0.07em',
                  marginLeft: '35%',
                  background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 40%, #c0c0c0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                data-testid="text-hero-line-2"
              >
                ON
              </h1>
              <h1
                className="text-[52px] sm:text-[80px] md:text-[110px] lg:text-[140px] xl:text-[160px] uppercase"
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 400,
                  lineHeight: 0.95,
                  letterSpacing: '-0.07em',
                  marginLeft: '10%',
                  background: 'linear-gradient(180deg, #ffffff 0%, #e0e0e0 40%, #b8b8b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                data-testid="text-hero-line-3"
              >
                DEMAND
              </h1>
            </div>

            <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-start sm:items-end gap-8 sm:gap-16">
              <div className="max-w-[320px]">
                <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.15em] text-white/30 leading-[1.8]">
                  MENTXR EMPOWERS YOU<br />
                  TO ACCESS AI-POWERED<br />
                  GUIDANCE EFFORTLESSLY.
                </p>
              </div>

              <form onSubmit={handleLogin} className="w-full max-w-[420px]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
                  <input
                    data-testid="input-email"
                    type="email"
                    placeholder="Email"
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
                    className="h-[44px] sm:h-[40px] px-6 sm:rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0 border-t border-white/[0.06] sm:border-t-0 sm:mx-0 mx-1.5 mb-1.5 sm:mb-0 rounded-xl sm:rounded-full tracking-wide"
                  >
                    {isLoading ? "..." : "GET ACCESS"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex -space-x-3">
                {["/avatars/face1.jpg", "/avatars/face2.jpg", "/avatars/face3.jpg", "/avatars/face4.jpg", "/avatars/face5.jpg"].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-full border-[2px] border-[#080808] object-cover"
                  />
                ))}
              </div>
              <p className="text-[11px] sm:text-[12px] text-white/20 tracking-wide">
                12,500+ founders scaling with AI mentorship
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 sm:bottom-12 right-6 sm:right-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center backdrop-blur-sm">
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-12 md:px-20 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-[700px]">
          <p className="text-[11px] tracking-[0.15em] text-white/20 uppercase mb-6">About</p>
          <p className="text-[16px] sm:text-[18px] md:text-[20px] text-white/40 leading-[1.8] font-light">
            We are an AI-powered mentorship platform that lets users converse with digital versions of the mentors they admire, delivering trusted guidance anytime, anywhere.
          </p>
        </div>
      </div>

      <div className="px-6 sm:px-12 md:px-20 py-12 sm:py-16 border-t border-white/[0.04]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12">
          <p className="text-[11px] tracking-[0.15em] text-white/20 uppercase">Countdown</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex items-center justify-center">
                <span className="font-mono text-[16px] sm:text-[20px] font-semibold text-white/70 tabular-nums">{String(timeLeft.months).padStart(2, '0')}</span>
              </div>
              <span className="text-[8px] text-white/15 tracking-[0.12em] uppercase mt-1.5">Months</span>
            </div>
            <span className="text-white/15 text-[16px] font-mono -mt-4">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex items-center justify-center">
                <span className="font-mono text-[16px] sm:text-[20px] font-semibold text-white/70 tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
              </div>
              <span className="text-[8px] text-white/15 tracking-[0.12em] uppercase mt-1.5">Hrs</span>
            </div>
            <span className="text-white/15 text-[16px] font-mono -mt-4">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex items-center justify-center">
                <span className="font-mono text-[16px] sm:text-[20px] font-semibold text-white/70 tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
              </div>
              <span className="text-[8px] text-white/15 tracking-[0.12em] uppercase mt-1.5">Min</span>
            </div>
          </div>
          <p className="text-[9px] text-white/15 tracking-[0.15em] uppercase">Until Full Release</p>
        </div>
      </div>

      <div className="px-6 sm:px-12 md:px-20 pb-16 sm:pb-24 pt-12 sm:pt-16 border-t border-white/[0.04]">
        <div className="max-w-[600px]">
          <p className="text-[11px] tracking-[0.15em] text-white/20 uppercase mb-6">FAQ</p>
          <h2 className="text-[22px] sm:text-[28px] md:text-[32px] font-light mb-8 sm:mb-12 tracking-[-0.02em] text-white/60">Frequently asked questions</h2>

          <div className="space-y-1">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border-b border-white/[0.04] overflow-hidden"
              >
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-4 sm:py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] sm:text-[15px] font-medium text-white/50 group-hover:text-white/70 transition-colors">{item.q}</span>
                  <span className="text-[18px] text-white/15 shrink-0 ml-4 leading-none transition-transform" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="pb-4 sm:pb-5">
                    <p className="text-[13px] sm:text-[14px] text-white/25 leading-[1.8]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/[0.04] px-6 sm:px-12 md:px-20 py-8 sm:py-10 flex items-center justify-between">
        <p className="text-[11px] text-white/15">
          &copy; 2026 MentXr&reg; by <span className="text-white/25 font-medium">CMD Supply</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-white/30"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
