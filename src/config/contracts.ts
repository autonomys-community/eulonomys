/**
 * AutoDriveCreditsReceiver contract ABI — just the payIntent function
 * and the IntentPaymentReceived event we care about.
 *
 * Full contract: https://github.com/autonomys/auto-drive/tree/main/packages/contracts
 */
export const CREDITS_RECEIVER_ABI = [
  {
    inputs: [{ name: "intentId", type: "bytes32" }],
    name: "payIntent",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "intentId", type: "bytes32" },
      { indexed: false, name: "paymentAmount", type: "uint256" },
    ],
    name: "IntentPaymentReceived",
    type: "event",
  },
] as const;
