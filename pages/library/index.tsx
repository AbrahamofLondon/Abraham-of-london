/**
 * pages/library/index.tsx — INSTITUTIONAL LIBRARY INDEX v1
 *
 * Master index for Abraham of London's intellectual estate.
 * Surfaces all 16+ content types across 8 systematic sections.
 *
 * Design principles:
 * - Institutional, not SaaS
 * - Comprehensive, not partial
 * - Clear access boundaries
 * - Searchable and filterable
 * - Static-build safe
 */

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
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
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  index: LibraryIndex;
};

// ─────────────────────────────────────────────────────────────────────────────
// Static generation
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<Props> = async () => {
  const index = buildLibraryIndex();

  // Serialise safely (strip any non-serialisable fields)
  const safe = JSON.parse(JSON.stringify(index));

  return {
    props: { index: safe },
    revalidate: 1800, // 30 minutes
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Access badge colours
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_COLORS: Record<LibraryItemAccess, { bg: string; text: string; border: string; label: string }> = {
  public: {
    bg: "rgba(34,197,94,0.08)",
    text: "rgba(34,197,94,0.7)",
    border: "rgba(34,197,94,0.15)",
    label: "Public",
  },
  member: {
    bg: "rgba(59,130,246,0.08)",
    text: "rgba(59,130,246,0.7)",
    border: "rgba(59,130,246,0.15)",
    label: "Member",
  },
  restricted: {
    bg: "rgba(245,158,11,0.08)",
    text: "rgba(245,158,11,0.7)",
    border: "rgba(245,158,11,0.15)",
    label: "Restricted",
  },
  paid: {
    bg: "rgba(239,68,68,0.08)",
    text: "rgba(239,68,68,0.7)",
    border: "rgba(239,68,68,0.15)",
    label: "Paid",
  },
  unknown: {
    bg: "rgba(255,255,255,0.04)",
    text: "rgba(255,255,255,0.3)",
    border: "rgba(255,255,255,0.06)",
    label: "Unknown",
  },
};

const TYPE_LABELS: Record<LibraryItemType, string> = {
  essay: "Essay",
  short: "Short",
  book: "Book",
  canon: "Canon",
  lexicon: "Lexicon",
  framework: "Framework",
  playbook: "Playbook",
  strategy: "Strategy",
  toolkit: "Toolkit",
  intelligence: "Intelligence",
  brief: "Brief",
  evidence: "Evidence",
  download: "Download",
  pdf: "PDF",
  print: "Print",
  resource: "Resource",
  vault: "Vault",
  event: "Event",
  premium: "Premium",
};

const FORMAT_LABELS: Record<LibraryItemFormat, string> = {
  article: "Article",
  pdf: "PDF",
  epub: "EPUB",
  worksheet: "Worksheet",
  book: "Book",
  brief: "Brief",
  toolkit: "Toolkit",
  event: "Event",
  resource: "Resource",
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter state
// ─────────────────────────────────────────────────────────────────────────────

type Filters = {
  query: string;
  section: LibrarySection | "";
  type: LibraryItemType | "";
  access: LibraryItemAccess | "";
  format: LibraryItemFormat | "";
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const LibraryIndexPage: NextPage<Props> = ({ index }) => {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    section: "",
    type: "",
    access: "",
    format: "",
  });

  const [showAllSections, setShowAllSections] = useState<Record<string, boolean>>({});

  const toggleShowAll = useCallback((sectionId: string) => {
    setShowAllSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    let items = index.items;

    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          TYPE_LABELS[item.type]?.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q)),
      );
    }

    if (filters.section) items = items.filter((i) => i.section === filters.section);
    if (filters.type) items = items.filter((i) => i.type === filters.type);
    if (filters.access) items = items.filter((i) => i.access === filters.access);
    if (filters.format) items = items.filter((i) => i.format === filters.format);

    return items;
  }, [index.items, filters]);

  // ── Derived filter options ──
  const availableTypes = useMemo(() => {
    const types = new Set(index.items.map((i) => i.type));
    return Array.from(types).sort();
  }, [index.items]);

  const availableFormats = useMemo(() => {
    const formats = new Set(index.items.map((i) => i.format).filter(Boolean) as LibraryItemFormat[]);
    return Array.from(formats).sort();
  }, [index.items]);

  const hasActiveFilters = filters.query || filters.section || filters.type || filters.access || filters.format;

  // ── Featured items ──
  const featuredItems = useMemo(() => {
    return index.items
      .filter((i) => i.featured && i.status === "published")
      .slice(0, 8);
  }, [index.items]);

  // ── Render ──
  return (
    <Layout
      title="Library | Abraham of London"
      description="The Abraham of London library brings together essays, frameworks, books, decision instruments, briefs, canon, lexicon, downloads, and restricted vault materials into one governed knowledge estate."
      canonicalUrl="/library"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen"
        style={{ backgroundColor: BASE, color: "white" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          {/* ── Hero ── */}
          <header
            className="mb-12 p-6"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}
            >
              Library
            </p>
            <h1
              className="mt-4"
              style={{
                ...serif,
                fontSize: "clamp(2rem,4vw,3rem)",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              The Abraham of London library brings together essays, frameworks,
              books, decision instruments, briefs, canon, lexicon, downloads, and
              restricted vault materials into one governed knowledge estate.
            </h1>

            {/* Stats rail */}
            <div className="mt-6 flex flex-wrap gap-6">
              <Stat label="Total indexed works" value={index.stats.total} />
              <Stat label="Public" value={index.stats.public} />
              <Stat label="Member / Restricted" value={index.stats.member + index.stats.restricted} />
              <Stat label="Downloads & Resources" value={index.stats.downloads} />
              <Stat label="Canon & Lexicon" value={index.stats.canonLexicon} />
            </div>

            {/* Access legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              <AccessLegendBadge access="public" />
              <AccessLegendBadge access="member" />
              <AccessLegendBadge access="restricted" />
              <AccessLegendBadge access="paid" />
            </div>
          </header>

          {/* ── Featured rail ── */}
          {featuredItems.length > 0 && (
            <section className="mb-12">
              <SectionLabel>Featured works</SectionLabel>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredItems.map((item) => (
                  <LibraryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* ── Search and filters ── */}
          <section className="mb-12">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Search title, summary, tags, type..."
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, query: e.target.value }))
                  }
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 pr-20 text-white placeholder:text-zinc-600 focus:border-amber-500/50 outline-none text-sm"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                />
                <span
                  className="absolute right-3 top-3 text-[10px]"
                  style={{
                    ...mono,
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {filteredItems.length} results
                </span>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  value={filters.section}
                  onChange={(v) => setFilters((f) => ({ ...f, section: v as any }))}
                  options={[
                    { value: "", label: "All sections" },
                    ...index.sections.map((s) => ({
                      value: s.id,
                      label: `${s.title} (${s.count})`,
                    })),
                  ]}
                />
                <FilterSelect
                  value={filters.type}
                  onChange={(v) => setFilters((f) => ({ ...f, type: v as any }))}
                  options={[
                    { value: "", label: "All types" },
                    ...availableTypes.map((t) => ({
                      value: t,
                      label: TYPE_LABELS[t as LibraryItemType] || t,
                    })),
                  ]}
                />
                <FilterSelect
                  value={filters.access}
                  onChange={(v) => setFilters((f) => ({ ...f, access: v as any }))}
                  options={[
                    { value: "", label: "All access" },
                    { value: "public", label: "Public" },
                    { value: "member", label: "Member" },
                    { value: "restricted", label: "Restricted" },
                    { value: "paid", label: "Paid" },
                  ]}
                />
                <FilterSelect
                  value={filters.format}
                  onChange={(v) => setFilters((f) => ({ ...f, format: v as any }))}
                  options={[
                    { value: "", label: "All formats" },
                    ...availableFormats.map((fmt) => ({
                      value: fmt,
                      label: FORMAT_LABELS[fmt] || fmt,
                    })),
                  ]}
                />
                {hasActiveFilters && (
                  <button
                    onClick={() =>
                      setFilters({ query: "", section: "", type: "", access: "", format: "" })
                    }
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider rounded transition-colors"
                    style={{
                      ...mono,
                      color: "rgba(255,255,255,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Results / Sections ── */}
          {hasActiveFilters ? (
            <section>
              <SectionLabel>
                {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </SectionLabel>
              {filteredItems.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <LibraryCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div
                  className="mt-6 p-8 text-center rounded-lg"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                  }}
                >
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No items match the current filters.
                  </p>
                  <button
                    onClick={() => setFilters({ query: "", section: "", type: "", access: "", format: "" })}
                    className="mt-3 text-xs underline underline-offset-4"
                    style={{ color: `${GOLD}AA` }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </section>
          ) : (
            /* Section grid view */
            <div className="space-y-12">
              {index.sections
                .filter((s) => s.count > 0)
                .map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    showAll={showAllSections[section.id] || false}
                    onToggle={() => toggleShowAll(section.id)}
                  />
                ))}
            </div>
          )}

          {/* ── Footer note ── */}
          <footer
            className="mt-16 p-4 text-center text-[10px] uppercase tracking-wider leading-relaxed"
            style={{
              ...mono,
              color: "rgba(255,255,255,0.2)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            Some restricted or paid works are visible as catalogue entries but
            require access, entitlement, or purchase.
          </footer>
        </div>
      </main>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl" style={{ ...serif, color: GOLD }}>
        {value}
      </p>
      <p
        className="text-[9px] uppercase tracking-widest mt-0.5"
        style={{ ...mono, color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </p>
    </div>
  );
}

function AccessLegendBadge({ access }: { access: LibraryItemAccess }) {
  const colors = ACCESS_COLORS[access] || ACCESS_COLORS.unknown;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] uppercase tracking-widest"
      style={{
        ...mono,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {colors.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}
    >
      {children}
    </p>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 text-[10px] uppercase tracking-wider rounded transition-colors outline-none appearance-none cursor-pointer"
      style={{
        ...mono,
        color: value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.03)",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='rgba(255,255,255,0.3)' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "24px",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function AccessBadge({ access }: { access: LibraryItemAccess }) {
  const colors = ACCESS_COLORS[access] || ACCESS_COLORS.unknown;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{
        ...mono,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {colors.label}
    </span>
  );
}

function TypeBadge({ type }: { type: LibraryItemType }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{
        ...mono,
        backgroundColor: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function FormatBadge({ format }: { format: LibraryItemFormat | null }) {
  if (!format) return null;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[7px] uppercase tracking-widest"
      style={{
        ...mono,
        backgroundColor: "rgba(201,169,110,0.08)",
        color: "rgba(201,169,110,0.6)",
        border: "1px solid rgba(201,169,110,0.12)",
      }}
    >
      {FORMAT_LABELS[format] || format}
    </span>
  );
}

function LibraryCard({ item }: { item: LibraryIndexItem }) {
  const href = item.href || "#";
  const isExternal = href.startsWith("http") || href.startsWith("/assets/");
  const isUnresolved = href === "#" || !href;

  return (
    <Link
      href={isUnresolved ? "#" : href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group block p-4 rounded-lg transition-all duration-150"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.012)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,169,110,0.2)";
        e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.012)";
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <TypeBadge type={item.type} />
        <AccessBadge access={item.access} />
        <FormatBadge format={item.format} />
      </div>

      <h3
        className="text-sm font-medium leading-snug group-hover:underline underline-offset-2"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {item.title}
      </h3>

      {item.summary && (
        <p
          className="mt-1.5 text-xs leading-relaxed line-clamp-2"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {item.summary}
        </p>
      )}

      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[7px] uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {item.date && (
        <p
          className="mt-1.5 text-[9px]"
          style={{ ...mono, color: "rgba(255,255,255,0.2)" }}
        >
          {new Date(item.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}

      <div className="mt-2">
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ ...mono, color: `${GOLD}99` }}
        >
          {isUnresolved
            ? "Access route pending"
            : item.access === "paid"
              ? "Purchase / Unlock"
              : item.access === "restricted"
                ? "Request access"
                : isExternal
                  ? "Download"
                  : "Read"}
        </span>
      </div>
    </Link>
  );
}

function SectionBlock({
  section,
  showAll,
  onToggle,
}: {
  section: LibrarySectionInfo;
  showAll: boolean;
  onToggle: () => void;
}) {
  const previewItems = showAll ? section.items : section.items.slice(0, 8);
  const hasMore = section.items.length > 8;

  return (
    <section>
      <div
        className="p-4 mb-4"
        style={{
          borderLeft: `2px solid ${GOLD}44`,
          backgroundColor: "rgba(255,255,255,0.01)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}
            >
              {section.icon} {section.title}
            </p>
            <p
              className="mt-1 text-xs leading-relaxed max-w-3xl"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {section.description}
            </p>
          </div>
          <p
            style={{
              ...mono,
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              whiteSpace: "nowrap",
              marginLeft: "12px",
            }}
          >
            {section.count} item{section.count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {previewItems.map((item) => (
          <LibraryCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={onToggle}
          className="mt-3 text-[10px] uppercase tracking-wider underline underline-offset-4 transition-colors"
          style={{
            ...mono,
            color: showAll ? "rgba(255,255,255,0.3)" : `${GOLD}AA`,
          }}
        >
          {showAll ? "Show fewer" : `View all ${section.count} items`}
        </button>
      )}
    </section>
  );
}

export default LibraryIndexPage;