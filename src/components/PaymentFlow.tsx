"use client";

import { useState } from "react";
import type { CostEstimate } from "@/types/eulogy";

interface PaymentFlowProps {
  contentSizeBytes: number;
  onPaymentConfirmed: () => void;
  onRequestEscrow: () => void;
}

type PaymentStep = "estimate" | "confirm" | "processing" | "complete";

export function PaymentFlow({
  contentSizeBytes,
  onPaymentConfirmed,
  onRequestEscrow,
}: PaymentFlowProps) {
  const [step, setStep] = useState<PaymentStep>("estimate");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchEstimate() {
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "estimate", contentSizeBytes }),
      });
      const data = await response.json();
      setEstimate(data);
      setStep("confirm");
    } catch {
      setError("Could not estimate cost. Please try again.");
    }
  }

  async function handlePay() {
    if (!estimate) return;
    setStep("processing");
    setError(null);

    try {
      const intentRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createIntent",
          creditAmount: estimate.creditAmount,
        }),
      });
      const intent = await intentRes.json();

      // In production, this would trigger the wallet transaction
      // For now, stub auto-confirms
      const confirmRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          intentId: intent.intentId,
        }),
      });
      const result = await confirmRes.json();

      if (result.status === "confirmed") {
        setStep("complete");
        onPaymentConfirmed();
      } else {
        setError(`Payment ${result.status}. Please try again.`);
        setStep("confirm");
      }
    } catch {
      setError("Payment failed. Please try again.");
      setStep("confirm");
    }
  }

  if (step === "estimate") {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground">Storage Payment</h3>
        <p className="mt-2 text-sm text-muted">
          Your eulogy will be stored permanently on the Autonomys Network. This
          requires a one-time payment in AI3 tokens.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchEstimate}
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

  if (step === "confirm" && estimate) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground">Confirm Payment</h3>
        <div className="mt-3 rounded-md bg-stone-100 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Storage cost</span>
            <span className="font-medium text-foreground">
              {estimate.ai3Amount} AI3
            </span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Credits</span>
            <span className="font-medium text-foreground">
              {estimate.creditAmount}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          AI3 is the native token of the Autonomys Network. Your payment
          purchases permanent storage credits that are consumed when your eulogy
          is uploaded to the Distributed Storage Network.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePay}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Pay {estimate.ai3Amount} AI3
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

  if (step === "processing") {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted">Processing payment...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
      <p className="font-medium text-green-800">Payment confirmed</p>
      <p className="mt-1 text-sm text-green-700">
        Your eulogy is being stored permanently on the Autonomys Network.
      </p>
    </div>
  );
}
