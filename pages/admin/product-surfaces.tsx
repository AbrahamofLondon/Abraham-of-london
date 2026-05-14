/**
 * pages/admin/product-surfaces.tsx — Admin Product Surface Registry
 *
 * Canonical estate map of every client-facing diagnostic, assessment, report,
 * escalation, and retained oversight surface.
 *
 * Provides:
 * - high-level counts by category/status/priority
 * - searchable, grouped card layout
 * - preview links to client routes
 * - links to admin monitoring pages
 * - warning badges for high/critical monitoring priority
 * - clear status labels
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import {
  PRODUCT_SURFACE_REGISTRY,
  getProductSurfacesByCategory,
  type AdminProductSurface,
  type ProductSurfaceCategory,
  type ProductSurfaceStatus,
  type ProductSurfaceMonitoringPriority,
} from "@/lib/admin/product-surface-registry";

type PageProps = {
  registry: typeof PRODUCT_SURFACE_REGISTRY;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;
  return { props: { registry: PRODUCT_SURFACE_REGISTRY } };
};

// ─── Design tokens ─────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Helpers ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ProductSurfaceCategory, string> = {
  DIAGNOSTIC: "Diagnostics",
  ASSESSMENT: "Assessments",
  REPORT: "Reports",
  INTERVENTION: "Interventions",
  RETAINER: "Retainer & Oversight",
  ESCALATION: "Escalations",
  CLIENT_PORTAL: "Client Portal",
  CONTENT: "Content",
};

const CATEGORY_ORDER: ProductSurfaceCategory[] = [
  "DIAGNOSTIC",
  "ASSESSMENT",
  "REPORT",
  "INTERVENTION",
  "RETAINER",
  "ESCALATION",
  "CLIENT_PORTAL",
  "CONTENT",
];

const STATUS_LABELS: Record<ProductSurfaceStatus, string> = {
  live: "Live",
  rough: "Rough",
  internal: "Internal",
  experimental: "Experimental",
  deprecated: "Deprecated",
};

const STATUS_COLORS: Record<ProductSurfaceStatus, string> = {
  live: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
  rough: "text-amber-300 border-amber-500/20 bg-amber-500/10",
  internal: "text-blue-300 border-blue-500/20 bg-blue-500/10",
  experimental: "text-purple-300 border-purple-500/20 bg-purple-500/10",
  deprecated: "text-white/40 border-white/10 bg-white/5",
};

const PRIORITY_COLORS: Record<ProductSurfaceMonitoringPriority, string> = {
  low: "text-white/40",
  medium: "text-amber-300/70",
  high: "text-amber-300",
  critical: "text-rose-300",
};

const PRIORITY_ICONS: Record<ProductSurfaceMonitoringPriority, React.ReactNode> = {
  low: null,
  medium: <AlertTriangle className="h-3 w-3 text-amber-300/70" />,
  high: <AlertTriangle className="h-3 w-3 text-amber-300" />,
  critical: <ShieldAlert className="h-3 w-3 text-rose-300" />,
};

// ─── Components ────────────────────────────────────────────────────────────

function SurfaceCard({ surface }: { surface: AdminProductSurface }) {
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5 transition-colors hover:border-white/20">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base text-white">{surface.label}</h3>
            <span
              className={`rounded border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider ${STATUS_COLORS[surface.status]}`}
            >
              {STATUS_LABELS[surface.status]}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55 line-clamp-2">
            {surface.description}
          </p>
        </div>
      </div>

      {/* Metadata row */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[9px] font-mono uppercase tracking-[0.12em]">
        {/* Audience */}
        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-white/40">
          {surface.audience}
        </span>

        {/* Monitoring priority */}
        <span className={`inline-flex items-center gap-1 ${PRIORITY_COLORS[surface.monitoringPriority]}`}>
          {PRIORITY_ICONS[surface.monitoringPriority]}
          {surface.monitoringPriority === "critical"
            ? "Critical priority"
            : surface.monitoringPriority === "high"
              ? "High priority"
              : surface.monitoringPriority === "medium"
                ? "Medium priority"
                : "Low priority"}
        </span>

        {/* Operational owner */}
        <span className="text-white/30">
          Owner: {surface.operationalOwner}
        </span>

        {/* Preview available */}
        {surface.previewAvailable && (
          <span className="text-emerald-400/60">Preview available</span>
        )}
      </div>

      {/* Entry requirement */}
      <div className="mt-3">
        <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
          Entry requirement
        </p>
        <p className="mt-0.5 text-xs text-white/45">{surface.entryRequirement}</p>
      </div>

      {/* Captures */}
      {surface.captures.length > 0 && (
        <div className="mt-3">
          <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Captures
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {surface.captures.map((capture) => (
              <span
                key={capture}
                className="rounded border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] text-white/40"
              >
                {capture}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Outputs */}
      {surface.outputs.length > 0 && (
        <div className="mt-3">
          <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Outputs
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {surface.outputs.map((output) => (
              <span
                key={output}
                className="rounded border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 text-[10px] text-amber-200/60"
              >
                {output}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Downstream */}
      {surface.downstream.length > 0 && (
        <div className="mt-3">
          <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Escalates to
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {surface.downstream.map((down) => (
              <span
                key={down}
                className="rounded border border-white/5 px-2 py-0.5 text-[10px] text-white/35"
              >
                {down}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
        <Link
          href={surface.clientRoute}
          className="inline-flex items-center gap-1 border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
        >
          <ExternalLink className="h-3 w-3" />
          Client route
        </Link>
        {surface.adminRoute && (
          <Link
            href={surface.adminRoute}
            className="inline-flex items-center gap-1 border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
          >
            <ShieldCheck className="h-3 w-3" />
            Admin surface
          </Link>
        )}
        <span className="text-[8px] font-mono text-white/20 self-center ml-auto">
          {surface.clientRoute}
        </span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProductSurfacesPage({
  registry,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<ProductSurfaceCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = React.useState<ProductSurfaceStatus | "all">("all");

  // Compute counts
  const totalSurfaces = registry.length;
  const liveCount = registry.filter((s) => s.status === "live").length;
  const criticalCount = registry.filter((s) => s.monitoringPriority === "critical").length;
  const highCount = registry.filter((s) => s.monitoringPriority === "high").length;

  // Filter
  const filtered = registry.filter((surface) => {
    if (selectedCategory !== "all" && surface.category !== selectedCategory) return false;
    if (selectedStatus !== "all" && surface.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesLabel = surface.label.toLowerCase().includes(q);
      const matchesDescription = surface.description.toLowerCase().includes(q);
      const matchesId = surface.id.toLowerCase().includes(q);
      const matchesCapture = surface.captures.some((c) => c.toLowerCase().includes(q));
      const matchesOutput = surface.outputs.some((o) => o.toLowerCase().includes(q));
      if (!matchesLabel && !matchesDescription && !matchesId && !matchesCapture && !matchesOutput) {
        return false;
      }
    }
    return true;
  });

  // Group filtered by category
  const grouped = getProductSurfacesByCategory();
  const orderedCategories = CATEGORY_ORDER.filter((cat) =>
    filtered.some((s) => s.category === cat),
  );

  return (
    <AdminLayout title="Product Surface Registry">
      <Head>
        <title>Product Surfaces | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-500/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Product Surface Registry
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Product estate map</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                Every client-facing diagnostic, assessment, report, escalation, and retained oversight
                surface. Use this to understand the product estate, find monitoring surfaces, and
                identify what needs operational attention.
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-white/60">
              <FileText className="h-3 w-3" />
              {totalSurfaces} surfaces
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              {liveCount} live
            </span>
            {highCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {highCount} high priority
              </span>
            )}
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-3 w-3" />
                {criticalCount} critical priority
              </span>
            )}
          </div>
        </section>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search surfaces..."
              className="w-full border border-white/10 bg-zinc-900/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-amber-500/30 focus:outline-none"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ProductSurfaceCategory | "all")}
            className="border border-white/10 bg-zinc-900/50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/60 focus:border-amber-500/30 focus:outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ProductSurfaceStatus | "all")}
            className="border border-white/10 bg-zinc-900/50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/60 focus:border-amber-500/30 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {(["live", "rough", "internal", "experimental", "deprecated"] as const).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          {/* Result count */}
          <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/30">
            {filtered.length} of {totalSurfaces} shown
          </span>
        </div>

        {/* Grouped surfaces */}
        {orderedCategories.length === 0 ? (
          <div className="border border-white/10 bg-zinc-950/70 p-8 text-center">
            <p className="font-serif text-lg text-white/50">No surfaces match your filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="mt-3 border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
            >
              Clear filters
            </button>
          </div>
        ) : (
          orderedCategories.map((category) => {
            const surfaces = filtered.filter((s) => s.category === category);
            if (surfaces.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                  <h2 className="font-serif text-lg text-white/80">{CATEGORY_LABELS[category]}</h2>
                  <span className="text-[9px] font-mono text-white/25">{surfaces.length}</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {surfaces.map((surface) => (
                    <SurfaceCard key={surface.id} surface={surface} />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        <p className="text-center text-[9px] font-mono uppercase tracking-[0.18em] text-white/20">
          Static registry v1 — dynamic route scanning may be added in a future version.
        </p>
      </div>
    </AdminLayout>
  );
}
