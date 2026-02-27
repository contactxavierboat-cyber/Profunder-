import { useState } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import heroBgImg from "@assets/IMG_0431_1772173955262.jpeg";

function SpaceBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <img
        src={heroBgImg}
        alt=""
        className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover"
        style={{ transform: 'translate(-50%, -50%)' }}
        aria-hidden="true"
      />
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


const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[11px] tracking-[0.2em] uppercase mb-6 sm:mb-8 text-[#7a7a9a]">{children}</p>
);

const SubscribeButton = ({ className = "", onSubscribe }: { className?: string; onSubscribe: () => void }) => (
  <button
    onClick={onSubscribe}
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
  { q: "Do I need perfect credit to use this?", a: "No. We work with all credit profiles — from thin files to complex portfolios. Our engine evaluates 6 capital components and places you in the right tier with a clear action plan, whether you're Prime-eligible or in Repair mode." },
  { q: "How is this different from a credit monitoring app?", a: "Credit monitoring shows you a score. We tell you what that score means to a lender, what products you actually qualify for, what will get you denied, and exactly how to fix it. It's underwriting intelligence, not a dashboard." },
  { q: "What documents do I need to upload?", a: "Start with your credit report (from any bureau) and your most recent bank statement. Our AI extracts over 40 data points automatically — no manual entry required." },
  { q: "How accurate is the denial simulation?", a: "Our denial engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials before you ever submit an application." },
  { q: "Is my financial data secure?", a: "All data is encrypted in transit and at rest. We never share your financial information with lenders, brokers, or third parties. Your data is used solely to generate your Capital Readiness analysis." },
  { q: "What's included with a subscription?", a: "Your subscription includes your full Capital Readiness Score, 6-component breakdown, tier eligibility, operating mode analysis, denial simulation, AI mentor chat, and credit repair recommendations — all 30 analyses per month." },
  { q: "Can I use this to prepare for an SBA loan?", a: "Absolutely. We evaluate you against SBA 7(a) and 504 underwriting criteria. You'll see exactly where you stand, what flags exist, and what to fix before applying." },
];


export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login, user } = useAuth();
  const handleSubscribeClick = () => {
    if (user) {
      window.location.href = '/subscription';
    } else {
      setShowLogin(true);
    }
  };


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
                <ProfundrLogo size="sm" className="text-[#1a1a2e]" />
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

      <div className="sticky top-0 z-50 w-full flex justify-center px-3 sm:px-10 pt-3 sm:pt-4" data-testid="nav-top">
        <nav className="flex items-center justify-between w-full max-w-[900px] h-[46px] sm:h-[52px] bg-white/80 backdrop-blur-md rounded-full px-2 sm:px-2.5 pl-2.5 sm:pl-3 shadow-lg shadow-black/10 hover:bg-white/90 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
          <div className="flex items-center px-2" data-testid="nav-logo">
            <ProfundrLogo size="md" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#features" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-features">Features</a>
            <a href="#results" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-results">Results</a>
            <a href="#faq" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111111] transition-colors" data-testid="link-faq">FAQ</a>
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

      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section id="sec-hero" className="relative z-20 min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-12 md:px-20 lg:px-28 py-16 sm:py-20 text-center">

        <div className="relative max-w-[900px] mx-auto flex flex-col items-center">

          <div className="relative w-full rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] px-5 sm:px-12 py-10 sm:py-16 flex flex-col items-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#d0d0de] bg-white/80 mb-8 sm:mb-10">
              <span className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-[#6a6a8a] font-medium" data-testid="text-hero-label">Digital Underwriting Engine</span>
            </div>

            <h1
              className="text-[48px] min-[400px]:text-[58px] sm:text-[68px] md:text-[88px] lg:text-[108px] uppercase italic leading-[0.85] mb-6 sm:mb-8 text-center"
              style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em', backgroundImage: 'linear-gradient(180deg, #000000 0%, #3a3a5a 50%, #7a7a9a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              data-testid="text-hero-headline"
            >
              <span className="hidden sm:inline">Qualify<br />Before<br />You Apply</span><span className="sm:hidden">Qualify Before<br />You Apply</span>
            </h1>

            <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#9a9ab8] to-transparent mb-6 sm:mb-8" />

            <p className="text-[12px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.8] max-w-[520px] mx-auto mb-10 sm:mb-12 px-2 text-justify">
              Know exactly where you stand before you submit a single funding application. We analyze your profile using real underwriting logic to determine your funding potential — before lenders ever see you.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#f5f5fa] border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
                <input
                  data-testid="input-email"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#6a6a8a] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  data-testid="button-join"
                  type="submit"
                  disabled={isLoading}
                  className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 sm:border-t-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
                >
                  {isLoading ? "..." : "SUBSCRIBE"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] text-[#7a7a9a] tracking-wide font-mono">
              <span className="flex items-center gap-1.5"><span className="text-[#9a9ab8]">&#x2713;</span> Full platform access</span>
              <span className="w-px h-3 bg-[#d0d0de]"></span>
              <span className="flex items-center gap-1.5"><span className="text-[#9a9ab8]">&#x2713;</span> Cancel anytime</span>
              <span className="w-px h-3 bg-[#d0d0de]"></span>
              <span className="flex items-center gap-1.5"><span className="text-[#9a9ab8]">&#x2713;</span> 30 analyses / month</span>
            </div>
          </div>

          <ScrollArrow targetId="sec-problem" />
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM / PAIN ═══════════════ */}
      <section id="sec-problem" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-10 sm:mb-14 tracking-[-0.04em]" style={gradientText('180deg', 0.95, 0.55)}>
            73% of funding applications get denied.
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#8a8aaa] to-transparent mx-auto mb-10 sm:mb-14" />
          <div className="space-y-0">
            {[
              "You apply with no idea how a lender evaluates you",
              "Credit scores alone don't reveal product eligibility",
              "Hidden risk signals kill applications before human review",
              "Every denial adds an inquiry — making the next one harder",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-6 py-5 border-b border-[#e0e0ea]/40 last:border-b-0">
                <span className="text-[10px] font-mono text-[#a0a0b8] shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[13px] sm:text-[16px] text-[#4a4a6a] leading-[1.6] text-left">{text}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-solution" />
        </div>
      </section>


      {/* ═══════════════ 3. SOLUTION OVERVIEW ═══════════════ */}
      <section id="sec-solution" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-8 sm:mb-10 tracking-[-0.04em]" style={gradientText('180deg', 0.95, 0.55)}>
            Underwriting intelligence — before you apply.
          </h2>
          <p className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] mb-14 sm:mb-20 max-w-[560px] mx-auto text-justify">
            We analyze your credit report and bank statements using the same 6-component framework real lenders use. You get a Capital Readiness Score, tier placement, exposure ceiling, denial simulation, and a step-by-step action plan.
          </p>
          <div className="grid grid-cols-3 gap-y-12 sm:gap-y-16">
            {[
              { val: "0–100", label: "Readiness Score" },
              { val: "2.5×", label: "Exposure Logic" },
              { val: "3", label: "Tiers" },
              { val: "Pre", label: "Denial Screen" },
              { val: "7", label: "AI Mentors" },
              { val: "Auto", label: "Dispute Letters" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <p className="text-[22px] sm:text-[32px] font-mono text-[#2a2a4a] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 300 }}>{item.val}</p>
                <p className="text-[9px] sm:text-[10px] text-[#9a9ab8] tracking-[0.2em] uppercase">{item.label}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="how-it-works" />
        </div>
      </section>


      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Four steps to underwriting-ready.
          </h2>
          <div className="space-y-16 sm:space-y-20 text-left">
            {[
              { step: "01", title: "Upload", desc: "Drop in your credit report and bank statement. Our AI extracts 40+ data points automatically." },
              { step: "02", title: "Score", desc: "Six components evaluated: Capital Strength, Credit Quality, Structure, Cash Flow, Liquidity, Risk Signals." },
              { step: "03", title: "Position", desc: "See your tier — Prime, Mid, or Alternative — and your maximum fundable amount via 2.5x exposure logic." },
              { step: "04", title: "Fix", desc: "Every underwriting trigger flagged. Auto-generated dispute letters and a repair timeline delivered." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 sm:gap-10 items-start">
                <span className="text-[36px] sm:text-[56px] font-mono text-[#d0d0de] leading-none shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>{item.step}</span>
                <div>
                  <h3 className="text-[18px] sm:text-[24px] text-[#1a1a2e] font-light mb-2 tracking-[-0.02em]">{item.title}</h3>
                  <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="features" />
        </div>
      </section>


      {/* ═══════════════ 5. FUNDING OUTCOMES ═══════════════ */}
      <section id="features" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Walk into any lender's office with confidence.
          </h2>
          <div className="space-y-0">
            {[
              { title: "Capital Readiness Score", desc: "0–100 composite across 6 underwriting components" },
              { title: "2.5x Exposure Ceiling", desc: "Maximum fundable amount with dynamic multiplier logic" },
              { title: "Tier Eligibility", desc: "Prime, Mid-Tier, or Alternative classification" },
              { title: "Denial Simulation", desc: "Pre-screen every trigger a lender would flag" },
              { title: "Credit Repair", desc: "Auto-generated dispute letters for all 3 bureaus" },
              { title: "AI Mentors", desc: "7 specialized advisors across strategy domains" },
              { title: "Operating Modes", desc: "Pre-Funding or Repair with tailored action paths" },
              { title: "Risk Detection", desc: "Liens, judgments, utilization spikes, velocity flags" },
              { title: "Next Steps", desc: "Action plan prioritized by fundability impact" },
            ].map((item, i) => (
              <div key={item.title} className="flex items-baseline justify-between py-4 border-b border-[#e0e0ea]/30 last:border-b-0 gap-4">
                <h3 className="text-[14px] sm:text-[16px] text-[#2a2a4a] font-medium text-left">{item.title}</h3>
                <p className="text-[11px] sm:text-[13px] text-[#8a8aa5] text-right shrink-0">{item.desc}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="results" />
        </div>
      </section>


      {/* ═══════════════ 6. SOCIAL PROOF ═══════════════ */}
      <section id="results" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Results</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Clarity, not luck.
          </h2>

          <div className="flex justify-between items-end mb-20 sm:mb-28 px-2">
            {[
              { val: "12.5K+", label: "Analyzed" },
              { val: "$47M+", label: "Deployed" },
              { val: "89%", label: "Approved" },
              { val: "6.2×", label: "Improvement" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <p className="text-[20px] sm:text-[36px] font-mono text-[#2a2a4a] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>{s.val}</p>
                <p className="text-[8px] sm:text-[10px] text-[#a0a0b8] tracking-[0.2em] uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-14 sm:space-y-20">
            {[
              { name: "Marcus T.", role: "E-commerce", quote: "42 to 78 in 60 days. Approved for $250K on the first try." },
              { name: "Aisha K.", role: "Real Estate", quote: "Denial simulation caught 3 triggers. Fixed them all — approved same week." },
              { name: "David L.", role: "SaaS", quote: "Moved from Mid-Tier to Prime. Saved 4% on rates." },
            ].map((t) => (
              <div key={t.name} className="text-left">
                <p className="text-[16px] sm:text-[22px] text-[#3a3a5a] leading-[1.5] mb-4 italic font-light">"{t.quote}"</p>
                <p className="text-[11px] text-[#9a9ab8] tracking-[0.1em]">{t.name} — {t.role}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-risk" />
        </div>
      </section>


      {/* ═══════════════ 7. RISK REVERSAL ═══════════════ */}
      <section id="sec-risk" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>No More Guessing</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-8 sm:mb-10 tracking-[-0.04em]" style={gradientText('180deg', 0.95, 0.55)}>
            Apply ready, not blind.
          </h2>
          <p className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] mb-14 sm:mb-20 max-w-[520px] mx-auto">
            Every denial costs you — hard inquiries, wasted time, damaged confidence. See what a lender sees before you ever submit.
          </p>
          <div className="flex flex-col sm:flex-row gap-12 sm:gap-20 text-left">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#c0c0d0] mb-6">Without</p>
              <div className="space-y-4">
                {["Guess at eligibility", "Multiple applications", "Hard inquiries stack", "Denied without reason", "Repeat"].map((t) => (
                  <p key={t} className="text-[13px] sm:text-[15px] text-[#b0b0c0] line-through decoration-[#d0d0de]">{t}</p>
                ))}
              </div>
            </div>
            <div className="w-px bg-gradient-to-b from-transparent via-[#d0d0de] to-transparent hidden sm:block" />
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#7a7a9a] mb-6">With Profundr</p>
              <div className="space-y-4">
                {["Know your tier & ceiling", "Fix before applying", "Apply once, with clarity", "Approved first try", "Build momentum"].map((t) => (
                  <p key={t} className="text-[13px] sm:text-[15px] text-[#3a3a5a]">{t}</p>
                ))}
              </div>
            </div>
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-breakdown" />
        </div>
      </section>


      {/* ═══════════════ 8. FEATURE BREAKDOWN ═══════════════ */}
      <section id="sec-breakdown" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Scoring Framework</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Six components. One score.
          </h2>
          <div className="space-y-0">
            {[
              { name: "Capital Strength", weight: "20", desc: "Revenue, assets, collateral" },
              { name: "Credit Quality", weight: "20", desc: "FICO, payment history, utilization" },
              { name: "Management", weight: "15", desc: "Entity, tenure, structure" },
              { name: "Cash Flow", weight: "15", desc: "DSCR, reserves, consistency" },
              { name: "Liquidity", weight: "15", desc: "DTI, current ratio, obligations" },
              { name: "Risk Signals", weight: "15", desc: "Liens, judgments, velocity flags" },
            ].map((c) => (
              <div key={c.name} className="flex items-center py-5 border-b border-[#e0e0ea]/30 last:border-b-0 gap-4 sm:gap-8">
                <span className="text-[14px] sm:text-[16px] text-[#2a2a4a] font-medium text-left w-[140px] sm:w-[180px] shrink-0">{c.name}</span>
                <span className="text-[18px] sm:text-[22px] font-mono text-[#c0c0d0] shrink-0 w-10 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>{c.weight}</span>
                <p className="text-[11px] sm:text-[13px] text-[#9a9ab8] text-left">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-baseline justify-between">
            <span className="text-[13px] text-[#5a5a7a]">Total</span>
            <span className="text-[28px] sm:text-[36px] font-mono text-[#2a2a4a]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>100</span>
          </div>
          <p className="text-[11px] text-[#a0a0b8] mt-2">Qualification range: $25K – $5M+ based on composite score and tier</p>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-modes" />
        </div>
      </section>


      {/* ═══════════════ 9. MODE DIFFERENTIATION ═══════════════ */}
      <section id="sec-modes" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Operating Modes</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Two modes. One goal.
          </h2>
          <div className="flex flex-col sm:flex-row gap-16 sm:gap-20 text-left">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-3">Pre-Funding</p>
              <p className="text-[28px] sm:text-[36px] font-mono text-[#2a2a4a] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>60+</p>
              <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7] mb-6">
                Optimize ceiling, refine tier placement, match to best products.
              </p>
              <div className="space-y-3">
                {["Product matching", "Ceiling maximization", "Timing strategy", "Rate optimization"].map((t) => (
                  <p key={t} className="text-[12px] text-[#8a8aa5]">— {t}</p>
                ))}
              </div>
            </div>
            <div className="w-px bg-gradient-to-b from-transparent via-[#d0d0de] to-transparent hidden sm:block" />
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-3">Repair</p>
              <p className="text-[28px] sm:text-[36px] font-mono text-[#2a2a4a] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>&lt;60</p>
              <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7] mb-6">
                Fix issues first — disputes, payments, structure corrections, timeline to ready.
              </p>
              <div className="space-y-3">
                {["Dispute letters", "Issue prioritization", "90-day timeline", "Score projections"].map((t) => (
                  <p key={t} className="text-[12px] text-[#8a8aa5]">— {t}</p>
                ))}
              </div>
            </div>
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-tiers" />
        </div>
      </section>


      {/* ═══════════════ 10. TIER POSITIONING ═══════════════ */}
      <section id="sec-tiers" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Tier Eligibility</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Three tiers. Know yours.
          </h2>
          <div className="space-y-12 sm:space-y-16 text-left">
            {[
              { name: "Prime", score: "75–100", products: "SBA 7(a), Conventional LOC, Term Loans, Equipment Finance" },
              { name: "Mid-Tier", score: "50–74", products: "Revenue-Based Lending, Invoice Factoring, MCA, Bridge Loans" },
              { name: "Alternative", score: "25–49", products: "Microloans, Secured Cards, Credit Builders, CDFI Loans" },
            ].map((t, i) => (
              <div key={t.name} className="flex gap-6 sm:gap-10 items-start">
                <span className="text-[36px] sm:text-[56px] font-mono text-[#d0d0de] leading-none shrink-0 w-16 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="flex items-baseline gap-4 mb-2">
                    <h3 className="text-[18px] sm:text-[24px] text-[#1a1a2e] font-light tracking-[-0.02em]">{t.name}</h3>
                    <span className="text-[13px] font-mono text-[#9a9ab8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.score}</span>
                  </div>
                  <p className="text-[12px] sm:text-[14px] text-[#7a7a9a] leading-[1.6]">{t.products}</p>
                </div>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-case" />
        </div>
      </section>


      {/* ═══════════════ 11. CASE STUDY ═══════════════ */}
      <section id="sec-case" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Case Study</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            38 → 71 in 67 days.
          </h2>
          <div className="space-y-0 text-left">
            {[
              { day: "01", detail: "Score 38. Tier 3. Four triggers: 78% utilization, 2 collections, thin file, no EIN." },
              { day: "03", detail: "6 dispute letters generated. 90-day utilization plan. EIN + business account recommended." },
              { day: "30", detail: "Score 52. Tier 2. 1 collection removed. Utilization 45%. Ceiling: $85K." },
              { day: "67", detail: "Score 71. Zero triggers. Utilization 22%. Ceiling: $210K. Applied $175K LOC — approved." },
            ].map((step) => (
              <div key={step.day} className="flex items-start gap-6 sm:gap-10 py-6 border-b border-[#e0e0ea]/30 last:border-b-0">
                <span className="text-[10px] font-mono text-[#a0a0b8] shrink-0 mt-1 tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>DAY {step.day}</span>
                <p className="text-[13px] sm:text-[15px] text-[#4a4a6a] leading-[1.7]">{step.detail}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="faq" />
        </div>
      </section>


      {/* ═══════════════ 12. FAQ ═══════════════ */}
      <section id="faq" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[640px] mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Straight answers.
          </h2>
          <div className="space-y-0 text-left">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-[#e0e0ea]/40">
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between py-6 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] sm:text-[16px] text-[#3a3a5a] group-hover:text-[#1a1a2e] transition-colors pr-6">{item.q}</span>
                  <span className="text-[16px] text-[#b0b0c0] shrink-0 leading-none transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="pb-6">
                    <p className="text-[12px] sm:text-[14px] text-[#6a6a8a] leading-[1.7] sm:leading-[1.8]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-trust" />
        </div>
      </section>


      {/* ═══════════════ 13. TRUST ═══════════════ */}
      <section id="sec-trust" className="relative z-20 px-6 sm:px-12 md:px-20 py-24 sm:py-36 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <SectionLabel>Trust</SectionLabel>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] leading-[0.88] mb-14 sm:mb-20 tracking-[-0.04em]" style={gradientText('180deg', 0.9, 0.5)}>
            Your data. Your control.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-12">
            {[
              { title: "Encrypted", desc: "AES-256 at rest, TLS 1.3 in transit" },
              { title: "Private", desc: "Never shared with lenders or brokers" },
              { title: "Compliant", desc: "FCRA-aligned analysis and disputes" },
              { title: "No Pull", desc: "Zero impact on your credit score" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <h3 className="text-[14px] sm:text-[16px] text-[#2a2a4a] font-medium mb-2">{item.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#9a9ab8] leading-[1.5] max-w-[140px]">{item.desc}</p>
              </div>
            ))}
          </div>
          <SubscribeButton className="mt-14" onSubscribe={handleSubscribeClick} />
          <ScrollArrow targetId="sec-cta" />
        </div>
      </section>


      {/* ═══════════════ 14. FINAL CTA ═══════════════ */}
      <section id="sec-cta" className="relative z-20 px-6 sm:px-12 md:px-20 py-28 sm:py-40">
        <div className="relative max-w-[640px] mx-auto text-center">
          <h2
            className="text-[32px] sm:text-[48px] md:text-[60px] leading-[0.88] mb-8 tracking-[-0.04em]"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 400, ...gradientText('180deg', 1, 0.55) }}
            data-testid="text-final-cta"
          >
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[13px] sm:text-[16px] text-[#5a5a7a] leading-[1.7] sm:leading-[1.9] mb-12 max-w-[480px] mx-auto">
            Capital Readiness Score. Tier eligibility. Exposure ceiling. Denial simulation. All in one place.
          </p>
          <form onSubmit={handleLogin} className="w-full max-w-[440px] mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/60 backdrop-blur-sm border border-[#e0e0ea]/50 rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email-bottom"
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab8] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
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
                {isLoading ? "..." : "SUBSCRIBE"}
              </button>
            </div>
          </form>
          <p className="text-[11px] text-[#b0b0c0] tracking-wide mb-6">
            12,500+ founders already qualifying before they apply
          </p>
          <SubscribeButton onSubscribe={handleSubscribeClick} />
        </div>
      </section>

      {/* ═══════════════ 15. FOOTER ═══════════════ */}
      <footer className="relative z-20 px-4 sm:px-12 md:px-20 py-10 sm:py-16 text-center">
        <div className="relative max-w-[720px] mx-auto">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8 mb-8">
            <ProfundrLogo size="sm" className="text-[#1a1a2e]" />
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {["Privacy", "Terms", "Contact", "Support"].map((link) => (
                <span key={link} className="text-[10px] sm:text-[11px] text-[#9a9ab8] tracking-[0.15em] uppercase cursor-pointer hover:text-[#5a5a7a] transition-colors">{link}</span>
              ))}
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d0d0de]/50 to-transparent mb-6" />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
            <p className="text-[10px] text-[#a0a0b8]">
              &copy; 2026 CMD Supply
            </p>
            <p className="text-[9px] text-[#b0b0c0] max-w-[400px] leading-[1.5]">
              Not a lender, broker, or financial advisor. Analyses are informational only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
