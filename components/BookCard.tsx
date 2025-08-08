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
  const imageSrc = coverImage || '/assets/images/default-book.jpg';

  return (
    <div className="border rounded-xl shadow-md p-4 bg-white dark:bg-zinc-900 flex flex-col justify-between transition hover:shadow-lg">
      {/* Cover */}
      <Link href={`/books/${slug}`} className="block">
        <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority
          />
        </div>
      </Link>

      {/* Title & Meta */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
          <Link href={`/books/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{author}</p>
        {genre && (
          <p className="text-sm italic text-zinc-500 dark:text-zinc-400 mb-2">{genre}</p>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">{excerpt}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {buyLink && buyLink !== '#' && (
          <a
            href={buyLink}
            className="flex-1 text-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Now
          </a>
        )}
        {downloadPdf && (
          <a
            href={downloadPdf}
            className="flex-1 text-center bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF
          </a>
        )}
        {downloadEpub && (
          <a
            href={downloadEpub}
            className="flex-1 text-center bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm transition"
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
