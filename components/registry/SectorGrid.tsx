// components/registry/SectorGrid.tsx — HARDENED (Dynamic Dispatcher)
import * as React from "react";
import dynamic from "next/dynamic";
import { useContentRegistry } from "@/hooks/useContentRegistry"; // Suggested hook name

// Dynamic Imports for Performance (Code Splitting)
const CanonCard = dynamic(() => import("@/components/canon/CanonCard"));
const EventCard = dynamic(() => import("@/components/events/EventCard"));
const ResourceCard = dynamic(() => import("@/components/resources/ResourceCard"));
const LexiconCard = dynamic(() => import("@/components/lexicon/LexiconCard"));
const DownloadCard = dynamic(() => import("@/components/downloads/DownloadCard"));

/* -----------------------------------------------------------------------------
  REGISTRY MAP
  Maps 'type' from API to specific React Components
----------------------------------------------------------------------------- */
const CARD_REGISTRY: Record<string, React.ComponentType<any>> = {
  canon: CanonCard,
  event: EventCard,
  resource: ResourceCard,
  lexicon: LexiconCard,
  download: DownloadCard,
  book: CanonCard, // Books often share the high-fidelity Canon layout
  short: CanonCard, // Shorts can use a compact variant of Canon
};

export default function SectorGrid() {
  const { content, isLoading, error } = useContentRegistry();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 w-full animate-pulse rounded-sm bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-red-900/50 bg-red-900/10 p-8 text-center font-mono text-xs uppercase tracking-widest text-red-500">
        Registry Sync Failure: Connection to Intelligence Database Interrupted
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {content.map((item: any) => {
        // Dynamic Dispatch
        const Component = CARD_REGISTRY[item.type] || CanonCard;
        
        return (
          <Component 
            key={item.slug} 
            {...item}
            // Ensure the components receive props in the format they expect
            description={item.excerpt || item.description}
            coverImage={item.image || item.coverImage}
          />
        );
      })}
    </section>
  );
}