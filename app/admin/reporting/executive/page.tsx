export const dynamic = "force-dynamic";
// Guard: provided by app/admin/layout.tsx (requireAdminServer).

import Link from "next/link";
import { ArrowRight, ExternalLink, FileText, Inbox, AlertCircle, BarChart2 } from "lucide-react";

export const metadata = {
  title: "Executive Reporting — Admin",
};

type CardProps = {
  href: string;
  icon: React.ReactNode;
  category: string;
  label: string;
  description: string;
  external?: boolean;
};

function NavCard({ href, icon, category, label, description, external }: CardProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex flex-col gap-3 border border-white/10 bg-zinc-950/70 p-6 transition-colors hover:border-white/20 hover:bg-zinc-900/70"
    >
      <div className="flex items-center justify-between">
        <span className="text-white/40 group-hover:text-white/60">{icon}</span>
        {external
          ? <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40" />
          : <ArrowRight className="h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400/60" />}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">{category}</p>
        <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
        <p className="mt-1.5 text-xs text-white/45">{description}</p>
      </div>
    </Link>
  );
}

export default function ExecutiveReportingAdminPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* Header */}
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber-500/70">
            Admin · Reporting
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Executive Reporting
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/50">
            Operational index for the Executive Reporting surface. Use this page to
            preview the client-facing assessment flow, monitor generated report state,
            track delivery and export issues, and continue escalation posture where
            required. This is an admin view — not the product surface itself.
          </p>
        </div>

        {/* Section 1 — Product Surface Preview */}
        <section>
          <div className="mb-4 border-b border-white/10 pb-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              Product Surface Preview
            </p>
            <p className="mt-1 text-xs text-white/40">
              Client-facing routes. Use to inspect the user experience and verify
              assessment flow integrity. Opens as the product — not an admin view.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NavCard
              href="/diagnostics/executive-reporting"
              icon={<ExternalLink className="h-5 w-5" />}
              category="Client Surface"
              label="Executive Reporting"
              description="The live client-facing executive reporting diagnostic. Opens the product surface. Use to verify flow, rendering, and content integrity."
              external
            />
            <NavCard
              href="/diagnostics/executive-reporting/run"
              icon={<ExternalLink className="h-5 w-5" />}
              category="Client Surface · Run"
              label="Executive Reporting — Run"
              description="Active assessment run page for the executive reporting diagnostic. Preview the live assessment experience before client delivery."
              external
            />
          </div>
        </section>

        {/* Section 2 — Operational Monitoring */}
        <section>
          <div className="mb-4 border-b border-white/10 pb-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              Operational Monitoring
            </p>
            <p className="mt-1 text-xs text-white/40">
              Admin surfaces for report state, delivery, export issues, and
              escalation. This is where operational work happens.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NavCard
              href="/admin/reports"
              icon={<FileText className="h-5 w-5" />}
              category="Report Index"
              label="Completed Campaign Reports"
              description="All completed alignment campaign reports indexed by organisation. Includes participant data, deliverable brief links, and report detail access."
            />
            <NavCard
              href="/admin/delivery-queue"
              icon={<Inbox className="h-5 w-5" />}
              category="Delivery"
              label="Delivery Queue"
              description="Pending and in-flight deliverables awaiting dispatch, acknowledgement, or operator sign-off. Monitor delivery state and resolve blockages here."
            />
            <NavCard
              href="/admin/pdf-dashboard"
              icon={<AlertCircle className="h-5 w-5" />}
              category="Export"
              label="PDF Dashboard"
              description="Overview of PDF generation jobs — status, failures, retries, and asset health. First stop for export or download issues."
            />
            <NavCard
              href="/admin/pdf-status"
              icon={<BarChart2 className="h-5 w-5" />}
              category="Export · Detail"
              label="PDF Asset Status"
              description="Per-asset PDF status including governance classification, canonical resolution, and binary availability. Use for deep export triage."
            />
          </div>
        </section>

        {/* Future note */}
        <div className="border border-white/10 bg-zinc-950/70 px-5 py-4 text-xs text-white/35">
          <span className="font-mono uppercase tracking-wider">Future: </span>
          The <code className="rounded bg-white/5 px-1 font-mono text-[10px] text-white/50">/admin/product-surfaces</code> index
          inventories all client-facing assessment and product surfaces with preview links, monitoring priority,
          delivery posture, and operational owner — so admin navigation distinguishes product preview from
          operational monitoring across the full surface estate.
        </div>

      </div>
    </div>
  );
}
