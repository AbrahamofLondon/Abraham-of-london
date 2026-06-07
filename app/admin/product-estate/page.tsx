export const dynamic = "force-dynamic";

import Link from "next/link";
import audit from "@/lib/product/product-estate-reality-audit.json";

export const metadata = {
  title: "Product Estate Command Centre",
};

type ProductReality = (typeof audit.products)[number];

const statusTone: Record<string, string> = {
  VERIFIED_ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  ACTIVE_BUT_UNVERIFIED: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  DUPLICATES_OR_COMPETES_WITH_ANOTHER_PRODUCT: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  STATIC_OR_FAKE_RUNTIME: "border-red-500/30 bg-red-500/10 text-red-200",
  ADMIN_ONLY: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  DORMANT: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${tone ?? "border-white/10 bg-white/5 text-white/55"}`}>
      {children}
    </span>
  );
}

function scoreTone(score: number) {
  if (score >= 8) return "text-emerald-300";
  if (score >= 6) return "text-amber-300";
  return "text-red-300";
}

function nextAction(product: ProductReality) {
  if (product.knownBlockers.length === 0) return "Keep under smoke and catalog drift monitoring.";
  return product.knownBlockers[0];
}

export default function ProductEstateCommandCentrePage() {
  const products = audit.products;
  const averageGrade = products.reduce((sum, product) => sum + product.realityGrade, 0) / products.length;
  const runtimeRisks = audit.crossCuttingFindings.filter((finding) => finding.classification === "STATIC_OR_FAKE_RUNTIME");

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            Admin · Product Estate
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl text-white">Product Estate Command Centre</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Runtime reality map for catalog, routes, APIs, admin surfaces, database authority, commercial routing, smoke state, and product ladder coherence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{products.length} products</Badge>
              <Badge>{averageGrade.toFixed(1)}/10 average</Badge>
              <Badge tone="border-red-500/30 bg-red-500/10 text-red-200">{runtimeRisks.length} runtime risks</Badge>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/35">Inventory</p>
            <p className="mt-2 text-2xl font-semibold text-white">{products.length}</p>
            <p className="mt-1 text-xs text-white/45">Tracked estate surfaces.</p>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/35">Route Health</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">Scripted</p>
            <p className="mt-1 text-xs text-white/45">Run <code>pnpm smoke:product-estate</code> against local or production.</p>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/35">Quarterly Intelligence</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">Parametric</p>
            <p className="mt-1 text-xs text-white/45">GMI must support future editions beyond Q2.</p>
          </div>
        </section>

        <section className="border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/35">Product Ladder</p>
              <p className="mt-1 text-sm text-white/55">One role per product state; no buyer-facing product competition.</p>
            </div>
            <Link href="/products" className="text-xs text-amber-300 hover:text-amber-200">View public products</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {audit.ladder.map((step) => (
              <div key={step.role} className="border border-white/10 bg-zinc-950/60 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wide text-amber-300/70">{step.role}</p>
                <p className="mt-1 text-sm font-medium text-white/85">{step.productName}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{step.purpose}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden border border-white/10">
          <div className="grid grid-cols-[0.7fr_1.2fr_0.9fr_0.6fr_1.4fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-[10px] uppercase tracking-wide text-white/40">
            <span>Score</span>
            <span>Product</span>
            <span>Status</span>
            <span>Smoke</span>
            <span>Next Action</span>
          </div>
          {products.map((product) => (
            <div key={product.productCode} className="grid grid-cols-[0.7fr_1.2fr_0.9fr_0.6fr_1.4fr] gap-3 border-b border-white/10 px-4 py-4 text-sm last:border-b-0">
              <div className={`font-mono text-xl ${scoreTone(product.realityGrade)}`}>{product.realityGrade}/10</div>
              <div>
                <Link href={product.route} className="font-medium text-white/90 hover:text-amber-200">
                  {product.productName}
                </Link>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-white/35">{product.productCode}</p>
              </div>
              <div>
                <Badge tone={statusTone[product.classification]}>{product.classification}</Badge>
              </div>
              <div className="text-xs text-white/50">{product.productionSmokeStatus}</div>
              <div className="text-xs leading-5 text-white/55">{nextAction(product)}</div>
            </div>
          ))}
        </section>

        <section className="border border-red-500/20 bg-red-500/[0.04] p-5">
          <p className="font-mono text-[10px] uppercase tracking-wide text-red-200/80">Runtime Provenance Risks</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {audit.crossCuttingFindings.map((finding) => (
              <div key={finding.id} className="border border-white/10 bg-zinc-950/60 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={finding.severity === "high" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}>{finding.severity}</Badge>
                  <Badge>{finding.classification}</Badge>
                </div>
                <p className="mt-3 text-sm text-white/80">{finding.finding}</p>
                <p className="mt-2 text-xs leading-5 text-white/45">{finding.requiredClosure}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
