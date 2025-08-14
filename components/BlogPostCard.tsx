// components/BlogPostCard.tsx
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { formatDate } from '../lib/date';

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date: string; // ISO or readable; we'll try to parse intelligently
  excerpt: string;
  coverImage?: string | StaticImageData;
  author: string;
  readTime?: string;
  category?: string;
};

const DEFAULT_COVER = '/assets/images/blog/default-blog-cover.jpg';

export default function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author,
  readTime,
  category,
}: BlogPostCardProps) {
  // Normalize image source
  const initialSrc: string | StaticImageData =
    typeof coverImage === 'object'
      ? coverImage
      : (typeof coverImage === 'string' && coverImage.trim()) ? coverImage : DEFAULT_COVER;

  const titleId = `post-${slug}-title`;
  const iso = new Date(date).toString() === 'Invalid Date' ? undefined : new Date(date).toISOString();
  const displayDate = formatDate(date, 'en-GB');

  // We keep it simple: onError always falls back to the local default (string path)
  let currentSrc: string | StaticImageData = initialSrc;
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.src.includes(DEFAULT_COVER)) return; // already default
    img.src = DEFAULT_COVER;
  };

  return (
    <article
      className="group rounded-xl border border-lightGrey bg-white shadow-card hover:shadow-cardHover transition overflow-hidden focus-within:ring-2 focus-within:ring-forest"
      itemScope
      itemType="https://schema.org/BlogPosting"
      aria-labelledby={titleId}
    >
      <Link href={`/blog/${slug}`} className="block relative w-full h-56 outline-none" prefetch={false}>
        {/* For StaticImageData, Next can blur; for string we keep it simple */}
        {typeof currentSrc === 'object' ? (
          <Image
            src={currentSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            placeholder="blur"
            priority={false}
          />
        ) : (
          <Image
            src={currentSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={handleImgError}
            priority={false}
          />
        )}
        <meta itemProp="image" content={typeof currentSrc === 'object' ? currentSrc.src : currentSrc} />
      </Link>

      <div className="p-4">
        {category && (
          <span className="inline-block text-xs rounded bg-warmWhite border border-lightGrey px-2 py-1 text-deepCharcoal/80 mb-2">
            {category}
          </span>
        )}

        <h3 id={titleId} className="text-xl font-serif text-deepCharcoal group-hover:underline mb-2" itemProp="headline">
          <Link href={`/blog/${slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {title}
          </Link>
        </h3>

        <p className="text-sm text-deepCharcoal/80 line-clamp-3" itemProp="description">
          {excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-deepCharcoal/60">
          <span itemProp="author" itemScope itemType="https://schema.org/Person">
            <span itemProp="name">{author}</span>
          </span>
          <span>
            {readTime ? `${readTime} · ` : ''}
            <time dateTime={iso} itemProp="datePublished">
              {displayDate}
            </time>
          </span>
        </div>
      </div>
    </article>
  );
}
