import { NextRequest, NextResponse } from "next/server";
import { aiAssistantService } from "@/services/aiAssistant";

// LLM calls can be slow; give them breathing room
export const maxDuration = 30;
import type { AssistantMessage } from "@/types/eulogy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: AssistantMessage[] = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // TODO: Get real user ID from auth session
    const userId = "stub-user";
    const sessionId = "stub-session";

    const result = await aiAssistantService.chat(messages, userId, sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json(
      { reply: "The writing helper is temporarily unavailable." },
      { status: 500 }
    );
  }
}
