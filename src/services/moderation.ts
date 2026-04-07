/**
 * Content moderation service.
 * Automated first-pass screening via LLM classifier for spam,
 * hate speech, and non-eulogy content.
 */

export type ModerationResult = {
  approved: boolean;
  reason?: string;
  confidence: number;
};

export interface ModerationService {
  screen(content: string, name: string): Promise<ModerationResult>;
}

export class LlmModerationService implements ModerationService {
  async screen(content: string, name: string): Promise<ModerationResult> {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      // If no API key, flag for manual review
      return { approved: false, reason: "Automated screening unavailable", confidence: 0 };
    }

    try {
      const response = await fetch(
        process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a content moderator for a eulogy/memorial website. Analyze the following content and determine if it is appropriate. Approve if it appears to be a genuine memorial or eulogy. Flag if it contains spam, hate speech, harassment, or is clearly not memorial content.

Respond with JSON only: {"approved": boolean, "reason": "brief explanation", "confidence": 0.0-1.0}`,
              },
              {
                role: "user",
                content: `Name: ${name}\n\nContent:\n${content}`,
              },
            ],
            max_tokens: 150,
            temperature: 0,
          }),
        }
      );

      if (!response.ok) {
        return { approved: false, reason: "Screening error", confidence: 0 };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const result = JSON.parse(text) as ModerationResult;
      return result;
    } catch {
      return { approved: false, reason: "Screening error", confidence: 0 };
    }
  }
}

export const moderationService: ModerationService = new LlmModerationService();
