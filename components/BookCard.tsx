// components/BookCard.tsx
import Image from 'next/image';
import Link from 'next/link';

export interface BookCardProps {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string;
  buyLink?: string;
  pdfLink?: string;
  epubLink?: string;
  genre?: string;
}

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  author,
  excerpt,
  coverImage,
  buyLink,
  pdfLink,
  epubLink,
  genre,
}) => {
  const imageSrc = coverImage || '/assets/images/default-book.jpg';

  return (
    <div className="border rounded-xl shadow-md p-4 mb-6 bg-white dark:bg-zinc-900">
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
      <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
        <Link href={`/books/${slug}`}>{title}</Link>
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{author}</p>
      {genre && <p className="text-sm italic text-zinc-500 dark:text-zinc-400 mb-2">{genre}</p>}
      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">{excerpt}</p>
      <div className="flex flex-wrap gap-2">
        {buyLink && (
          <a
            href={buyLink}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy
          </a>
        )}
        {pdfLink && (
          <a
            href={pdfLink}
            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 text-sm"
            download
          >
            Download PDF
          </a>
        )}
        {epubLink && (
          <a
            href={epubLink}
            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 text-sm"
            download
          >
            Download EPUB
          </a>
        )}
      </div>
    </div>
  );
};

export default BookCard;
