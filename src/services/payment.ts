import type { CostEstimate, PaymentIntent, PaymentStatus } from "@/types/eulogy";

export interface PaymentService {
  estimateCost(contentSizeBytes: number): Promise<CostEstimate>;
  createIntent(
    userId: string,
    creditAmount: number
  ): Promise<PaymentIntent>;
  confirmPayment(
    intentId: string
  ): Promise<{ status: PaymentStatus }>;
}

/**
 * Stub implementation using the free-tier credit system.
 * Will be replaced with real Pay with AI3 integration.
 */
export class StubPaymentService implements PaymentService {
  async estimateCost(contentSizeBytes: number): Promise<CostEstimate> {
    // Rough estimate: 1 credit per 100KB, minimum 1
    const creditAmount = Math.max(1, Math.ceil(contentSizeBytes / 102400));
    // Stub AI3 conversion: 0.01 AI3 per credit
    const ai3Amount = (creditAmount * 0.01).toFixed(4);
    return { ai3Amount, creditAmount };
  }

  async createIntent(
    userId: string,
    creditAmount: number
  ): Promise<PaymentIntent> {
    return {
      intentId: `stub_${userId}_${Date.now()}`,
      paymentAddress: "0x0000000000000000000000000000000000000000",
    };
  }

  async confirmPayment(
    intentId: string
  ): Promise<{ status: PaymentStatus }> {
    // Stub: always confirm
    return { status: "confirmed" };
  }
}

// Singleton — swap to real implementation when Pay with AI3 is live
export const paymentService: PaymentService = new StubPaymentService();
