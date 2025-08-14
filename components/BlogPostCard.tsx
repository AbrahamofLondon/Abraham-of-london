// components/BlogPostCard.tsx
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/date';
import { Post } from '@/types';

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
}: Post) {
  const initialSrc: string | StaticImageData =
    typeof coverImage === 'object' && coverImage !== null
      ? coverImage
      : (typeof coverImage === 'string' && coverImage.trim())
      ? coverImage
      : DEFAULT_COVER;

  const titleId = `post-${slug}-title`;
  const iso = new Date(date).toString() === 'Invalid Date' ? undefined : new Date(date).toISOString();
  const displayDate = formatDate(date, 'en-GB');

  let currentSrc: string | StaticImageData = initialSrc;
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.src.includes(DEFAULT_COVER)) return;
    img.src = DEFAULT_COVER;
    currentSrc = DEFAULT_COVER;
  };

  const metaImageContent: string = typeof currentSrc === 'string' ? currentSrc : (currentSrc as StaticImageData).src;

  return (
    <article
      className="group rounded-xl border border-[var(--color-lightGrey)] bg-[var(--color-warmWhite)] shadow-card hover:shadow-cardHover transition overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)]"
      itemScope
      itemType="https://schema.org/BlogPosting"
      aria-labelledby={titleId}
    >
      <Link href={`/blog/${slug}`} className="block relative w-full h-56 outline-none" prefetch={false}>
        {typeof currentSrc === 'string' ? (
          <Image
            src={currentSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={handleImgError}
            priority={false}
          />
        ) : (
          <Image
            src={currentSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            placeholder="blur"
            priority={false}
          />
        )}
        <meta itemProp="image" content={metaImageContent} />
      </Link>

      <div className="p-4">
        {category && (
          <span className="inline-block text-xs rounded bg-[var(--color-warmWhite)] border border-[var(--color-lightGrey)] px-2 py-1 text-[var(--color-on-secondary)]/80 mb-2">
            {category}
          </span>
        )}

        <h3
          id={titleId}
          className="text-xl font-serif text-[var(--color-on-secondary)] group-hover:underline mb-2"
          itemProp="headline"
        >
          <Link
            href={`/blog/${slug}`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {title}
          </Link>
        </h3>

        <p className="text-sm text-[var(--color-on-secondary)]/80 line-clamp-3" itemProp="description">
          {excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-on-secondary)]/60">
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