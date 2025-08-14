// components/BookCard.tsx
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';

export type BookCardProps = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | StaticImageData;
  buyLink: string;
  genre?: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

const DEFAULT_BOOK = '/assets/images/default-book.jpg';

export default function BookCard({
  slug,
  title,
  author,
  excerpt,
  coverImage,
  buyLink,
  genre,
  downloadPdf,
  downloadEpub,
}: BookCardProps) {
  const initialSrc: string | StaticImageData =
    typeof coverImage === 'object'
      ? coverImage
      : (typeof coverImage === 'string' && coverImage.trim()) ? coverImage : DEFAULT_BOOK;

  const titleId = `book-${slug}-title`;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.includes(DEFAULT_BOOK)) img.src = DEFAULT_BOOK;
  };

  return (
    <article
      className="group rounded-xl border border-lightGrey bg-white shadow-card hover:shadow-cardHover transition overflow-hidden focus-within:ring-2 focus-within:ring-forest"
      itemScope
      itemType="https://schema.org/Book"
      aria-labelledby={titleId}
    >
      <Link href={`/books/${slug}`} className="block relative w-full h-64 outline-none" prefetch={false}>
        {typeof initialSrc === 'object' ? (
          <Image
            src={initialSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            placeholder="blur"
          />
        ) : (
          <Image
            src={initialSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={handleImgError}
          />
        )}
        <meta itemProp="image" content={typeof initialSrc === 'object' ? initialSrc.src : initialSrc} />
      </Link>

      <div className="p-4">
        {genre && (
          <span className="inline-block text-xs rounded bg-warmWhite border border-lightGrey px-2 py-1 text-deepCharcoal/80 mb-2">
            {genre}
          </span>
        )}

        <h3 id={titleId} className="text-xl font-serif text-deepCharcoal group-hover:underline mb-2" itemProp="name">
          <Link href={`/books/${slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {title}
          </Link>
        </h3>

        <p className="text-sm text-deepCharcoal/80 line-clamp-3" itemProp="description">
          {excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-deepCharcoal/70" itemProp="author">{author}</span>
          <span className="mx-1 text-deepCharcoal/30">•</span>
          <Link href={buyLink || '#'} className="text-forest hover:underline" aria-label={`Buy ${title}`}>
            Buy
          </Link>
          {downloadPdf && (
            <>
              <span className="mx-1 text-deepCharcoal/30">•</span>
              <a
                href={downloadPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest hover:underline"
                aria-label={`Download PDF of ${title}`}
              >
                PDF
              </a>
            </>
          )}
          {downloadEpub && (
            <>
              <span className="mx-1 text-deepCharcoal/30">•</span>
              <a
                href={downloadEpub}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest hover:underline"
                aria-label={`Download EPUB of ${title}`}
              >
                EPUB
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
