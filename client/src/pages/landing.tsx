import { useState } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Plus, Minus } from "lucide-react";

const faqItems = [
  {
    q: "What is Start-Up Studio?",
    a: "Start-Up Studio® is a digital underwriting engine that evaluates your credit profile and determines your fundability using a proprietary 3-phase system: Structure, Scale, and Sequence."
  },
  {
    q: "What's included in my membership?",
    a: "Your membership includes 30 AI-powered fundability analyses per month, bank-level underwriting logic, document verification & storage, and priority support."
  },
  {
    q: "How does the fundability analysis work?",
    a: "Upload your credit profile data and financial documents. Our AI engine analyzes your information using real bank-level underwriting logic to generate a Fundability Index Score from 0-100."
  },
  {
    q: "Is there support available?",
    a: "Yes, all members have access to priority support. Reach out anytime via the in-app chat or contact our support team directly."
  },
  {
    q: "How much will this cost?",
    a: "Start-Up Studio® is available for $97/month, giving you full access to all features including AI-powered analyses, document verification, and more."
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { login } = useAuth();

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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">

      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.04]" viewBox="0 0 1000 800">
            <path d="M 100 200 Q 400 100 700 300 T 900 500" fill="none" stroke="white" strokeWidth="1" />
            <path d="M 0 400 Q 300 300 600 500 T 1000 300" fill="none" stroke="white" strokeWidth="1" />
            <path d="M 200 0 Q 500 200 800 100 T 1000 400" fill="none" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-24">

          <img
            src="/logo.png"
            alt="X+ Logo"
            className="w-16 h-16 rounded-xl mb-8"
          />

          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs tracking-[0.15em] text-primary font-medium mb-12">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            NOW AVAILABLE
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center mb-5 leading-[1.1]">
            "Digital Underwriting Engine"
          </h1>

          <p className="text-center text-white/50 text-sm sm:text-base leading-relaxed max-w-md mb-10">
            Upload your <span className="text-white font-semibold">credit profile</span> and receive a verified Fundability Score calculated using real bank-level underwriting logic.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-md mb-8">
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-full p-1.5 pl-6 hover:border-white/20 transition-colors focus-within:border-primary/30">
              <Input
                data-testid="input-email"
                type="email"
                placeholder="Email"
                className="bg-transparent border-0 h-10 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <Button
                data-testid="button-join"
                type="submit"
                className="h-10 px-6 rounded-full bg-primary text-black hover:bg-primary/90 font-bold text-sm shrink-0"
                disabled={isLoading}
              >
                {isLoading ? "..." : "Join Now"}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-3 mb-16">
            <div className="flex -space-x-2">
              {[
                "bg-gradient-to-br from-amber-300 to-orange-500",
                "bg-gradient-to-br from-sky-300 to-blue-500",
                "bg-gradient-to-br from-emerald-300 to-green-600",
                "bg-gradient-to-br from-pink-300 to-rose-500",
                "bg-gradient-to-br from-violet-300 to-purple-500",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${bg} border-2 border-[#0A0A0A]`}
                />
              ))}
            </div>
            <p className="text-sm text-white/40">
              Join 12,500+ founders already scaling with AI +
            </p>
          </div>

          <p className="text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-white/80 mb-4">
            OFFICIALLY LAUNCHED
          </p>

          <div className="flex items-center gap-2 text-white/40 text-xs tracking-[0.15em] uppercase">
            <CalendarDays className="w-3.5 h-3.5" />
            LEFT UNTIL FULL RELEASE
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] px-6 py-24">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">Frequently asked questions</h2>
          <p className="text-center text-white/40 text-sm mb-12 max-w-md mx-auto">
            Everything you need to know about Start-Up Studio. Find answers to the most common questions below.
          </p>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden transition-colors hover:border-white/15"
              >
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-white/90">{item.q}</span>
                  {openFaq === i ? (
                    <Minus className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                  ) : (
                    <Plus className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-white/40 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <p className="text-xs text-white/20">
          &copy; 2026 Start-Up Studio® by <span className="text-white/40 font-semibold">CMD Supply</span>
        </p>
      </footer>
    </div>
  );
}
