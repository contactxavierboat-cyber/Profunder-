import { useAuth } from "@/lib/store";
import { useLocation, useSearch } from "wouter";
import { Check, ShieldCheck, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const queryClient = useQueryClient();
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      fetch("/api/check-subscription", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.active) {
            queryClient.invalidateQueries({ queryKey: ["/api/me"] });
            toast({ title: "Subscription Activated!", description: "Welcome to MentXr®." });
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
      .then((data) => {
        if (data.price_id) {
          setPriceId(data.price_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrice(false));
  }, []);

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleSubscribe = async () => {
    if (!priceId) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Could not start checkout." });
        setIsProcessing(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not start checkout." });
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not open billing portal." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not open billing portal." });
    } finally {
      setIsProcessing(false);
    }
  };

  const isActive = user.subscriptionStatus === "active";

  const features = [
    "30 AI-Powered Fundability Analyses",
    "Bank-Level Underwriting Logic",
    "Document Verification & Storage",
    "Priority Support",
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-[#1A1A1A] flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="flex flex-col items-center">
          <div className="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] rounded-[14px] sm:rounded-[16px] mb-5 sm:mb-8 bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center relative">
            <span className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2E7D32]/12 animate-ping" />
            <span className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2E7D32] shadow-[0_0_12px_rgba(46,125,50,0.3)]" />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-[#E5E7EB] bg-white shadow-sm mb-5 sm:mb-8">
            <span className="w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] rounded-full bg-[#2E7D32] animate-pulse"></span>
            <span className="text-[11px] sm:text-[13px] font-semibold tracking-[0.12em] text-[#333] uppercase">
              {isActive ? "Active" : "Membership"}
            </span>
          </div>

          <h1 className="text-[26px] sm:text-[32px] font-normal tracking-[-0.03em] text-center leading-[1.1] text-[#1A1A1A] mb-2 sm:mb-3" data-testid="text-subscription-title">
            {isActive ? "You're All Set" : "Complete Access"}
          </h1>
          <p className="text-[#666] text-[13px] sm:text-[15px] text-center leading-[1.7] max-w-[380px] px-2">
            {isActive
              ? "Your membership is active. Manage your billing below."
              : "Unlock the full power of MentXr®."}
          </p>
        </div>

        {!isActive && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 text-center shadow-sm">
            <p className="text-[12px] sm:text-sm text-[#666]" data-testid="text-subscription-inactive">Subscription inactive. Activate below to continue.</p>
          </div>
        )}

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-lg">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent"></div>

          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-2 text-center">
            <p className="text-[11px] sm:text-[13px] text-[#666] uppercase tracking-[0.1em] font-semibold mb-3 sm:mb-4">MentXr® Monthly</p>
            <div className="mb-1">
              <span className="text-[42px] sm:text-[52px] font-bold tracking-tight text-[#1A1A1A]" data-testid="text-price">$50</span>
              <span className="text-[#666] text-[13px] sm:text-[15px] ml-1">/month</span>
            </div>
            <p className="text-[#666] text-[12px] sm:text-[13px]">All-in-one fundability platform</p>
          </div>

          <div className="px-5 sm:px-8 py-4 sm:py-6">
            <div className="w-full h-px bg-[#E5E7EB] mb-4 sm:mb-6"></div>
            <div className="space-y-3 sm:space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#2E7D32]" />
                  </div>
                  <span className="text-[13px] sm:text-[14px] text-[#333]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            {isActive ? (
              <button
                data-testid="button-manage-billing"
                onClick={handleManageBilling}
                disabled={isProcessing}
                className="w-full h-[44px] sm:h-[48px] rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[#333] text-[13px] sm:text-[14px] font-bold hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Manage Billing
                  </>
                )}
              </button>
            ) : (
              <button
                data-testid="button-activate"
                onClick={handleSubscribe}
                disabled={isProcessing || loadingPrice || !priceId}
                className="w-full h-[44px] sm:h-[48px] rounded-full bg-[#2E7D32] text-white text-[13px] sm:text-[14px] font-bold hover:bg-[#256b29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Activate Membership
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-[12px] text-[#666]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure SSL Payment via Stripe</span>
        </div>

      </div>
    </div>
  );
}
