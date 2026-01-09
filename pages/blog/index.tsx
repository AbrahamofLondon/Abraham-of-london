import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import { getContentlayerData, normalizeSlug, getDocHref } from "@/lib/contentlayer-compat";

type CoverAspect = "wide" | "square" | "book";
type CoverFit = "cover" | "contain";
type CoverPosition = "center" | "top" | "bottom" | "left" | "right";

type Item = {
  slug: string;
  url: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;
};

type Props = { items: Item[] };

function aspectClass(aspect?: CoverAspect | null) {
  switch (aspect) {
    case "book":
      return "aspect-[3/4]";
    case "square":
      return "aspect-square";
    case "wide":
    default:
      return "aspect-[16/9]";
  }
}

function fitClass(fit?: CoverFit | null) {
  if (fit === ("fit" as unknown as CoverFit)) return "object-contain";
  return fit === "contain" ? "object-contain" : "object-cover";
}

function positionClass(pos?: CoverPosition | null) {
  switch ((pos || "center").toLowerCase()) {
    case "top":
      return "object-top";
    case "bottom":
      return "object-bottom";
    case "left":
      return "object-left";
    case "right":
      return "object-right";
    default:
      return "object-center";
  }
}

function normalizeUrl(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "";

  let u = raw;
  u = u.replace(/^https?:\/\/[^/]+/i, "");
  if (!u.startsWith("/")) u = `/${u}`;
  if (u.length > 1) u = u.replace(/\/+$/, "");

  return u;
}

const BlogIndex: NextPage<Props> = ({ items }) => {
  return (
    <Layout title="Essays">
      <Head>
        <link rel="canonical" href="https://www.abrahamoflondon.org/blog" />
      </Head>

      <section className="py-10 sm:py-14">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-softGold/70">
            Essays · Abraham of London
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-neutral-950 dark:text-cream">
            Essays
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-700 dark:text-cream/80">
            Field notes, convictions, and strategic clarity - written for
            builders who refuse drift.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((p) => {
            const imgSrc = p.coverImage || "/assets/images/writing-desk.webp";
            const aClass = aspectClass(p.coverAspect);
            const oFit = fitClass(p.coverFit);
            const oPos = positionClass(p.coverPosition);

            return (
              <Link
                key={p.url || p.slug}
                href={p.url}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-black/25"
              >
                <div className={`relative ${aClass} bg-black/5 dark:bg-white/5`}>
                  <Image
                    src={imgSrc}
                    alt={p.title}
                    fill
                    className={`${oFit} ${oPos} transition-transform duration-500 group-hover:scale-[1.02]`}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                  />

                  {p.coverFit === "contain" && (
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="p-5">
                  <h2 className="font-serif text-xl font-semibold text-neutral-950 dark:text-cream">
                    {p.title}
                  </h2>

                  {p.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-700 dark:text-cream/80">
                      {p.excerpt}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-softGold/70">
                    {p.date ? (
                      <span>
                        {new Date(p.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                    {p.readTime ? <span>• {p.readTime}</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = await getContentlayerData();
  const allPosts = data.allPosts || [];
  
  // Filter out draft posts
  const published = allPosts.filter((d: any) => d && !d.draft);

  const items: Item[] = published
    .map((p: any) => {
      const slug = normalizeSlug(p.slugComputed || p.slug || "");
      const url = normalizeUrl(p?.url) || `/blog/${slug}`;

      return {
        slug,
        url,
        title: p.title ?? "Untitled",
        excerpt: p.excerpt ?? null,
        date: p.date ?? null,
        readTime: p.readTime ?? null,
        coverImage: p.coverImage ?? p.image ?? null,
        tags: Array.isArray(p.tags) ? p.tags : null,
        coverAspect: (p.coverAspect ?? null) as Item["coverAspect"],
        coverFit: (p.coverFit ?? null) as Item["coverFit"],
        coverPosition: (p.coverPosition ?? null) as Item["coverPosition"],
      };
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return { props: { items }, revalidate: 3600 };
};

export default BlogIndex;