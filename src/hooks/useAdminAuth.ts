"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

const MESSAGE_PREFIX = "Eulonomys admin authentication. Nonce: ";

interface AdminAuth {
  isAdmin: boolean;
  isChecking: boolean;
  headers: Record<string, string>;
  authenticate: () => Promise<Record<string, string> | null>;
}

/**
 * Hook for admin wallet authentication via signed nonce + session token.
 *
 * Flow:
 * 1. Fetch a one-time nonce from the server
 * 2. Sign "Eulonomys admin authentication. Nonce: {nonce}" with wallet
 * 3. Server verifies signature, consumes nonce, returns a session token
 * 4. Session token used as Bearer auth for subsequent API calls
 *
 * The signature is never sent to the moderation API — only the
 * short-lived session token (15 min TTL).
 */
export function useAdminAuth(): AdminAuth {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Reset when wallet changes
  useEffect(() => {
    setIsAdmin(false);
    setSessionToken(null);
  }, [address]);

  const authenticate = useCallback(async (): Promise<Record<string, string> | null> => {
    if (!address) return null;

    setIsChecking(true);
    try {
      // 1. Fetch a one-time nonce
      const nonceRes = await fetch("/api/admin/nonce");
      const { nonce } = await nonceRes.json();

      // 2. Sign the message with the nonce
      const message = `${MESSAGE_PREFIX}${nonce}`;
      const sig = await signMessageAsync({ message });

      // 3. Verify with server — returns session token
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          signature: sig,
          message,
        }),
      });

      const data = await res.json();

      if (data.authenticated && data.sessionToken) {
        setIsAdmin(true);
        setSessionToken(data.sessionToken);
        const authHeaders = { Authorization: `Bearer ${data.sessionToken}` };
        return authHeaders;
      }

      setIsAdmin(false);
      return null;
    } catch {
      setIsAdmin(false);
      setSessionToken(null);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [address, signMessageAsync]);

  const headers: Record<string, string> = sessionToken
    ? { Authorization: `Bearer ${sessionToken}` }
    : {};

  return { isAdmin, isChecking, headers, authenticate };
}
