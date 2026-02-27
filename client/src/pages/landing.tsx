import { useState } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import heroBgImg from "@assets/IMG_0431_1772173955262.jpeg";

const gt = (dir = '180deg') => ({
  backgroundImage: `linear-gradient(${dir}, #0a0a1a 0%, #2a2a4a 50%, #6a6a8a 100%)`,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
  fontStyle: 'italic' as const,
  lineHeight: '0.92',
});

const mono = { fontFamily: "'JetBrains Mono', monospace", fontWeight: 300 } as const;
const satoshi = { fontFamily: "'Satoshi', sans-serif", fontWeight: 400, letterSpacing: '-0.06em' } as const;

const faqItems = [
  { q: "Do I need perfect credit to use this?", a: "No. We work with all credit profiles — from thin files to complex portfolios. Our engine evaluates 6 capital components and places you in the right tier with a clear action plan, whether you're Prime-eligible or in Repair mode." },
  { q: "How is this different from credit monitoring?", a: "Credit monitoring shows you a score. We tell you what that score means to a lender, what products you actually qualify for, what will get you denied, and exactly how to fix it. It's underwriting intelligence, not a dashboard." },
  { q: "What documents do I need?", a: "Start with your credit report (from any bureau) and your most recent bank statement. Our AI extracts over 40 data points automatically — no manual entry required." },
  { q: "How accurate is the denial simulation?", a: "Our denial engine uses real underwriting triggers from SBA, conventional, and alternative lenders. It catches issues that cause 73% of funding denials before you ever submit an application." },
  { q: "Is my financial data secure?", a: "All data is encrypted in transit and at rest. We never share your financial information with lenders, brokers, or third parties. Your data is used solely to generate your Capital Readiness analysis." },
  { q: "What's included?", a: "Full Capital Readiness Score, 6-component breakdown, tier eligibility, operating mode analysis, denial simulation, AI mentor chat, and credit repair recommendations — 30 analyses per month." },
  { q: "Can I prepare for an SBA loan?", a: "Absolutely. We evaluate you against SBA 7(a) and 504 underwriting criteria. You'll see exactly where you stand, what flags exist, and what to fix before applying." },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login, user } = useAuth();

  const handleSubscribeClick = () => {
    if (user) window.location.href = '/subscription';
    else setShowLogin(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try { await login(email); } catch { setIsLoading(false); }
  };

  const handleLoginModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setIsLoading(true);
    try { await login(loginEmail); } catch { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen text-[#1a1a2e] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <img src={heroBgImg} alt="" className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover" style={{ transform: 'translate(-50%, -50%)' }} aria-hidden="true" />
      </div>

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
              <input data-testid="input-login-email" type="email" placeholder="Email address" className="w-full bg-[#f5f5fa] border border-[#e0e0ea] rounded-xl h-[48px] px-4 text-[14px] text-[#1a1a2e] placeholder:text-[#6a6a8a] outline-none focus:border-[#6a6a8a] transition-colors mb-4" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required disabled={isLoading} autoFocus />
              <button data-testid="button-login-submit" type="submit" disabled={isLoading} className="w-full h-[48px] rounded-xl text-white text-[13px] font-bold hover:opacity-90 transition-colors tracking-wide disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}>
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
            <a href="#how-it-works" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111] transition-colors" data-testid="link-how-it-works">Process</a>
            <a href="#features" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111] transition-colors" data-testid="link-features">Platform</a>
            <a href="#results" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111] transition-colors" data-testid="link-results">Results</a>
            <a href="#faq" className="text-[13px] font-medium text-[#5a5a7a] hover:text-[#111] transition-colors" data-testid="link-faq">FAQ</a>
          </div>
          <button onClick={() => setShowLogin(true)} className="rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-[12.5px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] shadow-sm" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }} data-testid="button-login">
            Log In
          </button>
        </nav>
      </div>

      <div className="relative z-20 px-4 sm:px-8 md:px-16 lg:px-24 pt-8 sm:pt-12 pb-16 sm:pb-24">
        <div className="max-w-[840px] mx-auto rounded-[24px] sm:rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_60px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* ═══ HERO ═══ */}
          <section id="sec-hero" className="px-6 sm:px-14 pt-14 sm:pt-20 pb-16 sm:pb-24 text-center" data-testid="section-hero">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#d0d0de] bg-white/60 mb-8 sm:mb-10">
              <span className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#6a6a8a] font-medium" data-testid="text-hero-label">Capital Operating System</span>
            </div>

            <h1 className="text-[48px] min-[400px]:text-[58px] sm:text-[72px] md:text-[92px] lg:text-[108px] uppercase italic leading-[0.84] mb-8 sm:mb-10" style={{ ...satoshi, backgroundImage: 'linear-gradient(180deg, #0a0a1a 0%, #2a2a4a 50%, #7a7a9a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} data-testid="text-hero-headline">
              Qualify<br />Before<br />You Apply
            </h1>

            <p className="text-[13px] sm:text-[16px] text-[#4a4a6a] leading-[1.7] sm:leading-[1.8] max-w-[480px] mx-auto mb-10 sm:mb-12">
              AI-powered underwriting intelligence that shows you exactly where you stand — before lenders ever see your file.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-[420px] mx-auto mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/80 border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden shadow-sm">
                <input data-testid="input-email" type="email" placeholder="Enter your email" className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab8] outline-none px-4 py-3.5 sm:px-0 sm:py-0" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <button data-testid="button-join" type="submit" disabled={isLoading} className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}>
                  {isLoading ? "..." : "Get Started"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[10px] sm:text-[11px] text-[#8a8aa0] tracking-wide" style={mono}>
              <span>$50/mo</span>
              <span className="w-px h-3 bg-[#d0d0de]"></span>
              <span>Cancel anytime</span>
              <span className="w-px h-3 bg-[#d0d0de]"></span>
              <span>30 analyses/mo</span>
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ PROBLEM ═══ */}
          <section id="sec-problem" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-problem">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">The Problem</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-4 tracking-[-0.04em]" style={gt()}>
              73% of business funding applications are denied.
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#6a6a8a] leading-[1.7] mb-10 sm:mb-14 max-w-[520px]">
              Most founders don't fail because they aren't qualified — they fail because they can't see what lenders see.
            </p>
            <div className="space-y-0">
              {[
                "Lender evaluation criteria remain invisible to applicants",
                "Credit scores alone don't determine product eligibility",
                "Hidden risk signals trigger automated denials",
                "Each denial adds a hard inquiry — compounding the problem",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-5 py-4 border-b border-[#e0e0ea]/40 last:border-b-0">
                  <span className="text-[10px] text-[#c0c0d0] shrink-0 w-5" style={mono}>{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[13px] sm:text-[15px] text-[#4a4a6a] leading-[1.6]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ SOLUTION ═══ */}
          <section id="sec-solution" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-solution">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">The Solution</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-4 tracking-[-0.04em]" style={gt()}>
              Underwriting intelligence, delivered before you apply.
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#6a6a8a] leading-[1.7] mb-12 sm:mb-16 max-w-[520px]">
              We run your profile through the same 6-component framework used by commercial lenders. You get a score, a tier, an exposure ceiling, and a clear action plan.
            </p>
            <div className="grid grid-cols-3 gap-y-10 sm:gap-y-14">
              {[
                { val: "0–100", label: "Readiness Score" },
                { val: "2.5×", label: "Exposure Logic" },
                { val: "3", label: "Capital Tiers" },
                { val: "Pre", label: "Denial Screen" },
                { val: "7", label: "AI Mentors" },
                { val: "Auto", label: "Dispute Letters" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <p className="text-[20px] sm:text-[30px] text-[#2a2a4a] mb-1" style={mono}>{item.val}</p>
                  <p className="text-[8px] sm:text-[10px] text-[#a0a0b8] tracking-[0.2em] uppercase">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ HOW IT WORKS ═══ */}
          <section id="how-it-works" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-how">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Process</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Four steps to capital readiness.
            </h2>
            <div className="space-y-12 sm:space-y-16">
              {[
                { step: "01", title: "Upload", desc: "Credit report and bank statement. 40+ data points extracted automatically — zero manual entry." },
                { step: "02", title: "Analyze", desc: "Six underwriting components scored: Capital Strength, Credit Quality, Structure, Cash Flow, Liquidity, Risk Signals." },
                { step: "03", title: "Position", desc: "Tier classification — Prime, Mid-Tier, or Alternative — with maximum fundable amount via 2.5× exposure logic." },
                { step: "04", title: "Optimize", desc: "Every denial trigger surfaced. Auto-generated dispute letters, repair timeline, and prioritized action plan delivered." },
              ].map((item) => (
                <div key={item.step} className="flex gap-5 sm:gap-8 items-start">
                  <span className="text-[32px] sm:text-[48px] text-[#d8d8e4] leading-none shrink-0" style={mono}>{item.step}</span>
                  <div className="pt-1 sm:pt-2">
                    <h3 className="text-[17px] sm:text-[22px] text-[#1a1a2e] font-medium mb-1.5 tracking-[-0.02em]">{item.title}</h3>
                    <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ PLATFORM ═══ */}
          <section id="features" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-features">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Platform</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Everything a founder needs to walk in funded.
            </h2>
            <div className="space-y-0">
              {[
                { title: "Capital Readiness Score", desc: "0–100 composite across 6 weighted components" },
                { title: "Exposure Ceiling", desc: "Max fundable amount via dynamic 2.5× multiplier" },
                { title: "Tier Eligibility", desc: "Prime, Mid-Tier, or Alternative classification" },
                { title: "Denial Simulation", desc: "Pre-screen every lender trigger before submission" },
                { title: "Credit Repair Engine", desc: "Auto-generated dispute letters for all 3 bureaus" },
                { title: "AI Mentor Network", desc: "7 specialized advisors across business domains" },
                { title: "Operating Modes", desc: "Pre-Funding or Repair — tailored action sequences" },
                { title: "Risk Signal Detection", desc: "Liens, judgments, utilization spikes, velocity flags" },
                { title: "Prioritized Action Plan", desc: "Next steps ranked by impact on fundability" },
              ].map((item) => (
                <div key={item.title} className="flex items-baseline justify-between py-3.5 border-b border-[#e0e0ea]/30 last:border-b-0 gap-4">
                  <span className="text-[13px] sm:text-[15px] text-[#2a2a4a] font-medium">{item.title}</span>
                  <span className="text-[11px] sm:text-[13px] text-[#9a9ab8] text-right shrink-0 hidden sm:block">{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ SCORING FRAMEWORK ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-scoring">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Scoring Framework</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Six components. One score.
            </h2>
            <div className="space-y-0">
              {[
                { name: "Capital Strength", pts: "20", desc: "Revenue, assets, collateral" },
                { name: "Credit Quality", pts: "20", desc: "FICO, payment history, utilization" },
                { name: "Management & Structure", pts: "15", desc: "Entity, tenure, ownership" },
                { name: "Earnings & Cash Flow", pts: "15", desc: "DSCR, reserves, consistency" },
                { name: "Liquidity & Leverage", pts: "15", desc: "DTI, current ratio, obligations" },
                { name: "Risk Signals", pts: "15", desc: "Liens, judgments, velocity" },
              ].map((c) => (
                <div key={c.name} className="flex items-center py-4 border-b border-[#e0e0ea]/30 last:border-b-0 gap-4 sm:gap-6">
                  <span className="text-[13px] sm:text-[15px] text-[#2a2a4a] font-medium w-[160px] sm:w-[200px] shrink-0">{c.name}</span>
                  <span className="text-[16px] sm:text-[20px] text-[#c0c0d4] w-8 text-right shrink-0" style={mono}>{c.pts}</span>
                  <span className="text-[11px] sm:text-[13px] text-[#9a9ab8] hidden sm:block">{c.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex items-baseline justify-between mt-8 pt-6 border-t border-[#d0d0de]/40">
              <span className="text-[14px] text-[#3a3a5a] font-medium">Total</span>
              <div className="text-right">
                <span className="text-[28px] sm:text-[36px] text-[#2a2a4a]" style={mono}>100</span>
                <p className="text-[10px] text-[#a0a0b8] mt-1">$25K – $5M+ qualification range</p>
              </div>
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ OPERATING MODES ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-modes">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Operating Modes</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Two paths. One destination.
            </h2>
            <div className="flex flex-col sm:flex-row gap-10 sm:gap-0">
              <div className="flex-1 sm:pr-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-2">Pre-Funding Mode</p>
                <p className="text-[28px] sm:text-[36px] text-[#2a2a4a] mb-3" style={mono}>60+</p>
                <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7] mb-5">
                  You're fundable. Optimize your ceiling, refine tier placement, match to products, time your application.
                </p>
                <div className="space-y-2.5">
                  {["Product matching", "Ceiling maximization", "Timing strategy", "Rate optimization"].map((t) => (
                    <p key={t} className="text-[12px] text-[#8a8aa5]">— {t}</p>
                  ))}
                </div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-[#d0d0de]/60 to-transparent hidden sm:block" />
              <div className="flex-1 sm:pl-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-2">Repair Mode</p>
                <p className="text-[28px] sm:text-[36px] text-[#2a2a4a] mb-3" style={mono}>&lt;60</p>
                <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7] mb-5">
                  Not yet ready. Fix first — dispute letters, payment optimization, structure corrections, timeline to fundability.
                </p>
                <div className="space-y-2.5">
                  {["Dispute generation", "Issue prioritization", "90-day timeline", "Score projections"].map((t) => (
                    <p key={t} className="text-[12px] text-[#8a8aa5]">— {t}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ TIERS ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-tiers">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Tier Eligibility</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Three tiers. Know yours.
            </h2>
            <div className="space-y-10 sm:space-y-12">
              {[
                { name: "Prime", range: "75–100", products: "SBA 7(a) & 504, Conventional LOC, Term Loans, Equipment Finance" },
                { name: "Mid-Tier", range: "50–74", products: "Revenue-Based Lending, Invoice Factoring, MCA, Bridge Loans" },
                { name: "Alternative", range: "25–49", products: "Microloans, Secured Cards, Credit Builders, CDFI Loans" },
              ].map((t, i) => (
                <div key={t.name} className="flex gap-5 sm:gap-8 items-start">
                  <span className="text-[32px] sm:text-[48px] text-[#d8d8e4] leading-none shrink-0 w-14 text-right" style={mono}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="pt-1 sm:pt-2">
                    <div className="flex items-baseline gap-3 mb-1.5">
                      <h3 className="text-[17px] sm:text-[22px] text-[#1a1a2e] font-medium tracking-[-0.02em]">{t.name}</h3>
                      <span className="text-[12px] text-[#9a9ab8]" style={mono}>{t.range}</span>
                    </div>
                    <p className="text-[12px] sm:text-[14px] text-[#7a7a9a] leading-[1.6]">{t.products}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ RESULTS ═══ */}
          <section id="results" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-results">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Traction</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Built for outcomes.
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 mb-14 sm:mb-20">
              {[
                { val: "12.5K+", label: "Profiles Analyzed" },
                { val: "$47M+", label: "Capital Deployed" },
                { val: "89%", label: "Approval Rate" },
                { val: "6.2×", label: "Score Improvement" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <p className="text-[20px] sm:text-[32px] text-[#2a2a4a] mb-1" style={mono}>{s.val}</p>
                  <p className="text-[8px] sm:text-[10px] text-[#a0a0b8] tracking-[0.15em] uppercase">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-10 sm:space-y-14">
              {[
                { name: "Marcus T.", role: "E-commerce Founder", quote: "42 → 78 in 60 days. Approved for $250K on the first try." },
                { name: "Aisha K.", role: "Real Estate Investor", quote: "Denial simulation caught 3 triggers I didn't know existed. Approved same week." },
                { name: "David L.", role: "SaaS CEO", quote: "Moved from Mid-Tier to Prime. Saved 4% on interest rates." },
              ].map((t) => (
                <div key={t.name}>
                  <p className="text-[15px] sm:text-[20px] text-[#3a3a5a] leading-[1.5] mb-3 italic font-light">"{t.quote}"</p>
                  <p className="text-[11px] text-[#a0a0b8] tracking-[0.1em]">{t.name} — {t.role}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ WITHOUT / WITH ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-comparison">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Before & After</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Apply ready. Not blind.
            </h2>
            <div className="flex flex-col sm:flex-row gap-10 sm:gap-0">
              <div className="flex-1 sm:pr-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#c0c0d0] mb-5">Without</p>
                <div className="space-y-3.5">
                  {["Guess at eligibility", "Spray-and-pray applications", "Hard inquiries compound", "Denied without explanation", "Repeat the cycle"].map((t) => (
                    <p key={t} className="text-[13px] sm:text-[14px] text-[#b0b0c4] line-through decoration-[#d0d0de]">{t}</p>
                  ))}
                </div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-[#d0d0de]/60 to-transparent hidden sm:block" />
              <div className="flex-1 sm:pl-10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#7a7a9a] mb-5">With Profundr</p>
                <div className="space-y-3.5">
                  {["Know your tier and ceiling", "Fix issues before submission", "Apply once, strategically", "Approved on first attempt", "Build capital momentum"].map((t) => (
                    <p key={t} className="text-[13px] sm:text-[14px] text-[#3a3a5a]">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ CASE STUDY ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-case">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Case Study</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              38 → 71 in 67 days.
            </h2>
            <div className="space-y-0">
              {[
                { day: "01", detail: "Score 38. Tier 3. Four triggers: 78% utilization, 2 collections, thin file, no EIN." },
                { day: "03", detail: "6 dispute letters auto-generated. 90-day utilization plan created. EIN + business account recommended." },
                { day: "30", detail: "Score 52. Tier 2. 1 collection removed. Utilization 45%. Exposure ceiling: $85K." },
                { day: "67", detail: "Score 71. Zero triggers. Utilization 22%. Ceiling: $210K. Applied $175K LOC — approved in 5 days." },
              ].map((step) => (
                <div key={step.day} className="flex items-start gap-5 sm:gap-8 py-5 border-b border-[#e0e0ea]/30 last:border-b-0">
                  <span className="text-[10px] text-[#a0a0b8] shrink-0 mt-1 tracking-wider" style={mono}>DAY {step.day}</span>
                  <p className="text-[13px] sm:text-[15px] text-[#4a4a6a] leading-[1.7]">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ TRUST ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-trust">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">Security</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Your data. Your control.
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6">
              {[
                { title: "Encrypted", desc: "AES-256 at rest, TLS 1.3 in transit" },
                { title: "Private", desc: "Never shared with lenders or third parties" },
                { title: "Compliant", desc: "FCRA-aligned analysis and dispute generation" },
                { title: "No Pull", desc: "We analyze uploads — zero credit impact" },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-[14px] sm:text-[16px] text-[#2a2a4a] font-medium mb-1.5">{item.title}</h3>
                  <p className="text-[11px] sm:text-[12px] text-[#9a9ab8] leading-[1.5]">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ FAQ ═══ */}
          <section id="faq" className="px-6 sm:px-14 py-16 sm:py-24" data-testid="section-faq">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#9a9ab8] mb-4">FAQ</p>
            <h2 className="text-[26px] sm:text-[38px] md:text-[48px] leading-[0.9] mb-12 sm:mb-16 tracking-[-0.04em]" style={gt()}>
              Common questions.
            </h2>
            <div className="space-y-0">
              {faqItems.map((item, i) => (
                <div key={i} className="border-b border-[#e0e0ea]/40">
                  <button data-testid={`button-faq-${i}`} className="w-full flex items-center justify-between py-5 text-left group" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="text-[13px] sm:text-[15px] text-[#3a3a5a] group-hover:text-[#1a1a2e] transition-colors pr-6 font-medium">{item.q}</span>
                    <span className="text-[16px] text-[#b0b0c0] shrink-0 transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="pb-5">
                      <p className="text-[12px] sm:text-[14px] text-[#6a6a8a] leading-[1.7]">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="mx-6 sm:mx-14 h-px bg-gradient-to-r from-transparent via-[#d0d0de]/60 to-transparent" />

          {/* ═══ FINAL CTA ═══ */}
          <section className="px-6 sm:px-14 py-16 sm:py-24 text-center" data-testid="section-cta">
            <h2 className="text-[30px] sm:text-[44px] md:text-[56px] leading-[0.9] mb-6 tracking-[-0.04em]" style={{ ...satoshi, ...gt() }} data-testid="text-final-cta">
              Stop guessing.<br />Start knowing.
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#5a5a7a] leading-[1.7] mb-10 max-w-[440px] mx-auto">
              Capital Readiness Score. Tier eligibility. Exposure ceiling. Denial simulation. Everything in one platform.
            </p>
            <form onSubmit={handleLogin} className="w-full max-w-[420px] mx-auto mb-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/80 border border-[#e0e0ea] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden shadow-sm">
                <input data-testid="input-email-bottom" type="email" placeholder="Enter your email" className="flex-1 bg-transparent text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab8] outline-none px-4 py-3.5 sm:px-0 sm:py-0" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <button data-testid="button-join-bottom" type="submit" disabled={isLoading} className="h-[44px] sm:h-[40px] px-6 sm:rounded-full text-white text-[13px] font-bold hover:opacity-90 transition-colors shrink-0 mx-1.5 mb-1.5 sm:mb-0 sm:mx-0 rounded-xl sm:rounded-full tracking-wide" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}>
                  {isLoading ? "..." : "Get Started"}
                </button>
              </div>
            </form>
            <p className="text-[11px] text-[#a0a0b8] mb-6">$50/month · Cancel anytime · 12,500+ founders</p>
            <button onClick={handleSubscribeClick} className="inline-flex items-center justify-center h-[44px] px-8 rounded-full text-white text-[13px] font-bold tracking-wide hover:opacity-90 transition-all hover:scale-[1.02] shadow-sm" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }} data-testid="button-subscribe">
              Subscribe Now
            </button>
          </section>

          {/* ═══ FOOTER ═══ */}
          <footer className="px-6 sm:px-14 py-8 sm:py-10 border-t border-[#e0e0ea]/30" data-testid="section-footer">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-8 mb-6">
              <ProfundrLogo size="sm" className="text-[#1a1a2e]" />
              <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
                {["Privacy", "Terms", "Contact", "Support"].map((link) => (
                  <span key={link} className="text-[10px] text-[#9a9ab8] tracking-[0.15em] uppercase cursor-pointer hover:text-[#5a5a7a] transition-colors">{link}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-4 pt-5 border-t border-[#e0e0ea]/30">
              <p className="text-[10px] text-[#a0a0b8]">&copy; 2026 CMD Supply</p>
              <p className="text-[9px] text-[#b0b0c0] max-w-[380px] leading-[1.5] text-center sm:text-right">Not a lender, broker, or financial advisor. Analyses are informational only and do not guarantee lending outcomes.</p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
