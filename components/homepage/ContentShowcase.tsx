// components/homepage/ContentShowcase.tsx — SIGNAL FEED (institutional)
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
    <section className={`relative bg-black py-20 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(245,158,11,0.06),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
            Intelligence
          </p>
          <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-6 max-w-3xl text-xl font-light text-gray-300">
              {description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/canon"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-amber-500/15 transition-all"
            >
              <BookOpen className="h-4 w-4 text-amber-300" />
              Canon
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/downloads/vault"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
            >
              <Vault className="h-4 w-4 text-amber-300" />
              Vault
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
            >
              <PenTool className="h-4 w-4 text-amber-300" />
              Shorts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Content Grid */}
        {displayedItems.length > 0 ? (
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
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                >
                  {type === "post" ? (
                    <BlogPostCard post={asBlogPost(item)} />
                  ) : type === "book" ? (
                    <BookCard book={asBook(item)} />
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                        Object
                      </p>
                      <h3 className="mt-4 font-serif text-2xl font-semibold text-amber-100">
                        {item.title || "Untitled"}
                      </h3>
                      <p className="mt-4 text-sm font-light leading-relaxed text-gray-300">
                        {item.excerpt || item.description || "High-signal object designed for deployment."}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          // No "coming soon" — immediate routing
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
              No browsing required
            </p>
            <h3 className="mt-5 font-serif text-3xl font-semibold text-amber-100">
              Start with the assets that prove substance fast.
            </h3>
            <p className="mt-4 max-w-2xl text-lg font-light text-gray-300">
              If you’re here to judge credibility, don’t scroll. Open the Canon or the Vault and evaluate the artefacts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-4 text-sm font-bold text-black"
              >
                Strategic Frameworks <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/downloads/vault"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-7 py-4 text-sm font-semibold text-amber-200 hover:border-amber-400/45 hover:bg-amber-500/15 transition-all"
              >
                Open the Vault <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* View All CTA */}
        {validItems.length > maxItems ? (
          <div className="mt-12">
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200 transition-all hover:border-amber-400/25 hover:bg-white/10"
            >
              <span>{viewAllLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}