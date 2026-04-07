import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Preserve their memory,
        <br />
        <span className="text-muted">forever.</span>
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Eulonomys lets you create permanent eulogies stored on the Autonomys
        Network. Once written, they can never be lost, altered, or censored.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/create"
          className="rounded-md bg-stone-800 px-6 py-3 text-base font-medium text-stone-50 hover:bg-stone-700 transition-colors"
        >
          Write a Eulogy
        </Link>
        <Link
          href="/browse"
          className="rounded-md border border-border px-6 py-3 text-base font-medium text-foreground hover:bg-stone-100 transition-colors"
        >
          Browse Eulogies
        </Link>
      </div>

      <div className="mt-20 grid gap-8 text-left sm:grid-cols-3">
        <div>
          <h3 className="font-semibold text-foreground">Permanent</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Stored on the Autonomys Distributed Storage Network. No server to
            shut down, no company to go bankrupt. The words endure.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Verifiable</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Every eulogy is content-addressed. Anyone can verify that what they
            read is exactly what was written — unchanged, uncensored.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Accessible</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Pay with AI3 tokens from your own wallet, or let a community sponsor
            cover the cost. Preserving memory should be within reach for everyone.
          </p>
        </div>
      </div>

      <div className="mt-16 rounded-lg border border-border bg-stone-100/50 px-6 py-5">
        <h3 className="text-sm font-semibold text-foreground">
          Powered by Pay with AI3
        </h3>
        <p className="mt-2 text-sm text-muted">
          Eulonomys uses the AI3 token for permanent storage on the Autonomys
          Network. Each eulogy is an on-chain transaction — your words become
          part of an immutable record that exists as long as the network does.
        </p>
      </div>
    </div>
  );
}
