// components/BookCard.tsx
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
  featured?: boolean; // <-- new
  className?: string; // <-- optional styling hook
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
    <article
      className={[
        "group rounded-xl border border-lightGrey bg-white shadow-card hover:shadow-cardHover transition overflow-hidden",
        featured ? "ring-2 ring-forest/20" : "",
        className,
      ].join(" ")}
    >
      <Link href={`/books/${slug}`} className="block">
        <motion.div
          className="relative w-full h-64"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={typeof src === "string" ? handleImgError : undefined}
            priority={featured}
          />
          {featured && (
            <span className="absolute top-3 left-3 rounded-full bg-forest text-cream text-xs font-semibold px-3 py-1 shadow">
              Featured
            </span>
          )}
        </motion.div>
      </Link>

      <div className="p-4">
        <h3 className="text-xl font-serif text-deepCharcoal group-hover:underline mb-1">
          <Link href={`/books/${slug}`}>{title}</Link>
        </h3>
        <p className="text-xs text-deepCharcoal/70 mb-2">By {author}</p>
        <p className="text-sm text-deepCharcoal/85 line-clamp-3">{excerpt}</p>
        <p className="text-xs text-deepCharcoal/60 mt-2">
          {genre || "Uncategorized"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/books/${slug}`}
            className="bg-forest text-cream px-4 py-2 rounded-[6px] hover:bg-midGreen transition-colors cursor-pointer"
          >
            Learn more
          </Link>

          {buyLink && buyLink !== "#" && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition-colors cursor-pointer"
            >
              Buy
            </a>
          )}

          {downloadPdf && (
            <a
              href={downloadPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest/90 underline underline-offset-4 hover:text-forest"
            >
              PDF
            </a>
          )}

          {downloadEpub && (
            <a
              href={downloadEpub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest/90 underline underline-offset-4 hover:text-forest"
            >
              EPUB
            </a>
          )}
        </div>
      </div>
    </article>
  );
}







