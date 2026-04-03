import { useLocation } from "wouter";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/")} className="text-[20px] font-[800] tracking-[-0.03em] text-white" data-testid="terms-logo">
          Profundr
        </button>
        <button onClick={() => setLocation("/")} className="text-[13px] text-white/50 hover:text-white transition-colors" data-testid="terms-back">
          ← Back to Home
        </button>
      </nav>

      <div className="max-w-[720px] mx-auto px-6 py-16">
        <h1 className="text-[36px] font-[800] tracking-[-0.025em] text-white mb-2" data-testid="terms-heading">
          Terms of Service
        </h1>
        <p className="text-[14px] text-white/40 mb-12">Effective Date: April 3, 2026</p>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">1. Acceptance of Terms</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">
            By accessing or using Profundr ("Platform," "we," "our," "us"), you agree to be bound by these Terms of Service.
          </p>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            If you do not agree, do not use the Platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">2. What Profundr Is (and Is Not)</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-4">
            Profundr is a capital intelligence and underwriting simulation platform.
          </p>
          <p className="text-[15px] text-white/90 font-medium mb-3">We:</p>
          <ul className="list-disc pl-6 mb-5 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Analyze financial and credit data</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide funding readiness insights</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Generate strategic recommendations</li>
          </ul>
          <p className="text-[15px] text-white/90 font-medium mb-3">We do not:</p>
          <ul className="list-disc pl-6 mb-5 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Guarantee funding or approvals</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Act as a lender, broker, or financial institution</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide legal or financial advice</li>
          </ul>
          <p className="text-[15px] text-white/90 font-medium italic">
            Banks approve profiles — Profundr helps you understand yours.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">3. Eligibility</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">You must:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Be at least 18 years old</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide accurate and truthful information</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Use the Platform for lawful purposes only</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">4. User Responsibilities</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">You agree to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide accurate, complete information</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Maintain confidentiality of your account</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Not misuse or attempt to exploit the Platform</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Not upload fraudulent or misleading documents</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            You are solely responsible for decisions made based on insights provided.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">5. Data Authorization</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">By using Profundr, you authorize us to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Access and analyze your financial and credit data (with consent)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Process uploaded documents</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Generate underwriting insights and funding simulations</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            You retain ownership of your data. We use it only to operate and improve the Platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">6. No Guarantee of Results</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">Profundr does not guarantee:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Credit approvals</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Funding amounts</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Financial outcomes</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            All outputs are analytical models and simulations, not commitments from lenders.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">7. Repair Center & Dispute Tools (FCRA Context)</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">If you use Profundr's Repair Center:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">You are responsible for reviewing all generated disputes before submission</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Profundr provides tools and templates, not legal representation</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">We do not guarantee removal of items or specific outcomes</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            You acknowledge that disputes are governed by laws including the Fair Credit Reporting Act (FCRA).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">8. Subscription & Payments</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">If applicable:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Access to certain features requires a paid subscription</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Billing terms will be disclosed at purchase</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Subscriptions may renew automatically unless canceled</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            No refunds unless required by law or explicitly stated.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">9. Intellectual Property</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">
            All content, systems, and models on Profundr are owned by us, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Scoring frameworks (e.g., AIS, Capital Readiness Score)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Platform design and logic</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Branding and materials</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            You may not copy, reverse-engineer, or redistribute any part of the Platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">10. Prohibited Use</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">You may not:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Attempt to manipulate underwriting outputs</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Reverse-engineer scoring systems</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Use the Platform for fraud or unlawful activity</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Interfere with system integrity or security</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">11. Limitation of Liability</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">
            To the maximum extent permitted by law, Profundr is not liable for:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Denied applications</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Financial losses</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Decisions made based on Platform insights</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            The Platform is provided "as is" without warranties of any kind.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">12. Indemnification</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">You agree to indemnify and hold Profundr harmless from:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Claims arising from your misuse of the Platform</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Violations of these Terms</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Submission of false or fraudulent information</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">13. Termination</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">We may suspend or terminate access if you:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Violate these Terms</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Misuse the Platform</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Engage in fraudulent behavior</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            You may stop using the Platform at any time.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">14. Governing Law</h2>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            These Terms are governed by the laws of the State of Texas, without regard to conflict of law principles.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">15. Changes to Terms</h2>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            We may update these Terms at any time. Continued use of Profundr constitutes acceptance of updated Terms.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">16. Contact</h2>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            <span className="text-white/90 font-medium">Email:</span>{" "}
            <a href="mailto:Support@profundr.com" className="text-white underline hover:text-white/80 transition-colors">Support@profundr.com</a>
          </p>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            <span className="text-white/90 font-medium">Company:</span> Profundr
          </p>
        </section>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-[13px] text-white/30 italic">
            "Stop guessing. Start qualifying."
          </p>
        </div>
      </div>
    </div>
  );
}
