import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/store";
import { BaalioLogo } from "@/components/baalio-logo";

function SpaceBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1.0;
    let rafId: number;
    const ease = () => {
      if (video.playbackRate > 0.4) {
        video.playbackRate = Math.max(0.4, video.playbackRate - 0.005);
        rafId = requestAnimationFrame(ease);
      }
    };
    rafId = requestAnimationFrame(ease);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover"
        style={{
          transform: 'translate(-50%, -50%)',
        }}
      >
        <source src="/marble-bg.mp4" type="video/mp4" />
      </video>
    </div>
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

const contentBlockStyle = "relative z-30 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 sm:p-8";

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
    Subscribe
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
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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

  const handleLoginModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setIsLoading(true);
    try {
      await login(loginEmail);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-[#1a1a2e] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SpaceBackground />

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !isLoading && setShowLogin(false)}>
          <div className="w-full max-w-[400px] mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
                <BaalioLogo size="sm" className="text-[#1a1a2e]" />
              </div>
              <button onClick={() => setShowLogin(false)} className="text-[#9a9ab0] hover:text-[#3a3a5a] transition-colors text-[18px] leading-none" data-testid="button-close-login">&times;</button>
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1a1a2e] mb-1">Welcome back</h2>
            <p className="text-[13px] text-[#6a6a8a] mb-6">Log in with your email to continue</p>
            <form onSubmit={handleLoginModal}>
              <input
                data-testid="input-login-email"
                type="email"
                placeholder="Email address"
                className="w-full bg-[#f5f5fa] border border-[#e0e0ea] rounded-xl h-[48px] px-4 text-[14px] text-[#1a1a2e] placeholder:text-[#6a6a8a] outline-none focus:border-[#6a6a8a] transition-colors mb-4"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
              <button
                data-testid="button-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-[48px] rounded-xl text-white text-[13px] font-bold hover:opacity-90 transition-colors tracking-wide disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
              >
                {isLoading ? "..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      )}

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

      <div className="sticky top-0 z-50 w-full flex justify-center px-3 sm:px-10 pt-3 sm:pt-4" data-testid="nav-top">
        <nav className="flex items-center justify-between w-full max-w-[900px] h-[46px] sm:h-[52px] bg-white/80 backdrop-blur-md rounded-full px-2 sm:px-2.5 pl-2.5 sm:pl-3 shadow-lg shadow-black/10 hover:bg-white/90 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
          <div className="flex items-center px-2" data-testid="nav-logo">
            <BaalioLogo size="md" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#what-you-get" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-what-you-get">What You Get</a>
            <a href="#why-it-matters" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-why-it-matters">Why It Matters</a>
          </div>

          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-[12.5px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
            data-testid="button-login"
          >
            Log In
          </button>
        </nav>
      </div>

      <section id="sec-hero" className="relative z-20 min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-12 md:px-20 lg:px-28 py-16 sm:py-20 text-center">
        <div className="relative max-w-[900px] mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-white/50 backdrop-blur-sm px-4 sm:px-12 py-8 sm:py-14 shadow-lg shadow-black/8 hover:bg-white/60 hover:shadow-xl hover:shadow-black/12 transition-all duration-500">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#6a6a8a] mb-6" data-testid="text-hero-label">PROFUNDR</p>
          <h1
            className="text-[36px] min-[400px]:text-[44px] sm:text-[56px] md:text-[72px] lg:text-[88px] uppercase italic leading-[0.88] mb-6 sm:mb-8 text-center"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em', backgroundImage: 'linear-gradient(180deg, #000000 0%, #3a3a5a 50%, #7a7a9a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            data-testid="text-hero-headline"
          >
            Qualify Before<br />You Apply.
          </h1>

          <SubscribeButton className="mb-8" />

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] text-[#7a7a9a] tracking-wide">
            <span>Full platform access</span>
            <span className="w-1 h-1 rounded-full bg-[#c0c0d0]"></span>
            <span>Cancel anytime</span>
            <span className="w-1 h-1 rounded-full bg-[#c0c0d0]"></span>
            <span>30 analyses / month</span>
          </div>
          </div>
          <ScrollArrow targetId="sec-ready" />
        </div>
      </section>

      <section id="sec-ready" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 text-center">
        <div className="relative max-w-[800px] mx-auto">
          <div className="rounded-2xl bg-white/50 backdrop-blur-sm px-4 sm:px-10 py-8 sm:py-10 shadow-lg shadow-black/8">
          <SectionLabel>The Reality</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.95, 0.55)}>
            Are You Ready for Funding?
          </h2>
          <div className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] max-w-[560px] mx-auto space-y-4">
            <p>Most business owners apply and hope.</p>
            <p>Profundr shows you if you're actually ready — before you submit an application.<br />
            Before you get denied.<br />
            Before you hurt your credit.</p>
          </div>
          </div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="how-it-works" />
        </div>
      </section>

      <section id="how-it-works" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 text-center">
        <div className="relative max-w-[800px] mx-auto">
          <div className="rounded-2xl bg-white/50 backdrop-blur-sm px-4 sm:px-10 py-8 sm:py-10 shadow-lg shadow-black/8">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            We review your credit profile the way lenders do.
          </h2>
          <div className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] max-w-[560px] mx-auto mb-8">
            <p className="mb-4">We check:</p>
          </div>
          <div className="max-w-[400px] mx-auto mb-8">
            <div className="space-y-3">
              {[
                "Recent applications",
                "Credit usage",
                "Account age",
                "Credit limits",
                "Total credit exposure",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f8fc] border border-[#e0e0ea]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a8aa5] shrink-0"></span>
                  <span className="text-[13px] sm:text-[15px] text-[#3a3a5a]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] max-w-[560px] mx-auto space-y-3">
            <p>Then we tell you clearly:</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4">
              <span className="text-[15px] sm:text-[18px] font-medium text-[#2a2a4a]">Ready to apply.</span>
              <span className="text-[#c0c0d0] hidden sm:inline">|</span>
              <span className="text-[15px] sm:text-[18px] font-medium text-[#6a6a8a]">Or fix this first.</span>
            </div>
          </div>
          </div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="what-you-get" />
        </div>
      </section>

      <section id="what-you-get" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 text-center">
        <div className="relative max-w-[800px] mx-auto">
          <div className="rounded-2xl bg-white/50 backdrop-blur-sm px-4 sm:px-10 py-8 sm:py-10 shadow-lg shadow-black/8">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-8 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Everything you need to know.
          </h2>
          <div className="max-w-[440px] mx-auto mb-8">
            <div className="space-y-3">
              {[
                "Fundability Score",
                "Approval level",
                "Risk warnings",
                "Exposure estimate",
                "Simple action steps",
                "Clear timing guidance",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f8fc] border border-[#e0e0ea]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a8aa5] shrink-0"></span>
                  <span className="text-[13px] sm:text-[15px] text-[#3a3a5a]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[15px] sm:text-[18px] font-medium text-[#2a2a4a]">No guessing.</p>
          </div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="why-it-matters" />
        </div>
      </section>

      <section id="why-it-matters" className="relative z-20 px-6 sm:px-12 md:px-20 py-20 sm:py-28 text-center">
        <div className="relative max-w-[800px] mx-auto">
          <div className="rounded-2xl bg-white/50 backdrop-blur-sm px-4 sm:px-10 py-8 sm:py-10 shadow-lg shadow-black/8">
          <SectionLabel>Why It Matters</SectionLabel>
          <h2 className="text-[26px] sm:text-[36px] md:text-[44px] leading-[0.9] mb-6 tracking-[-0.03em]" style={gradientText('180deg', 0.9, 0.5)}>
            Timing is everything.
          </h2>
          <div className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] max-w-[560px] mx-auto space-y-4">
            <p>Every application leaves a mark.<br />
            Too many marks lower approval chances.</p>
            <p>Timing matters.</p>
            <div className="pt-4 space-y-1">
              <p className="text-[15px] sm:text-[18px] font-medium text-[#2a2a4a]">Qualify first.</p>
              <p className="text-[15px] sm:text-[18px] font-medium text-[#6a6a8a]">Apply second.</p>
            </div>
          </div>
          </div>
          <SubscribeButton className="mt-10" />
          <ScrollArrow targetId="sec-cta" />
        </div>
      </section>

      <section id="sec-cta" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36">
        <div className="relative max-w-[700px] mx-auto text-center">
          <div className="rounded-2xl bg-white/50 backdrop-blur-sm px-4 sm:px-10 py-8 sm:py-10 shadow-lg shadow-black/8">
          <h2
            className="text-[30px] sm:text-[44px] md:text-[56px] leading-[0.9] mb-6 tracking-[-0.04em]"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, ...gradientText('180deg', 1, 0.55) }}
            data-testid="text-final-cta"
          >
            Qualify first.<br />Apply second.
          </h2>
          <p className="text-[12px] sm:text-[15px] text-[#6a6a8a] leading-[1.6] sm:leading-[1.8] mb-0 max-w-[480px] mx-auto">
            Know where you stand before you submit. Subscribe today and find out if you're ready.
          </p>
          </div>
          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mt-8 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#f5f5fa] border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#6a6a8a] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join-bottom"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
                style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
              >
                {isLoading ? "..." : "Subscribe"}
              </button>
            </div>
          </form>
          <SubscribeButton className="mt-6" />
        </div>
      </section>

      <footer className="relative z-20 border-t border-[#e0e0ea] py-12 sm:py-16 px-6 sm:px-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[900px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
              <BaalioLogo size="sm" className="text-[#1a1a2e]" />
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <a href="#how-it-works" className="text-[12px] text-[#8a8aa5] hover:text-[#3a3a5a] transition-colors" data-testid="link-footer-how">How It Works</a>
              <a href="#what-you-get" className="text-[12px] text-[#8a8aa5] hover:text-[#3a3a5a] transition-colors" data-testid="link-footer-features">What You Get</a>
              <a href="#why-it-matters" className="text-[12px] text-[#8a8aa5] hover:text-[#3a3a5a] transition-colors" data-testid="link-footer-why">Why It Matters</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#e0e0ea] text-center">
            <p className="text-[11px] text-[#9a9ab0]">&copy; {new Date().getFullYear()} Profundr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
