export const dynamic = "force-dynamic";

import Link from "next/link";
import audit from "@/lib/product/product-estate-reality-audit.json";
import {
  PRODUCT_SURFACE_REGISTRY,
  getSurfacesBelow,
  getPaidSurfacesWithGaps,
  getPublicSurfacesBelowThreshold,
  getSurfacesByFamily,
  getCorridorSurfaces,
  getMarketActivationSurfaces,
  getSurfacesWithFailGap,
  type ProductSurface,
  type SurfaceExposureStatus,
} from "@/lib/product/product-surface-registry";
import {
  evaluateAllSurfaces,
  getOverexposedSurfaces,
  validateCorridorOrdering,
  type SurfaceAuthorityScore,
} from "@/lib/product/product-surface-authority";

export const metadata = {
  title: "Product Estate Command Centre",
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const exposureTone: Record<SurfaceExposureStatus, string> = {
  public_active:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  public_limited:   "border-sky-500/30 bg-sky-500/10 text-sky-200",
  controlled_access:"border-amber-500/30 bg-amber-500/10 text-amber-200",
  evidence_gated:   "border-violet-500/30 bg-violet-500/10 text-violet-200",
  review_gated:     "border-orange-500/30 bg-orange-500/10 text-orange-200",
  admin_only:       "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  dormant:          "border-zinc-600/30 bg-zinc-700/10 text-zinc-500",
  hidden:           "border-zinc-700/20 bg-zinc-800/10 text-zinc-600",
  retired:          "border-zinc-800/20 bg-zinc-900/10 text-zinc-700",
};

function scoreTone(score: number) {
  if (score >= 9) return "text-emerald-300";
  if (score >= 8) return "text-sky-300";
  if (score >= 6) return "text-amber-300";
  return "text-red-400";
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tone ?? "border-white/10 bg-white/5 text-white/55"}`}>
      {children}
    </span>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">{label}</p>
      {count !== undefined && (
        <Badge>{count} surfaces</Badge>
      )}
    </div>
  );
}

function SurfaceRow({ surface, score }: { surface: ProductSurface; score?: SurfaceAuthorityScore }) {
  return (
    <div className="grid grid-cols-[2.5rem_2fr_1fr_1fr_2fr] gap-3 border-b border-white/8 px-4 py-3 text-sm last:border-b-0 hover:bg-white/[0.02]">
      <div className={`font-mono text-base font-semibold leading-tight ${scoreTone(surface.currentScore)}`}>
        {surface.currentScore}
      </div>
      <div>
        {surface.route ? (
          <Link href={surface.route} className="font-medium text-white/85 hover:text-amber-200">
            {surface.displayName}
          </Link>
        ) : (
          <span className="font-medium text-white/65">{surface.displayName}</span>
        )}
        <p className="mt-0.5 font-mono text-[10px] text-white/30">{surface.surfaceId}</p>
      </div>
      <div className="flex flex-col gap-1">
        <Badge tone={exposureTone[surface.currentExposureStatus]}>
          {surface.currentExposureStatus.replace(/_/g, " ")}
        </Badge>
        {surface.acceptsPayment && <Badge tone="border-emerald-500/20 text-emerald-400/70">paid</Badge>}
      </div>
      <div>
        <Badge>{surface.surfaceType.replace(/_/g, " ")}</Badge>
      </div>
      <div className="text-[11px] leading-5 text-white/45">
        {surface.authorityGaps.length > 0 ? (
          <span className={(surface.authorityGaps[0] ?? "").startsWith("[FAIL]") ? "text-red-300/70" : "text-amber-300/60"}>
            {(surface.authorityGaps[0] ?? "").slice(0, 80)}{(surface.authorityGaps[0] ?? "").length > 80 ? "…" : ""}
          </span>
        ) : (
          <span className="text-emerald-400/50">No recorded gaps</span>
        )}
      </div>
    </div>
  );
}

function SurfaceTable({ surfaces, scores }: { surfaces: ProductSurface[]; scores: SurfaceAuthorityScore[] }) {
  const scoreMap = new Map(scores.map((s) => [s.surfaceId, s]));
  const sorted = [...surfaces].sort((a, b) => a.currentScore - b.currentScore);
  return (
    <div className="overflow-hidden border border-white/10">
      <div className="grid grid-cols-[2.5rem_2fr_1fr_1fr_2fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-white/35">
        <span>Score</span>
        <span>Surface</span>
        <span>Exposure</span>
        <span>Type</span>
        <span>Top Gap</span>
      </div>
      {sorted.map((s) => (
        <SurfaceRow key={s.surfaceId} surface={s} score={scoreMap.get(s.surfaceId)} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductEstateCommandCentrePage() {
  const allSurfaces = PRODUCT_SURFACE_REGISTRY;
  const allScores = evaluateAllSurfaces();
  const corridorOrdering = validateCorridorOrdering();
  const overexposed = getOverexposedSurfaces();

  const surfacesBelow9 = getSurfacesBelow(9);
  const paidWithGaps = getPaidSurfacesWithGaps();
  const publicBelow9 = getPublicSurfacesBelowThreshold(9);
  const withFailGap = getSurfacesWithFailGap();

  const corridorSurfaces = getCorridorSurfaces();
  const marketActivation = getMarketActivationSurfaces();
  const instruments = getSurfacesByFamily("decision_instruments");
  const intelligence = getSurfacesByFamily("market_intelligence");
  const continuity = getSurfacesByFamily("continuity_and_subscription");
  const advisory = getSurfacesByFamily("advisory_and_oversight");
  const supporting = getSurfacesByFamily("supporting_infrastructure");
  const content = getSurfacesByFamily("knowledge_and_content");

  const avgScore = allSurfaces.reduce((sum, s) => sum + s.currentScore, 0) / allSurfaces.length;

  // Legacy product audit data
  const products = audit.products;
  const runtimeRisks = audit.crossCuttingFindings.filter((f) => f.classification === "STATIC_OR_FAKE_RUNTIME");

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-10">

        {/* Header */}
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            Admin · Product Estate Command Centre
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl text-white">Product Estate Command Centre</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Surface-by-surface authority map. Every named surface with a route, CTA, or buyer-facing promise is scored and classified here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{allSurfaces.length} surfaces</Badge>
              <Badge>{avgScore.toFixed(1)}/10 avg</Badge>
              <Badge tone="border-amber-500/30 bg-amber-500/10 text-amber-200">{surfacesBelow9.length} below 9</Badge>
              <Badge tone="border-red-500/30 bg-red-500/10 text-red-200">{withFailGap.length} FAIL gaps</Badge>
              {!corridorOrdering.valid && (
                <Badge tone="border-red-500/30 bg-red-500/10 text-red-200">corridor order issue</Badge>
              )}
            </div>
          </div>
        </header>

        {/* Summary tiles */}
        <section className="grid gap-3 md:grid-cols-5">
          {[
            { label: "Total Surfaces", value: allSurfaces.length.toString(), note: "Named surfaces in registry" },
            { label: "Avg Score", value: `${avgScore.toFixed(1)}/10`, note: "Across all surface types" },
            { label: "FAIL Gaps", value: withFailGap.length.toString(), note: "Surfaces with at least one FAIL dimension", tone: "text-red-300" },
            { label: "Paid with Gaps", value: paidWithGaps.length.toString(), note: "Paid surfaces with authority gaps", tone: "text-amber-300" },
            { label: "Public Overexposed", value: publicBelow9.length.toString(), note: "Public surfaces scoring below 9", tone: "text-orange-300" },
          ].map((tile) => (
            <div key={tile.label} className="border border-white/10 bg-white/[0.03] p-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/35">{tile.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${tile.tone ?? "text-white"}`}>{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.note}</p>
            </div>
          ))}
        </section>

        {/* ─── Surfaces Below 9 (triage priority) ─────────────────────────── */}
        <section>
          <SectionHeader label="Surfaces Below 9/10 — Triage Priority" count={surfacesBelow9.length} />
          <SurfaceTable surfaces={surfacesBelow9} scores={allScores} />
        </section>

        {/* ─── Paid Surfaces with Gaps ──────────────────────────────────────── */}
        {paidWithGaps.length > 0 && (
          <section>
            <SectionHeader label="Paid Surfaces with Authority Gaps" count={paidWithGaps.length} />
            <div className="mb-2 rounded border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-300/70">
              These surfaces accept payment. Authority gaps in entitlement, fulfilment, or market_authority must be closed before these surfaces are positioned as primary paid CTAs.
            </div>
            <SurfaceTable surfaces={paidWithGaps} scores={allScores} />
          </section>
        )}

        {/* ─── Operational Decision Intelligence Corridor ───────────────────── */}
        <section>
          <SectionHeader label="Operational Decision Corridor" count={corridorSurfaces.length} />
          {!corridorOrdering.valid && (
            <div className="mb-3 rounded border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-300/70">
              Corridor ordering issues detected: {corridorOrdering.violations.join("; ")}
            </div>
          )}
          <p className="mb-3 text-xs text-white/35">
            Corridor stages must be earned through progression. Evidence-gated stages must not appear as open public activation. Retainer Oversight is never self-serve.
          </p>
          <SurfaceTable surfaces={corridorSurfaces} scores={allScores} />
        </section>

        {/* ─── Market Activation ───────────────────────────────────────────── */}
        <section>
          <SectionHeader label="Market Activation" count={marketActivation.length} />
          <p className="mb-3 text-xs text-white/35">
            Free and low-friction entry surfaces. Diagnostics must carry explicit stateless labels if they do not persist results.
            Each must route to the paid corridor.
          </p>
          <SurfaceTable surfaces={marketActivation} scores={allScores} />
        </section>

        {/* ─── Decision Instruments ────────────────────────────────────────── */}
        <section>
          <SectionHeader label="Decision Instruments" count={instruments.length} />
          <p className="mb-3 text-xs text-white/35">
            All paid instruments must call verifyInstrumentEntitlement() before run, persist a DecisionInstrumentRun record, and record an artifact hash on PDF generation.
          </p>
          <SurfaceTable surfaces={instruments} scores={allScores} />
        </section>

        {/* ─── Market Intelligence (GMI) ───────────────────────────────────── */}
        <section>
          <SectionHeader label="Market Intelligence — GMI" count={intelligence.length} />
          <SurfaceTable surfaces={intelligence} scores={allScores} />
        </section>

        {/* ─── Continuity and Supporting ───────────────────────────────────── */}
        <section>
          <SectionHeader label="Continuity, Consoles & Supporting Layers" count={continuity.length + advisory.length + supporting.length} />
          <p className="mb-3 text-xs text-white/35">
            Supporting layers must not be sold as standalone products unless explicitly productised. Continuity Console requires case record. Authority Lens must position as a lens, not a replacement for Enterprise Assessment.
          </p>
          <SurfaceTable surfaces={[...continuity, ...advisory, ...supporting]} scores={allScores} />
        </section>

        {/* ─── Knowledge and Content ───────────────────────────────────────── */}
        <section>
          <SectionHeader label="Knowledge and Content" count={content.length} />
          <SurfaceTable surfaces={content} scores={allScores} />
        </section>

        {/* ─── Overexposed Surfaces ────────────────────────────────────────── */}
        {overexposed.length > 0 && (
          <section>
            <SectionHeader label="Overexposed Surfaces — Exposure Mismatch" count={overexposed.length} />
            <div className="mb-3 rounded border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-xs text-orange-300/70">
              Current exposure is more permissive than the authority score warrants. Review and reclassify.
            </div>
            <div className="overflow-hidden border border-white/10">
              <div className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-white/35">
                <span>Surface</span>
                <span>Current Exposure</span>
                <span>Recommended</span>
                <span>Score</span>
              </div>
              {overexposed.map((s) => (
                <div key={s.surfaceId} className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-3 border-b border-white/8 px-4 py-3 text-sm last:border-b-0">
                  <span className="text-white/75">{s.displayName}</span>
                  <Badge tone={exposureTone[s.currentExposure]}>{s.currentExposure.replace(/_/g, " ")}</Badge>
                  <Badge tone={exposureTone[s.exposureRecommendation]}>{s.exposureRecommendation.replace(/_/g, " ")}</Badge>
                  <span className={`font-mono ${scoreTone(s.currentScore)}`}>{s.currentScore}/10</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Runtime Provenance Risks (legacy) ───────────────────────────── */}
        <section className="border border-red-500/20 bg-red-500/[0.03] p-5">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-wide text-red-200/70">Runtime Provenance Risks</p>
          <div className="grid gap-3 md:grid-cols-2">
            {runtimeRisks.map((finding) => (
              <div key={finding.id} className="border border-white/8 bg-zinc-950/60 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={finding.severity === "high" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}>
                    {finding.severity}
                  </Badge>
                  <Badge>{finding.classification}</Badge>
                </div>
                <p className="mt-3 text-sm text-white/75">{finding.finding}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">{finding.requiredClosure}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Audit commands ──────────────────────────────────────────────── */}
        <section className="border border-white/8 bg-white/[0.02] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-white/30">Audit Commands</p>
          <div className="grid gap-2 font-mono text-[11px] text-white/45">
            {[
              "pnpm audit:product-estate -- --json",
              "pnpm smoke:product-estate -- --base-url https://www.abrahamoflondon.org",
              "pnpm test:product-estate",
              "pnpm validate:estate",
              "pnpm exec prisma migrate status",
            ].map((cmd) => (
              <code key={cmd} className="block rounded bg-zinc-900 px-3 py-1.5 text-white/60">{cmd}</code>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
