import { EulogyDetail } from "@/components/EulogyDetail";
import { config } from "@/config/app";
import type { EulogyMetadata } from "@/types/eulogy";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ cid: string }>;
}

async function getEulogyMetadata(cid: string): Promise<EulogyMetadata | null> {
  try {
    const response = await fetch(
      `${config.autoDrive.gatewayUrl}/${cid}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cid } = await params;
  const metadata = await getEulogyMetadata(cid);
  if (!metadata) {
    return { title: "Eulogy Not Found — Eulonomys" };
  }
  return {
    title: `${metadata.name} — Eulonomys`,
    description: `A permanent eulogy for ${metadata.name}, stored on the Autonomys Network.`,
  };
}

export default async function EulogyPage({ params }: PageProps) {
  const { cid } = await params;
  const metadata = await getEulogyMetadata(cid);

  if (!metadata) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Eulogy Not Found
        </h1>
        <p className="mt-4 text-muted">
          This eulogy could not be retrieved. The CID may be incorrect, or the
          content may not yet be available on the network.
        </p>
        <p className="mt-2 font-mono text-sm text-muted">{cid}</p>
      </div>
    );
  }

  return <EulogyDetail metadata={metadata} cid={cid} />;
}
