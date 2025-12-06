// components/Cards/BlogPostCard.tsx
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface BlogPostCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  author?: string | { name: string; picture?: string } | null;
  tags?: string[];
  featured?: boolean;
  readTime?: string | number | null;
  category?: string | null;
  className?: string;
  href?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  date,
  author,
  tags = [],
  featured = false,
  readTime,
  category,
  className = '',
  href,
}) => {
  const linkHref = href || `/blog/${slug}`;
  const displayText = excerpt || description || subtitle || '';
  const displayTags = tags.slice(0, 3);

  const authorName = typeof author === 'string' 
    ? author 
    : author?.name || null;

  const authorPicture = typeof author === 'object' && author !== null
    ? author.picture
    : null;

  const readTimeText = typeof readTime === 'number'
    ? `${readTime} min read`
    : readTime || null;

  return (
    <Link
      href={linkHref}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
    >
      <article className="flex h-full flex-col overflow-hidden">
        {coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {featured && (
              <div className="absolute left-3 top-3 rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Featured
              </div>
            )}
            {category && (
              <div className="absolute right-3 top-3 rounded-full border border-softGold/40 bg-black/60 px-3 py-1 text-xs font-semibold text-softGold backdrop-blur-sm">
                {category}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-5">
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-softGold/20 bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors group-hover:text-softGold">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm font-medium text-gray-400">{subtitle}</p>
            )}
          </div>

          {displayText && (
            <p className="text-sm leading-relaxed text-gray-300 line-clamp-3">
              {displayText}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              {authorPicture && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <Image
                    src={authorPicture}
                    alt={authorName || 'Author'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col">
                {authorName && (
                  <span className="text-xs font-medium text-gray-300">
                    {authorName}
                  </span>
                )}
                {date && (
                  <time className="text-xs text-gray-400">
                    {new Date(date).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </div>
            </div>
            {readTimeText && (
              <span className="text-xs text-gray-400">{readTimeText}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogPostCard;