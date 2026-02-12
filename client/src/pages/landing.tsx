import { useState, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 14);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target.getTime() - now;
      if (diff <= 0) { clearInterval(interval); return; }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-6 py-20 relative z-10">

        <img
          src="/logo.png"
          alt="X+ Logo"
          className="w-20 h-20 rounded-2xl shadow-2xl mb-6"
        />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary mb-10 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          NOW AVAILABLE
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-center leading-[1.1] mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
            Get early access
          </span>
        </h1>

        <p className="text-center text-white/50 text-base md:text-lg leading-relaxed max-w-md mb-10">
          Be amongst the first to experience the <span className="text-white font-medium">Digital Underwriting Engine</span> and get your Fundability Score. Sign up to be notified when we launch!
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-md mb-6">
          <div className="flex items-center gap-0 bg-white/[0.03] border border-white/10 rounded-full p-1.5 pl-5 backdrop-blur-sm hover:border-white/20 transition-colors focus-within:border-primary/40">
            <div className="flex-1 flex items-center">
              <span className="text-white/20 text-sm mr-3 hidden sm:block">Email</span>
              <Input
                data-testid="input-email"
                type="email"
                placeholder="Enter your email"
                className="bg-transparent border-0 h-10 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              data-testid="button-join"
              type="submit"
              className="h-10 px-6 rounded-full bg-primary text-black hover:bg-primary/90 font-semibold text-sm shrink-0"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Join waitlist"}
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-3 mb-16">
          <div className="flex -space-x-2.5">
            {[
              "bg-gradient-to-br from-amber-400 to-orange-500",
              "bg-gradient-to-br from-blue-400 to-indigo-500",
              "bg-gradient-to-br from-emerald-400 to-green-500",
              "bg-gradient-to-br from-pink-400 to-rose-500",
              "bg-gradient-to-br from-violet-400 to-purple-500",
            ].map((bg, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${bg} border-2 border-black flex items-center justify-center text-[10px] font-bold text-white/80`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/40">
            Join <span className="text-white font-semibold">12,171</span>+ others on the waitlist
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/30 text-xs mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
        </div>

        <div className="flex items-center gap-6 md:gap-10">
          {[
            { value: countdown.days, label: "days" },
            { value: countdown.hours, label: "hours" },
            { value: countdown.minutes, label: "minutes" },
            { value: countdown.seconds, label: "seconds" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl md:text-5xl font-bold tabular-nums text-white/90 font-mono">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-white/30 mt-1 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs mt-6 tracking-wider uppercase">left until full release</p>
      </div>
    </div>
  );
}
