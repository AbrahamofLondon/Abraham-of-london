import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion } from "framer-motion";

export type BookCardProps = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | StaticImageData;
  buyLink?: string;
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  featured?: boolean;
  className?: string;
};

const DEFAULT_COVER = "/assets/images/default-book.jpg";

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
  featured = false,
  className = "",
}: BookCardProps) {
  const src: string | StaticImageData =
    typeof coverImage === "object"
      ? coverImage
      : typeof coverImage === "string" && coverImage.trim()
      ? coverImage
      : DEFAULT_COVER;

  const handleImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget as HTMLImageElement & { src: string };
    if (!img.src.endsWith(DEFAULT_COVER)) img.src = DEFAULT_COVER;
  };

  return (
    <motion.article
      className={clsx(
        "group rounded-2xl bg-white shadow-2xl border border-gray-200 hover:shadow-blue-200 transition-all duration-300 overflow-hidden",
        featured && "ring-2 ring-blue-600/20",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
    >
      <Link href={`/books/${slug}`} className="block">
        <motion.div
          className="relative w-full h-80"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover rounded-t-2xl"
            onError={typeof src === "string" ? handleImgError : undefined}
            priority={featured}
          />
          {featured && (
            <span className="absolute top-4 left-4 rounded-full bg-blue-600 text-white text-sm font-semibold px-4 py-1 shadow-lg">
              Featured
            </span>
          )}
        </motion.div>
      </Link>

      <div className="p-6">
        <h3 className="text-2xl font-serif font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          <Link href={`/books/${slug}`}>{title}</Link>
        </h3>
        <p className="text-sm text-gray-600 mb-2">By {author}</p>
        <p className="text-gray-700 text-base line-clamp-3 mb-4">{excerpt}</p>
        <p className="text-sm text-gray-500 mb-4">{genre || "Uncategorized"}</p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/books/${slug}`}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
          >
            Learn More
          </Link>
          {buyLink && buyLink !== "#" && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
              Buy Now
            </a>
          )}
          {downloadPdf && (
            <a
              href={downloadPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition-colors"
            >
              PDF
            </a>
          )}
          {downloadEpub && (
            <a
              href={downloadEpub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition-colors"
            >
              EPUB
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}