// components/Cards/CanonResourceCard.tsx
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface CanonCardProps {
  canon: {
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    description?: string | null;
    coverImage?: string | null;
    volumeNumber?: number | string | null;
    date?: string | null;
    tags?: string[];
    featured?: boolean;
    accessLevel?: string | null;
    lockMessage?: string | null;
  };
  className?: string;
}

const CanonResourceCard: React.FC<CanonCardProps> = ({ canon, className = '' }) => {
  const isLocked = canon.accessLevel === 'inner-circle' || canon.accessLevel === 'premium';
  const displayText = canon.excerpt || canon.description || canon.subtitle || '';
  const displayTags = canon.tags?.slice(0, 3) || [];

  return (
    <Link
      href={`/canon/${canon.slug}`}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
    >
      <article className="flex h-full flex-col overflow-hidden">
        {canon.coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={canon.coverImage}
              alt={canon.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {canon.featured && (
              <div className="absolute left-3 top-3 rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Featured
              </div>
            )}
            
            {canon.volumeNumber && (
              <div className="absolute right-3 top-3 rounded-full border border-softGold/30 bg-black/60 px-3 py-1 text-xs font-bold text-softGold backdrop-blur-sm">
                Vol. {canon.volumeNumber}
              </div>
            )}
            
            {isLocked && (
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-400/90 backdrop-blur-sm">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Inner Circle
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

          <div className="space-y-2">
            {canon.volumeNumber && !canon.coverImage && (
              <p className="text-xs font-bold uppercase tracking-wider text-softGold/80">
                Volume {canon.volumeNumber}
              </p>
            )}
            
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors group-hover:text-softGold">
              {canon.title}
            </h3>
            
            {canon.subtitle && (
              <p className="text-sm font-medium text-gray-400">
                {canon.subtitle}
              </p>
            )}
          </div>

          {displayText && (
            <p className="text-sm leading-relaxed text-gray-300 line-clamp-3">
              {displayText}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            {canon.date && (
              <time className="text-xs text-gray-400">
                {new Date(canon.date).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            
            {isLocked && canon.lockMessage && (
              <span className="text-xs italic text-amber-400/80">
                {canon.lockMessage}
              </span>
            )}
            
            <div className="ml-auto flex items-center gap-1 text-xs font-medium text-softGold/70 transition-colors group-hover:text-softGold">
              Read
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default CanonResourceCard;