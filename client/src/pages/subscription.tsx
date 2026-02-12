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
            toast({ title: "Subscription Activated!", description: "Welcome to Start-Up Studio\u00ae." });
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
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Start-Up Studio" className="w-[64px] h-[64px] rounded-[16px] mb-8" />

          <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#333] bg-[#181818] mb-8">
            <span className="w-[8px] h-[8px] rounded-full bg-[#888] animate-pulse"></span>
            <span className="text-[13px] font-semibold tracking-[0.12em] text-white/90 uppercase">
              {isActive ? "Active" : "Membership"}
            </span>
          </div>

          <h1 className="text-[32px] font-normal tracking-[-0.03em] text-center leading-[1.1] text-[#e0e0e0] mb-3" data-testid="text-subscription-title">
            {isActive ? "You're All Set" : "Complete Access"}
          </h1>
          <p className="text-[#777] text-[15px] text-center leading-[1.7] max-w-[380px]">
            {isActive
              ? "Your membership is active. Manage your billing below."
              : "Unlock the full power of the Digital Underwriting Engine."}
          </p>
        </div>

        {!isActive && (
          <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
            <p className="text-sm text-[#999]" data-testid="text-subscription-inactive">Subscription inactive. Activate below to continue.</p>
          </div>
        )}

        <div className="bg-[#131313] border border-[#222] rounded-2xl overflow-hidden">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#444] to-transparent"></div>

          <div className="px-8 pt-8 pb-2 text-center">
            <p className="text-[13px] text-[#777] uppercase tracking-[0.1em] font-semibold mb-4">Start-Up Studio\u00ae Monthly</p>
            <div className="mb-1">
              <span className="text-[52px] font-bold tracking-tight text-[#E0E0E0]" data-testid="text-price">$50</span>
              <span className="text-[#555] text-[15px] ml-1">/month</span>
            </div>
            <p className="text-[#555] text-[13px]">All-in-one fundability platform</p>
          </div>

          <div className="px-8 py-6">
            <div className="w-full h-px bg-[#222] mb-6"></div>
            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#999]" />
                  </div>
                  <span className="text-[14px] text-[#bbb]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8">
            {isActive ? (
              <button
                data-testid="button-manage-billing"
                onClick={handleManageBilling}
                disabled={isProcessing}
                className="w-full h-[48px] rounded-full bg-[#1A1A1A] border border-[#333] text-[#ccc] text-[14px] font-bold hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full h-[48px] rounded-full bg-[#E0E0E0] text-[#0D0D0D] text-[14px] font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div className="flex items-center justify-center gap-2 text-[12px] text-[#555]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure SSL Payment via Stripe</span>
        </div>

      </div>
    </div>
  );
}
