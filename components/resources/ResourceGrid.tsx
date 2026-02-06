import Link from "next/link";
import Image from "next/image";

interface ResourceItem {
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  pdfPath?: string | null;
  category?: string | null; // Added for category/tag support
  [key: string]: unknown;
}

interface ResourceGridProps {
  items: ResourceItem[];
  columns?: 2 | 3 | 4;
}

export default function ResourceGrid({
  items,
  columns = 3,
}: ResourceGridProps) {
  const gridClass =
    {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }[columns] ?? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-lightGrey rounded-2xl">
        <p className="text-gray-500">No intelligence briefs found in manifest.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {items.map((resource) => (
        <ResourceCard key={String(resource.slug)} resource={resource} />
      ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: ResourceItem }) {
  const safeSlug = String(resource.slug);
  const safeCoverImage = resource.coverImage ? String(resource.coverImage) : null;
  const safeTitle = resource.title ? String(resource.title) : "Untitled Resource";
  const safeExcerpt = resource.excerpt ? String(resource.excerpt) : null;
  const safeCategory = resource.category ? String(resource.category) : null;
  
  // Ensure we are pointing to the validated public path
  const pdfPath =
    typeof resource.pdfPath === "string" && resource.pdfPath.trim().length
      ? resource.pdfPath
      : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:border-softGold/30 hover:shadow-cardHover">
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

      <div className="p-5">
        {safeCategory && (
          <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-softGold">
            {safeCategory}
          </span>
        )}
        
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-deepCharcoal">
          <Link
            href={`/resources/${safeSlug}`}
            className="transition-colors hover:text-softGold"
            prefetch={false}
          >
            {safeTitle}
          </Link>
        </h3>

        {safeExcerpt && (
          <p className="mb-4 line-clamp-3 text-sm text-gray-600">
            {safeExcerpt}
          </p>
        )}

        <div className="flex gap-2">
          <Link
            href={`/resources/${safeSlug}`}
            className="flex-1 rounded-lg bg-deepCharcoal px-3 py-2 text-center text-sm font-medium text-cream transition-colors hover:bg-deepCharcoal/90"
            prefetch={false}
          >
            Read Brief
          </Link>

          {pdfPath && (
            <a
              href={pdfPath}
              download
              className="flex-1 rounded-lg border border-lightGrey bg-white px-3 py-2 text-center text-sm font-medium text-deepCharcoal transition-colors hover:bg-warmWhite"
              rel="noopener noreferrer"
            >
              PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}