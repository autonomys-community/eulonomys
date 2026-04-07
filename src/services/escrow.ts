import type { EscrowContributor, EscrowBalance } from "@/types/eulogy";

export interface EscrowService {
  contribute(
    walletAddress: string,
    ai3Amount: string,
    displayName?: string
  ): Promise<{ contributionId: string }>;
  requestFunding(
    userId: string,
    creditAmount: number
  ): Promise<{ funded: boolean; contributorNames: string[] }>;
  getBalance(): Promise<EscrowBalance>;
  getContributors(): Promise<EscrowContributor[]>;
}

/**
 * Server-managed escrow stub.
 * Tracks contributions in PostgreSQL with transparent on-chain receipts.
 * Will be replaced with a smart contract integration if a suitable
 * audited contract is found for Autonomys EVM.
 */
export class ServerManagedEscrowService implements EscrowService {
  async contribute(
    walletAddress: string,
    ai3Amount: string,
    displayName?: string
  ): Promise<{ contributionId: string }> {
    // TODO: Record contribution in DB after on-chain tx confirmation
    return { contributionId: `escrow_${Date.now()}` };
  }

  async requestFunding(
    userId: string,
    creditAmount: number
  ): Promise<{ funded: boolean; contributorNames: string[] }> {
    // TODO: Check escrow balance, deduct if sufficient
    return { funded: false, contributorNames: [] };
  }

  async getBalance(): Promise<EscrowBalance> {
    // TODO: Query DB for aggregated balance
    return { totalAi3: "0", totalCreditsAvailable: 0 };
  }

  async getContributors(): Promise<EscrowContributor[]> {
    // TODO: Query DB for contributor list
    return [];
  }
}

export const escrowService: EscrowService = new ServerManagedEscrowService();
