import { useState } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
    <div className="relative min-h-[100dvh] flex flex-col bg-[#f9f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !isLoading && setShowLogin(false)}>
          <div className="w-full max-w-[400px] mx-4 bg-white rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <ProfundrLogo size="md" />
              <button onClick={() => setShowLogin(false)} className="text-[#b0b0b0] hover:text-[#666] transition-colors text-[20px] leading-none" data-testid="button-close-login">&times;</button>
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#1a1a1a] mb-1" data-testid="text-login-title">Welcome back</h2>
            <p className="text-[13px] text-[#888] mb-6">Enter your email to continue</p>
            <form onSubmit={handleLoginModal}>
              <input
                data-testid="input-login-email"
                type="email"
                placeholder="Email address"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl h-[48px] px-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#ccc] transition-colors mb-4"
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
                className="w-full h-[48px] rounded-xl bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {isLoading ? "..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="flex items-center justify-between px-4 sm:px-6 py-3" data-testid="nav-top">
        <div className="flex items-center gap-2" data-testid="nav-logo">
          <ProfundrLogo size="md" />
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors"
          data-testid="button-login"
        >
          Log in
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <h1
          className="text-[28px] sm:text-[32px] font-normal text-[#1a1a1a] tracking-[-0.02em] mb-auto mt-auto"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
          data-testid="text-hero-headline"
        >
          How fundable are you?
        </h1>
      </main>

      <div className="w-full max-w-[680px] mx-auto px-4 pb-4">
        <form onSubmit={handleLogin} className="w-full">
          <div className="flex items-center bg-[#f0f0f0] rounded-full h-[52px] pl-4 pr-1.5 border border-[#e5e5e5] shadow-sm">
            <button
              type="button"
              onClick={handleSubscribeClick}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e0e0e0] transition-colors shrink-0 mr-2"
              data-testid="button-attach"
              aria-label="Subscribe"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3.75V14.25M3.75 9H14.25" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <input
              data-testid="input-email"
              type="email"
              placeholder="Enter your email to get started"
              className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#999] outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              data-testid="button-join"
              type="submit"
              disabled={isLoading || !email}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors shrink-0 disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="text-[12px]">...</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#aaa] mt-3 leading-[1.5]" data-testid="text-footer-legal">
          By using Profundr, a capital intelligence platform, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Terms</span> and have read our{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
