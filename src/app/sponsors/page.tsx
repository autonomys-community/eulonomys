import { prisma } from "@/lib/prisma";
import { SponsorContribute } from "@/components/SponsorContribute";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sponsors — Eulonomys",
  description:
    "Community sponsors help others preserve memories of their loved ones on the Autonomys Network.",
};

export default async function SponsorsPage() {
  // Aggregate escrow balance
  const contributions = await prisma.escrowContribution.findMany({
    select: { ai3Amount: true, displayName: true, walletAddress: true },
    orderBy: { createdAt: "desc" },
  });

  const drawdowns = await prisma.escrowDrawdown.findMany({
    select: { ai3Equivalent: true },
  });

  const totalContributed = contributions.reduce(
    (sum, c) => sum + parseFloat(c.ai3Amount),
    0
  );
  const totalDrawn = drawdowns.reduce(
    (sum, d) => sum + parseFloat(d.ai3Equivalent),
    0
  );
  const balance = Math.max(0, totalContributed - totalDrawn);

  // Aggregate contributors by wallet, showing display name
  const contributorMap = new Map<
    string,
    { displayName: string; total: number }
  >();
  for (const c of contributions) {
    const key = c.walletAddress;
    const existing = contributorMap.get(key);
    if (existing) {
      existing.total += parseFloat(c.ai3Amount);
    } else {
      contributorMap.set(key, {
        displayName: c.displayName || `${key.slice(0, 6)}...${key.slice(-4)}`,
        total: parseFloat(c.ai3Amount),
      });
    }
  }
  const contributors = Array.from(contributorMap.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Community Fund</h1>
      <p className="mt-2 text-sm text-muted">
        Sponsors contribute AI3 tokens to help others store eulogies
        permanently on the Autonomys Network when they cannot afford the storage
        cost themselves.
      </p>

      {/* Balance */}
      <div className="mt-8 rounded-lg border border-border bg-stone-100/50 p-6 text-center">
        <p className="text-sm text-muted">Current Fund Balance</p>
        <p className="mt-1 text-3xl font-bold text-foreground">
          {balance.toFixed(4)} AI3
        </p>
        <p className="mt-1 text-sm text-muted">
          {totalContributed.toFixed(4)} AI3 contributed total
        </p>
      </div>

      {/* Contribute */}
      <div className="mt-8">
        <SponsorContribute />
      </div>

      {/* Contributors */}
      {contributors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Contributors
          </h2>
          <div className="mt-4 space-y-2">
            {contributors.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <span className="text-sm text-foreground">
                  {c.displayName}
                </span>
                <span className="text-sm font-medium text-muted">
                  {c.total.toFixed(4)} AI3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
