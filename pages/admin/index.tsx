/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/index.tsx — ADMIN COMMAND CENTER */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Crown,
  ClipboardCheck,
  FileCheck,
  FileText,
  Gauge,
  Key,
  Layers3,
  LineChart,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";

export async function getServerSideProps(context: any) {
  const guard = await requireAdminPage(context);
  if (!guard.authorized) return guard.redirect;
  return { props: { isAuthorized: true } };
}

/* ─── Status card ─────────────────────────────────────── */
function StatusCard({ label, value, sub, color = "text-white" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="border border-white/5 bg-zinc-900/20 p-4">
      <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/30">{label}</p>
      <p className={`mt-2 text-2xl font-light ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-[8px] font-mono text-white/20">{sub}</p>}
    </div>
  );
}

/* ─── Section heading ─────────────────────────────────── */
function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="h-3.5 w-3.5 text-amber-500/70" />}
      <h3 className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/30">{children}</h3>
    </div>
  );
}

/* ─── Module link ─────────────────────────────────────── */
function ModuleLink({ href, title, description, icon: Icon, color, bg }: {
  href: string; title: string; description: string; icon: any; color: string; bg: string;
}) {
  return (
    <Link
      href={href}
      className="group block border border-white/5 bg-zinc-900/20 p-5 transition-all hover:border-white/10 hover:bg-zinc-900/30"
    >
      <div className={`mb-3 inline-flex rounded p-2 ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <h4 className="font-serif text-base text-white transition-colors group-hover:text-amber-400">
        {title}
      </h4>
      <p className="mt-1 line-clamp-2 text-[10px] text-white/40">{description}</p>
      <div className="mt-3 flex items-center justify-between">
        <ArrowRight className="h-3 w-3 text-white/20 transition-colors group-hover:text-amber-500" />
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* PAGE                                                    */
/* ═══════════════════════════════════════════════════════ */

const AdminIndexPage: NextPage<{ isAuthorized: boolean }> = () => {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<any>(null);
  const [proofStats, setProofStats] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const results: string[] = [];
      try {
        const [statsRes, proofRes] = await Promise.all([
          fetch("/api/admin/deal-flow-stats").then(r => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/admin/proof/evidence").then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        setStats(statsRes);
        setProofStats(proofRes);

        // Derive alerts from data
        if (!statsRes) results.push("Deal flow stats API unreachable");
        if (!proofRes) results.push("Proof evidence API unreachable");
        if (proofRes?.items) {
          const pending = proofRes.items.filter((i: any) => i.status === "PENDING").length;
          if (pending > 0) results.push(`${pending} proof item${pending > 1 ? "s" : ""} awaiting review`);
        }
      } catch {
        results.push("Failed to load system status");
      } finally {
        setAlerts(results);
        setLoading(false);
      }
    }
    void load();
  }, []);

  const pendingProof = proofStats?.items?.filter((i: any) => i.status === "PENDING")?.length ?? 0;
  const approvedProof = proofStats?.items?.filter((i: any) => i.status === "APPROVED")?.length ?? 0;
  const strategySubmissions = stats?.strategy ?? 0;
  const diagnosticSubmissions = stats?.diagnostic ?? 0;

  return (
    <AdminLayout title="Command Center">
      <Head>
        <title>Admin | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-8">
        {/* ── HEADER ──────────────────────────────────────── */}
        <div className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Command Center
                </span>
              </div>
              <h2 className="mt-3 font-serif text-2xl text-white">
                {session?.user?.name?.split(" ")[0] || "Administrator"}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/25">
                  {session?.user?.email ?? "—"}
                </span>
                <span className="text-[8px] font-mono uppercase tracking-wider text-amber-500/50">
                  {(session?.user as any)?.role ?? "ADMIN"}
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                <div className={`h-1.5 w-1.5 rounded-full ${alerts.length > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                  {alerts.length > 0 ? `${alerts.length} alert${alerts.length > 1 ? "s" : ""}` : "System Operational"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ALERTS ──────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <SectionLabel icon={AlertTriangle}>Alerts requiring attention</SectionLabel>
            {alerts.map((alert) => (
              <div key={alert} className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-500/60 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/60">{alert}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── OVERVIEW CARDS ──────────────────────────────── */}
        <div>
          <SectionLabel icon={Activity}>System overview</SectionLabel>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatusCard label="Strategy Room" value={loading ? "--" : strategySubmissions} sub="Submissions" color="text-amber-400" />
            <StatusCard label="Diagnostics" value={loading ? "--" : diagnosticSubmissions} sub="Submissions" color="text-blue-400" />
            <StatusCard label="Proof queue" value={loading ? "--" : pendingProof} sub="Pending review" color={pendingProof > 0 ? "text-amber-400" : "text-emerald-400"} />
            <StatusCard label="Proof approved" value={loading ? "--" : approvedProof} sub="Ready to publish" color="text-emerald-400" />
          </div>
        </div>

        {/* ── OPERATIONAL MODULES ─────────────────────────── */}
        <div>
          <SectionLabel icon={Layers3}>Operational modules</SectionLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ModuleLink href="/admin/authority-center" title="Authority Center" description="Active leads, ER completions, SR entries, retainers, contradictions, stakeholders." icon={ShieldCheck} color="text-amber-500" bg="bg-amber-500/10" />
            <ModuleLink href="/admin/enterprise-pipeline" title="Enterprise Pipeline" description="Lead pipeline with route, temperature, win probability, conversion status." icon={Activity} color="text-emerald-500" bg="bg-emerald-500/10" />
            <ModuleLink href="/admin/outcome-ledger" title="Outcome Ledger" description="Decision → Contradiction → Enforcement → Outcome → Delta. Track record." icon={Layers3} color="text-sky-400" bg="bg-sky-500/10" />
            <ModuleLink href="/admin/proof" title="Proof Queue" description="Review, approve, anonymise, and publish diagnostic evidence." icon={FileCheck} color="text-emerald-400" bg="bg-emerald-500/10" />
            <ModuleLink href="/admin/access-keys" title="Access Management" description="Issue, revoke, and audit access keys for entitlements." icon={Key} color="text-amber-400" bg="bg-amber-500/10" />
            <ModuleLink href="/admin/conversion-dashboard" title="Conversion Metrics" description="A1-A5 targets, funnel health, and GA4 event reference." icon={LineChart} color="text-sky-400" bg="bg-sky-500/10" />
            <ModuleLink href="/admin/campaigns" title="Campaigns" description="Campaign management, participant tracking, and report delivery." icon={Megaphone} color="text-violet-400" bg="bg-violet-500/10" />
            <ModuleLink href="/admin/organisations" title="Organisations" description="Organisation management, dashboards, and linked campaigns." icon={Building2} color="text-teal-400" bg="bg-teal-500/10" />
            <ModuleLink href="/admin/pdf-dashboard" title="PDF & Reports" description="PDF intelligence registry, report status, and documents." icon={FileText} color="text-pink-400" bg="bg-pink-500/10" />
            <ModuleLink href="/admin/oversight-review" title="Oversight Review" description="Governed review bench for internal briefs, client-safe output, suppressions, and operator decisions." icon={ClipboardCheck} color="text-orange-400" bg="bg-orange-500/10" />
          </div>
        </div>

        {/* ── DECISION INTELLIGENCE ──────────────────────── */}
        <div>
          <SectionLabel icon={ShieldCheck}>Decision intelligence</SectionLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ModuleLink href="/admin/intelligence" title="Intelligence Center" description="Live audit stream, deal flow diagnostics, and recommendation rationale." icon={Sparkles} color="text-amber-500" bg="bg-amber-500/10" />
            <ModuleLink href="/admin/decision/contextual-efficacy" title="Contextual Efficacy" description="Performance by canonical context: domains, failure modes, interventions." icon={Gauge} color="text-cyan-400" bg="bg-cyan-500/10" />
            <ModuleLink href="/admin/decision/performance" title="Decision Performance" description="Engagement, conversion rates, and recommendation performance." icon={BarChart3} color="text-rose-400" bg="bg-rose-500/10" />
            <ModuleLink href="/admin/command-wall" title="Command Wall" description="Control surface with context registry and governed asset ranking." icon={Terminal} color="text-blue-500" bg="bg-blue-500/10" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIndexPage;
