/* pages/canon/index.tsx — THE CANON ARCHIVE (FLAGSHIP / CLEAN CONTRAST EDITION) */
/* eslint-disable react/no-unescaped-entities */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Lock,
  ChevronRight,
  Target,
  Building2,
  Castle,
  ScrollText,
  AlertCircle,
  Shield,
  Sparkles,
  Feather,
  Crown,
  Compass,
  Layers,
  Clock,
  Eye,
  Key,
  ArrowRight,
  FileText,
  BookMarked,
  PenTool,
  Scroll,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getAllCanons, normalizeSlug, sanitizeData } from "@/lib/content/server";
import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";

type AccessLevel = "public" | "inner-circle" | "restricted";
type CanonIconKey = "book" | "target" | "building" | "castle" | "scroll" | "pen" | "file" | "marked";

type CanonItem = {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  href: string;
  requiredTier: AccessTier;
  accessLevel: AccessLevel;
  coverImage: string | null;
  dateISO: string | null;
  readTime: string | null;
  tags: string[];
  category: string | null;
  featured: boolean;
  isTeachingEdition: boolean;
  volumeNumber: number | null;
  series: string;
  originalFilename: string;
};

type CanonSeries = {
  volume: string;
  title: string;
  description: string;
  iconKey: CanonIconKey;
  items: CanonItem[];
  color: string;
  gradient: string;
};

type CanonIndexProps = {
  items: CanonItem[];
  counts: {
    total: number;
    public: number;
    innerCircle: number;
    restricted: number;
  };
  series: CanonSeries[];
  featuredItems: CanonItem[];
  error?: string;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const ease = [0.22, 1, 0.36, 1] as const;

const ICON_MAP: Record<CanonIconKey, React.ComponentType<any>> = {
  book: BookOpen,
  target: Target,
  building: Building2,
  castle: Castle,
  scroll: Scroll,
  pen: PenTool,
  file: FileText,
  marked: BookMarked,
};

function collapseSlashes(s: string): string {
  return String(s || "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function normalizeBareCanonSlug(input: unknown): string {
  let s = String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const p = prefix.toLowerCase();
    if (s.toLowerCase().startsWith(p)) {
      s = s.slice(prefix.length).replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content/") || changed;
    changed = stripOnce("vault/") || changed;
    changed = stripOnce("canon/") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";

  const segments = s
    .split("/")
    .filter(Boolean)
    .map((seg) => normalizeSlug(seg))
    .filter(Boolean);

  return segments.join("/");
}

function classifyAccess(requiredTier: AccessTier): AccessLevel {
  const r = String(tiers.normalizeRequired(requiredTier));
  if (r === "public") return "public";
  if (r === "inner-circle") return "inner-circle";
  return "restricted";
}

function extractVolumeNumber(title: string): number | null {
  const romanMatch = title.match(/Volume[-\s]([IVXLCDM]+)/i);
  if (romanMatch && romanMatch[1]) {
    const roman = romanMatch[1].toUpperCase();
    const values: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };

    let total = 0;
    let prev = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
      const ch = roman[i];
      const cur = values[ch] ?? 0;
      total += cur < prev ? -cur : cur;
      prev = cur;
    }

    return total || null;
  }

  const numMatch = title.match(/Volume[-\s](\d+)/i);
  return numMatch && numMatch[1] ? parseInt(numMatch[1], 10) : null;
}

function extractSeries(title: string, filename: string): string {
  if (title.includes("Foundations") || filename.includes("volume-i-foundations")) return "Volume I";
  if (title.includes("Governance") || filename.includes("volume-ii-governance")) return "Volume II";
  if (title.includes("Civilisation") || filename.includes("volume-x-the-arc")) return "Volume X";
  if (filename.includes("builders-catechism")) return "Catechism";
  if (filename.includes("canon-campaign")) return "Campaign";
  if (filename.includes("canon-introduction-letter")) return "Introduction";
  if (filename.includes("canon-master-index-preview")) return "Index";
  if (filename.includes("volume-iii")) return "Volume III";
  if (filename.includes("volume-iv")) return "Volume IV";
  if (filename.includes("volume-x-")) return "Volume X";
  return "General";
}

function getIconKeyForSeries(series: string): CanonIconKey {
  switch (series) {
    case "Volume I": return "target";
    case "Volume II": return "building";
    case "Volume III": return "castle";
    case "Volume IV": return "castle";
    case "Volume X": return "scroll";
    case "Catechism": return "pen";
    case "Campaign": return "marked";
    case "Introduction": return "file";
    case "Index": return "scroll";
    default: return "book";
  }
}

function getSeriesTitle(series: string): string {
  switch (series) {
    case "Volume I": return "Foundations of Purpose";
    case "Volume II": return "Governance & Formation";
    case "Volume III": return "Civilisation & Legacy";
    case "Volume IV": return "Future Volumes";
    case "Volume X": return "The Arc of Future Civilisation";
    case "Catechism": return "Builders Catechism";
    case "Campaign": return "Canon Campaign";
    case "Introduction": return "Introduction to the Canon";
    case "Index": return "Master Index";
    default: return "Canonical Works";
  }
}

function getSeriesDescription(series: string): string {
  switch (series) {
    case "Volume I":
      return "First principles: purpose, mandate, meaning, and moral architecture.";
    case "Volume II":
      return "Rules, routines, and structures that survive pressure and personality.";
    case "Volume III":
      return "Institutions, continuity, and generational systems.";
    case "Volume IV":
      return "Emerging frameworks and forthcoming volumes.";
    case "Volume X":
      return "Speculative architecture for future civilisation.";
    case "Catechism":
      return "Foundational questions and answers for builders.";
    case "Campaign":
      return "Strategic initiatives and canonical outreach.";
    case "Introduction":
      return "A letter on the purpose and structure of the Canon.";
    case "Index":
      return "Complete guide to all canonical works.";
    default:
      return "Canonical volumes and supplementary materials.";
  }
}

function safeHref(path: string): string {
  const p = collapseSlashes(String(path || "/")).replace(/\/{2,}/g, "/");
  return p.startsWith("/") ? p : `/${p}`;
}

function latestUpdateLabel(items: CanonItem[]): string {
  if (!items.length) return "—";

  const timestamps = items
    .map((i) => {
      const ms = Date.parse(String(i.dateISO || ""));
      return Number.isFinite(ms) ? ms : 0;
    })
    .filter((n) => n > 0);

  if (!timestamps.length) return "—";

  return new Date(Math.max(...timestamps)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function sectionId(volume: string): string {
  return volume.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-[8%] h-[20rem] w-[20rem] rounded-full bg-amber-500/[0.025] blur-[120px]" />
      <div className="absolute right-[10%] top-[20%] h-[16rem] w-[16rem] rounded-full bg-white/[0.012] blur-[100px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute left-12 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/[0.025] to-transparent xl:block" />
      <div className="absolute right-12 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/[0.025] to-transparent xl:block" />
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="h-6 w-px bg-amber-500/40" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/72">
        {children}
      </span>
    </div>
  );
}

function StatPillar({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  accent?: boolean;
}) {
  return (
    <div className="border-l border-white/10 pl-5">
      <Icon className={`mb-3 h-4 w-4 ${accent ? "text-amber-400" : "text-white/38"}`} />
      <div className={`text-3xl font-light tracking-tight ${accent ? "text-amber-400" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/38">
        {label}
      </div>
    </div>
  );
}

function JumpChip({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-2.5 transition-all duration-300 hover:border-amber-500/35 hover:bg-white/[0.05]"
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/64 group-hover:text-white">
        {label}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-amber-400/55 transition-transform duration-300 group-hover:translate-x-0.5" />
    </a>
  );
}

function HeroPanel({
  counts,
  latestUpdate,
  series,
}: {
  counts: CanonIndexProps["counts"];
  latestUpdate: string;
  series: CanonSeries[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/8">
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-12 lg:pb-18 lg:pt-32">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-5xl">
            <RailLabel>Canonical Archive</RailLabel>

            <h1 className="mt-6 font-serif text-5xl font-light leading-[0.94] tracking-[-0.05em] text-white md:text-7xl lg:text-[6rem]">
              The Canon
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/68">
              The intellectual flagship of the house. Doctrine arranged with discipline:
              purpose, governance, formation, civilisation, and legacy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {series.map((s) => (
                <JumpChip key={s.volume} href={`#${sectionId(s.volume)}`} label={s.volume} />
              ))}
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-5">
              <StatPillar label="Total Volumes" value={counts.total} icon={ScrollText} />
              <StatPillar label="Public" value={counts.public} icon={Eye} />
              <StatPillar label="Inner Circle" value={counts.innerCircle} icon={Crown} accent />
              <StatPillar label="Restricted" value={counts.restricted} icon={Lock} />
              <StatPillar label="Latest" value={latestUpdate} icon={Clock} />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative overflow-hidden border border-white/10 bg-white/[0.025] p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(245,158,11,0.05),transparent_50%)]" />
              <div className="absolute right-0 top-0 h-10 w-10 border-r border-t border-amber-500/18" />

              <div className="relative">
                <div className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-black/30">
                  <Compass className="h-4 w-4 text-amber-400/72" />
                </div>

                <h2 className="mt-5 font-serif text-2xl text-white">
                  Complete Canon
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-white/56">
                  All volumes, teaching editions, catechisms, and supplementary works
                  organized for clarity and access.
                </p>

                <div className="mt-7 border-t border-white/8 pt-5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-white/28" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/34">
                      {counts.total} documents • fully indexed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ item, index }: { item: CanonItem; index: number }) {
  const tierLabel =
    item.accessLevel === "public"
      ? "Public"
      : item.accessLevel === "inner-circle"
        ? "Inner Circle"
        : String(item.requiredTier);

  return (
    <Link
      href={item.href}
      className="group relative overflow-hidden border border-white/10 bg-white/[0.025] p-7 transition-all duration-500 hover:border-amber-500/24 hover:bg-white/[0.04]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.04),transparent_55%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="absolute right-0 top-0 h-10 w-10 border-r border-t border-amber-500/0 transition-colors duration-700 group-hover:border-amber-500/20" />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            Featured_{String(index + 1).padStart(2, "0")}
          </span>

          <div className="flex items-center gap-2">
            {item.accessLevel !== "public" ? (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-500/65" />
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-amber-400/70">
                  {tierLabel}
                </span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-white/30" />
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">
                  Public
                </span>
              </>
            )}
          </div>
        </div>

        <h3 className="max-w-[18ch] font-serif text-2xl text-white transition-colors group-hover:text-amber-50">
          {item.title}
        </h3>

        {item.excerpt ? (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/52 transition-colors group-hover:text-white/68">
            {item.excerpt}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">
            {item.readTime}
          </span>
          {item.category ? (
            <>
              <span className="h-1 w-1 rounded-full bg-white/12" />
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">
                {item.category}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-7 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/0 transition-all duration-300 group-hover:text-amber-400/90">
          <span>Open volume</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function FeaturedShelf({ items }: { items: CanonItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-b border-white/6 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <RailLabel>Selected Volumes</RailLabel>
            <h2 className="mt-5 font-serif text-4xl text-white md:text-5xl">
              Featured entries
            </h2>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Sparkles className="h-3.5 w-3.5 text-amber-500/35" />
            <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/24">
              Editor's cut
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {items.map((item, index) => (
            <FeatureCard key={item.slug} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SeriesCard({
  series,
  index,
}: {
  series: CanonSeries;
  index: number;
}) {
  const Icon = ICON_MAP[series.iconKey];
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={sectionId(series.volume)}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.08, ease }}
      className="group relative"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden border border-white/8 bg-white/[0.02] p-8">
            <div
              className="absolute inset-0 opacity-80"
              style={{ background: series.gradient }}
            />
            <div className="absolute right-0 top-0 h-12 w-12 border-r border-t border-white/8" />
            <div className="absolute bottom-0 left-0 h-12 w-12 border-b border-l border-white/8" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/10 bg-black/30 px-3 py-1.5">
                <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/58">
                  {series.volume}
                </span>
              </div>

              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-white/10 bg-black/25">
                <Icon className="h-5 w-5 text-amber-400/72" />
              </div>

              <h2 className="font-serif text-3xl text-white">
                {series.title}
              </h2>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/54">
                {series.description}
              </p>

              <div className="mt-8 border-t border-white/8 pt-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-white/26" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/34">
                    {series.items.length} {series.items.length === 1 ? "work" : "works"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px border border-white/5 bg-white/5">
          {series.items.map((item, itemIndex) => {
            const isLocked = item.accessLevel !== "public";
            const tierLabel =
              item.accessLevel === "inner-circle"
                ? "Inner Circle"
                : isLocked
                  ? String(item.requiredTier)
                  : "Public";

            return (
              <Link
                key={item.slug}
                href={item.href}
                className="group/item relative overflow-hidden bg-black p-8 transition-all duration-500 hover:bg-zinc-950 md:p-10"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,158,11,0.00)_0%,rgba(245,158,11,0.025)_14%,rgba(0,0,0,0)_38%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute right-0 top-0 h-10 w-10 border-r border-t border-amber-500/0 transition-colors duration-700 group-hover:border-amber-500/20" />

                <div className="relative">
                  <div className="mb-6 flex items-start justify-between gap-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/28">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>

                      <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/42">
                        {item.readTime}
                      </span>

                      <div className="flex items-center gap-1.5 border border-white/8 bg-white/[0.02] px-2 py-1">
                        {isLocked ? (
                          <Key className="h-2.5 w-2.5 text-amber-400/58" />
                        ) : (
                          <Eye className="h-2.5 w-2.5 text-white/30" />
                        )}
                        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/42">
                          {tierLabel}
                        </span>
                      </div>
                    </div>

                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-amber-500/62" />
                    ) : null}
                  </div>

                  <h3 className="relative pr-10 font-serif text-2xl text-white transition-colors duration-300 group-hover:text-amber-50">
                    {item.title}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-amber-500/50 to-transparent transition-all duration-700 group-hover:w-14" />
                  </h3>

                  {item.subtitle ? (
                    <p className="mt-3 text-sm italic leading-relaxed text-white/42">
                      {item.subtitle}
                    </p>
                  ) : null}

                  {item.excerpt ? (
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/54 transition-colors duration-300 group-hover:text-white/68">
                      {item.excerpt}
                    </p>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="border border-white/5 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.18em] text-white/24"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-7 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/0 transition-all duration-300 group-hover:text-amber-400/88">
                    <span>Read volume</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  try {
    const rawDocs = getAllCanons() || [];
    const seenSlugs = new Set<string>();

    const items: CanonItem[] = rawDocs
      .filter((doc: any) => !doc?.draft)
      .map((doc: any) => {
        const raw = doc?.slug || doc?._raw?.flattenedPath || "";
        const bare = normalizeBareCanonSlug(raw);
        if (!bare) return null;

        if (seenSlugs.has(bare)) return null;
        seenSlugs.add(bare);

        const title = safeString(doc?.title, "Untitled Volume");
        const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
        const accessLevel = classifyAccess(requiredTier);
        const dateISO =
          doc?.date && Number.isFinite(Date.parse(String(doc.date)))
            ? new Date(doc.date).toISOString()
            : null;
        const filename = String(doc?._raw?.sourceFilePath || "").split(/[\/\\]/).pop() || "";

        return {
          title,
          subtitle: doc?.subtitle ? String(doc.subtitle) : null,
          excerpt: doc?.excerpt || doc?.description ? String(doc.excerpt || doc.description) : null,
          slug: bare,
          href: safeHref(`/canon/${bare}`),
          requiredTier,
          accessLevel,
          coverImage: doc?.coverImage ? String(doc.coverImage) : null,
          dateISO,
          readTime: doc?.readTime ? String(doc.readTime) : "10 min",
          tags: Array.isArray(doc?.tags) ? doc.tags.filter(Boolean).map(String) : [],
          category: doc?.category ? String(doc.category) : "General",
          featured: Boolean(doc?.featured),
          isTeachingEdition: title.toLowerCase().includes("teaching edition"),
          volumeNumber: extractVolumeNumber(title),
          series: String(doc?.series || extractSeries(title, filename)),
          originalFilename: filename,
        };
      })
      .filter((item): item is CanonItem => Boolean(item))
      .sort((a, b) => {
        const av = a.volumeNumber ?? 999;
        const bv = b.volumeNumber ?? 999;
        if (av !== bv) return av - bv;
        return a.title.localeCompare(b.title);
      });

    const counts = items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.accessLevel === "public") acc.public += 1;
        else if (item.accessLevel === "inner-circle") acc.innerCircle += 1;
        else acc.restricted += 1;
        return acc;
      },
      { total: 0, public: 0, innerCircle: 0, restricted: 0 }
    );

    const seriesMap = new Map<string, CanonSeries>();

    items.forEach((item) => {
      if (!seriesMap.has(item.series)) {
        const iconKey = getIconKeyForSeries(item.series);
        const gradientMap: Record<string, string> = {
          "Volume I": "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.06), transparent 70%)",
          "Volume II": "radial-gradient(circle at 70% 30%, rgba(59,130,246,0.045), transparent 70%)",
          "Volume III": "radial-gradient(circle at 50% 70%, rgba(168,85,247,0.045), transparent 70%)",
          "Volume IV": "radial-gradient(circle at 40% 60%, rgba(139,92,246,0.04), transparent 70%)",
          "Volume X": "radial-gradient(circle at 60% 40%, rgba(245,158,11,0.05), transparent 70%)",
        };

        seriesMap.set(item.series, {
          volume: item.series,
          title: getSeriesTitle(item.series),
          description: getSeriesDescription(item.series),
          iconKey,
          items: [],
          color: "from-gray-500/20 to-transparent",
          gradient: gradientMap[item.series] || "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02), transparent 70%)",
        });
      }

      const existing = seriesMap.get(item.series);
      if (existing) existing.items.push(item);
    });

    const series = Array.from(seriesMap.values()).filter((s) => s.items.length > 0);

    return {
      props: sanitizeData({
        items,
        counts,
        series,
        featuredItems: items.filter((i) => i.featured).slice(0, 4),
      }),
      revalidate: 60,
    };
  } catch (error) {
    console.error("[CANON_INDEX_FAILURE]", error);

    return {
      props: {
        items: [],
        counts: { total: 0, public: 0, innerCircle: 0, restricted: 0 },
        series: [],
        featuredItems: [],
        error: "Failed to load Canon documents",
      },
      revalidate: 60,
    };
  }
};

const CanonIndexPage: NextPage<CanonIndexProps> = ({
  items,
  counts,
  series,
  featuredItems,
  error,
}) => {
  const latestUpdate = latestUpdateLabel(items);
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="The Canon"
      description="Doctrine, purpose, governance, and civilisation — compressed into one spine."
      className="bg-black text-white"
      fullWidth
    >
      <Head>
        <link rel="canonical" href={`${SITE}/canon`} />
        <meta property="og:title" content="The Canon | Abraham of London" />
        <meta
          property="og:description"
          content="Doctrine, purpose, governance, and civilisation — compressed into one spine."
        />
      </Head>

      <main className="relative min-h-screen bg-black text-white selection:bg-amber-500/20">
        <AmbientGlow />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.9 }}
        >
          <HeroPanel counts={counts} latestUpdate={latestUpdate} series={series} />
        </motion.div>

        <FeaturedShelf items={featuredItems} />

        <section className="relative py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 border border-amber-500/20 bg-amber-500/5 p-8 text-center"
              >
                <AlertCircle className="mx-auto mb-4 h-8 w-8 text-amber-500" />
                <p className="text-amber-200/70">{error}</p>
              </motion.div>
            ) : null}

            {items.length === 0 ? (
              <div className="border border-dashed border-white/10 py-32 text-center">
                <Feather className="mx-auto mb-4 h-12 w-12 text-white/10" />
                <p className="font-mono text-xs uppercase tracking-widest text-white/20">
                  No volumes resolved in registry
                </p>
                {process.env.NODE_ENV === "development" ? (
                  <p className="mt-4 font-mono text-xs text-amber-500/30">
                    Check that canon documents exist in content/canon/
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-24 lg:space-y-28">
                {series.map((s, index) => (
                  <SeriesCard key={s.volume} series={s} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {items.length > 0 ? (
          <section className="border-t border-white/6 py-14">
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-white/24" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    Canon indexed • {counts.total} volumes • {latestUpdate}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500/28" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.36em] text-white/18">
                    Abraham of London • 2026
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </Layout>
  );
};

export default CanonIndexPage;