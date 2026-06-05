/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault/briefs/index.tsx — VAULT BRIEFS INDEX (PAGES-ROUTER SAFE)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Lock } from "lucide-react";

import Layout from "@/components/Layout";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
  getTierLabel,
} from "@/lib/access/tier-policy";

type BriefCard = {
  slug: string;
  href: string;
  title: string;
  series: string;
  group: "canon" | "frontier-resilience";
  groupLabel: string;
  abstract: string;
  requiredTier: AccessTier;
  tierLabel: string;
  volume?: number | null;
  sequenceCode?: string | null;
  readTime?: string | null;
  tags: string[];
  publishedAt?: string | null;
};

type Props = {
  items: BriefCard[];
  total: number;
};

const RULE = "rgba(255,255,255,0.08)";
const GOLD = "#C9A96E";

function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function sanitizeData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePathLocal(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .toLowerCase();
}

function cleanPathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function normalizeBriefSlug(input: unknown): string {
  let s = cleanPathish(
    safeString(input)
      .replace(/\.(md|mdx)$/i, "")
      .replace(/^content\//i, "")
      .replace(/^vault\//i, "")
      .replace(/^briefs\//i, "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .replace(/\/{2,}/g, "/"),
  );

  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;

    const nextA = stripPrefixOnce(s, "content");
    if (nextA !== s) {
      s = nextA;
      changed = true;
    }

    const nextB = stripPrefixOnce(s, "vault");
    if (nextB !== s) {
      s = nextB;
      changed = true;
    }

    const nextC = stripPrefixOnce(s, "briefs");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = cleanPathish(s);
  if (!s || s.includes("..")) return "";

  const parts = s.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isVaultBriefDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = safeString(doc?.docKind).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const flattened = normalizePathLocal(doc?._raw?.flattenedPath);
  const sourceFilePath = normalizePathLocal(doc?._raw?.sourceFilePath);
  const slug = normalizePathLocal(doc?.slug);
  const href = normalizePathLocal(doc?.href);

  return (
    type === "vaultbrief" ||
    docKind === "vaultbrief" ||
    flattened.startsWith("vault/briefs/") ||
    sourceFilePath.startsWith("vault/briefs/") ||
    slug.startsWith("vault/briefs/") ||
    href.startsWith("vault/briefs/") ||
    href.startsWith("/vault/briefs/")
  );
}

function getDocKey(doc: any): string {
  return safeString(
    doc?._id ||
      doc?.collectionSlug ||
      doc?.urlSlug ||
      doc?._raw?.flattenedPath ||
      doc?._raw?.sourceFilePath ||
      doc?.slug ||
      doc?.href,
  ).toLowerCase();
}

function buildBriefHref(doc: any, slugBare: string): string {
  const explicitHref = safeString(doc?.href).trim();
  if (explicitHref.startsWith("/vault/briefs/")) return explicitHref;
  return `/vault/briefs/${slugBare}`;
}

function getCombinedBriefs(docs: any[]): any[] {
  const seen = new Set<string>();

  return (docs || [])
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isVaultBriefDoc)
    .filter((doc: any) => {
      const key = getDocKey(doc);
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatDate(value?: string | null) {
  if (!value) return "Undated";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function briefCode(brief: BriefCard) {
  if (brief.sequenceCode) return brief.sequenceCode;
  if (typeof brief.volume === "number") return `BRF-${String(brief.volume).padStart(2, "0")}`;
  return `BRF-${brief.slug.slice(0, 3).toUpperCase()}`;
}

function briefGroupForSlug(slug: string): BriefCard["group"] {
  return slug.startsWith("frontier-resilience-") ? "frontier-resilience" : "canon";
}

function groupLabelForBrief(group: BriefCard["group"]): string {
  return group === "frontier-resilience" ? "Frontier Resilience Sequence" : "Foundational Canon";
}

function sequenceCodeForBrief(doc: any, slug: string, group: BriefCard["group"]): string | null {
  const explicit =
    safeString(doc?.institutionalId).trim() ||
    safeString(doc?.briefId).trim();
  if (explicit) return explicit;

  const canonMatch = slug.match(/^brief-(\d{3})-/);
  if (canonMatch) return `CANON-${canonMatch[1]}`;

  if (group === "frontier-resilience") return "FR";
  return null;
}

function BriefRow({
  brief,
  canOpen,
}: {
  brief: BriefCard;
  canOpen: boolean;
}) {
  const restricted = brief.requiredTier !== "public";
  const frontier = brief.group === "frontier-resilience";
  const accent = frontier ? "#7CB8E8" : GOLD;

  return (
    <Link
      href={brief.href}
      className="group grid gap-3 border-b px-0 py-4 transition-colors duration-200 md:grid-cols-[5rem_7rem_1fr_6rem_5rem]"
      style={{
        borderBottomColor: frontier ? "rgba(124,184,232,0.12)" : "rgba(201,169,110,0.13)",
        opacity: canOpen ? 1 : 0.64,
        backgroundColor: frontier ? "rgba(124,184,232,0.018)" : "transparent",
      }}
    >
      <div className="font-mono text-[7px] uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.2)" }}>
        {briefCode(brief)}
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.24em]" style={{ color: restricted ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.24)" }}>
        {restricted ? <Lock className="h-3 w-3 text-[#C9A96E]" /> : null}
        {brief.tierLabel}
      </div>

      <div className="min-w-0">
        <div className="font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: GOLD }}>
          <span style={{ color: accent }}>{brief.groupLabel}</span>
          {brief.series ? <span style={{ color: "rgba(255,255,255,0.22)" }}> · {brief.series}</span> : null}
        </div>
        <h2 className="mt-1 truncate font-serif text-[1.05rem] italic" style={{ color: canOpen ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.45)" }}>
          {brief.title}
        </h2>
        <p className="mt-1 truncate text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>
          {brief.abstract}
        </p>
      </div>

      <div className="font-mono text-[7px] uppercase tracking-[0.24em] md:text-right" style={{ color: "rgba(255,255,255,0.18)" }}>
        {formatDate(brief.publishedAt)}
      </div>

      <div className="font-mono text-[7px] uppercase tracking-[0.24em] md:text-right" style={{ color: "rgba(255,255,255,0.18)" }}>
        {brief.readTime || "5 min"}
      </div>
    </Link>
  );
}

function BriefGroupSection({
  id,
  title,
  label,
  description,
  items,
  userTier,
  accent,
}: {
  id: string;
  title: string;
  label: string;
  description: string;
  items: BriefCard[];
  userTier: AccessTier;
  accent: string;
}) {
  if (items.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 border-b pb-5" style={{ borderBottomColor: RULE }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.32em]" style={{ color: accent }}>
              {label}
            </p>
            <h2 className="mt-2 font-serif italic text-2xl" style={{ color: "rgba(255,255,255,0.86)" }}>
              {title}
            </h2>
          </div>
          <span className="font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.24)" }}>
            {items.length} briefs
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "rgba(255,255,255,0.42)" }}>
          {description}
        </p>
      </div>

      <div>
        {items.map((brief) => (
          <BriefRow
            key={brief.slug}
            brief={brief}
            canOpen={hasAccess(userTier, brief.requiredTier)}
          />
        ))}
      </div>
    </section>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const content = await import("@/lib/content/server");
  const allDocs = await content.getAllCombinedDocs();
  const docs = getCombinedBriefs(allDocs);

  const rawItems = docs
    .map((doc: any): BriefCard | null => {
      const rawSlug =
        doc?.urlSlug ||
        doc?.collectionSlug ||
        doc?.slug ||
        doc?._raw?.flattenedPath ||
        doc?._raw?.sourceFilePath ||
        "";

      const slugBare = normalizeBriefSlug(rawSlug);
      if (!slugBare) return null;

      const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
      const group = briefGroupForSlug(slugBare);

      return {
        slug: slugBare,
        href: buildBriefHref(doc, slugBare),
        title: safeString(doc?.title).trim() || "Untitled Brief",
        series:
          safeString(doc?.series).trim() ||
          safeString(doc?.category).trim() ||
          safeString(doc?.kind).trim() ||
          "Vault Briefs",
        group,
        groupLabel: groupLabelForBrief(group),
        abstract:
          safeString(doc?.abstract).trim() ||
          safeString(doc?.excerpt).trim() ||
          safeString(doc?.summary).trim() ||
          safeString(doc?.description).trim() ||
          "Technical specification pending.",
        requiredTier,
        tierLabel: getTierLabel(requiredTier),
        volume: typeof doc?.volume === "number" ? doc.volume : null,
        sequenceCode: sequenceCodeForBrief(doc, slugBare, group),
        readTime: safeString(doc?.readTime).trim() || "5 min read",
        tags: Array.isArray(doc?.tags) ? doc.tags.map(String) : [],
        publishedAt: doc?.date ? String(doc.date) : null,
      };
    })
    .filter((x): x is BriefCard => x !== null);
  const items: BriefCard[] = rawItems;

  items.sort((a, b) => {
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA;
  });

  return {
    props: sanitizeData({
      items,
      total: items.length,
    }),
    revalidate: 1800,
  };


};

const BriefsIndexPage: NextPage<Props> = ({ items, total }) => {
  const { data: session, status } = useSession();

  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ??
      (session as any)?.aol?.tier ??
      "public",
  );

  const canonItems = React.useMemo(
    () => items.filter((item) => item.group === "canon"),
    [items],
  );

  const frontierItems = React.useMemo(
    () => items.filter((item) => item.group === "frontier-resilience"),
    [items],
  );

  const isAuthenticated = status === "authenticated";

  return (
    <Layout title="Vault Briefs // Abraham of London" className="min-h-screen bg-black text-white">
      <Head>
        <title>Vault Briefs // Abraham of London</title>
        <meta
          name="description"
          content="Restricted operating documents for active members."
        />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="border-b" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-20 lg:px-10 lg:pb-10 lg:pt-24">
            <div className="flex items-center gap-3">
              <span style={{ width: 1, height: 18, backgroundColor: "rgba(201,169,110,0.42)", display: "inline-block" }} />
              <span className="font-mono text-[7.5px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,169,110,0.8)" }}>
                VAULT BRIEFS · BRIEFING REGISTRY
              </span>
            </div>

            <h1
              className="mt-6 max-w-3xl font-serif italic"
              style={{
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Deployable briefing artifacts.
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: "rgba(255,255,255,0.46)" }}>
              Vault Briefs are not the same as Intelligence Briefs. Intelligence Briefs diagnose public
              institutional failure. Vault Briefs preserve the canon, frameworks, and resilience
              sequences that apply the doctrine under pressure.
            </p>

            <div className="mt-6 h-px w-full" style={{ backgroundColor: RULE }} />

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <a
                href="#foundational-canon"
                className="font-mono text-[8px] uppercase tracking-[0.3em]"
                style={{ color: GOLD }}
              >
                Foundational Canon · {canonItems.length}
              </a>
              <a
                href="#frontier-resilience"
                className="font-mono text-[8px] uppercase tracking-[0.3em]"
                style={{ color: "#7CB8E8" }}
              >
                Frontier Resilience Sequence · {frontierItems.length}
              </a>
            </div>
          </div>
        </section>

        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="mb-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.22)" }}>
              <span>{total} briefs indexed</span>
              <span>Tier: {userTier}</span>
              <span>{canonItems.length} canon</span>
              <span>{frontierItems.length} frontier resilience</span>
            </div>

            {!isAuthenticated ? (
              <div className="mb-8 border px-5 py-4" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.05)" }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.42)" }}>
                    Access requires Inner Circle membership.
                  </p>
                  <Link
                    href="/inner-circle"
                    className="font-mono text-[8px] uppercase tracking-[0.28em]"
                    style={{ color: GOLD }}
                  >
                    /inner-circle
                  </Link>
                </div>
              </div>
            ) : null}

            {items.length === 0 ? (
              <div className="border px-6 py-16 text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.24)" }}>
                  No briefings resolved in registry
                </p>
              </div>
            ) : (
              <div className="space-y-14">
                <BriefGroupSection
                  id="foundational-canon"
                  title="Foundational Canon"
                  label="Foundational Canon"
                  description="The 12 pillar briefs set the doctrinal foundation: household, estate, oath, time, geography, and the primary forms of order."
                  items={canonItems}
                  userTier={userTier}
                  accent={GOLD}
                />
                <BriefGroupSection
                  id="frontier-resilience"
                  title="Frontier Resilience Sequence"
                  label="Frontier Resilience"
                  description="A vault sequence on pressure, stress, leadership fatigue, decision latency, and the culture revealed when institutions operate under strain."
                  items={frontierItems}
                  userTier={userTier}
                  accent="#7CB8E8"
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default BriefsIndexPage;
