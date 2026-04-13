import { prisma } from "@/lib/prisma";
import { SponsorContribute } from "@/components/SponsorContribute";
import { AnimatedBalance } from "@/components/AnimatedBalance";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sponsors — Eulonomys",
  description:
    "Community sponsors help others preserve memories of their loved ones on the Autonomys Network.",
};

export default async function SponsorsPage() {
  // Aggregate escrow balance
  const contributions = await prisma.escrowContribution.findMany({
    select: {
      ai3Amount: true,
      displayName: true,
      walletAddress: true,
      txHash: true,
      createdAt: true,
    },
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

  const explorerUrl =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
    "https://explorer.auto-evm.mainnet.autonomys.xyz";

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
          <AnimatedBalance value={balance} />
        </p>
        <p className="mt-1 text-sm text-muted">
          <AnimatedBalance
            value={totalContributed}
            suffix=" AI3 contributed total"
          />
        </p>
      </div>

      {/* Contribute */}
      <div className="mt-8">
        <SponsorContribute />
      </div>

      {/* Contributions */}
      {contributions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Contributions
          </h2>
          <div className="mt-4 space-y-2">
            {contributions.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm text-foreground">
                    {c.displayName ||
                      `${c.walletAddress.slice(0, 6)}...${c.walletAddress.slice(-4)}`}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <time dateTime={c.createdAt.toISOString()}>
                      {c.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {c.txHash && (
                      <a
                        href={`${explorerUrl}/tx/${c.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono underline hover:text-foreground transition-colors"
                      >
                        {c.txHash.slice(0, 10)}...{c.txHash.slice(-6)}
                      </a>
                    )}
                  </div>
                </div>
                <span className="ml-4 shrink-0 text-sm font-medium text-muted">
                  {parseFloat(c.ai3Amount).toFixed(4)} AI3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
