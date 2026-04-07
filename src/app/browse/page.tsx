import { prisma } from "@/lib/prisma";
import { EulogyCard } from "@/components/EulogyCard";
import type { EulogyCard as EulogyCardType } from "@/types/eulogy";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export const metadata = {
  title: "Browse Eulogies — Eulonomys",
  description: "Browse publicly shared eulogies stored permanently on the Autonomys Network.",
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 12;

  const where = {
    visibility: "PUBLIC" as const,
    moderation: "APPROVED" as const,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [eulogies, total] = await Promise.all([
    prisma.eulogy.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      select: {
        cid: true,
        name: true,
        dateOfBirth: true,
        dateOfPassing: true,
        relationship: true,
        contentPreview: true,
        createdAt: true,
      },
    }),
    prisma.eulogy.count({ where }),
  ]);

  const cards: EulogyCardType[] = eulogies.map((e) => ({
    cid: e.cid,
    name: e.name,
    dateOfBirth: e.dateOfBirth?.toISOString(),
    dateOfPassing: e.dateOfPassing?.toISOString(),
    relationship: e.relationship ?? undefined,
    contentPreview: e.contentPreview ?? undefined,
    createdAt: e.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Browse Eulogies</h1>
      <p className="mt-2 text-sm text-muted">
        Publicly shared memorials, stored permanently on the Autonomys Network.
      </p>

      {/* Search */}
      <form className="mt-6" action="/browse" method="GET">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name..."
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {cards.length === 0 ? (
        <p className="mt-8 text-center text-muted">
          {q
            ? `No eulogies found for "${q}".`
            : "No eulogies have been shared publicly yet."}
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <EulogyCard key={card.cid} eulogy={card} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <a
                    key={pageNum}
                    href={`/browse?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${pageNum}`}
                    className={`rounded-md px-3 py-1 text-sm ${
                      pageNum === currentPage
                        ? "bg-stone-800 text-stone-50"
                        : "border border-border text-muted hover:bg-stone-100"
                    } transition-colors`}
                  >
                    {pageNum}
                  </a>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
