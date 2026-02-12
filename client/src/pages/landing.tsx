import { useState } from "react";
import { useAuth } from "@/lib/store";
import { CalendarDays } from "lucide-react";

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
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      <div className="relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1200 800" fill="none">
          <path d="M0 400 Q300 200 600 400 T1200 400" stroke="white" strokeWidth="1" />
          <path d="M0 500 Q400 300 800 500 T1200 300" stroke="white" strokeWidth="1" />
          <path d="M200 0 Q500 300 800 100 T1200 500" stroke="white" strokeWidth="1" />
        </svg>

        <div className="relative z-10 flex flex-col items-center px-6 pt-20 pb-20">

          <img
            src="/logo.png"
            alt="X+"
            className="w-[64px] h-[64px] rounded-[16px] mb-8"
          />

          <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#333] bg-[#181818] mb-12">
            <span className="w-[8px] h-[8px] rounded-full bg-[#888]"></span>
            <span className="text-[13px] font-semibold tracking-[0.12em] text-white/90 uppercase">NOW AVAILABLE</span>
          </div>

          <h1 className="text-[48px] md:text-[64px] font-normal tracking-[-0.03em] text-center leading-[1.05] mb-6 text-[#e0e0e0]">
            "Digital Underwriting Engine"
          </h1>

          <p className="text-center text-[#777] text-[16px] leading-[1.8] max-w-[460px] mb-12">
            Upload your <span className="text-white font-semibold">credit profile</span> and receive a verified Fundability
            {"\n"}Score calculated using real bank-level underwriting logic.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-[420px] mb-10">
            <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-full h-[52px] pl-5 pr-1.5">
              <input
                data-testid="input-email"
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#555] outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[40px] px-5 rounded-full bg-[#E0E0E0] text-black text-[14px] font-bold hover:bg-white transition-colors shrink-0"
              >
                {isLoading ? "..." : "Join Now"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 mb-14">
            <div className="flex -space-x-2">
              {["/avatars/face1.jpg", "/avatars/face2.jpg", "/avatars/face3.jpg", "/avatars/face4.jpg", "/avatars/face5.jpg"].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-[32px] h-[32px] rounded-full border-[2px] border-[#0D0D0D] object-cover"
                />
              ))}
            </div>
            <p className="text-[13px] text-[#777]">
              Join 12,500+ founders already scaling with AI +
            </p>
          </div>

          <p className="text-[14px] font-bold tracking-[0.2em] uppercase text-white/80 mb-4">
            OFFICIALLY LAUNCHED
          </p>

          <div className="flex items-center gap-2 text-[12px] text-[#666] tracking-[0.15em] uppercase">
            <CalendarDays className="w-[14px] h-[14px]" />
            LEFT UNTIL FULL RELEASE
          </div>
        </div>
      </div>

      <div className="px-6 py-24">
        <div className="max-w-[560px] mx-auto">
          <h2 className="text-[32px] md:text-[36px] font-bold text-center mb-3 tracking-[-0.01em]">Frequently asked questions</h2>
          <p className="text-center text-[#666] text-[14px] mb-12 max-w-[420px] mx-auto leading-[1.6]">
            Everything you need to know about Start-Up Studio. Find answers to the most common questions below.
          </p>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-[#1F1F1F] rounded-xl bg-[#111] overflow-hidden"
              >
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] font-medium text-white/80">{item.q}</span>
                  <span className="text-[18px] text-white/30 shrink-0 ml-4 leading-none">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[13px] text-[#666] leading-[1.7]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#1A1A1A] px-6 py-8 text-center">
        <p className="text-[12px] text-[#444]">
          &copy; 2026 Start-Up Studio® by <span className="text-[#666] font-semibold">CMD Supply</span>
        </p>
      </footer>
    </div>
  );
}
