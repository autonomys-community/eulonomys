import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Step 1: Create an intent (locks price for 10 minutes)
    if (action === "createIntent") {
      const { contentSizeBytes } = body;
      if (!contentSizeBytes || contentSizeBytes <= 0) {
        return NextResponse.json(
          { error: "contentSizeBytes is required" },
          { status: 400 }
        );
      }
      const intent = await paymentService.createIntent(contentSizeBytes);
      return NextResponse.json(intent);
    }

    // Step 2: User has sent the on-chain tx — submit hash for watching
    if (action === "watch") {
      const { intentId, txHash } = body;
      if (!intentId || !txHash) {
        return NextResponse.json(
          { error: "intentId and txHash are required" },
          { status: 400 }
        );
      }
      await paymentService.watchTransaction(intentId, txHash);
      return NextResponse.json({ success: true });
    }

    // Step 3: Check intent status
    if (action === "status") {
      const { intentId } = body;
      if (!intentId) {
        return NextResponse.json(
          { error: "intentId is required" },
          { status: 400 }
        );
      }
      const status = await paymentService.getIntentStatus(intentId);
      return NextResponse.json(status);
    }

    // Step 4: Wait for intent to complete (long-poll)
    if (action === "waitForCompletion") {
      const { intentId } = body;
      if (!intentId) {
        return NextResponse.json(
          { error: "intentId is required" },
          { status: 400 }
        );
      }
      const status = await paymentService.waitForCompletion(intentId);
      return NextResponse.json({ status });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      {
        error: "Payment operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
