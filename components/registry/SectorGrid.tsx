// components/registry/SectorGrid.tsx — HARDENED (Dynamic Dispatcher)
import * as React from "react";
import dynamic from "next/dynamic";
import { useContentRegistry } from "@/hooks/useContentRegistry";
import type { CanonCardProps } from "@/components/canon/CanonCard";

// Dynamic Imports for Performance (Code Splitting)
// Using the actual CanonCard component that exists
const CanonCard = dynamic(() => import("@/components/canon/CanonCard"));
const EventCard = dynamic(() => import("@/components/events/EventCard"));
const ResourceCard = dynamic(() => import("@/components/resources/ResourceCard"));
const LexiconCard = dynamic(() => import("@/components/lexicon/LexiconCard"));
const DownloadCard = dynamic(() => import("@/components/downloads/DownloadCard"));

// Fallback component for any missing card types
const FallbackCard: React.FC<{ title?: string; description?: string; slug?: string }> = ({ 
  title = "Content", 
  description = "This content is currently unavailable.",
  slug
}) => (
  <div className="rounded-sm border border-white/5 bg-zinc-950/50 p-6">
    <h3 className="font-serif text-xl text-white/70">{title}</h3>
    <p className="mt-2 text-sm text-zinc-500">{description}</p>
    {slug && (
      <div className="mt-4 text-xs text-zinc-600">ID: {slug}</div>
    )}
  </div>
);

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

  // If no content, show empty state
  if (!content || content.length === 0) {
    return (
      <div className="rounded-sm border border-white/5 bg-zinc-950/50 p-12 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          No registry entries found
        </p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {content.map((item: any) => {
        // Type guard to check if this is a canon-type item
        const isCanonType = item.type === 'canon' || item.type === 'book' || item.type === 'short';
        
        if (isCanonType) {
          // For canon items, use CanonCard with the canon prop structure
          const CanonComponent = CanonCard as React.ComponentType<CanonCardProps>;
          return (
            <CanonComponent
              key={item.slug || item.id}
              canon={{
                slug: item.slug,
                title: item.title,
                subtitle: item.subtitle,
                excerpt: item.excerpt || item.description,
                description: item.description,
                coverImage: item.image || item.coverImage,
                volumeNumber: item.volumeNumber,
                featured: item.featured,
                tags: item.tags,
                date: item.date,
                accessLevel: item.accessLevel,
              }}
            />
          );
        }
        
        // For non-canon items, use the registry lookup
        const Component = CARD_REGISTRY[item.type] || FallbackCard;
        
        return (
          <Component 
            key={item.slug || item.id}
            {...item}
            description={item.excerpt || item.description}
            coverImage={item.image || item.coverImage}
          />
        );
      })}
    </section>
  );
}