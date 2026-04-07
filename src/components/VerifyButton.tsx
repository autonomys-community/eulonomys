"use client";

import { useState } from "react";
import { config } from "@/config/app";

type VerificationState = "idle" | "verifying" | "verified" | "failed";

export function VerifyButton({ cid }: { cid: string }) {
  const [state, setState] = useState<VerificationState>("idle");

  async function handleVerify() {
    setState("verifying");
    try {
      const response = await fetch(
        `${config.autoDrive.gatewayUrl}/${cid}`
      );
      if (response.ok) {
        setState("verified");
      } else {
        setState("failed");
      }
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      onClick={handleVerify}
      disabled={state === "verifying"}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-stone-100 disabled:opacity-50"
    >
      {state === "idle" && "Verify on-chain"}
      {state === "verifying" && "Verifying..."}
      {state === "verified" && (
        <span className="text-green-700">
          Verified — content matches on-chain CID
        </span>
      )}
      {state === "failed" && (
        <span className="text-red-700">
          Verification failed — could not confirm match
        </span>
      )}
    </button>
  );
}
