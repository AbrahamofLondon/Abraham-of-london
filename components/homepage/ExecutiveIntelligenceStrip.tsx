import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  PenTool,
  Workflow,
  Shield,
  Scale,
  Target,
} from "lucide-react";

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

const cx = (...x: Array<string | false | null | undefined>) =>
  x.filter(Boolean).join(" ");

function toDateLabel(input?: LooseShort["date"]): string {
  if (!input) return "Undated";
  const d = input instanceof Date ? input : new Date(String(input));
  if (!Number.isFinite(d.getTime())) return "Undated";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getHref(s: LooseShort): string {
  if (s.url) return s.url;
  if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
  const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
  if (raw) return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
  return "/shorts";
}

function takeSummary(s: LooseShort): string {
  const t = (s.excerpt || s.description || "").toString().trim();
  if (t) return t;
  return "High-signal field note designed to translate into a decision or a routine.";
}

function takeReadTime(s: LooseShort): string {
  const t = (s.readTime || "").toString().trim();
  return t ? t : "Brief";
}

const rails = [
  { label: "Cadence", icon: <Workflow className="h-4 w-4 text-amber-300" /> },
  { label: "Controls", icon: <Shield className="h-4 w-4 text-amber-300" /> },
  { label: "Decision Rights", icon: <Scale className="h-4 w-4 text-amber-300" /> },
  { label: "Mandate", icon: <Target className="h-4 w-4 text-amber-300" /> },
] as const;

export default function ExecutiveIntelligenceStrip({
  shorts,
  viewAllHref = "/shorts",
}: {
  shorts: LooseShort[];
  viewAllHref?: string;
}): JSX.Element | null {
  const items = Array.isArray(shorts) ? shorts.slice(0, 6) : [];
  if (!items.length) return null;

  // Feature the first item as “Executive Brief”
  const [lead, ...rest] = items;

  return (
    <section className="relative bg-black py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:120px_120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,158,11,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
              Executive intelligence
            </p>
            <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
              Notes built for deployment.
            </h2>
            <p className="mt-5 text-xl font-light text-gray-300">
              Not “content.” Field briefs that become decisions, routines, and operating standards.
            </p>

            {/* Discipline rail */}
            <div className="mt-8 flex flex-wrap gap-3">
              {rails.map((r) => (
                <span
                  key={r.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 backdrop-blur-sm"
                >
                  {r.icon}
                  {r.label}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all duration-300 hover:border-amber-400/50 hover:bg-white/10"
          >
            Browse all briefs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Body */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Lead brief */}
          <Link
            href={getHref(lead)}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5 lg:col-span-7"
          >
            <div className="absolute right-7 top-7 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-gray-300">
              Executive Brief • {takeReadTime(lead)}
            </div>

            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
              <PenTool className="h-7 w-7" />
            </div>

            <h3 className="font-serif text-4xl font-semibold text-amber-100">
              {lead.title || "Untitled"}
            </h3>

            <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-gray-300">
              {takeSummary(lead)}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                {toDateLabel(lead.date)} • Deployable signal
              </span>

              <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-amber-200">
                Open brief{" "}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.08),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>

          {/* Brief list */}
          <div className="grid gap-6 lg:col-span-5">
            {rest.slice(0, 5).map((s, idx) => (
              <Link
                key={`${s.title ?? "brief"}-${idx}`}
                href={getHref(s)}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                      {toDateLabel(s.date)} • {takeReadTime(s)}
                    </p>
                    <p className="mt-3 line-clamp-2 text-lg font-semibold text-amber-100">
                      {s.title || "Untitled"}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-gray-300">
                      {takeSummary(s)}
                    </p>
                  </div>

                  <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.06),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}