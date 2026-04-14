export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <div className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="text-3xl font-semibold">Creator funding</h1>
        <p className="mt-4 text-white/70">
          If you’re scaling a paid offer, sponsorships/collabs, or production output, capital is often the bottleneck.
          Prequalify first. If you qualify, we pursue funding options on your behalf.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">Use cases</div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-white/70">
              <li>Editors, designers, production</li>
              <li>Ad spend and distribution</li>
              <li>Equipment and tools</li>
              <li>Hiring and runway</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-semibold">Get started</div>
            <p className="mt-3 text-white/70">
              Start prequalification, or text/WhatsApp us and we’ll tell you straight what’s realistic.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="rounded-xl bg-[#4f8cff] px-4 py-3 font-medium text-white hover:opacity-90" href="/subscription">
                Start prequalification
              </a>
              <a
                className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                href="https://wa.me/18329746406"
                target="_blank"
                rel="noreferrer"
              >
                Text/WhatsApp
              </a>
              <a
                className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white hover:border-white/25"
                href="mailto:underwriting@profundr.com"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

