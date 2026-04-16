'use client';

import Link from 'next/link';
import { Clock, Tag, ChevronRight } from 'lucide-react';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
    tags?: string[];
  };
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/12 bg-[#0E0E12] p-6 backdrop-blur-sm transition-all hover:border-[#F59E0B]/20 hover:shadow-[0_28px_80px_-30px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.05),0_0_36px_rgba(201,169,110,0.06)]">
      <Link href={`/blog/${post.slug}`} className="block space-y-4">
        <h3 className="font-serif text-2xl font-medium text-white group-hover:text-[#F59E0B] transition-colors">
          {post.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-white/66">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.date}
          </span>
        </div>

        {post.excerpt && (
          <p className="text-sm text-white/85 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B]">
            Read Brief
          </span>
          <ChevronRight className="h-4 w-4 text-white/66 transition-transform group-hover:translate-x-1 group-hover:text-[#F59E0B]" />
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/12 pt-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/85"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}