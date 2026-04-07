"use client";

import { useState, useRef, useEffect } from "react";
import type { AssistantMessage } from "@/types/eulogy";

export function WritingHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: AssistantMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-muted underline underline-offset-2 hover:text-foreground transition-colors"
      >
        I&apos;m struggling with the words
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted">
          Take your time. I&apos;m here to help you find the words.
        </p>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm text-muted hover:text-foreground"
          aria-label="Close writing helper"
        >
          Close
        </button>
      </div>

      <div className="mb-3 max-h-64 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm italic text-muted">
            What would you like to share about your loved one? There are no
            wrong answers here.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === "user"
                ? "text-foreground"
                : "text-muted italic"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <p className="text-sm italic text-muted">Thinking...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Share a memory..."
          className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
