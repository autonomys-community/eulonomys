import { config } from "@/config/app";
import type {
  CostEstimate,
  PaymentIntent,
  IntentStatus,
  IntentStatusResponse,
} from "@/types/eulogy";

export interface ContractInfo {
  chainId: number;
  contractAddress: string;
  payIntentAbi: readonly unknown[];
}

export interface PaymentService {
  getContractInfo(): Promise<ContractInfo>;
  estimateCost(contentSizeBytes: number): Promise<CostEstimate>;
  createIntent(contentSizeBytes: number): Promise<PaymentIntent>;
  watchTransaction(intentId: string, txHash: string): Promise<void>;
  getIntentStatus(intentId: string): Promise<IntentStatusResponse>;
  waitForCompletion(intentId: string): Promise<IntentStatus>;
}

/**
 * Calls the Auto Drive REST API for credit purchase intents.
 *
 * Flow:
 * 1. GET /intents/contract — fetch contract address + ABI (public, cached)
 * 2. POST /intents — create intent with locked price
 * 3. User sends AI3 to contract via payIntent(intentId)
 * 4. POST /intents/:id/watch — submit txHash
 * 5. Poll GET /intents/:id until COMPLETED
 */
export class AutoDrivePaymentService implements PaymentService {
  private baseUrl: string;
  private apiKey: string;
  private contractInfoCache: ContractInfo | null = null;

  constructor() {
    this.baseUrl = config.autoDrive.apiUrl;
    this.apiKey = config.autoDrive.apiKey;
  }

  /**
   * Fetch contract details from Auto Drive — public endpoint, no auth required.
   * Cached for the lifetime of the service instance.
   */
  async getContractInfo(): Promise<ContractInfo> {
    if (this.contractInfoCache) return this.contractInfoCache;

    const res = await fetch(`${this.baseUrl}/intents/contract`);
    if (!res.ok) {
      throw new Error(`Failed to fetch contract info: ${res.status}`);
    }

    this.contractInfoCache = await res.json() as ContractInfo;
    return this.contractInfoCache;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-Auth-Provider": "apikey",
    };
  }

  async estimateCost(contentSizeBytes: number): Promise<CostEstimate> {
    // Create a temporary intent to get the current price, then use that
    // to calculate cost. We'll use the credit summary endpoint instead
    // to avoid creating throwaway intents.
    //
    // The price is: shannonsPerByte = transactionByteFee * priceMultiplier
    // We can get this from the intent creation response, but for an estimate
    // we'll create the intent and return the details.
    //
    // For now, create the actual intent. The frontend will use it if the user
    // proceeds. Intents expire after 10 minutes so stale ones clean themselves up.
    const res = await fetch(`${this.baseUrl}/intents`, {
      method: "POST",
      headers: this.headers(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create intent: ${res.status} ${body}`);
    }

    const intent = await res.json();
    // intent shape: { id, shannonsPerByte, status, expiresAt, ... }
    const shannonsPerByte = BigInt(intent.shannonsPerByte);
    const ai3AmountWei = shannonsPerByte * BigInt(contentSizeBytes);

    // Convert wei to human-readable AI3 (18 decimals)
    const ai3Amount = formatAi3(ai3AmountWei);

    return {
      ai3Amount,
      ai3AmountWei: ai3AmountWei.toString(),
      creditBytes: contentSizeBytes.toString(),
      shannonsPerByte: intent.shannonsPerByte,
    };
  }

  async createIntent(contentSizeBytes: number): Promise<PaymentIntent> {
    const [contractInfo, intentRes] = await Promise.all([
      this.getContractInfo(),
      fetch(`${this.baseUrl}/intents`, {
        method: "POST",
        headers: this.headers(),
      }),
    ]);

    if (!intentRes.ok) {
      const body = await intentRes.text();
      throw new Error(`Failed to create intent: ${intentRes.status} ${body}`);
    }

    const intent = await intentRes.json();
    const shannonsPerByte = BigInt(intent.shannonsPerByte);
    const ai3AmountWei = shannonsPerByte * BigInt(contentSizeBytes);

    return {
      intentId: intent.id,
      ai3AmountWei: ai3AmountWei.toString(),
      contractAddress: contractInfo.contractAddress,
      shannonsPerByte: intent.shannonsPerByte,
      expiresAt: intent.expiresAt,
    };
  }

  async watchTransaction(intentId: string, txHash: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/intents/${intentId}/watch`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ txHash }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to watch transaction: ${res.status} ${body}`);
    }
  }

  async getIntentStatus(intentId: string): Promise<IntentStatusResponse> {
    const res = await fetch(`${this.baseUrl}/intents/${intentId}`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to get intent status: ${res.status} ${body}`);
    }

    const data = await res.json();
    return { id: data.id, status: data.status };
  }

  async waitForCompletion(intentId: string): Promise<IntentStatus> {
    const { pollIntervalMs, pollTimeoutMs } = config.payment;
    const deadline = Date.now() + pollTimeoutMs;

    while (Date.now() < deadline) {
      const { status: rawStatus } = await this.getIntentStatus(intentId);
      const status = rawStatus.toUpperCase() as IntentStatus;

      if (status === "COMPLETED") return status;
      if (status === "EXPIRED" || status === "FAILED" || status === "OVER_CAP") {
        return status;
      }

      // PENDING or CONFIRMED — keep waiting
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Timed out waiting for intent completion");
  }
}

/** Format a BigInt wei value as human-readable AI3 (18 decimals) */
function formatAi3(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const fraction = wei % 10n ** 18n;
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${fractionStr}`;
}

export const paymentService: PaymentService = new AutoDrivePaymentService();
