import { randomBytes } from "crypto";

/**
 * In-memory nonce and session store for admin auth.
 *
 * Nonces: single-use, expire after 5 minutes.
 * Sessions: issued after nonce verification, expire after 15 minutes.
 *
 * For multi-instance production deployments, replace with Redis or DB.
 */

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 15 * 60 * 1000;

const nonces = new Map<string, number>();
const sessions = new Map<string, { walletAddress: string; expiresAt: number }>();

function cleanupNonces() {
  const now = Date.now();
  for (const [nonce, expiry] of nonces) {
    if (now >= expiry) nonces.delete(nonce);
  }
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now >= session.expiresAt) sessions.delete(token);
  }
}

export function createNonce(): string {
  cleanupNonces();
  const nonce = randomBytes(32).toString("hex");
  nonces.set(nonce, Date.now() + NONCE_TTL_MS);
  return nonce;
}

export function consumeNonce(nonce: string): boolean {
  cleanupNonces();
  const expiry = nonces.get(nonce);
  if (!expiry) return false;
  nonces.delete(nonce);
  return Date.now() < expiry;
}

/**
 * Create a session token for an authenticated admin wallet.
 * Returns a random token that maps to the wallet address.
 */
export function createSession(walletAddress: string): string {
  cleanupSessions();
  const token = randomBytes(32).toString("hex");
  sessions.set(token, {
    walletAddress: walletAddress.toLowerCase(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

/**
 * Validate a session token and return the wallet address if valid.
 * Does NOT consume the session — it can be reused until expiry.
 */
export function validateSession(token: string): string | null {
  cleanupSessions();
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() >= session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.walletAddress;
}

/**
 * Invalidate a session (logout).
 */
export function destroySession(token: string): void {
  sessions.delete(token);
}
