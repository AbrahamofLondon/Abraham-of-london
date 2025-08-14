// components/BookCard.tsx
import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { motion } from 'framer-motion';
import { Book } from '@/types';

const DEFAULT_COVER = '/assets/images/default-book.jpg';

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
}: Book) {
  const initialSrc: string | StaticImageData =
    typeof coverImage === 'object'
      ? coverImage
      : (typeof coverImage === 'string' && coverImage.trim())
      ? coverImage
      : DEFAULT_COVER;

  let currentSrc: string | StaticImageData = initialSrc;
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.src.includes(DEFAULT_COVER)) return;
    img.src = DEFAULT_COVER;
  };

  return (
    <article className="group rounded-xl border border-lightGrey bg-white shadow-card hover:shadow-cardHover transition overflow-hidden">
      <Link href={`/books/${slug}`}>
        <motion.div
          className="relative w-full h-64"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          {typeof currentSrc === 'object' ? (
            <Image
              src={currentSrc}
              alt={title}
              fill
              className="object-cover rounded"
              sizes="(max-width: 768px) 100vw, 33vw"
              placeholder="blur"
              priority={false}
            />
          ) : (
            <Image
              src={currentSrc}
              alt={title}
              fill
              className="object-cover rounded"
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={handleImgError}
              priority={false}
            />
          )}
        </motion.div>
      </Link>
      <div className="p-4">
        <h3 className="text-xl font-serif text-deepCharcoal group-hover:underline mb-2">{title}</h3>
        <p className="text-sm text-deepCharcoal/80 line-clamp-3">{excerpt}</p>
        <p className="text-xs text-deepCharcoal/60 mt-2">{author} • {genre}</p>
        {(downloadPdf || downloadEpub) && (
          <div className="mt-4 flex gap-2">
            {downloadPdf && (
              <a href={downloadPdf} className="text-forest underline" target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            )}
            {downloadEpub && (
              <a href={downloadEpub} className="text-forest underline" target="_blank" rel="noopener noreferrer">
                EPUB
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}