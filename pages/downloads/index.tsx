// pages/downloads/index.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { GetStaticProps } from "next";

type DownloadItem = {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  coverImage?: string | null;
  pdfPath?: string | null;
};

type Props = { items: DownloadItem[] };

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "downloads");

export const getStaticProps: GetStaticProps<Props> = async () => {
  const files = fs.existsSync(CONTENT_DIR)
    ? fs.readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f))
    : [];
  const items: DownloadItem[] = files.map((file) => {
    const slug = file.replace(/\.mdx?$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: (data as any).title || slug,
      excerpt: (data as any).excerpt ?? null,
      category: (data as any).category ?? null,
      coverImage: (data as any).coverImage ?? null,
      pdfPath: (data as any).pdfPath ?? null,
    };
  });
  items.sort((a, b) => a.title.localeCompare(b.title));
  return { props: { items }, revalidate: 120 };
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs text-deepCharcoal">
      {children}
    </span>
  );
}

export default function DownloadsIndex({ items }: Props) {
  return (
    <>
      <Head>
        <title>Downloads — Playbooks & Packs</title>
        <meta
          name="description"
          content="Leader playbooks, mentorship frameworks, and founder operating packs. Free, practical, and printable."
        />
      </Head>

      <main className="container mx-auto px-4 py-10 md:py-16">
        <header className="mb-8 md:mb-12">
          <h1 className="font-serif text-4xl text-forest md:text-5xl">Downloads</h1>
          <p className="mt-2 max-w-2xl text-deepCharcoal/80">
            Free, practical resources you can deploy this week. Print them. Share them. Lead with clarity.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <li
              key={d.slug}
              className="group overflow-hidden rounded-xl border border-lightGrey bg-warmWhite shadow-card transition hover:shadow-cardHover"
            >
              <Link
                href={`/downloads/${d.slug}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                prefetch={false}
                aria-label={`Open ${d.title}`}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={d.coverImage || "/assets/images/social/og-image.jpg"}
                    alt={d.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    priority={false}
                  />
                </div>
              </Link>

              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  {d.category && <Badge>{d.category}</Badge>}
                </div>

                <h2 className="font-serif text-xl text-forest">
                  <Link href={`/downloads/${d.slug}`} className="luxury-link" prefetch={false}>
                    {d.title}
                  </Link>
                </h2>

                {d.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-deepCharcoal/80">{d.excerpt}</p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/downloads/${d.slug}`}
                    className="aol-btn rounded-full px-4 py-2 text-sm"
                    prefetch={false}
                  >
                    Read online
                  </Link>

                  {d.pdfPath && (
                    <Link
                      href={d.pdfPath}
                      className="text-sm text-forest underline underline-offset-2 hover:text-softGold"
                      rel="noopener"
                    >
                      Download PDF →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
