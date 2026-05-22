import Link from "next/link";
import type { PublicationRecord } from "@/lib/editorial/types";

type PublicationCardProps = {
  publication: PublicationRecord;
  featured?: boolean;
};

export function PublicationCard({
  publication,
  featured = false,
}: PublicationCardProps) {
  const href = `/editorials/${publication.slug}`;

  if (featured) {
    return (
      <div className="mb-20">
        {/* Flagship label */}
        <div className="mb-6">
          <span className="text-[10px] tracking-[0.16em] uppercase text-[#C9963A] font-medium">
            Flagship Publication
          </span>
        </div>

        {/* Large title — the primary link */}
        <Link href={href} className="group block">
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] dark:text-[#F0EDE8] leading-tight mb-4 group-hover:text-[#C9963A] transition-colors duration-300 max-w-3xl">
            {publication.title}
          </h2>
        </Link>

        {/* Subtitle */}
        {publication.subtitle && (
          <p className="text-base text-[#5A5A5A] dark:text-[#8A8A8A] mb-5 font-medium tracking-wide">
            {publication.subtitle}
          </p>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-[#C9963A] mb-6" />

        {/* Description */}
        <p className="text-base text-[#3A3A3A] dark:text-[#C0BDB8] leading-relaxed max-w-2xl mb-8">
          {publication.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-[#8A8A8A]">
          <span>{publication.author}</span>
          {publication.readingTime && (
            <>
              <span className="text-[#D0D0D0] dark:text-[#3A3A3A]">·</span>
              <span>{publication.readingTime}</span>
            </>
          )}
          {publication.version && (
            <>
              <span className="text-[#D0D0D0] dark:text-[#3A3A3A]">·</span>
              <span>v{publication.version}</span>
            </>
          )}
          {publication.category && (
            <>
              <span className="text-[#D0D0D0] dark:text-[#3A3A3A]">·</span>
              <span className="tracking-wide">{publication.category}</span>
            </>
          )}
        </div>

        {/* Action row — each action is its own proper link */}
        <div className="flex flex-wrap gap-4 mt-8">
          {publication.previewEnabled && (
            <Link
              href={href}
              className="text-xs tracking-[0.1em] uppercase text-[#1A1A1A] dark:text-[#F0EDE8] border border-current px-4 py-2 hover:border-[#C9963A] hover:text-[#C9963A] transition-colors duration-300"
            >
              Read editorial
            </Link>
          )}
          {publication.epubEnabled && publication.epubPath && (
            <a
              href={publication.epubPath}
              className="text-xs tracking-[0.1em] uppercase text-[#8A8A8A] border border-[#D0D0D0] dark:border-[#3A3A3A] px-4 py-2 hover:text-[#C9963A] hover:border-[#C9963A] transition-colors duration-200"
            >
              Download ePub
            </a>
          )}
        </div>
      </div>
    );
  }

  // Standard card — horizontal band
  return (
    <Link
      href={href}
      className="group block border-t border-[#2A2A2A]/20 dark:border-[#2A2A2A] py-8 hover:border-[#C9963A] transition-colors duration-300"
    >
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 min-w-0">
          {/* Category */}
          {publication.category && (
            <div className="mb-2">
              <span className="text-[10px] tracking-[0.14em] uppercase text-[#8A8A8A] font-medium">
                {publication.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-serif text-xl text-[#1A1A1A] dark:text-[#F0EDE8] group-hover:text-[#C9963A] transition-colors duration-300 mb-2 leading-snug">
            {publication.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#5A5A5A] dark:text-[#8A8A8A] leading-relaxed max-w-xl">
            {publication.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-[#8A8A8A]">
            {publication.readingTime && <span>{publication.readingTime}</span>}
            {publication.version && (
              <>
                <span className="text-[#D0D0D0] dark:text-[#3A3A3A]">·</span>
                <span>v{publication.version}</span>
              </>
            )}
            {publication.status && (
              <>
                <span className="text-[#D0D0D0] dark:text-[#3A3A3A]">·</span>
                <span className="tracking-wide">{publication.status}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: content ID + enter */}
        <div className="flex-shrink-0 flex flex-col items-end justify-between gap-6 pt-1">
          {publication.contentId && (
            <span className="text-[10px] font-mono text-[#8A8A8A] dark:text-[#5A5A5A]">
              {publication.contentId}
            </span>
          )}
          <span className="text-xs text-[#8A8A8A] group-hover:text-[#C9963A] transition-colors duration-300 whitespace-nowrap">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
