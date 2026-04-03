import { useLocation } from "wouter";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/")} className="text-[20px] font-[800] tracking-[-0.03em] text-white" data-testid="privacy-logo">
          Profundr
        </button>
        <button onClick={() => setLocation("/")} className="text-[13px] text-white/50 hover:text-white transition-colors" data-testid="privacy-back">
          ← Back to Home
        </button>
      </nav>

      <div className="max-w-[720px] mx-auto px-6 py-16">
        <h1 className="text-[36px] font-[800] tracking-[-0.025em] text-white mb-2" data-testid="privacy-heading">
          Privacy Notice
        </h1>
        <p className="text-[14px] text-white/40 mb-12">Effective Date: April 3, 2026</p>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">1. Overview</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-4">
            Profundr ("we," "our," "us") is a capital intelligence platform designed to analyze financial profiles and determine funding eligibility before application.
          </p>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-4">
            This Privacy Notice explains how we collect, use, and protect your information when you use Profundr.
          </p>
          <p className="text-[15px] text-white/90 font-medium italic">
            Core principle: We analyze profiles — not exploit data.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">2. Information We Collect</h2>

          <h3 className="text-[16px] font-[600] text-white/90 mb-3">A. Information You Provide</h3>
          <ul className="list-disc pl-6 mb-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Name, email, phone number</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Business details (if applicable)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Uploaded documents (ID, proof of address, financial docs)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Messages, inquiries, and support interactions</li>
          </ul>

          <h3 className="text-[16px] font-[600] text-white/90 mb-3">B. Financial & Credit Data</h3>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">With your authorization, we may collect:</p>
          <ul className="list-disc pl-6 mb-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Credit report data (from credit bureaus)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Account balances and transaction history</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Credit utilization, inquiries, and account structure</li>
          </ul>

          <h3 className="text-[16px] font-[600] text-white/90 mb-3">C. Automated Data</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Device information (IP address, browser type)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Usage behavior (pages visited, actions taken)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Cookies and tracking technologies</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">3. How We Use Your Information</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">We use your data to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Generate your Approval Intelligence Score (AIS)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Simulate lender decision outcomes</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Identify risk factors and funding opportunities</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Build personalized funding strategies</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide dispute and repair documentation (if applicable)</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Improve system accuracy and underwriting models</li>
          </ul>
          <p className="text-[15px] text-white/90 font-semibold">We do not sell your personal data.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">4. How We Share Information</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">We may share your data only when necessary:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]"><span className="text-white/90 font-medium">With service providers</span> — secure infrastructure, analytics, data processing</li>
            <li className="text-[15px] text-white/70 leading-[1.8]"><span className="text-white/90 font-medium">With financial data partners</span> — only with your consent</li>
            <li className="text-[15px] text-white/70 leading-[1.8]"><span className="text-white/90 font-medium">For legal compliance</span> — court orders, regulatory requirements</li>
          </ul>
          <p className="text-[15px] text-white/90 font-semibold">We do not sell or rent your data to third parties.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">5. Data Security</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">We implement industry-standard safeguards, including:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Encryption of sensitive data</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Secure cloud infrastructure</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Access controls and authentication layers</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">No system is 100% secure — but we operate to bank-level standards.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">6. Your Rights</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Access your data</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Request corrections</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Request deletion of your data</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Withdraw consent at any time</li>
          </ul>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            To exercise these rights, contact us at{" "}
            <a href="mailto:Support@profundr.com" className="text-white underline hover:text-white/80 transition-colors">Support@profundr.com</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">7. Data Retention</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-3">We retain your information only as long as necessary to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li className="text-[15px] text-white/70 leading-[1.8]">Provide services</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Comply with legal obligations</li>
            <li className="text-[15px] text-white/70 leading-[1.8]">Maintain system integrity</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">8. Third-Party Services</h2>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            Profundr may integrate with third-party providers (e.g., credit data sources). Their use of your data is governed by their own privacy policies.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">9. Updates to This Notice</h2>
          <p className="text-[15px] text-white/70 leading-[1.8]">
            We may update this Privacy Notice periodically. Changes will be posted with a revised "Effective Date."
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-white mb-4">10. Contact</h2>
          <p className="text-[15px] text-white/70 leading-[1.8] mb-1">
            For questions or concerns:
          </p>
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
            "Banks approve profiles, not people. Profundr shows you where you stand — before you apply."
          </p>
        </div>
      </div>
    </div>
  );
}
