"use client";

import { useState } from "react";

export function SponsorContribute() {
  const [amount, setAmount] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleContribute() {
    if (!amount) return;
    setStatus("submitting");

    try {
      const response = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contribute",
          ai3Amount: amount,
          displayName: displayName || undefined,
        }),
      });

      if (response.ok) {
        setStatus("success");
        setAmount("");
        setDisplayName("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="font-semibold text-foreground">Contribute to the Community Fund</h3>
      <p className="mt-2 text-sm text-muted">
        Your AI3 contribution helps others preserve memories of their loved
        ones when they cannot afford storage costs.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground">
            Amount (AI3)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
            Display Name (optional)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you'd like to be recognized"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <p className="mt-1 text-xs text-muted">
            If provided, your name will be visible to creators you help.
          </p>
        </div>
        <button
          onClick={handleContribute}
          disabled={!amount || status === "submitting"}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {status === "submitting" ? "Contributing..." : "Contribute"}
        </button>
        {status === "success" && (
          <p className="text-sm text-green-700">
            Thank you for your contribution.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-700">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
