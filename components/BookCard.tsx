import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion, type MotionProps } from "framer-motion";
import clsx from "clsx";

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
  motionProps?: MotionProps;
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
  motionProps = {},
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
      {...motionProps}
      className={clsx(
        // calm, premium surface
        "group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all duration-300 hover:shadow-cardHover",
        className
      )}
    >
      <Link href={`/books/${slug}`} aria-label={`Open book: ${title}`} className="block">
        <div className="relative h-80 w-full">
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="rounded-t-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            onError={typeof src === "string" ? handleImgError : undefined}
            priority={featured}
          />
          <span className="pointer-events-none absolute inset-0 rounded-t-2xl bg-gradient-to-t from-black/10 to-transparent" />
          {featured && (
            <span className="absolute left-4 top-4 rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-deepCharcoal shadow">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="p-6">
        <h3 className="mb-1 font-serif text-2xl font-semibold leading-snug text-deepCharcoal transition-colors group-hover:text-forest">
          <Link href={`/books/${slug}`}>{title}</Link>
        </h3>
        <p className="mb-2 text-sm text-deepCharcoal/70">By {author}</p>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-deepCharcoal/90">
          {excerpt}
        </p>

        <p className="mb-5 text-xs uppercase tracking-[0.14em] text-deepCharcoal/60">
          {genre || "Uncategorized"}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/books/${slug}`}
            className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
            aria-label={`Learn more about ${title}`}
          >
            Details
          </Link>

          {buyLink && buyLink !== "#" && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-deepCharcoal px-4 py-2 text-sm font-semibold text-deepCharcoal transition hover:bg-deepCharcoal hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/20"
            >
              Buy
            </a>
          )}

          {downloadPdf && (
            <a
              href={downloadPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-forest underline underline-offset-4 hover:text-primary-hover"
            >
              PDF
            </a>
          )}

          {downloadEpub && (
            <a
              href={downloadEpub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-forest underline underline-offset-4 hover:text-primary-hover"
            >
              EPUB
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
