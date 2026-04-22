import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/config/app";
import { validateSession } from "@/lib/nonceStore";

/**
 * Verify admin via session token issued by /api/admin/check.
 * Returns the verified wallet address or null.
 */
async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const walletAddress = await validateSession(token);
  if (!walletAddress) return null;

  // Double-check the wallet is still in the admin list
  const isAdmin = config.moderation.adminWallets.some(
    (w) => w.toLowerCase() === walletAddress
  );

  return isAdmin ? walletAddress : null;
}

export async function GET(request: NextRequest) {
  try {
    const adminAddress = await verifyAdmin(request);
    if (!adminAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statuses = (searchParams.get("status") || "PENDING,FLAGGED").split(",");

    const items = await prisma.eulogy.findMany({
      where: {
        moderation: { in: statuses as ("PENDING" | "FLAGGED")[] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        cid: true,
        name: true,
        contentPreview: true,
        imageCid: true,
        createdAt: true,
        moderation: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Moderation query error:", error);
    return NextResponse.json(
      { error: "Could not fetch moderation queue" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAddress = await verifyAdmin(request);
    if (!adminAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    await prisma.eulogy.update({
      where: { id },
      data: {
        moderation: action === "approve" ? "APPROVED" : "REJECTED",
        moderationNote: `${action}d by ${adminAddress} at ${new Date().toISOString()}`,
      },
    });

    console.log(
      `[MODERATION] ${action.toUpperCase()} eulogy ${id} by ${adminAddress}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json(
      { error: "Moderation action failed" },
      { status: 500 }
    );
  }
}
