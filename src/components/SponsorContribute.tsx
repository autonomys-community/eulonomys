"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useSendTransaction,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, parseGwei } from "viem";

const ESCROW_WALLET = process.env.NEXT_PUBLIC_ESCROW_WALLET_ADDRESS;

const explorerUrl =
  process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
  "https://explorer.auto-evm.mainnet.autonomys.xyz";

type Status = "idle" | "connecting" | "signing" | "confirming" | "recording" | "success" | "error";

export function SponsorContribute() {
  const [amount, setAmount] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();

  const escrowConfigured = !!ESCROW_WALLET;

  async function handleContribute() {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!ESCROW_WALLET) {
      setError("Community fund is not yet configured. Please try again later.");
      setStatus("error");
      return;
    }

    setError(null);
    setTxHash(null);

    try {
      // Connect wallet if needed
      if (!isConnected) {
        setStatus("connecting");
        await connectAsync({ connector: injected() });
      }

      setStatus("signing");

      // Auto EVM gas price fix (same as payment flow)
      const gasPrice = publicClient
        ? (await publicClient.getGasPrice()) + parseGwei("1")
        : undefined;

      // Simple AI3 transfer to the escrow wallet
      const hash = await sendTransactionAsync({
        to: ESCROW_WALLET as `0x${string}`,
        value: parseEther(amount),
        ...(gasPrice != null && { gasPrice }),
      });

      setTxHash(hash);
      setStatus("confirming");

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Record in database
      setStatus("recording");
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contribute",
          walletAddress: address,
          ai3Amount: amount,
          txHash: hash,
          displayName: displayName || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to record contribution");
      }

      setStatus("success");
      setAmount("");
      setDisplayName("");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("User rejected") || msg.includes("denied")) {
        setError("Transaction cancelled.");
      } else {
        setError(msg);
      }
      setStatus("error");
    }
  }

  const isWorking = ["connecting", "signing", "confirming", "recording"].includes(status);

  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="font-semibold text-foreground">
        Contribute to the Community Fund
      </h3>
      <p className="mt-2 text-sm text-muted">
        Your AI3 contribution helps others preserve memories of their loved
        ones when they cannot afford storage costs.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-foreground"
          >
            Amount (AI3)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isWorking}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-foreground"
          >
            Display Name (optional)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you'd like to be recognized"
            disabled={isWorking}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-muted">
            If provided, your name will be visible on the contributors list.
          </p>
        </div>

        <button
          onClick={handleContribute}
          disabled={!escrowConfigured || !amount || parseFloat(amount) <= 0 || isWorking}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {status === "connecting" && "Connecting wallet..."}
          {status === "signing" && "Confirm in wallet..."}
          {status === "confirming" && "Confirming on-chain..."}
          {status === "recording" && "Recording contribution..."}
          {status === "idle" && "Contribute"}
          {status === "success" && "Contribute"}
          {status === "error" && "Try Again"}
        </button>

        {status === "success" && (
          <p className="text-sm text-green-700">
            Thank you for your contribution!
            {txHash && (
              <>
                {" "}
                <a
                  href={`${explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-900"
                >
                  View transaction
                </a>
              </>
            )}
          </p>
        )}
        {!escrowConfigured && (
          <p className="text-sm text-muted">
            The community fund is not yet available. Check back soon.
          </p>
        )}
        {status === "error" && error && (
          <p className="text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
  );
}
