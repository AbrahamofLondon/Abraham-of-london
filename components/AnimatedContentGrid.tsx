// components/AnimatedContentGrid.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Download, ChevronRight } from "lucide-react";

export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon"
  | "strategy"
  | "page";

export type ContentCard = {
  type: DocKind | string;
  slug: string;
  href: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  tags?: string[] | null;
  image?: string | null;
  downloadUrl?: string | null;
};

type TypeConfigItem = {
  label: string;
  bg: string;
  accent: string;
  border: string;
};

type Props = {
  filteredDocs: ContentCard[];
  filter: DocKind | "all";
  TYPE_CONFIG: Record<string, TypeConfigItem>;
};

export function AnimatedContentGrid({ filteredDocs, filter, TYPE_CONFIG }: Props) {
  return (
    <AnimatePresence mode="wait">
      {filteredDocs.length > 0 ? (
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredDocs.map((doc, index) => {
            const config =
              TYPE_CONFIG[String(doc.type)] ??
              ({
                label: String(doc.type ?? "Content"),
                bg: "bg-neutral-50",
                accent: "text-neutral-800",
                border: "border-neutral-200/70",
              } satisfies TypeConfigItem);

            const dateObj = doc.date ? new Date(doc.date) : null;

            return (
              <motion.div
                key={`${String(doc.type)}-${doc.slug}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
              >
                <Link href={doc.href} className="group block h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl">
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
                      <Image
                        src={doc.image || "/assets/images/writing-desk.webp"}
                        alt={doc.title}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-6">
                      {/* Meta Row */}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                            config.bg,
                            config.accent,
                            config.border,
                          ].join(" ")}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {config.label}
                        </span>

                        {dateObj ? (
                          <time className="text-xs font-medium text-neutral-500">
                            {dateObj.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        ) : null}
                      </div>

                      {/* Title */}
                      <h3 className="mb-3 font-serif text-xl font-normal leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700">
                        {doc.title}
                      </h3>

                      {/* Excerpt */}
                      {doc.excerpt || doc.description ? (
                        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-600">
                          {doc.excerpt || doc.description}
                        </p>
                      ) : null}

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 ? (
                        <div className="mb-5 flex flex-wrap gap-2">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg border border-neutral-200/50 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 ? (
                            <span className="rounded-lg border border-neutral-200/50 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-400">
                              +{doc.tags.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                        {doc.downloadUrl ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                            <Download className="h-3.5 w-3.5" />
                            <span>Available</span>
                          </div>
                        ) : (
                          <div />
                        )}

                        <div className={["flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2", config.accent].join(" ")}>
                          <span className="text-xs">View</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
