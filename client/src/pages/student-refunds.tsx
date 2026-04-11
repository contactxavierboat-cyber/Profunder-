import { useState, useEffect } from "react";
import { ProfundrLogo } from "@/components/profundr-logo";

export default function StudentRefundsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState(0);
  const [testIdx, setTestIdx] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setShowcaseTab((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { title: "Refund Discovery Engine", desc: "Find out if you qualify for the American Opportunity Credit or Hope Credit refund. We analyze your enrollment and financial profile instantly.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> },
    { title: "Qualification Check", desc: "Upload your documents and get a clear yes or no on what refund programs you're eligible for — no guesswork.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg> },
    { title: "Refund Estimator", desc: "See exactly how much you could receive back based on your education credits and enrollment history.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { title: "Document Prep", desc: "We help you gather and organize every document needed for your refund claim — so nothing gets missed.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { title: "Status Tracking", desc: "Track every step of your refund from submission to deposit. Know exactly where things stand at all times.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
    { title: "Student Support", desc: "Dedicated support team that understands education credits and refund processes. We're here every step of the way.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  ];

  const faqs = [
    { q: "What is the American Opportunity Credit?", a: "The American Opportunity Credit is a refund program for students who paid for higher education. You may qualify for up to $2,500 per year for the first four years of school — and up to $1,000 of that is refundable even if you owe nothing." },
    { q: "What is the Hope Credit?", a: "The Hope Credit is an education-based refund that helps students recover money spent on tuition, fees, and course materials during their first two years of college enrollment." },
    { q: "Who qualifies for these refunds?", a: "Students who were enrolled at least half-time in a degree or certificate program, paid for qualified education expenses, and meet income requirements may qualify." },
    { q: "How much can I get back?", a: "Depending on your enrollment history and expenses, you could receive up to $2,500 per eligible year. Some students recover thousands across multiple years." },
    { q: "Do I need to be currently enrolled?", a: "No. You can claim refunds for previous years of enrollment. If you attended school in the last few years and didn't claim these credits, you may still be eligible." },
    { q: "How long does the process take?", a: "Most refund claims are processed within 4-8 weeks after submission. We track every step so you always know where things stand." },
    { q: "Is there a cost to check if I qualify?", a: "No. Our qualification check is free. You only pay if you decide to move forward with the full refund recovery service." },
    { q: "What documents do I need?", a: "Typically you'll need proof of enrollment (1098-T form), records of education expenses, and basic identification. We help you gather everything." },
  ];

  const showcaseTabs = [
    {
      label: "American Opportunity",
      bg: "linear-gradient(135deg, #2d5a87 0%, #1a4570 25%, #103555 50%, #0a2840 75%, #051c30 100%)",
      gradientBase: "#103555",
      title: "American Opportunity Credit",
      desc: "Up to $2,500 per year for qualified students. We find what you're owed and help you claim it.",
      photo: "/pexels-gustavo-fring-7447388_1775149015902.jpg",
      cards: [
        <div key="aoc1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Refund</p>
          <p className="text-[40px] font-black text-[#111] leading-none mb-1">$2,500</p>
          <p className="text-[12px] text-[#1a73e8] font-semibold mb-3">Per Eligible Year</p>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#1a73e8] rounded-full" style={{ width: "100%" }} /></div>
        </div>,
        <div key="aoc2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Eligibility</p>
          {[{ n: "Enrollment", v: "Verified" }, { n: "Expenses", v: "Qualified" }, { n: "Years", v: "4 max" }].map((p) => (
            <div key={p.n} className="mb-2 last:mb-0 flex justify-between text-[11px]"><span className="text-[#666]">{p.n}</span><span className="font-semibold text-[#2d6a4f]">{p.v}</span></div>
          ))}
        </div>,
        <div key="aoc3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
          <p className="text-[10px] text-[#888] mb-1">Success Rate</p>
          <p className="text-[28px] font-black text-[#111] leading-none">94%</p>
          <p className="text-[10px] text-[#2d6a4f] font-semibold">Claims approved</p>
        </div>,
      ],
    },
    {
      label: "Hope Credit",
      bg: "linear-gradient(135deg, #5a7a50 0%, #3d5c3a 25%, #2a4a35 50%, #1a3a2e 75%, #0f2b22 100%)",
      gradientBase: "#1a3a2e",
      title: "Hope Credit",
      desc: "Recover education expenses from your first two years of college. Every dollar counts.",
      photo: "/pexels-jay-brand-1763356224-34147233_1775149015900.jpg",
      cards: [
        <div key="hc1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Recovery</p>
          <p className="text-[40px] font-black text-[#111] leading-none mb-1">$1,800</p>
          <p className="text-[12px] text-[#2d6a4f] font-semibold mb-3">Average Refund</p>
          <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: "72%" }} /></div>
        </div>,
        <div key="hc2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Covered</p>
          {[{ n: "Tuition", v: "Yes" }, { n: "Fees", v: "Yes" }, { n: "Materials", v: "Yes" }].map((p) => (
            <div key={p.n} className="mb-2 last:mb-0 flex justify-between text-[11px]"><span className="text-[#666]">{p.n}</span><span className="font-semibold text-[#2d6a4f]">{p.v}</span></div>
          ))}
        </div>,
        <div key="hc3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
          <p className="text-[10px] text-[#888] mb-1">Avg. Time</p>
          <p className="text-[28px] font-black text-[#111] leading-none">6wk</p>
          <p className="text-[10px] text-[#2d6a4f] font-semibold">To receive funds</p>
        </div>,
      ],
    },
    {
      label: "Multi-Year Recovery",
      bg: "linear-gradient(135deg, #8a6a7a 0%, #6e4d60 25%, #553a4a 50%, #3e2835 75%, #2a1a22 100%)",
      gradientBase: "#3e2835",
      title: "Multi-Year Recovery",
      desc: "Didn't claim credits in previous years? You may be able to recover refunds for multiple past years.",
      photo: "/pexels-kevinbidwell-3934707_1775149015901.jpg",
      cards: [
        <div key="my1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Total Recovery</p>
          <div className="flex items-end gap-2 mb-1"><span className="text-[32px] font-black text-[#111] leading-none">$7,500</span></div>
          <p className="text-[12px] text-[#2d6a4f] font-semibold">Across 3 years</p>
        </div>,
        <div key="my2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
          <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">By Year</p>
          {[{ label: "2023", val: "$2,500" }, { label: "2022", val: "$2,500" }, { label: "2021", val: "$2,500" }].map((s) => (
            <div key={s.label} className="flex justify-between py-1 text-[10px]"><span className="text-[#666]">{s.label}</span><span className="font-semibold text-[#111]">{s.val}</span></div>
          ))}
        </div>,
        <div key="my3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
          <p className="text-[10px] text-[#888] mb-1">Max Years</p>
          <p className="text-[28px] font-black text-[#111] leading-none">4</p>
          <p className="text-[10px] text-[#2d6a4f] font-semibold">Claimable years</p>
        </div>,
      ],
    },
  ];

  const testimonials = [
    { name: "Jessica T.", role: "College Junior", amount: "$4,800+", label: "Refunded through Profundr", quote: "I had no idea I was leaving money on the table. Profundr helped me recover education credits from two years I never claimed. The process was simple and I got my refund in about 5 weeks.", photo: "/founders/founder11.jpg" },
    { name: "Marcus D.", role: "Recent Graduate", amount: "$2,500", label: "Refunded through Profundr", quote: "I graduated last year and thought I missed my chance. Turns out I qualified for the American Opportunity Credit. Profundr walked me through every step — money in my account within a month.", photo: "/founders/founder3.jpg" },
    { name: "Aisha K.", role: "Community College Student", amount: "$3,200+", label: "Refunded through Profundr", quote: "As a community college student, I didn't think these programs applied to me. They did. Profundr found credits I qualified for and helped me claim them. Real money, real fast.", photo: "/founders/founder9.jpg" },
  ];

  const t = testimonials[testIdx];
  const prevIdx = testIdx === 0 ? testimonials.length - 1 : testIdx - 1;
  const nextIdx = testIdx === testimonials.length - 1 ? 0 : testIdx + 1;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }} data-testid="student-refunds-page">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0]" data-testid="student-nav">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[56px] sm:h-[64px] flex items-center justify-between">
          <a href="/" className="inline-flex items-center select-none gap-1.5 sm:gap-2" aria-label="profundr.">
            <img src="/profundr-brain-logo.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8" style={{ display: "block", borderRadius: "6px" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.05em", color: "#111" }} className="text-[16px] sm:text-[20px]">profundr<span style={{ marginLeft: "-0.15em" }}>.</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#programs" className="text-[14px] text-[#555] hover:text-[#111] transition-colors" data-testid="link-programs">Programs</a>
            <a href="#how-it-works" className="text-[14px] text-[#555] hover:text-[#111] transition-colors" data-testid="link-how-it-works">How It Works</a>
            <a href="#faq" className="text-[14px] text-[#555] hover:text-[#111] transition-colors" data-testid="link-faq">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:8664207393" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#111] font-medium transition-colors" data-testid="link-call-nav">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              (866) 420-7393
            </a>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-5 py-2.5 bg-[#111] text-white text-[13px] font-medium hover:bg-[#333] transition-colors"
              data-testid="student-btn-get-started"
            >
              Check Eligibility
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden w-10 h-10 flex items-center justify-center"
              data-testid="student-btn-hamburger"
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#f0f0f0] bg-white px-4 py-4 space-y-4">
            <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">Programs</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">How It Works</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">FAQ</a>
            <div className="pt-2 border-t border-[#f0f0f0] flex flex-col gap-3">
              <a href="tel:8664207393" className="flex items-center gap-2 text-[15px] text-[#555]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                (866) 420-7393
              </a>
              <button onClick={() => { setMobileMenuOpen(false); window.location.href = '/login'; }} className="w-full py-3 bg-[#111] text-white text-[14px] font-semibold" data-testid="student-mobile-get-started">Check Eligibility</button>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-[115px] sm:pt-[120px] pb-[40px] sm:pb-[50px] px-5 sm:px-6" data-testid="student-hero">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e8f0fe] rounded-full mb-6" data-testid="student-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <span className="text-[12px] font-semibold text-[#1a73e8]">Student Refund Recovery</span>
          </div>
          <h1 className="text-[36px] sm:text-[50px] md:text-[60px] text-[#000] leading-[1.08] sm:leading-[0.95] mb-4 sm:mb-8 max-w-[300px] sm:max-w-none mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }} data-testid="text-student-hero-headline">
            Get your student<br className="hidden sm:inline" /> refund back
          </h1>
          <p className="text-[15px] sm:text-[18px] text-[#555] leading-[1.7] sm:leading-[1.6] max-w-[340px] sm:max-w-[520px] mx-auto mb-8 sm:mb-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }} data-testid="text-student-hero-sub">
            Thousands of students are owed money through the <span className="underline underline-offset-[3px] decoration-[1px] decoration-[#999]">American Opportunity Credit</span> and <span className="underline underline-offset-[3px] decoration-[1px] decoration-[#999]">Hope Credit</span>. We help you find and claim it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 mb-5 sm:mb-6 w-full sm:max-w-none mx-auto">
            <a
              href="tel:8664207393"
              className="px-8 py-3 sm:py-3.5 bg-[#111] border border-[#111] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors inline-flex items-center gap-2"
              data-testid="student-btn-call-hero"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              Call (866) 420-7393
            </a>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-2.5 sm:py-3.5 text-[#555] text-[14px] font-medium sm:border sm:border-[#ddd] sm:hover:bg-[#f8f8f8] transition-colors"
              data-testid="student-btn-check-online"
            >
              Check Eligibility Online
            </button>
          </div>
          <p className="text-[12px] text-[#bbb]">Free qualification check. No obligation.</p>
        </div>
      </section>

      <section className="overflow-hidden" data-testid="student-founders-strip">
        <style>{`
          @keyframes scrollFounders {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex gap-[6px]" style={{ animation: "scrollFounders 60s linear infinite", width: "max-content" }}>
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-[6px]">
              {[
                { img: "/founders/founder1.jpg", name: "Maya R.", title: "Nursing student" },
                { img: "/founders/founder2.jpg", name: "Sofia L.", title: "Business major" },
                { img: "/founders/founder3.jpg", name: "Kwame A.", title: "Engineering graduate" },
                { img: "/founders/founder4.jpg", name: "Darius J.", title: "Pre-med student" },
                { img: "/founders/founder5.jpg", name: "Arjun P.", title: "Computer science" },
                { img: "/founders/founder6.jpg", name: "Ravi M.", title: "MBA student" },
                { img: "/founders/founder7.jpg", name: "Suresh K.", title: "Community college" },
                { img: "/founders/founder8.jpg", name: "Amara N.", title: "Education major" },
                { img: "/founders/founder9.jpg", name: "Keisha T.", title: "Liberal arts" },
                { img: "/founders/founder10.jpg", name: "Carmen D.", title: "Recent graduate" },
                { img: "/founders/founder11.jpg", name: "Jasmine W.", title: "Part-time student" },
              ].map((founder) => (
                <div key={founder.name} className="w-[220px] h-[300px] sm:w-[320px] sm:h-[440px] shrink-0 relative overflow-hidden" data-testid={`student-card-${founder.name.replace(/\s+/g, "-").toLowerCase()}`}>
                  <img src={founder.img} alt={founder.name} className="w-full h-full object-cover object-top" loading="lazy" />
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: "rgba(0,0,0,0.25)" }}>
                    <p className="text-[15px] font-semibold text-white leading-snug">{founder.name}</p>
                    <p className="text-[13px] text-white/85 leading-snug">{founder.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 px-5 sm:px-6 bg-white" data-testid="student-stats">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center sm:justify-center gap-y-7 sm:gap-x-20 sm:gap-y-8">
          {[
            { value: "$4.2M+", label: "Refunded to students" },
            { value: "8,500+", label: "Students helped" },
            { value: "94%", label: "Qualification rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center" data-testid={`student-stat-${stat.label.replace(/\s+/g, "-").toLowerCase()}`}>
              <p className="text-[52px] sm:text-[48px] text-[#000] leading-none" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>{stat.value}</p>
              <p className="text-[14px] sm:text-[14px] text-[#888] mt-2 sm:mt-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="py-12 sm:py-16 px-5 sm:px-6 scroll-mt-16" style={{ backgroundColor: "#e8e5e0" }} data-testid="student-cta-banner">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-center md:items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-[420px] text-center md:text-left">
            <h3 className="text-[20px] sm:text-[24px] text-[#000] leading-[1.15] mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Your education paid for more than a degree.</h3>
            <p className="text-[14px] sm:text-[15px] text-[#555] leading-[1.7] sm:leading-[1.6]">Find out if you're owed money from education credits you never claimed.</p>
          </div>
          <a href="tel:8664207393" className="px-8 py-3.5 bg-[#111] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors inline-flex items-center gap-2 whitespace-nowrap" data-testid="student-btn-call-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            Call Now — (866) 420-7393
          </a>
        </div>
      </section>

      <section id="programs" className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-[#111] scroll-mt-16" data-testid="student-programs-showcase">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-white leading-[1.1] sm:leading-[1.05] mb-8 sm:mb-10 text-center max-w-[280px] sm:max-w-none mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Education credits you may be owed.</h2>
          <div className="hidden sm:flex overflow-x-auto no-scrollbar items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
            {showcaseTabs.map((tab, i) => (
              <span key={tab.label} onClick={() => setShowcaseTab(i)} className={`px-4 sm:px-5 py-2 text-[12px] sm:text-[13px] font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${showcaseTab === i ? "bg-white text-[#111] border-white" : "bg-transparent text-white/70 border-white/20 hover:border-white/40"}`} data-testid={`student-tab-${tab.label.replace(/\s+/g, "-").toLowerCase()}`}>{tab.label}</span>
            ))}
          </div>
          <div className="relative" style={{ minHeight: "400px" }}>
            {showcaseTabs.map((tab, i) => (
              <div
                key={tab.label}
                className="absolute inset-0 transition-all duration-700 ease-in-out"
                style={{
                  opacity: showcaseTab === i ? 1 : 0,
                  transform: showcaseTab === i ? "translateX(0)" : showcaseTab > i ? "translateX(-30px)" : "translateX(30px)",
                  pointerEvents: showcaseTab === i ? "auto" : "none",
                  zIndex: showcaseTab === i ? 2 : 1,
                }}
              >
                <div className="hidden md:block rounded-2xl overflow-hidden relative h-full" style={{ background: tab.bg, minHeight: "400px" }}>
                  <div className="absolute top-8 left-10 z-30 max-w-[280px]">
                    <p className="text-[26px] font-bold text-white mb-2 leading-[1.15]">{tab.title}</p>
                    <p className="text-[13px] text-white/60 leading-[1.5]">{tab.desc}</p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-[58%]" style={{ padding: "16px" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                      <img src={tab.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: "center 40%" }} />
                    </div>
                  </div>
                  <div className="absolute z-20" style={{ left: "28%", top: "130px" }}>
                    <div className="relative">
                      <div className="relative z-10">{tab.cards[0]}</div>
                      {tab.cards[1] && <div className="relative z-[5] -mt-3 ml-4">{tab.cards[1]}</div>}
                    </div>
                  </div>
                  {tab.cards[2] && <div className="absolute z-20" style={{ bottom: "28px", right: "40px" }}>{tab.cards[2]}</div>}
                  <div className="absolute left-0 top-0 bottom-0 w-[48%] z-10" style={{ background: `linear-gradient(to right, ${tab.gradientBase} 50%, transparent 100%)` }} />
                </div>
                <div className="md:hidden rounded-2xl overflow-hidden" style={{ background: tab.bg }}>
                  <div className="px-5 pt-6 pb-4">
                    <p className="text-[22px] font-bold text-white mb-2 leading-[1.15]">{tab.title}</p>
                    <p className="text-[13px] text-white/60 leading-[1.5]">{tab.desc}</p>
                  </div>
                  <div className="px-4 pb-6 flex items-end gap-3">
                    <div className="flex-1 min-w-0 shrink-0" style={{ maxWidth: "55%" }}>
                      <div className="relative">
                        <div className="relative z-10">{tab.cards[0]}</div>
                        {tab.cards[2] && (
                          <div className="absolute z-[5] -top-2 left-2 right-[-8px] opacity-50 scale-[0.95]">{tab.cards[2]}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}><img src={tab.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: "center 40%" }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex sm:hidden items-center justify-center gap-2 mt-6">
            {showcaseTabs.map((_, i) => (
              <div key={i} className={`h-[3px] rounded-full transition-all ${showcaseTab === i ? "w-6 bg-white" : "w-3 bg-white/25"}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 sm:py-6 border-y border-[#f0f0f0] bg-[#fafafa] overflow-hidden" data-testid="student-social-proof">
        <style>{`
          @keyframes scrollProof {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="sm:max-w-[900px] sm:mx-auto sm:px-6 sm:flex sm:justify-center sm:gap-x-10">
          <div className="flex sm:hidden gap-x-8" style={{ animation: "scrollProof 25s linear infinite", width: "max-content" }}>
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-x-8">
                {["Free Eligibility Check", "Up to $2,500/Year", "Multi-Year Recovery", "Secure & Private", "No Upfront Cost"].map((item) => (
                  <span key={item} className="text-[11px] text-[#999] font-medium tracking-wide uppercase flex items-center gap-2 shrink-0 whitespace-nowrap">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M4 8l3 3 5-5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="hidden sm:contents">
            {["Free Eligibility Check", "Up to $2,500/Year", "Multi-Year Recovery", "Secure & Private", "No Upfront Cost"].map((item) => (
              <span key={item} className="text-[12px] text-[#999] font-medium tracking-wide uppercase flex items-center gap-2 shrink-0 whitespace-nowrap">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M4 8l3 3 5-5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-white scroll-mt-16" data-testid="student-one-system">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-[28px] sm:text-[36px] md:text-[48px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Your education credits. One system.</h2>
          <p className="text-[14px] sm:text-[16px] text-[#888] max-w-[320px] sm:max-w-[520px] mx-auto leading-[1.7] sm:leading-[1.6]">We check your eligibility, gather your documents, submit your claim, and track your refund — all in one place. No runaround.</p>
        </div>
      </section>

      <section className="py-[50px] sm:py-[60px] px-5 sm:px-6 bg-white border-t border-[#f0f0f0]" data-testid="student-features">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {features.slice(0, 3).map((item) => (
            <div key={item.title} className="border border-[#e8e8e8] rounded-2xl p-6 sm:p-8 bg-white text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl border border-[#e8e8e8] flex items-center justify-center mb-6 sm:mb-16 mx-auto sm:mx-0">{item.icon}</div>
              <h4 className="text-[18px] font-bold text-[#111] mb-2">{item.title}</h4>
              <p className="text-[14px] text-[#888] leading-[1.6]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-[50px] sm:py-[80px] bg-[#111]" data-testid="student-testimonials">
        <h2 className="text-[30px] sm:text-[32px] md:text-[42px] text-white leading-[1.1] sm:leading-[1.05] mb-8 sm:mb-12 px-5 sm:px-6 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Students who got their money back</h2>
        <div className="md:hidden px-5">
          <div className="rounded-2xl overflow-hidden mb-6">
            <img src={t.photo} alt={t.name} className="w-full h-[380px] object-cover object-top" style={{ background: "#222" }} />
          </div>
          <div className="mb-2">
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none"><path d="M0 28V16.8C0 7.47 5.4 1.87 16.2 0l1.8 3.74C11.7 5.6 9 9.33 8.1 14H15.75V28H0zm19.8 0V16.8C19.8 7.47 25.2 1.87 36 0l-1.8 3.74C28.5 5.6 25.8 9.33 24.9 14H32.55v14H19.8z" fill="#444"/></svg>
          </div>
          <p className="text-[18px] text-white/80 leading-[1.6] mb-6">{t.quote}</p>
          <div className="flex items-center gap-3 mb-2">
            <div>
              <p className="text-[15px] font-bold text-white">{t.name}</p>
              <p className="text-[13px] text-white/50">{t.role}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[32px] font-black text-white leading-none">{t.amount}</p>
            <p className="text-[13px] text-white/50 mt-1">{t.label}</p>
          </div>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <div key={i} onClick={() => setTestIdx(i)} className={`h-[3px] cursor-pointer transition-all ${testIdx === i ? "w-8 bg-white" : "w-5 bg-white/20"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTestIdx(prevIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center" data-testid="student-btn-test-prev-m"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <button onClick={() => setTestIdx(nextIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center" data-testid="student-btn-test-next-m"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            </div>
          </div>
        </div>
        <div className="hidden md:block px-12 lg:px-24">
          <div className="bg-[#1a1a1a] overflow-hidden">
            <div className="flex flex-row">
              <div className="w-[42%] shrink-0">
                <img src={t.photo} alt={t.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex-1 p-12 flex flex-col justify-center">
                <svg width="28" height="20" viewBox="0 0 32 24" fill="none" className="mb-6"><path d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0l1.6 3.2C10.4 4.8 8 8 7.2 12H14V24H0zm18 0V14.4C18 6.4 22.8 1.6 32 0l-1.6 3.2C24.8 4.8 22.4 8 21.6 12H28v12H18z" fill="#444"/></svg>
                <p className="text-[15px] text-white/80 leading-[1.7] mb-6">"{t.quote}"</p>
                <p className="text-[16px] font-bold text-white mb-0.5">{t.name}</p>
                <p className="text-[13px] text-white/50 mb-8">{t.role}</p>
                <div>
                  <p className="text-[36px] font-black text-white leading-none">{t.amount}</p>
                  <p className="text-[13px] text-white/50 mt-1">{t.label}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-10">
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <div key={i} onClick={() => setTestIdx(i)} className={`h-[3px] cursor-pointer transition-all ${testIdx === i ? "w-8 bg-white" : "w-5 bg-white/20"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTestIdx(prevIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors" data-testid="student-btn-test-prev"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <button onClick={() => setTestIdx(nextIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors" data-testid="student-btn-test-next"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-white border-t border-[#f0f0f0]" data-testid="student-how-steps">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-10 sm:mb-14 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", title: "Check Your Eligibility", desc: "Call us or use our online tool. We'll ask a few questions about your enrollment history and determine if you qualify." },
              { step: "02", title: "We Prepare Everything", desc: "Our team gathers your documents, verifies your education credits, and prepares your refund claim — you don't lift a finger." },
              { step: "03", title: "Get Your Refund", desc: "Once submitted, we track your claim from start to finish. Most students receive their refund within 4-8 weeks." },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left" data-testid={`student-step-${item.step}`}>
                <div className="text-[48px] font-black text-[#f0f0f0] leading-none mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{item.step}</div>
                <h4 className="text-[18px] font-bold text-[#111] mb-2">{item.title}</h4>
                <p className="text-[14px] text-[#888] leading-[1.6]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-[#fafafa] border-t border-[#f0f0f0] scroll-mt-16" data-testid="student-faq">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-10 sm:mb-14 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Frequently asked questions</h2>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#e8e8e8]" data-testid={`student-faq-item-${i}`}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between py-5 text-left" data-testid={`student-btn-faq-${i}`}>
                  <span className="text-[15px] sm:text-[16px] font-semibold text-[#111] pr-4">{faq.q}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 transition-transform ${faqOpen === i ? "rotate-45" : ""}`}><path d="M8 3v10M3 8h10" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                {faqOpen === i && (
                  <div className="pb-5 -mt-1">
                    <p className="text-[14px] text-[#666] leading-[1.7]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-6 px-5 sm:px-6 bg-[#111] border-t border-white/10" data-testid="student-cta-bar">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
          <h3 className="text-[22px] sm:text-[22px] md:text-[28px] font-bold text-white text-center sm:text-left leading-[1.2]" style={{ letterSpacing: "-0.02em" }}>Don't leave your refund unclaimed.</h3>
          <a href="tel:8664207393" className="px-5 py-2.5 bg-white text-[#111] text-[13px] font-semibold hover:bg-white/90 transition-colors shrink-0 inline-flex items-center gap-2" data-testid="student-btn-final-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            Call (866) 420-7393
          </a>
        </div>
      </section>

      <footer className="py-10 sm:py-14 px-5 sm:px-6 bg-[#111] border-t border-white/10" data-testid="student-footer">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-10 mb-10 sm:mb-12">
            <div style={{ opacity: 0.4 }}>
              <ProfundrLogo size="md" variant="light" />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-12 sm:gap-x-16 gap-y-6">
              <div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Programs</p>
                <div className="space-y-2">
                  <a href="#programs" className="block text-[13px] text-white/50 hover:text-white transition-colors">American Opportunity</a>
                  <a href="#programs" className="block text-[13px] text-white/50 hover:text-white transition-colors">Hope Credit</a>
                  <a href="#faq" className="block text-[13px] text-white/50 hover:text-white transition-colors">FAQ</a>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Contact</p>
                <div className="space-y-2">
                  <a href="tel:8664207393" className="block text-[13px] text-white/50 hover:text-white transition-colors">(866) 420-7393</a>
                  <a href="/" className="block text-[13px] text-white/50 hover:text-white transition-colors">Business Funding</a>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Legal</p>
                <div className="space-y-2">
                  <a href="/privacy" className="block text-[13px] text-white/50 hover:text-white transition-colors">Privacy Notice</a>
                  <a href="/terms" className="block text-[13px] text-white/50 hover:text-white transition-colors">Terms</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-4 order-1 sm:order-none">
              {[
                { href: "https://linkedin.com/company/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>, label: "LinkedIn" },
                { href: "https://instagram.com/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.5" opacity="0.4"/><circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" opacity="0.4"/><circle cx="17.5" cy="6.5" r="1" fill="white" opacity="0.4"/></svg>, label: "Instagram" },
                { href: "https://youtube.com/@profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="white" strokeWidth="1.5" opacity="0.4"/><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white" opacity="0.4"/></svg>, label: "YouTube" },
                { href: "https://x.com/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L20 4h-2l-5.2 6.3L8 4H4z" stroke="white" strokeWidth="1.5" opacity="0.4"/></svg>, label: "X" },
              ].map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:opacity-100 transition-opacity" aria-label={social.label} data-testid={`student-link-social-${social.label.toLowerCase()}`}>{social.icon}</a>
              ))}
            </div>
            <p className="text-[12px] text-white/30 order-2 sm:order-none">&copy; 2026 Profundr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
