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
    <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all hover:border-amber-500/20 hover:shadow-2xl">
      <Link href={`/blog/${post.slug}`} className="block space-y-4">
        <h3 className="font-serif text-2xl font-medium text-cream group-hover:text-amber-500 transition-colors">
          {post.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.date}
          </span>
        </div>

        {post.excerpt && (
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            Read Brief
          </span>
          <ChevronRight className="h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-500" />
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400"
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