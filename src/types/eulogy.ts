export interface EulogyMetadata {
  version: string;
  type: "eulogy";
  name: string;
  dateOfBirth?: string;
  dateOfPassing?: string;
  relationship?: string;
  visibility: "public" | "private";
  content: string;
  contentFormat: "markdown";
  imageCid?: string;
  createdAt: string;
  createdBy: string;
  fundedBy: "escrow" | "self";
}

export interface EulogyCard {
  cid: string;
  name: string;
  dateOfBirth?: string;
  dateOfPassing?: string;
  relationship?: string;
  contentPreview?: string;
  createdAt: string;
}

export interface CostEstimate {
  ai3Amount: string;
  creditAmount: number;
}

export interface PaymentIntent {
  intentId: string;
  paymentAddress: string;
}

export type PaymentStatus = "confirmed" | "pending" | "expired" | "over_cap";

export interface EscrowContributor {
  displayName: string;
  totalContributed: string;
}

export interface EscrowBalance {
  totalAi3: string;
  totalCreditsAvailable: number;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}
