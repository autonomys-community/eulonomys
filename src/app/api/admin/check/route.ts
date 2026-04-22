import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { config } from "@/config/app";
import { consumeNonce, createSession } from "@/lib/nonceStore";

const MESSAGE_PREFIX = "Eulonomys admin authentication. Nonce: ";

/**
 * Verify admin wallet ownership and issue a session token.
 *
 * Requires walletAddress + signature + message (with nonce).
 * Returns a session token on success that is used for subsequent
 * moderation API calls. The session expires after 15 minutes.
 *
 * Deliberately returns the same generic error for all failure modes
 * to avoid leaking which wallets are admins.
 */
export async function POST(request: NextRequest) {
  const fail = () => NextResponse.json({ authenticated: false });

  try {
    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return fail();
    }

    // Validate message format and consume the nonce
    if (!message.startsWith(MESSAGE_PREFIX)) {
      return fail();
    }

    const nonce = message.slice(MESSAGE_PREFIX.length);
    if (!(await consumeNonce(nonce))) {
      return fail();
    }

    // Verify signature
    const valid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return fail();
    }

    // Check admin allowlist
    const isAdmin = config.moderation.adminWallets.some(
      (w) => w.toLowerCase() === walletAddress.toLowerCase()
    );
    if (!isAdmin) {
      return fail();
    }

    // Issue session token
    const sessionToken = await createSession(walletAddress);
    return NextResponse.json({ authenticated: true, sessionToken });
  } catch {
    return fail();
  }
}
