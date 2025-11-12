// components/resources/ResourceGrid.tsx
import Link from "next/link";
import Image from "next/image";
import type { DownloadMeta } from "@/lib/server/downloads-data";

interface ResourceGridProps {
  items: DownloadMeta[];
  columns?: 2 | 3 | 4;
}

export default function ResourceGrid({ items, columns = 3 }: ResourceGridProps) {
  const gridClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  if (!items || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {items.map((resource) => (
        <ResourceCard key={resource.slug} resource={resource} />
      ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: DownloadMeta }) {
  const safeCoverImage = resource.coverImage ? String(resource.coverImage) : null;
  const safeTitle = resource.title ? String(resource.title) : "Untitled Resource";
  const safeExcerpt = resource.excerpt ? String(resource.excerpt) : null;
  const pdfPath = (resource as any).pdfPath ? String((resource as any).pdfPath) : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover hover:border-softGold/30">
      {safeCoverImage && (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={safeCoverImage}
            alt={safeTitle}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-deepCharcoal mb-2 line-clamp-2">
          <Link 
            href={`/downloads/${resource.slug}`}
            className="hover:text-softGold transition-colors"
            prefetch={false}
          >
            {safeTitle}
          </Link>
        </h3>
        
        {safeExcerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {safeExcerpt}
          </p>
        )}
        
        <div className="flex gap-2">
          <Link
            href={`/downloads/${resource.slug}`}
            className="flex-1 text-center rounded-lg bg-deepCharcoal text-cream px-3 py-2 text-sm font-medium hover:bg-[color:var(--color-on-secondary)/0.9] transition-colors"
            prefetch={false}
          >
            View Details
          </Link>
          
          {pdfPath && (
            <a
              href={pdfPath}
              download
              className="flex-1 text-center rounded-lg border border-lightGrey bg-white text-deepCharcoal px-3 py-2 text-sm font-medium hover:bg-warmWhite transition-colors"
              rel="noopener noreferrer"
            >
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}