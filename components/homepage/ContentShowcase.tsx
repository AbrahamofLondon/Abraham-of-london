// components/homepage/ContentShowcase.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import BlogPostCard from "@/components/BlogPostCard"; // ✅ FIX (default import)
import BookCard from "@/components/books/BookCard";

// -----------------------------------------------------------------------------
// Types - ENSURE required properties exist
// -----------------------------------------------------------------------------

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
  title = "Latest Content",
  description = "Explore our latest writings and resources",
  viewAllHref = "/content",
  viewAllLabel = "View all content",
  maxItems = 6,
  className = "",
}: ContentShowcaseProps): JSX.Element {
  const validItems = (items || []).filter(
    (item) => item && typeof item === "object" && item.slug && item.title,
  );

  const displayedItems = validItems.slice(0, maxItems);

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-serif text-3xl font-semibold text-deepCharcoal md:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              {description}
            </p>
          ) : null}
        </motion.div>

        {/* Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item, index) => {
            const type = String(item._type || item.type || "").toLowerCase();
            const key = item.slug || item._id || item.id || `item-${index}`;

            if (type === "post") {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                >
                  <BlogPostCard post={asBlogPost(item)} />
                </motion.div>
              );
            }

            if (type === "book") {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                >
                  <BookCard book={asBook(item)} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
              >
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 backdrop-blur-sm">
                  <h3 className="font-semibold text-deepCharcoal">
                    {item.title || "Untitled"}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Type: {type || "unknown"}
                  </p>
                  {item.excerpt ? (
                    <p className="mt-2 text-sm text-gray-500">{item.excerpt}</p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All CTA */}
        {validItems.length > maxItems ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-semibold text-cream transition-all hover:bg-forest/90 hover:shadow-lg"
            >
              <span>{viewAllLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ) : null}

        {/* Empty State */}
        {displayedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto max-w-md rounded-2xl bg-warmWhite/50 p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-softGold/20">
                <FileText className="h-8 w-8 text-softGold" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-deepCharcoal">
                Content Coming Soon
              </h3>
              <p className="mt-2 text-gray-600">
                We&apos;re preparing some valuable content for you. Check back
                soon!
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
