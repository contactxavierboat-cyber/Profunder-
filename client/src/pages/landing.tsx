import { Link } from "wouter";
import { ProfundrLogo } from "@/components/profundr-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0f17]/75 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ProfundrLogo className="h-7 w-7" />
            Profundr
          </Link>
          <nav className="flex items-center gap-4 text-sm text-white/80">
            <Link href="/smb" className="hover:text-white">SMBs</Link>
            <Link href="/creators" className="hover:text-white">Creators</Link>
            <a
              href="/subscription"
              className="rounded-lg border border-white/15 px-3 py-2 text-white hover:border-white/25"
            >
              Start
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Funding placement for operators and creators who are ready to scale.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-white/70">
            We don’t send junk to lenders. We qualify you first, then place you into the right funding options.
            If you’re not fundable, we tell you fast.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="https://wa.me/18329746406"
              className="rounded-xl bg-[#4f8cff] px-4 py-3 font-medium text-white hover:opacity-90"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp underwriting now
            </a>
            <a
              href="tel:+18664207393"
              className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
            >
              Call (866) 420-7393
            </a>
            <a
              href="/subscription"
              className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
            >
              Prequalify
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/65">
            {[
              "SMBs",
              "Creators",
              "Agencies",
              "Ecommerce",
              "Home Services",
              "Med Spas",
            ].map((t) => (
              <span key={t} className="rounded-full border border-white/10 px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-10">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">For SMBs</h2>
              <p className="mt-2 text-white/70">
                Working capital for payroll, equipment, marketing, inventory, and cash-flow smoothing.
              </p>
              <Link href="/smb" className="mt-3 inline-block text-[#4f8cff] hover:underline">
                See SMB flow →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">For Creators</h2>
              <p className="mt-2 text-white/70">
                Capital to scale content output, team, ads, and sponsorship/collab momentum.
              </p>
              <Link href="/creators" className="mt-3 inline-block text-[#4f8cff] hover:underline">
                See Creator flow →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="text-xl font-semibold">How it works (simple)</h2>
          <ol className="mt-3 space-y-2 text-white/70">
            <li><b className="text-white">Prequalify</b> (fast filter, no wasted back-and-forth).</li>
            <li><b className="text-white">Underwriting review</b> (is this actually fundable?).</li>
            <li><b className="text-white">Placement</b> (we pursue the right options on your behalf).</li>
            <li><b className="text-white">Close</b> (we earn when funding closes).</li>
          </ol>

          <div className="mt-8 rounded-2xl border border-[#4f8cff]/25 bg-white/5 p-5">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="text-base font-semibold">Talk to underwriting.</div>
                <div className="text-sm text-white/70">Fast answer. If you’re a fit, we move.</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/18329746406"
                  className="rounded-xl bg-[#4f8cff] px-4 py-3 font-medium text-white hover:opacity-90"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <a
                  href="tel:+18664207393"
                  className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                >
                  Call
                </a>
                <a
                  href="mailto:underwriting@profundr.com"
                  className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0b0f17]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-5 py-10 text-sm text-white/70">
          <div>
            <div className="font-semibold text-white">Profundr Underwriting Team</div>
            <div>Call anytime: (866) 420-7393</div>
            <div>Email: underwriting@profundr.com</div>
            <div>WhatsApp: +1 832 974 6406</div>
            <div>IG: @profundrapp</div>
            <div className="mt-2 text-white/50">700 Smith St, Houston, TX 77002</div>
          </div>
          <div className="max-w-xl text-white/50">
            If this isn’t a fit, reply “stop” and we’ll make sure you don’t hear from us again.
          </div>
        </div>
      </footer>
    </div>
  );
}
