"use client";

import { useState, useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ModerationItem {
  id: string;
  cid: string;
  name: string;
  contentPreview: string | null;
  imageCid: string | null;
  createdAt: string;
  moderation: string;
}

const gatewayUrl =
  process.env.NEXT_PUBLIC_AUTO_DRIVE_GATEWAY_URL ||
  "https://gateway.autonomys.xyz/file";

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-sm text-white hover:bg-stone-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ModerationQueue() {
  const { isChecking, headers, authenticate } = useAdminAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  async function handleAuthenticate() {
    const authHeaders = await authenticate();
    if (!authHeaders) {
      setError("Your wallet is not authorized for moderation.");
      return;
    }

    setAuthenticated(true);
    // Fetch immediately using the returned headers (not stale state)
    await fetchQueue(authHeaders);
  }

  async function fetchQueue(overrideHeaders?: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/moderation?status=PENDING,FLAGGED", {
        headers: overrideHeaders || headers,
      });
      if (!response.ok) {
        const text = await response.text();
        setError(`Moderation API error ${response.status}: ${text}`);
        setItems([]);
        return;
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (e) {
      setError(`Failed to load moderation queue: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // Admin can retry
    }
  }

  // Not yet authenticated — prompt to sign
  if (!authenticated) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted">
          Sign a message with your admin wallet to access the moderation queue.
        </p>
        <button
          onClick={handleAuthenticate}
          disabled={isChecking}
          className="mt-4 rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {isChecking ? "Verifying..." : "Authenticate"}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading moderation queue...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => fetchQueue()}
          className="mt-2 text-sm underline text-muted hover:text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No items pending review.</p>;
  }

  return (
    <div className="space-y-4">
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 min-w-0">
              {item.imageCid && (
                <button
                  className="shrink-0 cursor-pointer"
                  onClick={() => setLightboxSrc(`${gatewayUrl}/${item.imageCid}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${gatewayUrl}/${item.imageCid}`}
                    alt=""
                    className="max-h-20 max-w-24 rounded-md border border-border object-contain hover:opacity-80 transition-opacity"
                  />
                </button>
              )}
              <div className="min-w-0">
                <h4 className="font-medium text-foreground">{item.name}</h4>
                <p className="mt-1 text-xs text-muted">
                  CID:{" "}
                  <code className="font-mono break-all">{item.cid}</code>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Status:{" "}
                  <span
                    className={
                      item.moderation === "FLAGGED"
                        ? "text-amber-700 font-medium"
                        : ""
                    }
                  >
                    {item.moderation}
                  </span>
                </p>
                {item.contentPreview && (
                  <p className="mt-2 text-sm text-muted line-clamp-3">
                    {item.contentPreview}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
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
        </div>
      ))}
    </div>
  );
}
