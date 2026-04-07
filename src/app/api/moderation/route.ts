import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // TODO: Verify admin auth (email domain allowlist / wallet address)
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
    // TODO: Verify admin auth
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
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json(
      { error: "Moderation action failed" },
      { status: 500 }
    );
  }
}
