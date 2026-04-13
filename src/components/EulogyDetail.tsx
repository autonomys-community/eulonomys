"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VerifyButton } from "./VerifyButton";
const gatewayUrl =
  process.env.NEXT_PUBLIC_AUTO_DRIVE_GATEWAY_URL ||
  "https://gateway.autonomys.xyz/file";
import type { EulogyMetadata } from "@/types/eulogy";

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ShareButton({ cid, name }: { cid: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/eulogy/${cid}`;
    const text = `A permanent eulogy for ${name}, stored on the Autonomys Network.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — Eulonomys`, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for when document loses focus
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-stone-100"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function EulogyDetail({
  metadata,
  cid,
}: {
  metadata: EulogyMetadata;
  cid: string;
}) {
  const birth = formatDate(metadata.dateOfBirth);
  const passing = formatDate(metadata.dateOfPassing);
  const dateRange = [birth, passing].filter(Boolean).join(" — ");

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {metadata.name}
        </h1>
        {dateRange && <p className="mt-2 text-muted">{dateRange}</p>}
        {metadata.relationship && (
          <p className="mt-1 text-sm italic text-muted">
            {metadata.relationship}
          </p>
        )}
      </header>

      {metadata.imageCid && (
        <div className="mt-8 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${gatewayUrl}/${metadata.imageCid}`}
            alt={`Photo of ${metadata.name}`}
            className="max-h-96 rounded-lg border border-border"
          />
        </div>
      )}

      <div className="prose mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {metadata.content}
        </ReactMarkdown>
      </div>

      <footer className="mt-12 space-y-4 border-t border-border pt-6">
        <div className="rounded-md bg-stone-100 p-4 text-center text-sm text-muted">
          This eulogy is stored permanently on the Autonomys Network. It cannot
          be altered, deleted, or censored.
        </div>

        <div className="flex items-center justify-center gap-4">
          <VerifyButton cid={cid} />
          <ShareButton cid={cid} name={metadata.name} />
        </div>

        <p className="text-center text-xs text-muted">
          CID:{" "}
          <a
            href={`${gatewayUrl}/${cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline hover:text-foreground transition-colors"
          >
            {cid}
          </a>
        </p>
      </footer>
    </article>
  );
}
