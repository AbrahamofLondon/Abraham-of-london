/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BriefListItem = {
  title: string;
  summary: string;
  date: string | null;
  href: string;
};

type Props = {
  briefs: BriefListItem[];
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function publicBriefBareSlug(input: unknown): string {
  const normalized = normalizePathish(input)
    .replace(/^content\//i, "")
    .replace(/^briefs\//i, "");

  if (!normalized || normalized.includes("..")) return "";
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isPublicBriefSource(doc: any): boolean {
  const flattened = normalizePathish(doc?._raw?.flattenedPath).toLowerCase();
  const source = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();

  return (
    flattened.startsWith("briefs/") ||
    source.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    source.startsWith("content/briefs/")
  );
}

function isRenderablePublicBrief(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (!isPublicBriefSource(doc)) return false;
  if (safeString(doc?.status).trim().toLowerCase() !== "canonical") return false;

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  return requiredTier === "public";
}

function publicBriefSlugForDoc(doc: any): string {
  return (
    publicBriefBareSlug(doc?.urlSlug) ||
    publicBriefBareSlug(doc?.slugSafe) ||
    publicBriefBareSlug(doc?.slugComputed) ||
    publicBriefBareSlug(doc?.slug) ||
    publicBriefBareSlug(doc?._raw?.flattenedPath) ||
    publicBriefBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllBriefs, sanitizeData } = await import("@/lib/content/server");
  const briefs = (getAllBriefs() || [])
    .filter(isRenderablePublicBrief)
    .map((doc: any) => {
      const slug = publicBriefSlugForDoc(doc);
      return {
        title: safeString(doc?.title) || "Untitled brief",
        summary: safeString(doc?.summary || doc?.excerpt || doc?.description) || "Strategic brief.",
        date: safeString(doc?.date) || null,
        href: `/briefs/${slug}`,
      };
    })
    .filter((brief: BriefListItem) => brief.href !== "/briefs/")
    .sort((a: BriefListItem, b: BriefListItem) => {
      if (!a.date && !b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return {
    props: sanitizeData({ briefs }),
    revalidate: 1800,
  };
};

const PublicBriefsIndexPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ briefs }) => {
  return (
    <Layout
      title="Briefs | Abraham of London"
      description="Canonical public strategic briefs and decision readings from Abraham of London."
      canonicalUrl="/briefs"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-24 text-white" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.02] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Briefs
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Public strategic briefs and decision readings.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56">
              This is the public-facing brief catalogue: canonical briefs that are open to read,
              distinct from restricted vault materials and member-only intelligence.
            </p>
          </header>

          {briefs.length > 0 ? (
            <section className="grid gap-5 md:grid-cols-2">
              {briefs.map((brief) => (
                <article key={brief.href} className="border border-white/10 bg-white/[0.015] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[#C9A96E]/20 bg-[#C9A96E]/10 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-[#E6C98C]" style={mono}>
                      Brief
                    </span>
                    <span className="border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-emerald-200" style={mono}>
                      Public
                    </span>
                    <span className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-white/40" style={mono}>
                      Canonical
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-2xl leading-tight text-white">{brief.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/52">{brief.summary}</p>
                  {brief.date ? (
                    <p className="mt-3 text-[8px] uppercase tracking-[0.18em] text-white/28" style={mono}>
                      {new Date(brief.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                  <Link
                    href={brief.href}
                    className="mt-4 inline-flex items-center gap-2 transition hover:opacity-80"
                    style={{ color: `${GOLD}DD` }}
                  >
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      Read brief
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </section>
          ) : (
            <section className="border border-white/10 bg-white/[0.015] p-8 text-sm leading-7 text-white/48">
              No canonical public briefs are currently available.
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default PublicBriefsIndexPage;
