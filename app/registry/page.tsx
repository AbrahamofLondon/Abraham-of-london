// app/registry/page.tsx — HARDENED (Production Entry Point)
import { Metadata } from "next";
import RegistryLayout from "@/components/layouts/RegistryLayout";
import { allDocuments } from "contentlayer/generated"; // Invariant: Contentlayer mapping
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Intelligence Registry | Institutional Briefs",
  description: "A centralized repository of 163 socio-political briefs, strategic analysis, and tactical dispatches.",
  openGraph: {
    title: "Intelligence Registry",
    description: "Access the full portfolio of 163 strategic intelligence briefs.",
    type: "website",
  },
};

/**
 * LOADING STATE
 * Provides a tactical fallback while the registry synchronizes
 */
function RegistryLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">
          Synchronizing Registry...
        </span>
      </div>
    </div>
  );
}

/**
 * REGISTRY PAGE
 * Serves as the high-level orchestrator for the Contentlayer data.
 */
export default async function RegistryPage() {
  // We pre-calculate total document count on the server for SEO and initial UI rendering
  const totalBriefs = allDocuments.length;

  return (
    <Suspense fallback={<RegistryLoading />}>
      {/* The RegistryLayout is a Client Component that manages 
        filtering, search, and the 9-sector grid logic.
      */}
      <RegistryLayout />
      
      {/* Hidden SEO Metadata for 163 Briefs 
        Ensures search engines index the depth of the portfolio 
      */}
      <section className="sr-only">
        <h2>Archive Index</h2>
        <ul>
          {allDocuments.slice(0, 20).map((doc) => (
            <li key={doc._id}>{doc.title}</li>
          ))}
        </ul>
      </section>
    </Suspense>
  );
}