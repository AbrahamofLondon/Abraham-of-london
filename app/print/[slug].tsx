// app/print/[slug].tsx (or app/print/[slug]/page.tsx in app router)
import type React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import mdxComponents from "@/components/mdx-components";
import BrandFrame from "@/components/print/BrandFrame";
import { getAllPrintSlugs, getPrintDocumentBySlug } from "@/lib/server/print-utils";
import type { PrintMeta } from "@/types/print";

/* ---------------------- Type guards / helpers ---------------------- */

const asStringOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : null;

const asStringOrDefault = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

const asBool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

const asKind = (t: unknown): PrintMeta["kind"] => {
  if (t === "book") return "book";
  if (t === "download") return "download";
  return "print";
};

function toCanonicalSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[\/\s-]+|[\/\s-]+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");
  return s || "untitled";
}

function formatPretty(isoish?: string | null, tz = "Europe/London"): string {
  if (!isoish || typeof isoish !== "string") return "Date TBC";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoish)) {
      const d = new Date(`${isoish}T00:00:00Z`);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    }
    const d = new Date(isoish);
    if (Number.isNaN(d.valueOf())) return isoish;
    const date = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${date}, ${time}`;
  } catch {
    return isoish;
  }
}

/* ------------------ Static params (SSG) ----------------- */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const rawSlugs = getAllPrintSlugs() as Array<string | { slug: string }>;
    const unique = Array.from(
      new Set(
        rawSlugs
          .map((item) =>
            typeof item === "string" ? toCanonicalSlug(item) : toCanonicalSlug(item?.slug),
          )
          .filter(Boolean),
      ),
    );
    if (process.env.NODE_ENV === "development") {
      console.log(`🖨️ Generated ${unique.length} print paths`);
    }
    return unique.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

/* -------------------- Metadata (SEO) -------------------- */

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const { slug } = params;
  const doc = getPrintDocumentBySlug(slug);

  if (!doc) {
    return {
      title: "Print Not Found",
      description: "The requested print document was not found.",
      robots: { index: false, follow: true },
    };
  }

  const title = asStringOrDefault((doc as any).title, "Untitled Print");

  const descriptionText =
    asStringOrNull((doc as any).description) ??
    asStringOrNull((doc as any).excerpt) ??
    "Printable document from Abraham of London";

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  return {
    title: `${title} | Print`,
    description: descriptionText,
    openGraph: {
      type: "article",
      title,
      description: descriptionText,
      url: `${site}/print/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: descriptionText,
    },
    robots: { index: false, follow: true },
  };
}

/* --------------------- Page component ------------------- */

interface PageProps {
  params: { slug: string };
}

export default async function PrintPage({ params }: PageProps) {
  const { slug } = params;
  const doc = getPrintDocumentBySlug(slug);
  if (!doc) notFound();

  const d = doc as Record<string, unknown>;

  const meta: PrintMeta = {
    slug,
    title: asStringOrDefault(d.title, "Untitled Print"),
    description: asStringOrNull(d.description),
    excerpt: asStringOrNull(d.excerpt),
    author: asStringOrDefault(d.author, "Abraham of London"),
    date: asStringOrNull(d.date),
    category: asStringOrNull(d.category),
    tags: asStringArray(d.tags),
    coverImage: asStringOrNull(d.coverImage),
    heroImage: asStringOrNull(d.heroImage),
    isChathamRoom: asBool(d.isChathamRoom, false),
    source: asStringOrDefault(d.source, "mdx"),
    kind: asKind(d.type),
    content: asStringOrDefault(d.content, ""),
    published: true,
  };

  let mdx: MDXRemoteSerializeResult | null = null;
  if (meta.content && meta.content.trim()) {
    try {
      const scopeForMdx: Record<string, unknown> = { ...meta };
      mdx = await serialize(meta.content, {
        scope: scopeForMdx,
        mdxOptions: {
          development: process.env.NODE_ENV === "development",
        },
      });
    } catch (error) {
      console.error("Error serializing MDX:", error);
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/print/${slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: meta.title,
    description: meta.description || meta.excerpt || "",
    url,
    ...(meta.author
      ? { author: { "@type": "Person", name: meta.author } }
      : {}),
    ...(meta.date ? { datePublished: meta.date } : {}),
    ...(meta.tags && meta.tags.length > 0
      ? { keywords: meta.tags.join(", ") }
      : {}),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Print Content */}
      <BrandFrame
        title={meta.title}
        subtitle={meta.description || meta.excerpt || ""}
        author={meta.author || undefined}
        date={meta.date || undefined}
        pageSize="A4"
        marginsMm={18}
      >
        <article className="prose prose-lg mx-auto max-w-none print:prose-sm">
          <header className="mb-8 border-b border-gray-200 pb-6 print:mb-6 print:border-b print:pb-4">
            <h1 className="mb-4 font-serif text-3xl text-deepCharcoal print:text-2xl">
              {meta.title}
            </h1>

            {(meta.description || meta.excerpt) && (
              <p className="leading-relaxed text-lg text-gray-600 print:text-base">
                {meta.description || meta.excerpt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 print:text-xs">
              {meta.author && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">By:</span>
                  <span>{meta.author}</span>
                </div>
              )}
              {meta.date && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Date:</span>
                  <time dateTime={meta.date}>{formatPretty(meta.date)}</time>
                </div>
              )}
              {meta.category && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Category:</span>
                  <span>{meta.category}</span>
                </div>
              )}
            </div>

            {meta.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {meta.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 print:border print:border-gray-300 print:bg-transparent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Main Content */}
          <div className="print-content">
            {mdx ? (
              <MDXRemote {...mdx} components={mdxComponents} />
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p className="mb-2 text-lg">Content not available for printing</p>
                <p className="text-sm">Please check back later or contact support.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-500 print:mt-8 print:pt-4">
            <p>
              Generated by Abraham of London • Printed on{" "}
              {new Date().toLocaleDateString("en-GB")}
            </p>
            <p className="mt-1 text-xs">{url}</p>
          </footer>
        </article>
      </BrandFrame>

      {/* Back Navigation (Hidden in print) */}
      <div className="fixed bottom-4 left-4 print:hidden">
        <Link
          href="/print"
          className="rounded-full border border-gray-200 bg-white p-3 text-gray-600 shadow-lg transition-colors hover:text-deepCharcoal"
          title="Back to Print Materials"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0 7-7m-7 7h18"
            />
          </svg>
        </Link>
      </div>
    </>
  );
}

/** ISR: revalidate every hour */
export const revalidate = 3600;