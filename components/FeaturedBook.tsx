import React from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  author: string;
  slug: string;
  coverImage: string;          // prefer a local /public path
  excerpt?: string;
  pdf?: string | null;         // local /public path recommended
  epub?: string | null;        // local /public path recommended
  className?: string;
  priority?: boolean;          // optional; true only if above-the-fold
};

const DEFAULT_COVER = "/assets/images/default-book.jpg";
const isExternal = (u?: string | null) => !!u && /^https?:\/\//i.test(u);
const toLocalOrFallback = (src?: string) =>
  src && src.startsWith("/") ? src : DEFAULT_COVER;

export default function FeaturedBook({
  title,
  author,
  slug,
  coverImage,
  excerpt,
  pdf,
  epub,
  className = "",
  priority = false,
}: Props) {
  const [imgSrc, setImgSrc] = React.useState(toLocalOrFallback(coverImage));
  const headingId = React.useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl bg-warmWhite border border-lightGrey/70 shadow-card overflow-hidden mb-14 ${className}`}
      itemScope
      itemType="https://schema.org/Book"
    >
      <meta itemProp="name" content={title} />
      <meta itemProp="author" content={author} />

      <div className="grid md:grid-cols-2">
        <figure className="relative h-72 md:h-full m-0">
          <Image
            src={imgSrc}
            alt={`${title} — book cover`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority}
            onError={() => setImgSrc(DEFAULT_COVER)}
          />
          <meta itemProp="image" content={imgSrc} />
        </figure>

        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h2 id={headingId} className="font-serif text-3xl text-forest mb-2">
            Featured Book
          </h2>

          <h3 className="text-2xl font-semibold mb-1" itemProp="name">
            {title}
          </h3>

          <p className="text-sm text-deepCharcoal/80 mb-4">
            By <span itemProp="author">{author}</span>
          </p>

          {excerpt && (
            <p className="text-deepCharcoal mb-6" itemProp="description">
              {excerpt}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/books/${slug}`}
              prefetch={false}
              className="bg-forest text-cream px-4 py-2 rounded-[6px] hover:bg-softGold hover:text-forest transition"
              aria-labelledby={headingId}
            >
              Learn more
            </Link>

            {pdf && (
              <a
                href={pdf}
                {...(isExternal(pdf)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : { download: "" })}
                className="border-2 border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition"
                itemProp="workExample"
              >
                Download PDF
              </a>
            )}

            {epub && (
              <a
                href={epub}
                {...(isExternal(epub)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : { download: "" })}
                className="border-2 border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition"
                itemProp="workExample"
              >
                Download EPUB
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
