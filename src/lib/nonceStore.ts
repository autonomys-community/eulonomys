import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * DB-backed nonce and session store for admin auth.
 *
 * Using the database instead of in-memory Maps so that nonces and sessions
 * survive across serverless function instances (required for Vercel/multi-instance
 * deployments where the nonce may be issued by one instance and consumed by another).
 *
 * Nonces: single-use, expire after 5 minutes.
 * Sessions: reusable, expire after 15 minutes.
 */

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 15 * 60 * 1000;

export async function createNonce(): Promise<string> {
  // Opportunistically prune expired nonces
  await prisma.adminNonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const nonce = randomBytes(32).toString("hex");
  await prisma.adminNonce.create({
    data: { nonce, expiresAt: new Date(Date.now() + NONCE_TTL_MS) },
  });
  return nonce;
}

export async function consumeNonce(nonce: string): Promise<boolean> {
  const record = await prisma.adminNonce.findUnique({ where: { nonce } });
  if (!record) return false;

  // Always delete — nonces are single-use even if expired
  await prisma.adminNonce.delete({ where: { nonce } });

  return new Date() < record.expiresAt;
}

export async function createSession(walletAddress: string): Promise<string> {
  // Opportunistically prune expired sessions
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.adminSession.create({
    data: {
      token,
      walletAddress: walletAddress.toLowerCase(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function validateSession(token: string): Promise<string | null> {
  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) return null;

  if (new Date() >= session.expiresAt) {
    await prisma.adminSession.delete({ where: { token } });
    return null;
  }

  return session.walletAddress;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { token } });
}
