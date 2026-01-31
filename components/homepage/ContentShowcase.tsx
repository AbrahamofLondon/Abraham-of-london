import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Vault, PenTool } from "lucide-react";

import BlogPostCard from "@/components/BlogPostCard";
import BookCard from "@/components/books/BookCard";
import { safeSlice } from "@/lib/utils/safe";

interface ContentItem {
  slug: string;
  title: string;
  _type?: string;
  type?: string;
  _id?: string;
  id?: string;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  date?: string;
  author?: any;
  tags?: string[];
  featured?: boolean;
  [key: string]: any;
}

const asBlogPost = (item: ContentItem): any => {
  const { slug, title, excerpt, description, ...rest } = item;
  return {
    slug: slug || "",
    title: title || "Untitled",
    excerpt: excerpt || description || "",
    coverImage: rest.coverImage ?? null,
    date: rest.date ?? null,
    author: rest.author ?? null,
    tags: Array.isArray(rest.tags) ? rest.tags : [],
    featured: Boolean(rest.featured),
    ...rest,
  };
};

const asBook = (item: ContentItem): any => {
  const { slug, title, excerpt, description, _id, id, ...rest } = item;
  return {
    slug: slug || "",
    title: title || "Untitled",
    excerpt: excerpt || description || "",
    coverImage: rest.coverImage ?? null,
    date: rest.date ?? null,
    author: rest.author ?? null,
    tags: Array.isArray(rest.tags) ? rest.tags : [],
    featured: Boolean(rest.featured),
    _id: _id || id || `book-${slug || Date.now()}`,
    ...rest,
  };
};

interface ContentShowcaseProps {
  items: ContentItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  maxItems?: number;
  className?: string;
}

export default function ContentShowcase({
  items,
  title = "Signal Feed",
  description = "High-signal writing and assets engineered for deployment — not entertainment.",
  viewAllHref = "/resources",
  viewAllLabel = "Browse resources",
  maxItems = 6,
  className = "",
}: ContentShowcaseProps): JSX.Element {
  const validItems = (items || []).filter(
    (item) => item && typeof item === "object" && item.slug && item.title
  );

  const displayedItems = safeSlice(validItems, 0, maxItems);

  return (
    <section className={`relative bg-black py-24 ${className}`}>
      {/* Technical Grid Overlay */}
      <div className="bg-grid-technical mask-radial-fade absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="signal-dot" />
            <span className="text-kicker">Intelligence Feed</span>
          </div>
          
          <h2 className="heading-statement">
            {title}
          </h2>
          
          {description && (
            <p className="mt-6 max-w-3xl text-xl font-light text-white/40 leading-relaxed">
              {description}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/canon" className="city-gate-card px-6 py-3 flex items-center gap-3 group">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span className="text-metadata text-white/70 group-hover:text-amber-500 transition-colors">Canon</span>
            </Link>
            <Link href="/downloads/vault" className="city-gate-card px-6 py-3 flex items-center gap-3 group">
              <Vault className="h-4 w-4 text-amber-500" />
              <span className="text-metadata text-white/70 group-hover:text-amber-500 transition-colors">Vault</span>
            </Link>
            <Link href="/shorts" className="city-gate-card px-6 py-3 flex items-center gap-3 group">
              <PenTool className="h-4 w-4 text-amber-500" />
              <span className="text-metadata text-white/70 group-hover:text-amber-500 transition-colors">Shorts</span>
            </Link>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item, index) => {
            const type = String(item._type || item.type || "").toLowerCase();
            const key = item.slug || item._id || item.id || `item-${index}`;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                {type === "post" ? (
                  <BlogPostCard post={asBlogPost(item)} />
                ) : type === "book" ? (
                  <BookCard book={asBook(item)} />
                ) : (
                  <div className="city-gate-card p-8 h-full flex flex-col">
                    <span className="text-metadata mb-6 italic opacity-50">Artefact // {index + 1}</span>
                    <h3 className="font-serif text-2xl font-light text-white group-hover:text-amber-500 transition-colors">
                      {item.title || "Untitled"}
                    </h3>
                    <p className="mt-4 text-sm font-light leading-relaxed text-white/40 flex-grow">
                      {item.excerpt || item.description || "High-signal object designed for deployment."}
                    </p>
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <Link href={`/resources/${item.slug}`} className="text-kicker flex items-center gap-2 group/btn">
                            Access Module <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* View All CTA */}
        {validItems.length > maxItems && (
          <div className="mt-16 flex justify-center">
            <Link
              href={viewAllHref}
              className="group city-gate-card px-10 py-5 flex items-center gap-4 hover:border-amber-500/50"
            >
              <span className="text-metadata group-hover:text-white transition-colors">{viewAllLabel}</span>
              <ArrowRight className="h-4 w-4 text-amber-500 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}