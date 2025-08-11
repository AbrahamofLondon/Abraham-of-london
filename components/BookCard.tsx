// components/BookCard.tsx
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
  const imageSrc = coverImage && coverImage.trim().length > 0 ? coverImage : '/assets/images/default-book.jpg';

  return (
    <div className="border rounded-xl shadow-md p-4 bg-white flex flex-col justify-between transition hover:shadow-lg">
      <Link href={`/books/${slug}`} className="block">
        <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="flex-1">
        <h2 className="text-xl font-semibold text-deepCharcoal mb-1">
          <Link href={`/books/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-deepCharcoal/70 mb-1">{author}</p>
        {genre && <p className="text-sm italic text-deepCharcoal/60 mb-2">{genre}</p>}
        <p className="text-sm text-deepCharcoal/80 mb-4">{excerpt}</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        <Link
          href={`/books/${slug}`}
          className="flex-1 text-center bg-forest text-cream px-3 py-2 rounded hover:bg-midGreen text-sm transition"
        >
          Read / Buy (free)
        </Link>
        {buyLink && buyLink !== '#' && (
          <a
            href={buyLink}
            className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Now
          </a>
        )}
        {downloadPdf && (
          <a
            href={downloadPdf}
            className="flex-1 text-center border border-forest text-forest px-3 py-2 rounded hover:bg-forest hover:text-cream text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF
          </a>
        )}
        {downloadEpub && (
          <a
            href={downloadEpub}
            className="flex-1 text-center border border-forest text-forest px-3 py-2 rounded hover:bg-forest hover:text-cream text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            EPUB
          </a>
        )}
      </div>
    </div>
  );
};

export default BookCard;
