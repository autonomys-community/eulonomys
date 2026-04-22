"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { parseGwei } from "viem";
import type { PaymentIntent } from "@/types/eulogy";

interface PaymentFlowProps {
  contentSizeBytes: number;
  onPaymentConfirmed: () => void;
  onRequestEscrow: () => void;
}

type PaymentStep =
  | "connect"
  | "estimate"
  | "confirm"
  | "signing"
  | "waiting"
  | "crediting"
  | "complete"
  | "error";

export function PaymentFlow({
  contentSizeBytes,
  onPaymentConfirmed,
  onRequestEscrow,
}: PaymentFlowProps) {
  const [step, setStep] = useState<PaymentStep>("estimate");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [payIntentAbi, setPayIntentAbi] = useState<readonly unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isTxConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Step 1: Create intent (locks price)
  const createIntent = useCallback(async () => {
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }

    setError(null);
    try {
      const [intentRes, contractRes] = await Promise.all([
        fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createIntent", contentSizeBytes }),
        }),
        fetch("/api/payment"),
      ]);

      if (!intentRes.ok) {
        const data = await intentRes.json();
        throw new Error(data.details || data.error || "Failed to create intent");
      }

      const data: PaymentIntent = await intentRes.json();
      setIntent(data);

      if (contractRes.ok) {
        const contractInfo = await contractRes.json();
        setPayIntentAbi(contractInfo.payIntentAbi);
      }

      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create payment intent");
    }
  }, [contentSizeBytes, isConnected, connect]);

  // Step 2: User confirms — send on-chain tx
  const handlePay = useCallback(async () => {
    if (!intent) return;

    setStep("signing");
    setError(null);

    try {
      // Auto EVM doesn't support EIP-1559 fee history. Fetch current gas price
      // + 1 GWEI buffer to force a legacy (type-0) tx that MetaMask can handle.
      const gasPrice = publicClient
        ? (await publicClient.getGasPrice()) + parseGwei("1")
        : undefined;

      // Use ABI from Auto Drive API if available, otherwise fall back to local definition
      const abi = payIntentAbi ?? [
        {
          inputs: [{ name: "intentId", type: "bytes32" }],
          name: "payIntent",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ];

      // The intentId from Auto Drive is already a 0x-prefixed 32-byte hex string
      // (generated via randomBytes(32).toString('hex')). Pass it directly as bytes32.
      const hash = await writeContractAsync({
        address: intent.contractAddress as `0x${string}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abi: abi as any,
        functionName: "payIntent",
        args: [intent.intentId as `0x${string}`],
        value: BigInt(intent.ai3AmountWei),
        ...(gasPrice != null && { gasPrice }),
      });

      setTxHash(hash);
      setStep("waiting");
      setStatusMessage("Transaction submitted. Waiting for confirmations...");

      // Step 3: Tell Auto Drive to watch this tx
      setStatusMessage("Submitting transaction to Auto Drive...");
      await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "watch",
          intentId: intent.intentId,
          txHash: hash,
        }),
      });

      // Step 4: Poll status so the user sees each stage
      setStep("crediting");
      const deadline = Date.now() + 5 * 60 * 1000; // 5 min timeout
      let pollCount = 0;

      while (Date.now() < deadline) {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            intentId: intent.intentId,
          }),
        });
        const result = await res.json();
        pollCount++;

        const status = result.status?.toUpperCase();

        if (status === "COMPLETED") {
          setStep("complete");
          onPaymentConfirmed();
          return;
        }

        if (status === "EXPIRED" || status === "FAILED" || status === "OVER_CAP") {
          setError(
            `Payment ${status.toLowerCase()}. ${
              status === "EXPIRED"
                ? "The price lock expired. Please try again."
                : status === "OVER_CAP"
                  ? "Your account has reached the storage limit."
                  : "Please try again."
            }`
          );
          setStep("error");
          return;
        }

        // Update message based on what Auto Drive reports
        if (status === "CONFIRMED") {
          setStatusMessage("Transaction confirmed on-chain. Applying credits...");
        } else {
          setStatusMessage(
            `Waiting for on-chain confirmation... (${pollCount * 3}s)`
          );
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      setError("Timed out waiting for credits. Your transaction was sent — check the explorer link above and contact support if needed.");
      setStep("error");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      // User likely rejected the wallet prompt
      if (msg.includes("User rejected") || msg.includes("denied")) {
        setError("Transaction cancelled.");
        setStep("confirm");
      } else {
        setError(msg);
        setStep("error");
      }
    }
  }, [intent, publicClient, writeContractAsync, onPaymentConfirmed]);

  const explorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://explorer.auto-evm.mainnet.autonomys.xyz";

  // Format AI3 for display
  const displayAmount = intent
    ? `${parseFloat(intent.ai3AmountWei) / 1e18} AI3`
    : "";

  // --- Connect wallet prompt ---
  if (!isConnected) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground">Connect Wallet</h3>
        <p className="mt-2 text-sm text-muted">
          Connect your wallet to pay for permanent storage with AI3 tokens.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => connect({ connector: injected() })}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Connect Wallet
          </button>
          <button
            onClick={onRequestEscrow}
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-stone-100 transition-colors"
          >
            Request Community Funding
          </button>
        </div>
      </div>
    );
  }

  // --- Estimate / create intent ---
  if (step === "estimate") {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground">Storage Payment</h3>
        <p className="mt-2 text-sm text-muted">
          Your eulogy will be stored permanently on the Autonomys Network. This
          requires a one-time payment in AI3 tokens from your connected wallet.
        </p>
        <p className="mt-2 text-xs text-muted">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={createIntent}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Calculate Cost
          </button>
          <button
            onClick={onRequestEscrow}
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-stone-100 transition-colors"
          >
            Request Community Funding
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  // --- Confirm payment ---
  if (step === "confirm" && intent) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground">Confirm Payment</h3>
        <div className="mt-3 rounded-md bg-stone-100 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Storage cost</span>
            <span className="font-medium text-foreground">{displayAmount}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Storage purchased</span>
            <span className="font-medium text-foreground">
              {formatBytes(parseInt(intent.ai3AmountWei) / parseInt(intent.shannonsPerByte))}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          This will open your wallet to sign a transaction sending AI3 to the
          Autonomys Credits Receiver contract. The price is locked for 10
          minutes. Credits are applied automatically after on-chain confirmation.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePay}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Pay {displayAmount}
          </button>
          <button
            onClick={() => setStep("estimate")}
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-stone-100 transition-colors"
          >
            Back
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  // --- In-progress states ---
  if (
    step === "signing" ||
    step === "waiting" ||
    step === "crediting"
  ) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
        <p className="mt-3 text-sm text-muted">
          {step === "signing" && "Waiting for wallet signature..."}
          {step === "waiting" && (statusMessage || "Waiting for transaction confirmation...")}
          {step === "crediting" && (statusMessage || "Credits being applied...")}
        </p>
        {txHash && (
          <p className="mt-2 text-xs text-muted">
            Tx:{" "}
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline hover:text-foreground transition-colors"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </p>
        )}
      </div>
    );
  }

  // --- Error ---
  if (step === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Payment failed</p>
        {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
        <button
          onClick={() => {
            setError(null);
            setIntent(null);
            setTxHash(undefined);
            setStep("estimate");
          }}
          className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- Complete ---
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
      <p className="font-medium text-green-800">Payment confirmed</p>
      <p className="mt-1 text-sm text-green-700">
        Your eulogy is being stored permanently on the Autonomys Network.
      </p>
      {txHash && (
        <p className="mt-2 text-xs text-green-600">
          Tx:{" "}
          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline hover:text-green-800 transition-colors"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
