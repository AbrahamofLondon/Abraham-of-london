import Image from 'next/image';
import Link from 'next/link';

export interface BookCardProps {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  buyLink?: string;
  genre?: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  author,
  excerpt,
  coverImage,
  buyLink,
  downloadPdf,
  downloadEpub,
  genre,
}) => {
  // slug-aware fallback, then project default
  const imageSrc =
    (coverImage && coverImage.trim()) ||
    (slug === 'fathering-without-fear'
      ? '/assets/images/fathering-without-fear.jpg'
      : '/assets/images/default-book.jpg');

  const internalBookUrl = `/books/${slug}`;
  const hasExternalBuy = !!buyLink && buyLink !== '#';

  return (
    <article
      className="border rounded-xl shadow-card p-4 bg-white flex flex-col justify-between transition hover:shadow-cardHover"
      aria-label={`${title} by ${author}`}
    >
      {/* Cover */}
      <Link href={internalBookUrl} className="block group">
        <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={`Cover of ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Title & Meta */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">
          <Link href={internalBookUrl} className="hover:underline">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-zinc-600 mb-1">{author}</p>
        {genre && <p className="text-sm italic text-zinc-500 mb-2">{genre}</p>}
        <p className="text-sm text-zinc-700 mb-4">{excerpt}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {/* Always offer the internal book page (free read / details) */}
        <Link
          href={internalBookUrl}
          className="flex-1 text-center bg-forest text-cream px-3 py-2 rounded hover:bg-softGold hover:text-forest text-sm transition"
          aria-label={`Open ${title}`}
        >
          Read / Buy (free)
        </Link>

        {/* Optional: external buyLink if provided */}
        {hasExternalBuy && (
          <a
            href={buyLink}
            className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buy ${title} externally`}
          >
            Buy Now
          </a>
        )}

        {/* Optional downloads */}
        {downloadPdf && (
          <a
            href={downloadPdf}
            className="flex-1 text-center border-2 border-forest text-forest px-3 py-2 rounded hover:bg-forest hover:text-cream text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
            download
            aria-label={`Download ${title} as PDF`}
          >
            PDF
          </a>
        )}
        {downloadEpub && (
          <a
            href={downloadEpub}
            className="flex-1 text-center border-2 border-forest text-forest px-3 py-2 rounded hover:bg-forest hover:text-cream text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
            download
            aria-label={`Download ${title} as EPUB`}
          >
            EPUB
          </a>
        )}
      </div>
    </article>
  );
};

export default BookCard;
