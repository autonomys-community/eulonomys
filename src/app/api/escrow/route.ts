import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/services/escrow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "contribute") {
      const { walletAddress, ai3Amount, txHash, displayName } = body;

      if (!walletAddress || !ai3Amount || !txHash) {
        return NextResponse.json(
          { error: "walletAddress, ai3Amount, and txHash are required" },
          { status: 400 }
        );
      }

      const result = await escrowService.recordContribution(
        walletAddress,
        ai3Amount,
        txHash,
        displayName || undefined
      );
      return NextResponse.json(result);
    }

    if (action === "requestFunding") {
      const { creditAmount, ai3Equivalent, eulogyId } = body;
      if (!creditAmount || !ai3Equivalent || !eulogyId) {
        return NextResponse.json(
          { error: "creditAmount, ai3Equivalent, and eulogyId are required" },
          { status: 400 }
        );
      }
      const result = await escrowService.requestFunding(
        creditAmount,
        ai3Equivalent,
        eulogyId
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
    const message = error instanceof Error ? error.message : String(error);
    console.error("Escrow error:", message);
    return NextResponse.json(
      { error: "Escrow operation failed", details: message },
      { status: 500 }
    );
  }
}
