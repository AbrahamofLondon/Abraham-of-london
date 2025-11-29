// components/homepage/ContentShowcase.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import BlogPostCard from "@/components/BlogPostCard"; // Fixed import path
import BookCard from "@/components/books/BookCard";
import type { PostMeta, BookMeta } from "@/types/index";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ContentItem =
  | (PostMeta & { _type: "post" })
  | (BookMeta & { _type: "book" });

interface ContentShowcaseProps {
  items: ContentItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  maxItems?: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Type Guards
// -----------------------------------------------------------------------------

const isPostItem = (
  item: ContentItem
): item is PostMeta & { _type: "post" } => {
  return item._type === "post";
};

const isBookItem = (
  item: ContentItem
): item is BookMeta & { _type: "book" } => {
  return item._type === "book";
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function ContentShowcase({
  items,
  title = "Latest Content",
  description = "Explore our latest writings and resources",
  viewAllHref = "/content",
  viewAllLabel = "View all content",
  maxItems = 6,
  className = "",
}: ContentShowcaseProps): JSX.Element {
  const displayedItems = items.slice(0, maxItems);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

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
          {description && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              {description}
            </p>
          )}
        </motion.div>

        {/* Content Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {displayedItems.map((item) => {
            if (isPostItem(item)) {
              return (
                <motion.div key={item.slug} variants={itemVariants}>
                  <BlogPostCard post={item} />
                </motion.div>
              );
            } else if (isBookItem(item)) {
              return (
                <motion.div key={item.slug} variants={itemVariants}>
                  <BookCard book={item} />
                </motion.div>
              );
            }
            return null;
          })}
        </motion.div>

        {/* View All CTA */}
        {items.length > maxItems && (
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
        )}

        {/* Empty State */}
        {displayedItems.length === 0 && (
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
                We're preparing some valuable content for you. Check back soon!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
