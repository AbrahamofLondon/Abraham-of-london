/**
 * pages/library/index.tsx — INSTITUTIONAL LIBRARY INDEX v2
 *
 * The Abraham of London Library — a governed knowledge estate.
 *
 * Design principles:
 * - Institutional hierarchy, not generic card grid
 * - Interactive access chips, not decorative counters
 * - Type-distinct cards with honest CTAs
 * - Navigable sections, not endless scroll
 * - No restricted/vault body content leakage
 */

import * as React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { buildLibraryIndex } from "@/lib/library/library-index";
import type {
  LibraryIndex,
  LibraryIndexItem,
  LibrarySection,
  LibraryItemType,
  LibraryItemAccess,
  LibraryItemFormat,
  LibrarySectionInfo,
} from "@/lib/library/library-index";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(3,3,5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// Type visual profiles — subtle accent per content category
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_PROFILES: Record<string, { accent: string; category: string }> = {
  canon:        { accent: GOLD,                    category: "Canon"        },
  lexicon:      { accent: GOLD,                    category: "Lexicon"      },
  framework:    { accent: "#93C5FD",               category: "Framework"    },
  playbook:     { accent: "#93C5FD",               category: "Playbook"     },
  toolkit:      { accent: "#93C5FD",               category: "Toolkit"      },
  strategy:     { accent: "#93C5FD",               category: "Strategy"     },
  intelligence: { accent: "#FCD34D",               category: "Intelligence" },
  brief:        { accent: "#FCD34D",               category: "Brief"        },
  evidence:     { accent: "#FCD34D",               category: "Evidence"     },
  premium:      { accent: "#FCD34D",               category: "Premium"      },
  download:     { accent: "#C084FC",               category: "Download"     },
  pdf:          { accent: "#C084FC",               category: "PDF"          },
  print:        { accent: "#C084FC",               category: "Print"        },
  resource:     { accent: "#C084FC",               category: "Resource"     },
  vault:        { accent: "#F87171",               category: "Vault"        },
  book:         { accent: "#6EE7B7",               category: "Book"         },
  essay:        { accent: "rgba(255,255,255,0.55)", category: "Essay"       },
  short:        { accent: "rgba(255,255,255,0.35)", category: "Short"       },
  event:        { accent: "#FDA4AF",               category: "Event"        },
};

const DEFAULT_PROFILE = { accent: "rgba(255,255,255,0.3)", category: "Record" };

function typeProfile(type: LibraryItemType) {
  return TYPE_PROFILES[type] || DEFAULT_PROFILE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Access colours
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_COLORS: Record<LibraryItemAccess, { bg: string; text: string; border: string; label: string }> = {
  public:     { bg: "rgba(34,197,94,0.07)",   text: "rgba(34,197,94,0.75)",   border: "rgba(34,197,94,0.14)",   label: "Public"     },
  member:     { bg: "rgba(59,130,246,0.07)",  text: "rgba(59,130,246,0.75)",  border: "rgba(59,130,246,0.14)",  label: "Member"     },
  restricted: { bg: "rgba(245,158,11,0.07)",  text: "rgba(245,158,11,0.75)",  border: "rgba(245,158,11,0.14)",  label: "Restricted" },
  paid:       { bg: "rgba(239,68,68,0.07)",   text: "rgba(239,68,68,0.75)",   border: "rgba(239,68,68,0.14)",   label: "Paid"       },
  unknown:    { bg: "rgba(255,255,255,0.03)",  text: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.06)", label: "Unknown"    },
};

const TYPE_LABELS: Record<LibraryItemType, string> = {
  essay: "Essay", short: "Short", book: "Book", canon: "Canon", lexicon: "Lexicon",
  framework: "Framework", playbook: "Playbook", strategy: "Strategy", toolkit: "Toolkit",
  intelligence: "Intelligence", brief: "Brief", evidence: "Evidence", download: "Download",
  pdf: "PDF", print: "Print", resource: "Resource", vault: "Vault", event: "Event", premium: "Premium",
};

const FORMAT_LABELS: Record<LibraryItemFormat, string> = {
  article: "Article", pdf: "PDF", epub: "EPUB", worksheet: "Worksheet",
  book: "Book", brief: "Brief", toolkit: "Toolkit", event: "Event", resource: "Resource",
};

// ─────────────────────────────────────────────────────────────────────────────
// CTA label — access-aware, never misleads restricted/paid users
// ─────────────────────────────────────────────────────────────────────────────

export function ctaLabel(item: LibraryIndexItem): string {
  if (!item.href || item.href === "#") return "Access route pending";
  if (item.access === "paid") return "Purchase / Unlock";
  if (item.type === "brief" && item.access === "restricted") return "View metadata / Request access";
  if (item.access === "restricted") return "View access requirements";
  if (item.access === "member") return "Member access";
  if (item.type === "vault") return "View metadata";
  if (item.type === "event") return "View event";
  if (item.type === "brief") return "Read brief";
  if (
    item.href.startsWith("/assets/") ||
    item.href.startsWith("http") ||
    item.format === "pdf" ||
    item.format === "epub"
  ) return "Download";
  return "Read";
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter logic (pure — testable independently of React)
// ─────────────────────────────────────────────────────────────────────────────

export type SortOrder = "recommended" | "newest" | "az" | "restricted_first";

export type Filters = {
  query: string;
  section: LibrarySection | "";
  type: LibraryItemType | "";
  access: LibraryItemAccess | "";
  format: LibraryItemFormat | "";
  sort: SortOrder;
};

export const EMPTY_FILTERS: Filters = {
  query: "", section: "", type: "", access: "", format: "", sort: "recommended",
};

export function applyFilters(items: LibraryIndexItem[], filters: Filters): LibraryIndexItem[] {
  let result = items;

  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        TYPE_LABELS[item.type]?.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)),
    );
  }

  if (filters.section) result = result.filter((i) => i.section === filters.section);
  if (filters.type)    result = result.filter((i) => i.type === filters.type);
  if (filters.access)  result = result.filter((i) => i.access === filters.access);
  if (filters.format)  result = result.filter((i) => i.format === filters.format);

  if (filters.sort === "newest") {
    result = [...result].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } else if (filters.sort === "az") {
    result = [...result].sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters.sort === "restricted_first") {
    const rank = (i: LibraryIndexItem) =>
      i.access === "restricted" ? 0 : i.access === "paid" ? 1 : i.access === "member" ? 2 : 3;
    result = [...result].sort((a, b) => rank(a) - rank(b));
  }

  return result;
}

export function hasActiveFilters(filters: Filters): boolean {
  return !!(filters.query || filters.section || filters.type || filters.access || filters.format);
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

type Props = { index: LibraryIndex };

// ─────────────────────────────────────────────────────────────────────────────
// Static generation — strip no additional fields; LibraryIndexItem has no body
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<Props> = async () => {
  const index = buildLibraryIndex();
  const safe = JSON.parse(JSON.stringify(index));
  return { props: { index: safe }, revalidate: 1800 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const LibraryIndexPage: NextPage<Props> = ({ index }) => {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAllSections, setShowAllSections] = useState<Record<string, boolean>>({});
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleShowAll = useCallback((sectionId: string) => {
    setShowAllSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const setAccess = useCallback((access: LibraryItemAccess | "") => {
    setFilters((f) => ({ ...f, access: f.access === access ? "" : access }));
  }, []);

  const setSection = useCallback((section: LibrarySection | "") => {
    setFilters((f) => ({ ...EMPTY_FILTERS, section: f.section === section ? "" : section, sort: f.sort }));
  }, []);

  const filteredItems = useMemo(
    () => applyFilters(index.items, filters),
    [index.items, filters],
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(index.items.map((i) => i.type))).sort(),
    [index.items],
  );

  const availableFormats = useMemo(
    () =>
      Array.from(new Set(index.items.map((i) => i.format).filter(Boolean) as LibraryItemFormat[])).sort(),
    [index.items],
  );

  const activeFilters = hasActiveFilters(filters);

  const featuredItems = useMemo(
    () => index.items.filter((i) => i.featured && i.status === "published").slice(0, 6),
    [index.items],
  );

  return (
    <Layout
      title="Library | Abraham of London"
      description="The Abraham of London Library is a governed knowledge estate: essays, canon, frameworks, decision instruments, intelligence briefs, downloads, and restricted vault records organised for serious decision work."
      canonicalUrl="/library"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      {/* Bottom padding prevents any fixed-position UI from obscuring cards */}
      <main
        className="min-h-screen"
        style={{ backgroundColor: BASE, color: "white", paddingBottom: "6rem" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">

          {/* ── Hero ── */}
          <header
            className="mb-10 p-6 sm:p-8"
            style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.018)" }}
          >
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Library
            </p>
            <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(1.75rem,3.5vw,2.75rem)", color: "rgba(255,255,255,0.92)", lineHeight: 1.25 }}>
              The Abraham of London Library is a governed knowledge estate.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Essays, canon, frameworks, decision instruments, intelligence briefs, downloads,
              and restricted vault records — organised for serious decision work.
            </p>
            <p className="mt-4" style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
              452+ indexed works across essays, canon, frameworks, intelligence, downloads,
              proof materials, and restricted vault records.
            </p>

            {/* ── Interactive access chips (Part 1) ── */}
            <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Filter by access level">
              <AccessChip
                label="All"
                count={index.stats.total}
                active={!filters.access}
                onToggle={() => setAccess("")}
              />
              <AccessChip
                label="Public"
                count={index.stats.public}
                active={filters.access === "public"}
                onToggle={() => setAccess("public")}
                colorText="rgba(34,197,94,0.8)"
                colorBorder="rgba(34,197,94,0.2)"
                colorBg="rgba(34,197,94,0.05)"
              />
              <AccessChip
                label="Member"
                count={index.stats.member}
                active={filters.access === "member"}
                onToggle={() => setAccess("member")}
                colorText="rgba(59,130,246,0.8)"
                colorBorder="rgba(59,130,246,0.2)"
                colorBg="rgba(59,130,246,0.05)"
              />
              <AccessChip
                label="Restricted"
                count={index.stats.restricted}
                active={filters.access === "restricted"}
                onToggle={() => setAccess("restricted")}
                colorText="rgba(245,158,11,0.8)"
                colorBorder="rgba(245,158,11,0.2)"
                colorBg="rgba(245,158,11,0.05)"
              />
              {index.stats.downloads > 0 && (
                <AccessChip
                  label="Downloads"
                  count={index.stats.downloads}
                  active={filters.section === "downloads_resources"}
                  onToggle={() => setSection("downloads_resources")}
                  colorText="rgba(192,132,252,0.8)"
                  colorBorder="rgba(192,132,252,0.2)"
                  colorBg="rgba(192,132,252,0.05)"
                />
              )}
              {index.stats.canonLexicon > 0 && (
                <AccessChip
                  label="Canon / Lexicon"
                  count={index.stats.canonLexicon}
                  active={filters.section === "canon_lexicon"}
                  onToggle={() => setSection("canon_lexicon")}
                  colorText={`${GOLD}CC`}
                  colorBorder={`${GOLD}33`}
                  colorBg={`${GOLD}0A`}
                />
              )}
            </div>

            {/* Access key */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["public", "member", "restricted", "paid"] as LibraryItemAccess[]).map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[7px] uppercase tracking-widest"
                  style={{ ...mono, backgroundColor: ACCESS_COLORS[a].bg, color: ACCESS_COLORS[a].text, border: `1px solid ${ACCESS_COLORS[a].border}` }}
                >
                  {ACCESS_COLORS[a].label}
                </span>
              ))}
            </div>
          </header>

          {/* ── Pathway cards — shown only on unfiltered view (Part 2) ── */}
          {!activeFilters && (
            <section className="mb-12" aria-label="Primary pathways">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}99` }}>
                Where to begin
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <PathwayCard
                  number="I"
                  title="Learn the doctrine"
                  body="Canon, Lexicon, Essays — the governing definitions, worldview principles, and long-form analysis."
                  section="canon_lexicon"
                  onSelect={setSection}
                  activeSection={filters.section}
                />
                <PathwayCard
                  number="II"
                  title="Apply the instruments"
                  body="Frameworks, Playbooks, Toolkits, Downloads — execution-grade methods and practical decision tools."
                  section="frameworks_playbooks"
                  onSelect={setSection}
                  activeSection={filters.section}
                />
                <PathwayCard
                  number="III"
                  title="Inspect the proof estate"
                  body="Intelligence, Briefs, Evidence — market analysis, case materials, and the institutional proof record."
                  section="intelligence_briefs"
                  onSelect={setSection}
                  activeSection={filters.section}
                />
              </div>
            </section>
          )}

          {/* ── Featured (only when unfiltered) ── */}
          {!activeFilters && featuredItems.length > 0 && (
            <section className="mb-12">
              <SectionLabel>Featured works</SectionLabel>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredItems.map((item) => (
                  <LibraryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* ── Filter panel (Part 4) ── */}
          <section className="mb-10" aria-label="Filter and search controls">
            <div className="flex flex-col gap-3">
              {/* Search row */}
              <div className="relative max-w-2xl">
                <input
                  type="search"
                  placeholder="Search title, summary, tags, type..."
                  value={filters.query}
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded px-4 py-2.5 pr-24 text-white placeholder:text-zinc-700 focus:border-amber-500/40 outline-none text-xs"
                  style={mono}
                  aria-label="Search library"
                />
                <span
                  className="absolute right-3 top-2.5 text-[9px]"
                  style={{ ...mono, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em" }}
                  aria-live="polite"
                >
                  {activeFilters || filters.query ? `${filteredItems.length} of ${index.stats.total}` : `${index.stats.total} works`}
                </span>
              </div>

              {/* Filter selects row */}
              <div className="flex flex-wrap gap-2 items-center">
                <FilterSelect
                  label="Section"
                  value={filters.section}
                  onChange={(v) => setFilters((f) => ({ ...f, section: v as LibrarySection | "" }))}
                  options={[
                    { value: "", label: "All sections" },
                    ...index.sections.filter((s) => s.count > 0).map((s) => ({ value: s.id, label: `${s.title} (${s.count})` })),
                  ]}
                />
                <FilterSelect
                  label="Type"
                  value={filters.type}
                  onChange={(v) => setFilters((f) => ({ ...f, type: v as LibraryItemType | "" }))}
                  options={[
                    { value: "", label: "All types" },
                    ...availableTypes.map((t) => ({ value: t, label: TYPE_LABELS[t as LibraryItemType] || t })),
                  ]}
                />
                <FilterSelect
                  label="Access"
                  value={filters.access}
                  onChange={(v) => setFilters((f) => ({ ...f, access: v as LibraryItemAccess | "" }))}
                  options={[
                    { value: "", label: "All access" },
                    { value: "public", label: "Public" },
                    { value: "member", label: "Member" },
                    { value: "restricted", label: "Restricted" },
                    { value: "paid", label: "Paid" },
                  ]}
                />
                <FilterSelect
                  label="Format"
                  value={filters.format}
                  onChange={(v) => setFilters((f) => ({ ...f, format: v as LibraryItemFormat | "" }))}
                  options={[
                    { value: "", label: "All formats" },
                    ...availableFormats.map((fmt) => ({ value: fmt, label: FORMAT_LABELS[fmt] || fmt })),
                  ]}
                />
                <FilterSelect
                  label="Sort"
                  value={filters.sort}
                  onChange={(v) => setFilters((f) => ({ ...f, sort: v as SortOrder }))}
                  options={[
                    { value: "recommended", label: "Recommended" },
                    { value: "newest",      label: "Newest first" },
                    { value: "az",          label: "A – Z" },
                    { value: "restricted_first", label: "Restricted / Premium first" },
                  ]}
                />
                {(activeFilters) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-[9px] uppercase tracking-wider rounded transition-opacity hover:opacity-70"
                    style={{ ...mono, color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)" }}
                    aria-label="Clear all filters"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Results (Part 3 — sections or flat list) ── */}
          {activeFilters ? (
            <section aria-label={`${filteredItems.length} filtered results`}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}99` }}>
                {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </p>

              {filteredItems.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <LibraryCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState onClear={clearFilters} />
              )}
            </section>
          ) : (
            <div className="space-y-14">
              {index.sections
                .filter((s) => s.count > 0)
                .map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    showAll={showAllSections[section.id] || false}
                    onToggle={() => toggleShowAll(section.id)}
                    onSectionFilter={setSection}
                    sort={filters.sort}
                  />
                ))}
            </div>
          )}

          {/* ── Footer note ── */}
          <footer
            className="mt-16 p-4 text-center text-[9px] uppercase tracking-wider leading-loose"
            style={{ ...mono, color: "rgba(255,255,255,0.18)", borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            Restricted and paid works appear as catalogue entries only.
            No body content is served without entitlement.
            <br />
            Some records are metadata only — access, purchase, or institutional entitlement required to proceed.
          </footer>
        </div>
      </main>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AccessChip — interactive filter button (Part 1)
// ─────────────────────────────────────────────────────────────────────────────

function AccessChip({
  label,
  count,
  active,
  onToggle,
  colorText = "rgba(255,255,255,0.55)",
  colorBorder = "rgba(255,255,255,0.12)",
  colorBg = "rgba(255,255,255,0.03)",
}: {
  label: string;
  count: number;
  active: boolean;
  onToggle: () => void;
  colorText?: string;
  colorBorder?: string;
  colorBg?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className="inline-flex flex-col items-start rounded px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      style={{
        ...mono,
        border: `1px solid ${active ? colorBorder.replace("0.2", "0.45") : colorBorder}`,
        backgroundColor: active ? colorBg.replace("0.05", "0.12") : colorBg,
        opacity: active ? 1 : 0.75,
        boxShadow: active ? `0 0 0 1px ${colorBorder}` : "none",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontSize: "clamp(1rem,2vw,1.35rem)",
          ...serif,
          color: active ? colorText.replace("0.8", "1") : colorText,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: "8px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)",
          marginTop: "4px",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PathwayCard — estate entry point (Part 2)
// ─────────────────────────────────────────────────────────────────────────────

function PathwayCard({
  number,
  title,
  body,
  section,
  onSelect,
  activeSection,
}: {
  number: string;
  title: string;
  body: string;
  section: LibrarySection;
  onSelect: (s: LibrarySection | "") => void;
  activeSection: LibrarySection | "";
}) {
  const active = activeSection === section;
  return (
    <button
      type="button"
      onClick={() => onSelect(section)}
      aria-pressed={active}
      className="group text-left p-5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      style={{
        border: `1px solid ${active ? `${GOLD}44` : "rgba(255,255,255,0.07)"}`,
        backgroundColor: active ? `${GOLD}09` : "rgba(255,255,255,0.012)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${GOLD}30`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = active ? `${GOLD}44` : "rgba(255,255,255,0.07)"; }}
    >
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}88` }}>
        Pathway {number}
      </p>
      <p className="mt-2 text-sm font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
        {body}
      </p>
      <p className="mt-3 text-[9px] uppercase tracking-wider" style={{ ...mono, color: `${GOLD}77` }}>
        {active ? "Active filter — click to clear" : "Browse →"}
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterSelect
// ─────────────────────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="px-3 py-1.5 text-[9px] uppercase tracking-wider rounded outline-none appearance-none cursor-pointer transition-colors"
      style={{
        ...mono,
        color: value ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
        border: "1px solid rgba(255,255,255,0.09)",
        backgroundColor: "rgba(255,255,255,0.025)",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='rgba(255,255,255,0.25)' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "24px",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ backgroundColor: "#111" }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LibraryCard — type-distinct (Parts 5 + 6)
// ─────────────────────────────────────────────────────────────────────────────

function AccessBadge({ access }: { access: LibraryItemAccess }) {
  const c = ACCESS_COLORS[access] || ACCESS_COLORS.unknown;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{ ...mono, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: LibraryItemType }) {
  const profile = typeProfile(type);
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{
        ...mono,
        backgroundColor: "rgba(255,255,255,0.03)",
        color: `${profile.accent}CC`,
        border: `1px solid ${profile.accent}22`,
      }}
    >
      {profile.category}
    </span>
  );
}

function FormatBadge({ format }: { format: LibraryItemFormat | null }) {
  if (!format) return null;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{ ...mono, backgroundColor: `${GOLD}08`, color: `${GOLD}88`, border: `1px solid ${GOLD}14` }}
    >
      {FORMAT_LABELS[format] || format}
    </span>
  );
}

function LibraryCard({ item }: { item: LibraryIndexItem }) {
  const href = item.href || "#";
  const isExternal = href.startsWith("http") || href.startsWith("/assets/");
  const isLocked = item.access === "restricted" || item.access === "paid";
  const profile = typeProfile(item.type);
  const cta = ctaLabel(item);

  const cardContent = (
    <>
      {/* Type-accent left bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "2px",
          backgroundColor: profile.accent,
          opacity: isLocked ? 0.35 : 0.5,
          borderRadius: "1px 0 0 1px",
        }}
      />

      <div className="pl-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <TypeBadge type={item.type} />
          <AccessBadge access={item.access} />
          <FormatBadge format={item.format} />
        </div>

        {/* Title */}
        <h3
          className="text-sm font-medium leading-snug"
          style={{ color: isLocked ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.88)" }}
        >
          {item.title}
        </h3>

        {/* Restricted notice */}
        {item.access === "restricted" && (
          <p className="mt-1 text-[8px] uppercase tracking-wider" style={{ ...mono, color: "rgba(245,158,11,0.55)" }}>
            Restricted record. Metadata only.
          </p>
        )}
        {item.access === "paid" && (
          <p className="mt-1 text-[8px] uppercase tracking-wider" style={{ ...mono, color: "rgba(239,68,68,0.55)" }}>
            Commercial access required.
          </p>
        )}
        {item.access === "member" && (
          <p className="mt-1 text-[8px] uppercase tracking-wider" style={{ ...mono, color: "rgba(59,130,246,0.55)" }}>
            Member access.
          </p>
        )}

        {/* Summary — not shown for vault/restricted to avoid partial body exposure */}
        {item.summary && item.access !== "restricted" && item.type !== "vault" && (
          <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.38)" }}>
            {item.summary}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.18)" }}>
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.12)" }}>
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Date */}
        {item.date && (
          <p className="mt-2 text-[8px]" style={{ ...mono, color: "rgba(255,255,255,0.18)" }}>
            {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}

        {/* CTA */}
        <div className="mt-2.5">
          <span
            className="text-[9px] uppercase tracking-wider"
            style={{ ...mono, color: isLocked ? "rgba(255,255,255,0.25)" : `${GOLD}AA` }}
          >
            {cta} {!isLocked && "→"}
          </span>
        </div>
      </div>
    </>
  );

  const cardStyle: React.CSSProperties = {
    position: "relative",
    display: "block",
    padding: "1rem",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.06)",
    backgroundColor: isLocked ? "rgba(255,255,255,0.007)" : "rgba(255,255,255,0.012)",
    textDecoration: "none",
    transition: "border-color 150ms, background-color 150ms",
    overflow: "hidden",
  };

  if (isLocked) {
    // Restricted items: no live link to avoid routing to unavailable content
    return (
      <div style={cardStyle} aria-label={`${item.title} — ${cta}`}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      style={cardStyle}
      aria-label={`${item.title} — ${cta}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}22`;
        e.currentTarget.style.backgroundColor = `${GOLD}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.012)";
      }}
    >
      {cardContent}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionBlock — navigable sections with collapse (Part 3)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_CARD_LIMIT = 8;

function SectionBlock({
  section,
  showAll,
  onToggle,
  onSectionFilter,
  sort,
}: {
  section: LibrarySectionInfo;
  showAll: boolean;
  onToggle: () => void;
  onSectionFilter: (s: LibrarySection | "") => void;
  sort: SortOrder;
}) {
  const sortedItems = useMemo(() => {
    if (sort === "newest") {
      return [...section.items].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
    if (sort === "az") return [...section.items].sort((a, b) => a.title.localeCompare(b.title));
    return section.items;
  }, [section.items, sort]);

  const displayItems = showAll ? sortedItems : sortedItems.slice(0, SECTION_CARD_LIMIT);
  const hasMore = section.items.length > SECTION_CARD_LIMIT;

  return (
    <section aria-label={section.title}>
      {/* Section header */}
      <div
        className="p-4 mb-5 flex items-start justify-between gap-4"
        style={{ borderLeft: `2px solid ${GOLD}33`, backgroundColor: "rgba(255,255,255,0.008)" }}
      >
        <div className="flex-1 min-w-0">
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}CC` }}>
            {section.icon} {section.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            {section.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
            {section.count}
          </p>
          <button
            onClick={() => onSectionFilter(section.id as LibrarySection)}
            className="text-[8px] uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ ...mono, color: `${GOLD}77` }}
            aria-label={`Filter to ${section.title} only`}
          >
            Filter →
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayItems.map((item) => (
          <LibraryCard key={item.id} item={item} />
        ))}
      </div>

      {/* Show more / collapse */}
      {hasMore && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={onToggle}
            className="text-[9px] uppercase tracking-wider underline underline-offset-4 transition-opacity hover:opacity-70"
            style={{ ...mono, color: showAll ? "rgba(255,255,255,0.28)" : `${GOLD}99` }}
            aria-expanded={showAll}
          >
            {showAll ? "Collapse section" : `View all ${section.count} items in this section`}
          </button>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div
      className="mt-6 p-10 text-center rounded"
      style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}
      role="status"
    >
      <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
        No records match the current filters.
      </p>
      <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
        Try broadening your search or adjusting the access level.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
        style={{ ...mono, color: `${GOLD}AA` }}
      >
        Clear filters
      </button>
    </div>
  );
}

export default LibraryIndexPage;
