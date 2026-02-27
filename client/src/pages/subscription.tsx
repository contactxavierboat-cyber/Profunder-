import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import { useLocation, useSearch } from "wouter";
import { Check, ShieldCheck, CreditCard, Loader2, ExternalLink, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

function BlobBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    interface Blob { x: number; y: number; vx: number; vy: number; radius: number; opacity: number; phase: number; wobbleSpeed: number; wobbleAmp: number; points: number; squeezePhase: number; squeezeSpeed: number; squeezeAmount: number; }
    let blobs: Blob[] = [];
    let time = 0;
    const resize = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.width = w * window.devicePixelRatio; canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    const init = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      const count = Math.min(Math.floor((w * h) / 40000), 30);
      blobs = [];
      for (let i = 0; i < count; i++) {
        const speed = Math.random() * 1.0 + 0.5; const angle = Math.random() * Math.PI * 2;
        blobs.push({ x: Math.random() * w, y: Math.random() * h, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: Math.random() * 100 + 50, opacity: Math.random() * 0.18 + 0.1, phase: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 1.2 + 0.5, wobbleAmp: Math.random() * 0.35 + 0.15, points: Math.floor(Math.random() * 4) + 6, squeezePhase: Math.random() * Math.PI * 2, squeezeSpeed: Math.random() * 1.5 + 0.6, squeezeAmount: Math.random() * 0.4 + 0.25 });
      }
    };
    const drawBlob = (b: Blob) => {
      const breathe = Math.sin(time * 0.6 + b.phase) * 0.12 + 1;
      const r = b.radius * breathe;
      const sqz = Math.sin(time * b.squeezeSpeed + b.squeezePhase) * b.squeezeAmount;
      const scaleX = 1 + sqz; const scaleY = 1 - sqz;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < b.points; i++) {
        const a = (Math.PI * 2 / b.points) * i;
        const wobble = Math.sin(time * b.wobbleSpeed + b.phase + i * 1.3) * b.wobbleAmp;
        const dist = r * (1 + wobble);
        pts.push({ x: b.x + Math.cos(a) * dist * scaleX, y: b.y + Math.sin(a) * dist * scaleY });
      }
      ctx.beginPath();
      ctx.moveTo((pts[pts.length - 1].x + pts[0].x) / 2, (pts[pts.length - 1].y + pts[0].y) / 2);
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + next.x) / 2, (pts[i].y + next.y) / 2);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 1.3);
      grad.addColorStop(0, `rgba(155, 155, 172, ${b.opacity * 1.5})`);
      grad.addColorStop(0.35, `rgba(145, 145, 165, ${b.opacity * 1.1})`);
      grad.addColorStop(0.65, `rgba(135, 135, 155, ${b.opacity * 0.55})`);
      grad.addColorStop(1, `rgba(125, 125, 145, 0)`);
      ctx.fillStyle = grad; ctx.fill();
      const edgeGrad = ctx.createRadialGradient(b.x, b.y, r * 0.6, b.x, b.y, r * 1.1);
      edgeGrad.addColorStop(0, `rgba(170, 170, 185, 0)`);
      edgeGrad.addColorStop(0.7, `rgba(165, 165, 182, ${b.opacity * 0.45})`);
      edgeGrad.addColorStop(1, `rgba(165, 165, 182, 0)`);
      ctx.fillStyle = edgeGrad; ctx.fill();
    };
    const draw = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h); time += 0.016;
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        const margin = b.radius * 2;
        if (b.x < -margin) b.x = w + margin; if (b.x > w + margin) b.x = -margin;
        if (b.y < -margin) b.y = h + margin; if (b.y > h + margin) b.y = -margin;
        drawBlob(b);
      });
      animationId = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const resizeHandler = () => { resize(); init(); };
    window.addEventListener('resize', resizeHandler);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resizeHandler); };
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 1 }} />;
}

const gradientText = {
  backgroundImage: 'linear-gradient(180deg, #000000 0%, #2a2a4a 45%, #6a6a8a 100%)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  fontStyle: 'italic' as const,
  lineHeight: '0.95',
};

const contentBlock = "relative z-10 rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)]";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
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
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #ffffff 0%, #f5f5fc 15%, #eef0fa 30%, #f8f8ff 45%, #f2f0fb 60%, #f6f5fc 75%, #f0eff8 88%, #eceaf5 100%)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#7a7a9a]" />
      </div>
    );
  }

  if (!user) { setLocation("/"); return null; }

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

  const isActive = user.subscriptionStatus === "active";

  const features = [
    "Capital Readiness Score & 6-Component Analysis",
    "2.5x Exposure Ceiling Calculation",
    "AI Credit Repair with Dispute Letters",
    "7 AI Mentors & Creator Intelligence",
    "Denial Simulation & Risk Detection",
    "Document Upload & Auto-Extraction",
  ];

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #ffffff 0%, #f5f5fc 15%, #eef0fa 30%, #f8f8ff 45%, #f2f0fb 60%, #f6f5fc 75%, #f0eff8 88%, #eceaf5 100%)' }}
    >
      <BlobBackground />

      <div className="relative z-20 w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-full border-2 border-[#c0c0d0] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#8a8aa5]"></span>
            </div>
            <ProfundrLogo size="sm" variant="dark" />
          </div>

          <p className="text-[11px] tracking-[0.2em] uppercase text-[#7a7a9a] mb-4">
            {isActive ? "Active Membership" : "Membership"}
          </p>

          <h1
            className="text-[32px] sm:text-[44px] md:text-[52px] tracking-[-0.04em] mb-3"
            style={gradientText}
            data-testid="text-subscription-title"
          >
            {isActive ? "You're All Set" : "Complete Access"}
          </h1>
          <p className="text-[13px] sm:text-[15px] text-[#6a6a8a] leading-[1.7] max-w-[400px]">
            {isActive
              ? "Your membership is active. Manage your billing below."
              : "Unlock the full power of Profundr — AI-powered underwriting intelligence, credit repair, and mentorship."}
          </p>
        </div>

        {!isActive && (
          <div className={`${contentBlock} p-4 text-center`}>
            <p className="text-[12px] sm:text-[13px] text-[#6a6a8a]" data-testid="text-subscription-inactive">Complete your profile and activate your membership below.</p>
          </div>
        )}

        <div className={`${contentBlock} overflow-hidden`}>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c0c0d0] to-transparent"></div>

          <div className="px-6 sm:px-8 pt-7 sm:pt-9 pb-3 text-center">
            <p className="text-[11px] sm:text-[12px] text-[#7a7a9a] uppercase tracking-[0.15em] font-semibold mb-4">Profundr Monthly</p>
            <div className="mb-2">
              <span
                className="text-[44px] sm:text-[56px] tracking-tight"
                style={{ ...gradientText, fontStyle: 'normal', lineHeight: '1' }}
                data-testid="text-price"
              >$50</span>
              <span className="text-[#8a8aa5] text-[14px] sm:text-[15px] ml-1.5">/month</span>
            </div>
            <p className="text-[#8a8aa5] text-[12px] sm:text-[13px]">All-in-one fundability platform</p>
          </div>

          {needsProfile && (
            <div className="px-6 sm:px-8 py-5 sm:py-6">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d0d0de] to-transparent mb-5 sm:mb-6"></div>
              <p className="text-[11px] sm:text-[12px] text-[#7a7a9a] uppercase tracking-[0.15em] font-semibold mb-4 text-center">Your Profile</p>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9ab0]" />
                  <input
                    data-testid="input-profile-username"
                    type="text"
                    placeholder="Choose a username"
                    className="w-full bg-[#f5f5fa] border border-[#e0e0ea] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab0] outline-none focus:border-[#6a6a8a] transition-colors"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    minLength={3}
                    disabled={savingProfile}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9ab0]" />
                  <input
                    data-testid="input-profile-phone"
                    type="tel"
                    placeholder="Phone number"
                    className="w-full bg-[#f5f5fa] border border-[#e0e0ea] rounded-xl h-[48px] pl-10 pr-4 text-[14px] text-[#1a1a2e] placeholder:text-[#9a9ab0] outline-none focus:border-[#6a6a8a] transition-colors"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    disabled={savingProfile}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="px-6 sm:px-8 py-5 sm:py-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d0d0de] to-transparent mb-5 sm:mb-6"></div>
            <p className="text-[11px] sm:text-[12px] text-[#7a7a9a] uppercase tracking-[0.15em] font-semibold mb-4 text-center">What's Included</p>
            <div className="space-y-3.5 sm:space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/50 border border-white/40 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#6a6a8a]" />
                  </div>
                  <span className="text-[13px] sm:text-[14px] text-[#3a3a5a]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-7 sm:pb-9">
            {isActive ? (
              <button
                data-testid="button-manage-billing"
                onClick={handleManageBilling}
                disabled={isProcessing}
                className="w-full h-[48px] sm:h-[52px] rounded-full border border-white/30 bg-[#f8f8fc] text-[#3a3a5a] text-[13px] sm:text-[14px] font-bold hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Manage Billing</>}
              </button>
            ) : (
              <button
                data-testid="button-activate"
                onClick={handleActivate}
                disabled={isProcessing || savingProfile || loadingPrice || !priceId || (needsProfile && (!profileUsername.trim() || profileUsername.trim().length < 3 || !profilePhone.trim()))}
                className="w-full h-[48px] sm:h-[52px] rounded-full text-white text-[13px] sm:text-[14px] font-bold tracking-wide hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
                style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%)' }}
              >
                {isProcessing || savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Activate Membership</>}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] sm:text-[12px] text-[#8a8aa5]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure SSL Payment via Stripe</span>
        </div>

        <div className="text-center">
          <button
            onClick={() => setLocation("/")}
            className="text-[12px] text-[#8a8aa5] hover:text-[#5a5a7a] transition-colors tracking-wide"
          >
            ← Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
