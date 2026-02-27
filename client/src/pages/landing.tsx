import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";

function FormatResponse({ content }: { content: string }) {
  const cleaned = content
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/^-{2,}/gm, "");
  const sections = cleaned.split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const trimmed = section.trim();
        if (!trimmed) return null;
        const isTitle =
          /^\d+\)\s/.test(trimmed) ||
          /^(FUNDABILITY|FUNDING|KEY FINDINGS|PHASE|TIMELINE|NEXT MOVE|CAPITAL|CLIENT|CERTIFICATION)/i.test(trimmed) ||
          (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.includes("."));
        const lines = trimmed.split("\n");
        const hasBullets = lines.some((l) => /^\s*[-•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));

        if (isTitle) {
          return (
            <p key={i} className="text-[13px] font-semibold text-[#1a1a1a] tracking-wide uppercase">
              {trimmed}
            </p>
          );
        }
        if (hasBullets) {
          return (
            <div key={i} className="space-y-1">
              {lines.map((line, j) => {
                const bulletMatch = line.match(/^\s*[-•]\s*(.*)/);
                const numMatch = line.match(/^\s*\d+[.)]\s*(.*)/);
                if (bulletMatch) return <p key={j} className="pl-4 text-[14px] text-[#333] leading-[1.65]">{"\u2022"} {bulletMatch[1]}</p>;
                if (numMatch) {
                  const num = line.match(/^\s*(\d+)/)?.[1];
                  return <p key={j} className="pl-4 text-[14px] text-[#333] leading-[1.65]">{num}. {numMatch[1]}</p>;
                }
                return <p key={j} className="text-[14px] text-[#333] leading-[1.65]">{line}</p>;
              })}
            </div>
          );
        }
        return <p key={i} className="text-[14px] text-[#333] leading-[1.65]">{trimmed}</p>;
      })}
    </div>
  );
}

export default function LandingPage() {
  const [input, setInput] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const { user, messages, sendMessage, loginSilent } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage("");
      setInput("");
      doSend(msg);
    }
  }, [user]);

  const doSend = async (text: string) => {
    setIsSending(true);
    try {
      await sendMessage(text);
    } catch {
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isSending) return;

    if (!user) {
      setPendingMessage(text);
      setInput(text);
      setShowLogin(true);
      return;
    }

    setInput("");
    doSend(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleLoginModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setIsLoggingIn(true);
    try {
      await loginSilent(loginEmail);
      setShowLogin(false);
    } catch {
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isLoggedIn = !!user;
  const hasMessages = isLoggedIn && messages.length > 0;

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#f9f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !isLoggingIn && setShowLogin(false)}>
          <div className="w-full max-w-[400px] mx-4 bg-white rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <ProfundrLogo size="md" />
              <button onClick={() => setShowLogin(false)} className="text-[#b0b0b0] hover:text-[#666] transition-colors text-[20px] leading-none" data-testid="button-close-login">&times;</button>
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#1a1a1a] mb-1" data-testid="text-login-title">Sign in to continue</h2>
            <p className="text-[13px] text-[#888] mb-6">Enter your email to start your capital analysis</p>
            <form onSubmit={handleLoginModal}>
              <input
                data-testid="input-login-email"
                type="email"
                placeholder="Email address"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl h-[48px] px-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#ccc] transition-colors mb-4"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoggingIn}
                autoFocus
              />
              <button
                data-testid="button-login-submit"
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-[48px] rounded-xl bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {isLoggingIn ? "..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0" data-testid="nav-top">
        <div className="flex items-center gap-2" data-testid="nav-logo">
          <ProfundrLogo size="md" />
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#999] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
            <button
              onClick={() => window.location.href = user.subscriptionStatus === 'active' ? '/dashboard' : '/subscription'}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors"
              data-testid="button-dashboard"
            >
              Dashboard
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors"
            data-testid="button-login"
          >
            Log in
          </button>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center overflow-hidden">
        {!hasMessages && !isSending ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <h1
              className="text-[28px] sm:text-[32px] font-normal text-[#1a1a1a] tracking-[-0.02em] text-center"
              data-testid="text-hero-headline"
            >
              How fundable are you?
            </h1>
          </div>
        ) : (
          <div className="flex-1 w-full max-w-[680px] mx-auto overflow-y-auto px-4 pt-4 pb-2" data-testid="chat-messages">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-white">P</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-[#f0f0f0] rounded-[20px] rounded-br-[6px] px-4 py-2.5"
                        : "bg-transparent"
                    }`}
                    data-testid={`message-${msg.role}-${msg.id}`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-[14px] text-[#1a1a1a] leading-[1.6]">{msg.content}</p>
                    ) : (
                      <FormatResponse content={msg.content} />
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-white">P</span>
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      <div className="w-full max-w-[680px] mx-auto px-4 pb-4 shrink-0">
        {!hasMessages && !isSending && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {[
              "Analyze my credit profile",
              "What tier am I in?",
              "Run a denial simulation",
              "How do I improve my score?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="px-3.5 py-2 text-[12px] text-[#666] border border-[#e0e0e0] rounded-full hover:bg-[#f0f0f0] hover:border-[#ccc] transition-colors"
                data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-").replace(/[?]/g, "")}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center bg-[#f0f0f0] rounded-full h-[52px] pl-4 pr-1.5 border border-[#e5e5e5] shadow-sm focus-within:border-[#ccc] transition-colors">
            <input
              ref={inputRef}
              data-testid="input-chat"
              type="text"
              placeholder="Ask about your funding readiness..."
              className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#999] outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
            />
            <button
              data-testid="button-send"
              type="submit"
              disabled={isSending || !input.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors shrink-0 disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              {isSending ? (
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
          Profundr is a capital intelligence platform, not a lender.{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Terms</span> &middot;{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Privacy</span>
        </p>
      </div>
    </div>
  );
}
