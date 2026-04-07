import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/services/escrow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "contribute") {
      // TODO: Get wallet address from auth/wallet session
      const walletAddress = "0x0000000000000000000000000000000000000000";
      const result = await escrowService.contribute(
        walletAddress,
        body.ai3Amount,
        body.displayName
      );
      return NextResponse.json(result);
    }

    if (action === "requestFunding") {
      // TODO: Get real user ID from auth session
      const userId = "stub-user";
      const result = await escrowService.requestFunding(
        userId,
        body.creditAmount
      );
      return NextResponse.json(result);
    }

    if (action === "balance") {
      const balance = await escrowService.getBalance();
      return NextResponse.json(balance);
    }

    if (action === "contributors") {
      const contributors = await escrowService.getContributors();
      return NextResponse.json(contributors);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Escrow error:", error);
    return NextResponse.json(
      { error: "Escrow operation failed" },
      { status: 500 }
    );
  }
}
