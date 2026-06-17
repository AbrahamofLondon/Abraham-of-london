import { safeArraySlice } from "@/lib/utils/safe";
import React from 'react';
import Link from 'next/link';

interface RelatedShort {
  id: string;
  title: string;
  excerpt: string;
  duration: string;
  category: string;
  viewCount: number;
  image: string;
  slug: string;
}

interface RelatedShortsProps {
  shorts: RelatedShort[];
  currentShortId: string;
}

const RelatedShorts: React.FC<RelatedShortsProps> = ({ shorts, currentShortId }) => {
  // First filter, then explicitly type the slice
  const filtered = shorts.filter((s) => s.id !== currentShortId);
  const filteredShorts: RelatedShort[] = safeArraySlice(filtered, 0, 4);

  if (filteredShorts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-xl font-light text-white/85">More Shorts</h2>
          <p className="mt-1 text-sm text-white/40">Continue reading</p>
        </div>
        <Link
          href="/shorts"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/70 hover:text-amber-400 transition-colors"
        >
          View all
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredShorts.map((short: RelatedShort) => (
          <Link key={short.id} href={`/shorts/${short.slug}`}>
            <div className="group border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer">
              <h3 className="font-serif font-light text-white/80 group-hover:text-white transition-colors line-clamp-2" style={{ fontSize: "clamp(0.95rem, 1.1vw, 1.05rem)", lineHeight: 1.2 }}>
                {short.title}
              </h3>
              
              {short.excerpt && (
                <p className="mt-2 text-sm text-white/40 line-clamp-2 leading-relaxed">
                  {short.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default RelatedShorts;