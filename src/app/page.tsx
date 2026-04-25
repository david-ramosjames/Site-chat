import Link from "next/link";

const industries = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electricians",
  "Restoration",
  "Pest control",
  "General contractors",
];

const platforms = ["WordPress", "Webflow", "Squarespace", "Shopify", "Custom sites"];

export default function MarketingPage() {
  return (
    <main className="bg-white text-ink-900">
      <header className="border-b border-ink-300/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              CC
            </span>
            <span>ChatToConvert</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <a href="#how-it-works" className="text-ink-700 hover:text-ink-900">
              How it works
            </a>
            <a href="#industries" className="text-ink-700 hover:text-ink-900">
              Industries
            </a>
            <Link href="/admin" className="btn-primary">
              Open admin
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24 md:pb-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Built for home services & high-value service businesses
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Turn website visitors into <span className="text-brand-600">booked jobs</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-700">
              ChatToConvert is a simple chat widget that asks the right questions, qualifies the
              lead, and sends it to your phone or inbox. One script tag. No integrations required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admin" className="btn-primary">
                See the demo dashboard
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                How it works
              </a>
            </div>
            <p className="mt-6 text-sm text-ink-500">
              Closing <span className="font-semibold text-ink-700">one more job per month</span>{" "}
              usually pays for ChatToConvert many times over.
            </p>
          </div>

          <div className="relative">
            <div className="card p-5">
              <div className="flex items-center gap-2 border-b border-ink-300/60 pb-3">
                <div className="h-8 w-8 rounded-full bg-brand-500 text-center text-sm font-semibold leading-8 text-white">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">Austin HVAC Pros</p>
                  <p className="text-xs text-ink-500">Usually replies in a few minutes</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-100 px-4 py-2 text-ink-900">
                  Need help with your AC or heating? We answer fast.
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2 text-white">
                  AC repair
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-100 px-4 py-2">
                  Is this urgent?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2 text-white">
                  Yes, today
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-100 px-4 py-2">
                  What ZIP code is the service location?
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 rotate-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-card">
              New lead → SMS
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-ink-300/60 bg-ink-100/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Paste one script tag",
                body: "Drop ChatToConvert into your site header/footer. No plugins. No code changes beyond one line.",
              },
              {
                n: "2",
                title: "Guided intake, not a dead form",
                body: "The widget walks the visitor through a few qualifying questions — service, urgency, ZIP, contact.",
              },
              {
                n: "3",
                title: "Leads hit your phone & inbox",
                body: "Email, SMS, Slack, CRM webhook or Google Sheet. You pick. The lead arrives with all the context.",
              },
            ].map((s) => (
              <div key={s.n} className="card p-6">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-700">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Built for the trades</h2>
            <p className="mt-3 text-ink-700">
              If your average job is worth hundreds or thousands of dollars, you can&apos;t afford
              to miss a lead at 9pm. ChatToConvert captures every visitor, 24/7.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {industries.map((i) => (
                <li key={i} className="pill">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Works everywhere</h2>
            <p className="mt-3 text-ink-700">
              Any site that lets you paste a script tag works — no platform lock-in.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <li key={p} className="pill">
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 card p-4 font-mono text-xs text-ink-700">
              &lt;script src=&quot;https://chatto-convert.com/widget.js&quot; data-client-id=&quot;YOUR_ID&quot;
              async&gt;&lt;/script&gt;
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Try the live demo on the admin dashboard
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Open the admin to configure the widget for &quot;Austin HVAC Pros,&quot; copy your
            install script, and preview the widget.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-ink-100"
          >
            Open admin dashboard
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-300/60 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-ink-500 md:flex-row">
          <p>© {new Date().getFullYear()} ChatToConvert</p>
          <p>Made for home services & high-value service businesses.</p>
        </div>
      </footer>
    </main>
  );
}
