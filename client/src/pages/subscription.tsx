import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user, isLoading, loginSilent } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signupEmail, setSignupEmail] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.subscriptionStatus !== "active") {
        fetch("/api/activate-free", { method: "POST" })
          .then(r => r.json())
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/me"] });
            setLocation("/");
          })
          .catch(() => setLocation("/"));
      } else {
        setLocation("/");
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = signupEmail.trim();
    if (!email) return;
    setSigningUp(true);
    try {
      await loginSilent(email);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Welcome!", description: "Signed in successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Sign in failed" });
    } finally {
      setSigningUp(false);
    }
  };

  if (user) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eee]" data-testid="nav-top">
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/")} data-testid="nav-logo">
            <ProfundrLogo size="md" variant="dark" />
          </button>
        </div>
        <button
          onClick={() => setLocation("/")}
          className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
          data-testid="button-back-home"
        >
          Back to Home
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[380px] space-y-6">
          <div className="text-center">
            <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.03em] leading-tight mb-3" data-testid="text-signin-title">
              Sign In
            </h1>
            <p className="text-[13px] text-[#888] leading-[1.7] max-w-[300px] mx-auto">
              Enter your email to sign in or create an account.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#eee] p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  data-testid="input-signin-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  disabled={signingUp}
                  autoFocus
                />
              </div>
              <button
                data-testid="button-signin"
                type="submit"
                disabled={signingUp || !signupEmail.trim()}
                className="w-full h-[48px] rounded-full bg-[#1a1a2e] text-white text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
              </button>
            </form>
          </div>

          <div className="text-center">
            <button
              onClick={() => setLocation("/")}
              className="text-[12px] text-[#aaa] hover:text-[#666] transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
