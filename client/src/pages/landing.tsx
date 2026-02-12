import { useState } from "react";
import { useAuth } from "@/lib/store";
import { CalendarDays } from "lucide-react";

const faqItems = [
  {
    q: "What is MentXr?",
    a: "MentXr® is a digital underwriting engine that evaluates your credit profile and determines your fundability using a proprietary 3-phase system: Structure, Scale, and Sequence."
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
    a: "MentXr® is available for $50/month, giving you full access to all features including AI-powered analyses, document verification, and more."
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-20">

          <img
            src="/logo.png"
            alt="X+"
            className="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] rounded-[14px] sm:rounded-[16px] mb-6 sm:mb-8"
          />

          <div className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-[#333] bg-[#181818] mb-8 sm:mb-12">
            <span className="w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] rounded-full bg-[#888] animate-ping"></span>
            <span className="text-[11px] sm:text-[13px] font-semibold tracking-[0.12em] text-white/90 uppercase">NOW AVAILABLE</span>
          </div>

          <h1 className="text-[28px] sm:text-[36px] md:text-[46px] font-normal tracking-[-0.03em] text-center leading-[1.05] mb-4 sm:mb-6 text-[#e0e0e0] px-2">
            Mentorship, On Demand
          </h1>

          <p className="text-center text-[#777] text-[14px] sm:text-[16px] leading-[1.7] sm:leading-[1.8] max-w-[520px] mb-8 sm:mb-12 px-4 sm:px-2">
            Engage with AI versions of influential mentors and gain their perspective in real time. Guidance, whenever you need it.
          </p>

          <form onSubmit={handleLogin} className="w-full max-w-[420px] mb-8 sm:mb-10 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl sm:rounded-full sm:h-[52px] sm:pl-5 sm:pr-1.5 overflow-hidden">
              <input
                data-testid="input-email"
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#555] outline-none px-4 py-3.5 sm:px-0 sm:py-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                data-testid="button-join"
                type="submit"
                disabled={isLoading}
                className="h-[44px] sm:h-[40px] px-5 sm:rounded-full bg-[#E0E0E0] text-black text-[14px] font-bold hover:bg-white transition-colors shrink-0 border-t border-[#2A2A2A] sm:border-t-0 sm:mx-0 mx-1.5 mb-1.5 sm:mb-0 rounded-xl sm:rounded-full"
              >
                {isLoading ? "..." : "Subscribe Now"}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-10 sm:mb-14">
            <div className="flex -space-x-3 sm:-space-x-4">
              {["/avatars/face1.jpg", "/avatars/face2.jpg", "/avatars/face3.jpg", "/avatars/face4.jpg", "/avatars/face5.jpg"].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full border-[2px] border-[#0D0D0D] object-cover"
                />
              ))}
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#777] text-center">
              Join 12,500+ founders already scaling with AI +
            </p>
          </div>

          <p className="text-center text-[#777] text-[13px] sm:text-[14px] leading-[1.7] max-w-[460px] mb-3 sm:mb-4 px-4 sm:px-2">
            We are an AI-powered mentorship platform that lets users converse with digital versions of the mentors they admire, delivering trusted guidance anytime, anywhere.
          </p>

          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-[#666] tracking-[0.15em] uppercase">
            <CalendarDays className="w-[13px] h-[13px] sm:w-[14px] sm:h-[14px]" />
            LEFT UNTIL FULL RELEASE
          </div>
        </div>
      </div>

      <div className="relative h-24 sm:h-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" style={{ maskImage: "linear-gradient(to bottom, white 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, white 0%, transparent 100%)" }}></div>
      </div>

      <div className="px-4 sm:px-6 pb-16 sm:pb-24 pt-8 sm:pt-12">
        <div className="max-w-[560px] mx-auto">
          <h2 className="text-[26px] sm:text-[32px] md:text-[36px] font-normal text-center mb-3 tracking-[-0.03em] text-[#e0e0e0]">Frequently asked questions</h2>
          <p className="text-center text-[#666] text-[13px] sm:text-[14px] mb-8 sm:mb-12 max-w-[420px] mx-auto leading-[1.6]">
            Everything you need to know about MentXr. Find answers to the most common questions below.
          </p>

          <div className="space-y-2 sm:space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-[#1F1F1F] rounded-xl bg-[#111] overflow-hidden"
              >
                <button
                  data-testid={`button-faq-${i}`}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[13px] sm:text-[14px] font-medium text-white/80">{item.q}</span>
                  <span className="text-[18px] text-white/30 shrink-0 ml-3 sm:ml-4 leading-none">
                    {openFaq === i ? "\u2212" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-3.5 sm:pb-4">
                    <p className="text-[12px] sm:text-[13px] text-[#666] leading-[1.7]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#1A1A1A] px-4 sm:px-6 py-6 sm:py-8 text-center">
        <p className="text-[11px] sm:text-[12px] text-[#444]">
          &copy; 2026 MentXr&reg; by <span className="text-[#666] font-semibold">CMD Supply</span>
        </p>
      </footer>
    </div>
  );
}
