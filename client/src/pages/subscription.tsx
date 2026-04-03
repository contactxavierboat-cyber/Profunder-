import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import { useLocation } from "wouter";
import { Loader2, Check, Crown, Shield, Zap, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface PlanData {
  product_id: string;
  name: string;
  description: string;
  price_id: string;
  unit_amount: number;
  currency: string;
  tier: "basic" | "repair" | "capital";
}

const PLAN_FEATURES: Record<string, { features: string[]; icon: LucideIcon; color: string; accent: string }> = {
  basic: {
    icon: Shield,
    color: "#3b82f6",
    accent: "bg-blue-50 border-blue-200",
    features: [
      "Credit analysis",
      "Capital Readiness Report",
      "AI Chat Assistant",
      "Profile monitoring",
      "Basic underwriting insights",
    ],
  },
  repair: {
    icon: Zap,
    color: "#8b5cf6",
    accent: "bg-purple-50 border-purple-300",
    features: [
      "Everything in Basic",
      "Repair Center",
      "AI dispute letters",
      "3-round dispute system",
      "Negative item identification",
      "Inquiry analysis",
      "Credit report error detection",
      "Dispute tracking dashboard",
    ],
  },
  capital: {
    icon: Crown,
    color: "#f59e0b",
    accent: "bg-amber-50 border-amber-200",
    features: [
      "Everything in Basic + Repair",
      "Funding Sequence Strategy",
      "Lender targeting",
      "Capital stacking plan",
      "Real-time underwriting intelligence",
      "Credit Unlocks tab",
      "1-on-1 guidance access",
      "Approval probability insights",
    ],
  },
};

const TIER_ORDER = ["basic", "repair", "capital"] as const;

export default function SubscriptionPage() {
  const { user, isLoading, loginSilent } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [step, setStep] = useState<"plans" | "account">("plans");
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";
  const isCanceled = params.get("canceled") === "true";

  useEffect(() => {
    fetch("/api/subscription-plans")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length > 0) setPlans(data); })
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

  const redirectToCheckout = async (priceId: string) => {
    if (!priceId) {
      toast({ variant: "destructive", title: "Error", description: "Could not load subscription details. Please try again." });
      return;
    }
    setRedirectingToCheckout(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.updated) {
        toast({ title: "Plan Updated", description: `Your plan has been changed to ${data.tier?.charAt(0).toUpperCase()}${data.tier?.slice(1) || "the new plan"}.` });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/check-subscription"] });
        setRedirectingToCheckout(false);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast({ variant: "destructive", title: "Checkout Error", description: message });
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

  const userTier = user?.subscriptionTier as string | null;
  const isActiveSub = user?.subscriptionStatus === "active" && !!userTier;

  const sortedPlans = TIER_ORDER.map(tier => plans.find(p => p.tier === tier)).filter(Boolean) as PlanData[];

  const handleSelectPlan = (plan: PlanData) => {
    if (!user) {
      setSelectedTier(plan.tier);
      setStep("account");
      return;
    }
    if (isActiveSub && userTier === plan.tier) return;
    redirectToCheckout(plan.price_id);
  };

  const handleCreateAccountAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = signupEmail.trim();
    const password = signupPassword;
    if (!email || !password) return;
    setSigningUp(true);
    setSignupError("");

    try {
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerData.error?.includes("already exists")) {
          const loginRes = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const loginData = await loginRes.json();
          if (!loginRes.ok) {
            setSignupError(loginData.error || "Account exists. Check your password.");
            setSigningUp(false);
            return;
          }
        } else {
          setSignupError(registerData.error || "Could not create account.");
          setSigningUp(false);
          return;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/me"] });

      await new Promise(r => setTimeout(r, 300));

      const plan = plans.find(p => p.tier === selectedTier);
      if (plan) {
        await redirectToCheckout(plan.price_id);
      } else {
        setLocation("/");
      }
    } catch (err: any) {
      setSignupError(err.message || "Something went wrong.");
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eee]" data-testid="nav-top">
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/")} data-testid="nav-logo">
            <ProfundrLogo size="md" variant="dark" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!user && (
            <button
              onClick={() => setLocation("/login")}
              className="text-[13px] text-[#555] hover:text-[#111] font-medium transition-colors"
              data-testid="button-login-link"
            >
              Log In
            </button>
          )}
          <button
            onClick={() => setLocation("/")}
            className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
            data-testid="button-back-home"
          >
            Back to Home
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="w-full max-w-[1100px] mx-auto space-y-8">
          {step === "account" && !user && selectedTier ? (
            <div className="max-w-[440px] mx-auto">
              <button
                onClick={() => { setStep("plans"); setSignupError(""); }}
                className="flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#555] mb-6 transition-colors"
                data-testid="button-back-to-plans"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to plans
              </button>

              <div className="bg-white rounded-2xl border border-[#eee] p-6 sm:p-8 shadow-sm">
                <div className="text-center mb-6">
                  <ProfundrLogo size="md" variant="dark" />
                  <h2 className="text-[20px] font-bold text-[#1a1a1a] mt-4 mb-1">Create your account</h2>
                  <p className="text-[13px] text-[#888]">
                    Sign up to get started with <span className="font-semibold text-[#555]">{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}</span>
                  </p>
                </div>

                {(() => {
                  const plan = plans.find(p => p.tier === selectedTier);
                  if (!plan) return null;
                  const meta = PLAN_FEATURES[plan.tier];
                  const IconComponent = meta.icon;
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#eee] bg-[#fafafa] mb-6" data-testid="selected-plan-summary">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                        <IconComponent className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">{plan.name.replace("Profundr ", "")}</p>
                        <p className="text-[11px] text-[#888]">${(plan.unit_amount / 100).toFixed(0)}/month</p>
                      </div>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  );
                })()}

                <form onSubmit={handleCreateAccountAndCheckout} className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-[#555] mb-1 block">Email</label>
                    <input
                      data-testid="input-signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[46px] px-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                      value={signupEmail}
                      onChange={(e) => { setSignupEmail(e.target.value); setSignupError(""); }}
                      required
                      disabled={signingUp}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#555] mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        data-testid="input-signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[46px] px-4 pr-10 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                        value={signupPassword}
                        onChange={(e) => { setSignupPassword(e.target.value); setSignupError(""); }}
                        required
                        minLength={6}
                        disabled={signingUp}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#666]"
                        tabIndex={-1}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {signupError && (
                    <p className="text-[12px] text-red-500 px-1" data-testid="text-signup-error">{signupError}</p>
                  )}

                  <button
                    data-testid="button-create-account"
                    type="submit"
                    disabled={signingUp || !signupEmail.trim() || !signupPassword || signupPassword.length < 6}
                    className="w-full h-[48px] rounded-full bg-[#1a1a2e] text-white text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  >
                    {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account & Continue to Payment"}
                  </button>
                </form>

                <p className="text-[11px] text-[#bbb] text-center mt-4">
                  Already have an account? <button onClick={() => setLocation("/login")} className="text-[#8b5cf6] hover:underline" data-testid="link-login-instead">Log in</button>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="mb-3" data-testid="text-plans-title">
                  <ProfundrLogo size="lg" variant="dark" />
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1a1a1a] mb-2">Choose Your Plan</h1>
                <p className="text-[14px] text-[#888] leading-[1.7] max-w-[500px] mx-auto">
                  Select the plan that matches your goals. Upgrade or downgrade anytime.
                </p>
              </div>

              {plans.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#999]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {sortedPlans.map((plan) => {
                    const meta = PLAN_FEATURES[plan.tier];
                    const IconComponent = meta.icon;
                    const isCurrent = isActiveSub && userTier === plan.tier;
                    const isRecommended = plan.tier === "repair";
                    const formattedPrice = `$${(plan.unit_amount / 100).toFixed(0)}`;

                    return (
                      <div
                        key={plan.tier}
                        className={`relative bg-white rounded-2xl border p-6 sm:p-7 shadow-sm flex flex-col transition-all ${
                          isRecommended ? "border-purple-300 ring-2 ring-purple-200" : "border-[#eee]"
                        } ${isCurrent ? "opacity-90" : "hover:shadow-md"}`}
                        data-testid={`plan-card-${plan.tier}`}
                      >
                        {isRecommended && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8b5cf6] text-white text-[11px] font-semibold px-4 py-1 rounded-full" data-testid="badge-recommended">
                            RECOMMENDED
                          </div>
                        )}

                        {isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-[11px] font-semibold px-4 py-1 rounded-full" data-testid="badge-current-plan">
                            CURRENT PLAN
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4 mt-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                            <IconComponent className="w-5 h-5" style={{ color: meta.color }} />
                          </div>
                          <div>
                            <h3 className="text-[16px] font-semibold text-[#1a1a1a]" data-testid={`text-plan-name-${plan.tier}`}>{plan.name.replace("Profundr ", "")}</h3>
                          </div>
                        </div>

                        <div className="mb-5">
                          <span className="text-[32px] font-bold text-[#1a1a1a]" data-testid={`text-plan-price-${plan.tier}`}>{formattedPrice}</span>
                          <span className="text-[14px] text-[#888]">/month</span>
                        </div>

                        <div className="space-y-2.5 mb-6 flex-1">
                          {meta.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                              <span className="text-[13px] text-[#555] leading-[1.5]">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isCurrent || redirectingToCheckout}
                          className={`w-full h-[46px] rounded-full text-[14px] font-medium transition-colors flex items-center justify-center gap-2 ${
                            isCurrent
                              ? "bg-[#f0f0f0] text-[#999] cursor-default"
                              : isRecommended
                              ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
                              : "bg-[#1a1a2e] text-white hover:bg-[#2a2a40]"
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                          data-testid={`button-select-${plan.tier}`}
                        >
                          {isCurrent ? "Current Plan" : redirectingToCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : `Get ${plan.name.replace("Profundr ", "")}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {plans.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#eee] shadow-sm overflow-hidden" data-testid="feature-comparison-table">
                  <div className="px-6 py-4 border-b border-[#eee]">
                    <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Feature Comparison</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#eee]">
                          <th className="text-left px-6 py-3 text-[12px] font-medium text-[#888] w-[40%]">Feature</th>
                          <th className="text-center px-4 py-3 text-[12px] font-medium text-[#3b82f6]">Basic</th>
                          <th className="text-center px-4 py-3 text-[12px] font-medium text-[#8b5cf6]">Repair</th>
                          <th className="text-center px-4 py-3 text-[12px] font-medium text-[#f59e0b]">Capital</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { feature: "Credit Analysis", basic: true, repair: true, capital: true },
                          { feature: "Capital Readiness Report", basic: true, repair: true, capital: true },
                          { feature: "AI Chat Assistant", basic: true, repair: true, capital: true },
                          { feature: "Profile Monitoring", basic: true, repair: true, capital: true },
                          { feature: "Basic Underwriting Insights", basic: true, repair: true, capital: true },
                          { feature: "Repair Center", basic: false, repair: true, capital: true },
                          { feature: "AI Dispute Letters", basic: false, repair: true, capital: true },
                          { feature: "3-Round Dispute System", basic: false, repair: true, capital: true },
                          { feature: "Negative Item Identification", basic: false, repair: true, capital: true },
                          { feature: "Inquiry Analysis", basic: false, repair: true, capital: true },
                          { feature: "Credit Report Error Detection", basic: false, repair: true, capital: true },
                          { feature: "Dispute Tracking Dashboard", basic: false, repair: true, capital: true },
                          { feature: "Funding Sequence Strategy", basic: false, repair: false, capital: true },
                          { feature: "Lender Targeting", basic: false, repair: false, capital: true },
                          { feature: "Capital Stacking Plan", basic: false, repair: false, capital: true },
                          { feature: "Real-time Underwriting Intelligence", basic: false, repair: false, capital: true },
                          { feature: "Credit Unlocks Tab", basic: false, repair: false, capital: true },
                          { feature: "1-on-1 Guidance Access", basic: false, repair: false, capital: true },
                          { feature: "Approval Probability Insights", basic: false, repair: false, capital: true },
                        ].map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-[#fafafa]" : ""} data-testid={`comparison-row-${idx}`}>
                            <td className="px-6 py-2.5 text-[#333]">{row.feature}</td>
                            <td className="text-center px-4 py-2.5">
                              {row.basic ? <Check className="w-4 h-4 text-[#3b82f6] mx-auto" /> : <span className="text-[#ddd]">—</span>}
                            </td>
                            <td className="text-center px-4 py-2.5">
                              {row.repair ? <Check className="w-4 h-4 text-[#8b5cf6] mx-auto" /> : <span className="text-[#ddd]">—</span>}
                            </td>
                            <td className="text-center px-4 py-2.5">
                              {row.capital ? <Check className="w-4 h-4 text-[#f59e0b] mx-auto" /> : <span className="text-[#ddd]">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isActiveSub && user && (
                <div className="text-center">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/create-portal-session", { method: "POST" });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      } catch {}
                    }}
                    className="text-[13px] text-[#8b5cf6] hover:text-[#7c3aed] font-medium transition-colors"
                    data-testid="button-manage-subscription"
                  >
                    Manage Subscription
                  </button>
                </div>
              )}
            </>
          )}

          <div className="text-center space-y-2 pb-8">
            <p className="text-[11px] text-[#bbb]">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
