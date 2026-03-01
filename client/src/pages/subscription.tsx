import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user, isLoading, loginSilent } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signupEmail, setSignupEmail] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [priceData, setPriceData] = useState<{ price_id: string; unit_amount: number; currency: string; name: string } | null>(null);
  const hasRedirected = useRef(false);

  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";
  const isCanceled = params.get("canceled") === "true";

  useEffect(() => {
    fetch("/api/subscription-price")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPriceData(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isSuccess && user) {
      setCheckoutSuccess(true);
      const pollSubscription = async () => {
        for (let i = 0; i < 15; i++) {
          try {
            const res = await fetch("/api/check-subscription", { method: "POST" });
            const data = await res.json();
            if (data.active) {
              queryClient.invalidateQueries({ queryKey: ["/api/me"] });
              toast({ title: "Subscription active", description: "Welcome to Profundr." });
              setTimeout(() => setLocation("/"), 1000);
              return;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
        }
        setCheckoutSuccess(false);
        toast({ variant: "destructive", title: "Activation pending", description: "Your payment is being processed. Please refresh in a moment." });
      };
      pollSubscription();
      return;
    }

    if (isCanceled) {
      toast({ title: "Checkout canceled", description: "No charge was made." });
    }
  }, [isSuccess, isCanceled, user]);

  useEffect(() => {
    if (user && !isSuccess && !isCanceled) {
      if (user.subscriptionStatus === "active") {
        setLocation("/");
        return;
      }
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        redirectToCheckout();
      }
    }
  }, [user, priceData]);

  const redirectToCheckout = async () => {
    if (!priceData) {
      toast({ variant: "destructive", title: "Error", description: "Could not load subscription details. Please try again." });
      return;
    }
    setRedirectingToCheckout(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: priceData.price_id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: err.message || "Something went wrong. Please try again." });
      setRedirectingToCheckout(false);
    }
  };

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
      toast({ title: "Welcome!", description: "Redirecting to checkout..." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Sign in failed" });
    } finally {
      setSigningUp(false);
    }
  };

  if (checkoutSuccess || (isSuccess && user)) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#fafafa] gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-semibold text-[#1a1a1a] mb-1">Activating your subscription</p>
          <p className="text-[13px] text-[#777]">This will only take a moment...</p>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-[#999] mt-2" />
      </div>
    );
  }

  if (user && redirectingToCheckout) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#fafafa] gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#1a1a2e]" />
        <p className="text-[13px] text-[#777]">Redirecting to checkout...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#fafafa] gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#1a1a2e]" />
        <p className="text-[13px] text-[#777]">Setting up your account...</p>
      </div>
    );
  }

  const formattedPrice = priceData ? `$${(priceData.unit_amount / 100).toFixed(0)}` : "$50";

  return (
    <div className="min-h-[100dvh] h-[100dvh] flex flex-col bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
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

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="w-full max-w-[440px] mx-auto space-y-6">
          <div className="text-center">
            <div className="mb-3" data-testid="text-signin-title">
              <ProfundrLogo size="lg" variant="dark" />
            </div>
            <p className="text-[13px] text-[#888] leading-[1.7] max-w-[340px] mx-auto text-justify">
              The full capital intelligence system. Everything you need to understand, repair, and expand your financial position.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#eee] p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-[#1a1a2e] flex items-center justify-center mx-auto mb-4">
                <svg width={48 * 0.57} height={48 * 0.57} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
                  <path d="M12 2v20" />
                  <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
                  <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
                  <path d="M5 15c2-.5 3.5-1 5-3" />
                  <path d="M19 15c-2-.5-3.5-1-5-3" />
                </svg>
              </div>
              <span className="text-[32px] font-bold text-[#1a1a1a]" data-testid="text-price">{formattedPrice}</span>
              <span className="text-[32px] font-bold text-[#1a1a1a]">/month</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3" data-testid="feature-capital-readiness">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Capital Readiness Index</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">A lender-behavior simulation that ranks how fundable you are right now — based on real underwriting triggers.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="feature-risk-signal">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Risk Signal Scan</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">Detects hidden denial triggers — utilization spikes, thin-file gaps, inquiry stacking, seasoning issues, and structural weaknesses most consumers miss.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="feature-dispute-engine">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Precision Dispute Engine</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">Strategic, FCRA-aligned correction workflows that target data integrity flaws — not random template letters.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="feature-approval-strategy">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Approval Strategy Map</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">Product timing, exposure sequencing, and positioning logic designed to increase approval odds before you apply.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="feature-funding-blueprint">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Funding Growth Blueprint</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">Step-by-step capital stacking roadmap — optimize utilization, strengthen anchors, improve profile symmetry, and raise your exposure ceiling.</p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="feature-underwriter-view">
                <svg className="w-4 h-4 text-[#1a1a2e] flex-shrink-0 mt-0.5" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <p className="text-[13px] font-medium text-[#1a1a1a]">Underwriter View</p>
                  <p className="text-[11px] text-[#888] leading-[1.5] mt-0.5">See your profile the way a credit analyst does — risk layers, behavioral patterns, stability markers, and automated denial simulations.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
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
                data-testid="button-subscribe"
                type="submit"
                disabled={signingUp || !signupEmail.trim()}
                className="w-full h-[48px] rounded-full bg-[#1a1a2e] text-white text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : `Subscribe — ${formattedPrice}/mo`}
              </button>
            </form>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[11px] text-[#bbb]">
              Secure payment via Stripe. Cancel anytime.
            </p>
            <button
              onClick={() => setLocation("/")}
              className="text-[12px] text-[#aaa] hover:text-[#666] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
