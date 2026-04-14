export default function SMBPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <div className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="text-3xl font-semibold">SMB funding placement</h1>
        <p className="mt-4 text-white/70">
          If you’re operating a real business and trying to scale, we’ll tell you whether you’re fundable and place you into
          the right funding options.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">Best fit</div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-white/70">
              <li>Home services (roofing, HVAC, plumbing)</li>
              <li>Agencies and service businesses</li>
              <li>Med spas and local operators</li>
              <li>Ecommerce with consistent volume</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">Get started</div>
            <p className="mt-3 text-white/70">Fastest path is WhatsApp. If you’re a fit, we move.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className="rounded-xl bg-[#4f8cff] px-4 py-3 font-medium text-white hover:opacity-90"
                href="https://wa.me/18329746406"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp underwriting now
              </a>
              <a
                className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                href="tel:+18664207393"
              >
                Call (866) 420-7393
              </a>
              <a
                className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                href="/subscription"
              >
                Prequalify
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
