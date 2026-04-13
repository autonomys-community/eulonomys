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
  imageCid?: string;
  createdAt: string;
}

// --- Payment types aligned with Auto Drive intent API ---

export interface CostEstimate {
  /** AI3 amount in human-readable units (e.g. "0.0012") */
  ai3Amount: string;
  /** AI3 amount in wei/shannons (raw bigint string for the contract call) */
  ai3AmountWei: string;
  /** Storage bytes this would buy */
  creditBytes: string;
  /** Price rate used (shannons per byte) */
  shannonsPerByte: string;
}

export interface PaymentIntent {
  intentId: string;
  /** AI3 amount in wei that must be sent to the contract */
  ai3AmountWei: string;
  /** The credits receiver contract address */
  contractAddress: string;
  /** Shannons per byte locked for this intent */
  shannonsPerByte: string;
  /** ISO timestamp when this intent expires */
  expiresAt: string;
}

export type IntentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "EXPIRED"
  | "OVER_CAP"
  | "FAILED";

export interface IntentStatusResponse {
  id: string;
  status: IntentStatus;
}

export interface EscrowContributor {
  displayName: string;
  totalAi3: string;
}

export interface EscrowBalance {
  totalAi3: string;
  totalCreditsAvailable: number;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}
