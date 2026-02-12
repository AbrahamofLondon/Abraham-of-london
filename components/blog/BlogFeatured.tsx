'use client';

import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

interface BlogFeaturedProps {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
  };
}

export default function BlogFeatured({ post }: BlogFeaturedProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 md:p-12">
      <div className="absolute right-0 top-0 p-8 opacity-10">
        <Shield className="h-24 w-24 text-amber-500" />
      </div>
      
      <div className="relative z-10 max-w-3xl">
        <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
          Featured Intelligence
        </span>
        
        <Link href={`/blog/${post.slug}`}>
          <h2 className="mt-4 font-serif text-3xl font-medium text-cream hover:text-amber-500 transition-colors md:text-4xl">
            {post.title}
          </h2>
        </Link>
        
        <time className="mt-4 block text-sm text-gray-500">{post.date}</time>
        
        {post.excerpt && (
          <p className="mt-6 text-lg text-gray-400 leading-relaxed">{post.excerpt}</p>
        )}
        
        <Link
          href={`/blog/${post.slug}`}
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-400"
        >
          Access Full Brief <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}