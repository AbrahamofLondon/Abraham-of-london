/* components/downloads/SurrenderAssetsLanding.tsx — SSOT SAFE (PRESENTATIONAL, PROP-DRIVEN)
   - Never renders empty silently: shows deterministic diagnostics if assets are missing.
   - Accepts pre-grouped props, but can derive grouped+stats from `assets` if caller passes only assets.
   - No registry imports here (presentational only).
*/
import * as React from "react";
import { safeArraySlice } from "@/lib/utils/safe";
import {
  Download as DownloadIcon,
  FileText,
  Shield,
  Users,
  Zap,
  Award,
  Sparkles,
  Lock,
  ChevronRight,
} from "lucide-react";

type AssetTier = string;

export type SurrenderAsset = {
  id: string;
  title: string;

  type?: string; // "worksheet" | "assessment" | "tool" | "framework" | ...
  tier?: AssetTier; // "public" | "member" | "inner-circle" | etc.
  outputPath?: string; // SSOT href for downloads (public-relative)

  description?: string;
  excerpt?: string;
  tags?: string[];
  category?: string;

  format?: string;
  formats?: string[];

  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  version?: string;
  author?: string;
  priority?: number;

  fileSizeHuman?: string; // optional UI helper
};

type GroupKey = "worksheets" | "assessments" | "tools" | "other";

export type SurrenderAssetsLandingProps = {
  assets: SurrenderAsset[];

  // Optional — caller may pre-group.
  grouped?: Record<GroupKey, SurrenderAsset[]>;

  // Optional — caller may pre-compute.
  stats?: {
    total: number;
    interactive: number;
    fillable: number;
    public: number;
  };
};

function norm(input: unknown) {
  return String(input ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase();
}

function safeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x ?? "").trim()).filter(Boolean);
}

function hrefFromAsset(asset: SurrenderAsset): string {
  const href = String(asset.outputPath || "").trim();
  if (!href) return "#";
  return href.startsWith("/") ? href : `/${href.replace(/^\/+/, "")}`;
}

function tierBadge(tier: unknown) {
  const t = norm(tier);
  if (!t || t === "public") {
    return {
      label: "Public",
      Icon: Sparkles,
      cls: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    };
  }
  return {
    label: t.replace(/-/g, " "),
    Icon: Lock,
    cls: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  };
}

function typeBadge(type: unknown) {
  const t = norm(type);
  if (t === "worksheet") return { label: "Worksheet", Icon: FileText, cls: "border-amber-500/25 bg-amber-500/10 text-amber-200" };
  if (t === "assessment") return { label: "Assessment", Icon: Shield, cls: "border-sky-500/25 bg-sky-500/10 text-sky-200" };
  if (t === "tool") return { label: "Tool", Icon: Zap, cls: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" };
  if (t === "framework") return { label: "Framework", Icon: Users, cls: "border-indigo-500/25 bg-indigo-500/10 text-indigo-200" };
  return { label: (t || "PDF").toUpperCase(), Icon: FileText, cls: "border-white/10 bg-white/[0.03] text-white/70" };
}

function groupAssets(assets: SurrenderAsset[]): Record<GroupKey, SurrenderAsset[]> {
  const out: Record<GroupKey, SurrenderAsset[]> = {
    worksheets: [],
    assessments: [],
    tools: [],
    other: [],
  };

  for (const a of assets) {
    const t = norm(a.type);
    if (t === "worksheet") out.worksheets.push(a);
    else if (t === "assessment") out.assessments.push(a);
    else if (t === "tool" || t === "framework") out.tools.push(a);
    else out.other.push(a);
  }

  return out;
}

function computeStats(assets: SurrenderAsset[]) {
  const total = assets.length;
  const interactive = assets.filter((a) => Boolean(a.isInteractive)).length;
  const fillable = assets.filter((a) => Boolean(a.isFillable)).length;
  const pub = assets.filter((a) => norm(a.tier) === "public" || !norm(a.tier)).length;

  return { total, interactive, fillable, public: pub };
}

type AssetCardProps = {
  asset: SurrenderAsset;
  index: number;
};

const AssetCard: React.FC<AssetCardProps> = ({ asset, index }) => {
  const href = hrefFromAsset(asset);

  const tb = typeBadge(asset.type);
  const rb = tierBadge(asset.tier);

  const TypeIcon = tb.Icon;
  const TierIcon = rb.Icon;

  const tags = (safeArraySlice(asset.tags || [], 0, 3) as unknown[])
  .map((x) => String(x).trim())
  .filter(Boolean);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-amber-500/25 hover:bg-white/[0.07]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_10%_20%,rgba(245,158,11,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_90%_80%,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${tb.cls}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              {tb.label}
            </span>

            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${rb.cls}`}>
              <TierIcon className="h-3.5 w-3.5" />
              {rb.label}
            </span>

            {asset.isInteractive ? (
              <span className="inline-flex items-center rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">
                interactive
              </span>
            ) : null}

            {asset.isFillable ? (
              <span className="inline-flex items-center rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">
                fillable
              </span>
            ) : null}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-white/35">
            {asset.fileSizeHuman || asset.format || "PDF"}
          </div>
        </div>

        <h3 className="mt-5 font-serif text-xl text-white/90 tracking-tight group-hover:text-amber-100 transition-colors">
          {asset.title}
        </h3>

        {asset.description ? (
          <p className="mt-2 text-sm text-white/55 leading-relaxed">{asset.description}</p>
        ) : null}

        {tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={`${asset.id}-${tag}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/45"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/35">
            asset_{String(index + 1).padStart(2, "0")}
          </div>

          <a
            href={href}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/15 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            Download
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

function Section({
  title,
  description,
  icon,
  assets,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  assets: SurrenderAsset[];
}) {
  return (
    <section className="mt-14">
      <div className="mb-7 flex items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-amber-200">
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-2xl text-white/95 tracking-tight">{title}</h2>
          <p className="text-sm text-white/45">{description}</p>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
            No assets indexed in this category
          </div>
          <div className="mt-2 text-white/60">
            Ensure items are typed correctly (<span className="font-mono text-amber-200">worksheet</span>,{" "}
            <span className="font-mono text-amber-200">assessment</span>,{" "}
            <span className="font-mono text-amber-200">tool</span>,{" "}
            <span className="font-mono text-amber-200">framework</span>) and have a valid <span className="font-mono text-amber-200">outputPath</span>.
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset, i) => (
            <AssetCard key={asset.id} asset={asset} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function SurrenderAssetsLanding(props: SurrenderAssetsLandingProps): React.ReactElement {
  const assets = Array.isArray(props.assets) ? props.assets : [];
  const grouped = props.grouped ?? groupAssets(assets);
  const stats = props.stats ?? computeStats(assets);

  const total = stats.total;

  // Hard diagnostic: never render a blank page again.
  const diagnostics = {
    received: assets.length,
    worksheets: grouped.worksheets.length,
    assessments: grouped.assessments.length,
    tools: grouped.tools.length,
    other: grouped.other.length,
    interactive: stats.interactive,
    fillable: stats.fillable,
    public: stats.public,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.06),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-5 py-2">
              <Award className="h-4 w-4 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-200">
                Surrender Framework Assets
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl md:text-6xl font-bold tracking-tight italic">
              Transform Theory Into <span className="text-amber-500">Practice</span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg md:text-xl text-white/55 leading-relaxed">
              Worksheets, diagnostics, and tools that turn surrender into an operating discipline.
            </p>

            {/* STAT RAIL */}
            <div className="mt-10 grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="text-3xl font-bold">{total}</div>
                <div className="mt-1 text-sm text-white/45">Total Assets</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="text-3xl font-bold text-amber-400">{stats.interactive}</div>
                <div className="mt-1 text-sm text-white/45">Interactive</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="text-3xl font-bold text-emerald-400">{stats.public}</div>
                <div className="mt-1 text-sm text-white/45">Public</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="text-3xl font-bold text-fuchsia-300">{stats.fillable}</div>
                <div className="mt-1 text-sm text-white/45">Fillable</div>
              </div>
            </div>

            {/* Diagnostic ribbon (subtle, but decisive) */}
            <div className="mt-8 w-full max-w-5xl rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left">
              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                Diagnostics (render-proof)
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 text-[10px] font-mono uppercase tracking-widest text-white/45">
                <div>received: <span className="text-white/80">{diagnostics.received}</span></div>
                <div>worksheets: <span className="text-white/80">{diagnostics.worksheets}</span></div>
                <div>assessments: <span className="text-white/80">{diagnostics.assessments}</span></div>
                <div>tools: <span className="text-white/80">{diagnostics.tools}</span></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BODY */}
      <div id="downloads" className="mx-auto max-w-7xl px-6 py-14">
        {total === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              No assets available
            </div>
            <h2 className="mt-4 font-serif text-3xl text-white">This page received zero items.</h2>
            <p className="mt-3 text-white/60 max-w-3xl mx-auto">
              This component is presentational only. Your page must pass props from a registry-backed loader.
              If you see <span className="font-mono text-amber-200">received: 0</span>, your upstream loader is returning nothing.
            </p>
          </div>
        ) : (
          <>
            <Section
              title="Worksheets & Templates"
              description="Interactive tools for daily practice"
              icon={<FileText className="h-6 w-6" />}
              assets={grouped.worksheets}
            />

            <Section
              title="Assessments & Diagnostics"
              description="Measure your surrender orientation"
              icon={<Shield className="h-6 w-6" />}
              assets={grouped.assessments}
            />

            <Section
              title="Tools & Frameworks"
              description="Decision-making frameworks and operational instruments"
              icon={<Zap className="h-6 w-6" />}
              assets={grouped.tools}
            />

            {grouped.other.length > 0 ? (
              <Section
                title="Other Assets"
                description="Indexed items that don’t fit the primary buckets"
                icon={<Users className="h-6 w-6" />}
                assets={grouped.other}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}