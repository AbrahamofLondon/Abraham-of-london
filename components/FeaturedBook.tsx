import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  author: string;
  slug: string;
  coverImage: string;
  excerpt?: string;
  pdf?: string | null;
  epub?: string | null;
};

export default function FeaturedBook({
  title,
  author,
  slug,
  coverImage,
  excerpt,
  pdf,
  epub,
}: Props) {
  return (
    <section
      aria-labelledby="featured-book"
      className="rounded-2xl bg-warmWhite border border-lightGrey/70 shadow-card overflow-hidden mb-14"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative h-72 md:h-full">
          <Image
            src={coverImage}
            alt={`${title} cover`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h2
            id="featured-book"
            className="font-serif text-3xl text-forest mb-2"
          >
            Featured Book
          </h2>
          <h3 className="text-2xl font-semibold mb-1">{title}</h3>
          <p className="text-sm text-deepCharcoal/80 mb-4">By {author}</p>
          {excerpt && <p className="text-deepCharcoal mb-6">{excerpt}</p>}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/books/${slug}`}
              className="bg-forest text-cream px-4 py-2 rounded-[6px] hover:bg-softGold hover:text-forest transition"
            >
              Learn more
            </Link>
            {pdf && (
              <a
                href={pdf}
                className="border-2 border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition"
                download
              >
                Download PDF
              </a>
            )}
            {epub && (
              <a
                href={epub}
                className="border-2 border-forest text-forest px-4 py-2 rounded-[6px] hover:bg-forest hover:text-cream transition"
                download
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




