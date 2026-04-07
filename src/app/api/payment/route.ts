import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "estimate") {
      const estimate = await paymentService.estimateCost(body.contentSizeBytes);
      return NextResponse.json(estimate);
    }

    if (action === "createIntent") {
      // TODO: Get real user ID from auth session
      const userId = "stub-user";
      const intent = await paymentService.createIntent(
        userId,
        body.creditAmount
      );
      return NextResponse.json(intent);
    }

    if (action === "confirm") {
      const result = await paymentService.confirmPayment(body.intentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment operation failed" },
      { status: 500 }
    );
  }
}
