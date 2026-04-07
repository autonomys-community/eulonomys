"use client";

import { useState, useEffect } from "react";

interface ModerationItem {
  id: string;
  cid: string;
  name: string;
  contentPreview: string | null;
  createdAt: string;
  moderation: string;
}

export function ModerationQueue() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const response = await fetch("/api/moderation?status=PENDING,FLAGGED");
      const data = await response.json();
      setItems(data.items || []);
    } catch {
      // Silently fail — admin can refresh
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    try {
      await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading moderation queue...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No items pending review.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-foreground">{item.name}</h4>
              <p className="mt-1 text-xs text-muted">
                CID: <code className="font-mono">{item.cid}</code>
              </p>
              <p className="mt-1 text-xs text-muted">
                Status: {item.moderation}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(item.id, "approve")}
                className="rounded-md bg-green-700 px-3 py-1 text-xs text-white hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(item.id, "reject")}
                className="rounded-md bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
          {item.contentPreview && (
            <p className="mt-2 text-sm text-muted">{item.contentPreview}</p>
          )}
        </div>
      ))}
    </div>
  );
}
