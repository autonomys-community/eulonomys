import { prisma } from "@/lib/prisma";
import type { EscrowContributor, EscrowBalance } from "@/types/eulogy";

export interface EscrowService {
  recordContribution(
    walletAddress: string,
    ai3Amount: string,
    txHash: string,
    displayName?: string
  ): Promise<{ contributionId: string }>;
  requestFunding(
    creditAmount: number,
    ai3Equivalent: string,
    eulogyId: string
  ): Promise<{ funded: boolean; contributorNames: string[] }>;
  getBalance(): Promise<EscrowBalance>;
  getContributors(): Promise<EscrowContributor[]>;
}

/**
 * Server-managed escrow backed by PostgreSQL.
 * Contributions are recorded after on-chain tx confirmation.
 * Drawdowns happen when a user chooses "fund from community pool"
 * at upload time.
 */
export class ServerManagedEscrowService implements EscrowService {
  async recordContribution(
    walletAddress: string,
    ai3Amount: string,
    txHash: string,
    displayName?: string
  ): Promise<{ contributionId: string }> {
    const contribution = await prisma.escrowContribution.create({
      data: {
        walletAddress,
        ai3Amount,
        txHash,
        displayName,
      },
    });
    return { contributionId: contribution.id };
  }

  async requestFunding(
    creditAmount: number,
    ai3Equivalent: string,
    eulogyId: string
  ): Promise<{ funded: boolean; contributorNames: string[] }> {
    const balance = await this.getBalance();
    const available = parseFloat(balance.totalAi3);
    const needed = parseFloat(ai3Equivalent);

    if (available < needed) {
      return { funded: false, contributorNames: [] };
    }

    // Record the drawdown
    await prisma.escrowDrawdown.create({
      data: {
        eulogyId,
        creditAmount,
        ai3Equivalent,
      },
    });

    // Get contributor names for attribution
    const contributions = await prisma.escrowContribution.findMany({
      where: { displayName: { not: null } },
      select: { displayName: true },
      distinct: ["displayName"],
      take: 10,
    });

    return {
      funded: true,
      contributorNames: contributions
        .map((c) => c.displayName)
        .filter(Boolean) as string[],
    };
  }

  async getBalance(): Promise<EscrowBalance> {
    const contributions = await prisma.escrowContribution.findMany({
      select: { ai3Amount: true },
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

    return {
      totalAi3: balance.toFixed(6),
      totalCreditsAvailable: Math.floor(balance * 1e18), // approximate
    };
  }

  async getContributors(): Promise<EscrowContributor[]> {
    const contributions = await prisma.escrowContribution.findMany({
      select: { walletAddress: true, ai3Amount: true, displayName: true },
    });

    const map = new Map<
      string,
      { displayName: string; totalAi3: number }
    >();

    for (const c of contributions) {
      const key = c.walletAddress;
      const existing = map.get(key);
      if (existing) {
        existing.totalAi3 += parseFloat(c.ai3Amount);
      } else {
        map.set(key, {
          displayName:
            c.displayName || `${key.slice(0, 6)}...${key.slice(-4)}`,
          totalAi3: parseFloat(c.ai3Amount),
        });
      }
    }

    return Array.from(map.values())
      .map((v) => ({
        displayName: v.displayName,
        totalAi3: v.totalAi3.toFixed(6),
      }))
      .sort((a, b) => parseFloat(b.totalAi3) - parseFloat(a.totalAi3));
  }
}

export const escrowService: EscrowService = new ServerManagedEscrowService();
