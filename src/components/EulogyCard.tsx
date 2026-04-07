import Link from "next/link";
import type { EulogyCard as EulogyCardType } from "@/types/eulogy";

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function EulogyCard({ eulogy }: { eulogy: EulogyCardType }) {
  const birth = formatDate(eulogy.dateOfBirth);
  const passing = formatDate(eulogy.dateOfPassing);
  const dateRange = [birth, passing].filter(Boolean).join(" — ");

  return (
    <Link
      href={`/eulogy/${eulogy.cid}`}
      className="block rounded-lg border border-border p-6 transition-colors hover:bg-stone-100/50"
    >
      <h3 className="text-lg font-semibold text-foreground">{eulogy.name}</h3>
      {dateRange && (
        <p className="mt-1 text-sm text-muted">{dateRange}</p>
      )}
      {eulogy.relationship && (
        <p className="mt-1 text-sm text-muted italic">{eulogy.relationship}</p>
      )}
      {eulogy.contentPreview && (
        <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3">
          {eulogy.contentPreview}
        </p>
      )}
    </Link>
  );
}
