import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import { useLocation, useSearch } from "wouter";
import { Check, ShieldCheck, CreditCard, Loader2, ExternalLink, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user, isLoading, loginSilent } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const queryClient = useQueryClient();
  const search = useSearch();
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const needsProfile = user && !user.username;

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      fetch("/api/check-subscription", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.active) {
            queryClient.invalidateQueries({ queryKey: ["/api/me"] });
            toast({ title: "Subscription Activated!", description: "Welcome to Profundr." });
            setTimeout(() => setLocation("/dashboard"), 1500);
          }
        });
    }
    if (params.get("canceled") === "true") {
      toast({ title: "Checkout Canceled", description: "You can try again anytime." });
    }
  }, [search]);

  useEffect(() => {
    fetch("/api/subscription-price")
      .then((res) => res.json())
      .then((data) => { if (data.price_id) setPriceId(data.price_id); })
      .catch(() => {})
      .finally(() => setLoadingPrice(false));
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = signupEmail.trim();
    if (!email) return;
    setSigningUp(true);
    try {
      await loginSilent(email);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Account created", description: "Complete your profile to subscribe." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Sign up failed" });
    } finally {
      setSigningUp(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { toast({ variant: "destructive", title: "Error", description: "Could not open billing portal." }); }
    } catch { toast({ variant: "destructive", title: "Error", description: "Could not open billing portal." }); }
    finally { setIsProcessing(false); }
  };

  const handleActivate = async () => {
    if (!priceId) return;
    setIsProcessing(true);
    if (needsProfile) {
      if (!profileUsername.trim() || profileUsername.trim().length < 3 || !profilePhone.trim()) {
        toast({ variant: "destructive", title: "Error", description: "Please fill in your username and phone number" });
        setIsProcessing(false);
        return;
      }
      setSavingProfile(true);
      try {
        const profileRes = await fetch("/api/profile-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: profileUsername.trim(), phone: profilePhone.trim() }),
        });
        if (!profileRes.ok) {
          const err = await profileRes.json().catch(() => ({ error: "Failed to save profile" }));
          toast({ variant: "destructive", title: "Error", description: err.error || "Failed to save profile" });
          setIsProcessing(false);
          setSavingProfile(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to save profile" });
        setIsProcessing(false);
        setSavingProfile(false);
        return;
      }
      setSavingProfile(false);
    }
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { toast({ variant: "destructive", title: "Error", description: data.error || "Could not start checkout." }); setIsProcessing(false); }
    } catch { toast({ variant: "destructive", title: "Error", description: "Could not start checkout." }); setIsProcessing(false); }
  };

  const isActive = user?.subscriptionStatus === "active";

  const features = [
    "Capital Readiness Score & 6-Component Analysis",
    "2.5x Exposure Ceiling Calculation",
    "AI Credit Repair with Dispute Letters",
    "7 AI Mentors & Creator Intelligence",
    "Denial Simulation & Risk Detection",
    "Document Upload & Auto-Extraction",
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eee]" data-testid="nav-top">
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/")} data-testid="nav-logo">
            <ProfundrLogo size="md" variant="dark" />
          </button>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#999] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
            {isActive && (
              <button
                onClick={() => setLocation("/dashboard")}
                className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1a1a2e] text-white hover:bg-[#2a2a40] transition-colors"
                data-testid="button-dashboard"
              >
                Dashboard
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setLocation("/")}
            className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
            data-testid="button-back-home"
          >
            Back to Home
          </button>
        )}
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 min-h-[calc(100dvh-56px)]">

          {!user ? (
            <div className="w-full max-w-[420px] space-y-6">
              <div className="text-center">
                <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.03em] leading-tight mb-3" data-testid="text-signup-title">
                  Subscribe
                </h1>
                <p className="text-[13px] text-[#888] leading-[1.7] max-w-[340px] mx-auto">
                  Create your account to unlock AI-powered underwriting intelligence, credit repair, and funding readiness.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#eee] p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
                      <path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      data-testid="input-signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={signingUp}
                    />
                  </div>
                  <button
                    data-testid="button-signup"
                    type="submit"
                    disabled={signingUp || !signupEmail.trim()}
                    className="w-full h-[48px] rounded-full bg-[#1a1a2e] text-white text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                  </button>
                </form>
                <p className="text-[10px] text-[#bbb] text-center mt-4 leading-[1.6]">
                  By signing up you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#eee] p-6 shadow-sm">
                <div className="text-center mb-4">
                  <span className="text-[32px] sm:text-[40px] font-semibold text-[#1a1a1a] tracking-tight">$50</span>
                  <span className="text-[#999] text-[14px] ml-1">/month</span>
                </div>
                <div className="space-y-3">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-[#888]" />
                      </div>
                      <span className="text-[13px] text-[#555]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#aaa]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure & Private</span>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[420px] space-y-6">
              <div className="text-center">
                <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.03em] leading-tight mb-3" data-testid="text-subscription-title">
                  {isActive ? "You're All Set" : "Complete Access"}
                </h1>
                <p className="text-[13px] text-[#888] leading-[1.7] max-w-[340px] mx-auto">
                  {isActive
                    ? "Your membership is active. Manage your billing below."
                    : "Unlock the full power of Profundr — AI-powered underwriting intelligence, credit repair, and mentorship."}
                </p>
              </div>

              {!isActive && (
                <div className="bg-white rounded-2xl border border-[#eee] p-4 text-center shadow-sm">
                  <p className="text-[13px] text-[#888]" data-testid="text-subscription-inactive">Complete your profile and activate your membership below.</p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
                <div className="px-6 sm:px-8 pt-7 pb-3 text-center">
                  <p className="text-[11px] text-[#999] uppercase tracking-[0.15em] font-semibold mb-3">Profundr Monthly</p>
                  <div className="mb-2">
                    <span className="text-[40px] sm:text-[48px] font-semibold text-[#1a1a1a] tracking-tight" data-testid="text-price">$50</span>
                    <span className="text-[#999] text-[14px] ml-1">/month</span>
                  </div>
                  <p className="text-[#aaa] text-[12px]">All-in-one fundability platform</p>
                </div>

                {needsProfile && (
                  <div className="px-6 sm:px-8 py-5">
                    <div className="w-full h-px bg-[#eee] mb-5"></div>
                    <p className="text-[11px] text-[#999] uppercase tracking-[0.15em] font-semibold mb-4 text-center">Your Profile</p>
                    <div className="space-y-3">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                        <input
                          data-testid="input-profile-username"
                          type="text"
                          placeholder="Choose a username"
                          className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                          value={profileUsername}
                          onChange={(e) => setProfileUsername(e.target.value)}
                          minLength={3}
                          disabled={savingProfile}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                        <input
                          data-testid="input-profile-phone"
                          type="tel"
                          placeholder="Phone number"
                          className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          disabled={savingProfile}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-6 sm:px-8 py-5">
                  <div className="w-full h-px bg-[#eee] mb-5"></div>
                  <p className="text-[11px] text-[#999] uppercase tracking-[0.15em] font-semibold mb-4 text-center">What's Included</p>
                  <div className="space-y-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#888]" />
                        </div>
                        <span className="text-[13px] text-[#555]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 sm:px-8 pb-7">
                  {isActive ? (
                    <button
                      data-testid="button-manage-billing"
                      onClick={handleManageBilling}
                      disabled={isProcessing}
                      className="w-full h-[48px] rounded-full border border-[#ddd] bg-[#f5f5f5] text-[#555] text-[14px] font-medium hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Manage Billing</>}
                    </button>
                  ) : (
                    <button
                      data-testid="button-activate"
                      onClick={handleActivate}
                      disabled={isProcessing || savingProfile || loadingPrice || !priceId || (needsProfile && (!profileUsername.trim() || profileUsername.trim().length < 3 || !profilePhone.trim()))}
                      className="w-full h-[48px] rounded-full bg-[#1a1a2e] text-white text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing || savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Activate Membership</>}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#aaa]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure SSL Payment via Stripe</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
