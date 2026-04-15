/* pages/resources/index.tsx — RESOURCE VAULT (Institutional, Build-Safe) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LibraryBig, FileText } from "lucide-react";

import Layout from "@/components/Layout";
import { normalizeSlug } from "@/lib/content/shared";
import { resolveDocCoverImage } from "@/lib/content/client-utils";

type ResourceMeta = {
  slug: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  date: string | null;
  readTime: string | null;
  image: string | null;
  tags: string[];
  author: string | null;
  href: string;
};

type Props = { resources: ResourceMeta[] };

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function safeDateISO(d: any): string | null {
  const t = new Date(d ?? "").getTime();
  if (!Number.isFinite(t) || t <= 0) return null;
  return new Date(t).toISOString();
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  console.log("[PAGE_DATA] pages/resources/index.tsx getStaticProps START");
  try {
  try {
  try {
    const { getAllResources, getDocHref, sanitizeData } = await import(
      "@/lib/content/server"
    );
    const docs = (getAllResources() || []).filter((d: any) => !d?.draft);

    const resources: ResourceMeta[] = docs
      .map((r: any) => {
        const href = getDocHref(r);
        const rawSlug = String(r?.slug || r?._raw?.flattenedPath || "");
        const bareSlug = normalizeSlug(rawSlug).replace(/^resources\//, "");

        return {
          slug: bareSlug,
          title: String(r?.title || "Untitled Resource").trim(),
          description: r?.description ?? r?.excerpt ?? null,
          subtitle: r?.subtitle ?? null,
          date: safeDateISO(r?.date),
          readTime: r?.readTime ?? r?.normalizedReadTime ?? null,
          image: resolveDocCoverImage(r),
          tags: Array.isArray(r?.tags)
            ? r.tags.filter((x: any) => typeof x === "string" && x.trim())
            : [],
          author: r?.author ?? null,
          href,
        };
      })
      .filter((x) => Boolean(x.slug) && Boolean(x.title) && x.title !== "Untitled Resource")
      .sort((a, b) => (Date.parse(b.date || "") || 0) - (Date.parse(a.date || "") || 0));

    return { props: sanitizeData({ resources }), revalidate: 1800 };
  } catch (error) {
    console.error("[Resources] getStaticProps failed:", error);
    return { props: { resources: [] }, revalidate: 1800 };
  }

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/resources/index.tsx getStaticProps END");
  }
};

const ResourcesIndexPage: NextPage<Props> = ({ resources }) => {
  const pageDescription =
    "Structural assets, frameworks, and tools for fathers, founders, and institutional architects.";

  return (
    <Layout
      title="Resources | Abraham of London"
      description={pageDescription}
      canonicalUrl="/resources"
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <title>Resources | Abraham of London</title>
        <link rel="canonical" href={`${SITE}/resources`} />
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden border-b border-white/5 px-6 pb-20 pt-28 md:pt-36">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.07),transparent_40%)]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2">
              <LibraryBig className="h-4 w-4 text-amber-300" />
              <span className="text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300">
                Strategic Assets
              </span>
            </div>

            <h1 className="font-serif text-5xl leading-[0.95] text-white md:text-7xl">
              Resource
              <span className="ml-3 italic text-amber-200/90">Vault.</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/65">
              Curated frameworks, primers, and structural tools for builders who need
              more than motivational wallpaper.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          {resources.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2">
              {resources.map((res) => (
                <article
                  key={res.slug}
                  className="group flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:border-amber-500/30 hover:bg-white/[0.05]"
                >
                  <Link href={res.href} className="flex h-full flex-col">
                    {res.image ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5">
                        <Image
                          src={res.image}
                          alt={res.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-white/5 bg-zinc-900/50">
                        <span className="font-serif text-4xl italic text-amber-300/20">
                          Vault
                        </span>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-8">
                      <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
                        <FileText className="h-3.5 w-3.5 text-amber-300/80" />
                        Resource
                      </div>

                      <h2 className="mb-2 font-serif text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-amber-200">
                        {res.title}
                      </h2>

                      {res.description ? (
                        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-white/60">
                          {res.description}
                        </p>
                      ) : null}

                      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="text-[10px] font-mono uppercase tracking-[0.20em] text-white/35">
                          {res.date ? new Date(res.date).toLocaleDateString("en-GB") : "Undated"}
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-300 transition-all group-hover:bg-amber-500/10">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center text-white/35 italic">
              Initializing archive...
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default ResourcesIndexPage;