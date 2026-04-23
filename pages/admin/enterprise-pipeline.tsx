import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type PipelineEntry = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  revenue: string;
  problem: string;
  route: string;
  score: number;
  aiDealQuality: string | null;
  predictedWinProbability: number | null;
  predictedNextAction: string | null;
  predictedTemperature: string | null;
  // Journey progress
  hasERResult: boolean;
  hasSRSession: boolean;
  lastAction: string;
  createdAt: string;
};

type PageProps = {
  entries: PipelineEntry[];
  stats: {
    total: number;
    strategy: number;
    diagnostic: number;
    erConverted: number;
    srEntered: number;
    avgScore: number;
  };
};

function temperatureColor(temp: string | null): string {
  if (temp === "SCORCHING") return "rgba(252,165,165,0.70)";
  if (temp === "HOT") return "rgba(253,186,116,0.65)";
  if (temp === "WARM") return `${GOLD}BB`;
  return "rgba(255,255,255,0.30)";
}

function routeColor(route: string): string {
  if (route === "STRATEGY") return "rgba(252,165,165,0.65)";
  if (route === "DIAGNOSTIC") return `${GOLD}BB`;
  return "rgba(255,255,255,0.30)";
}

const EnterprisePipelinePage: NextPage<PageProps> = ({ entries, stats }) => {
  const [filter, setFilter] = React.useState<"all" | "strategy" | "diagnostic">("all");
  const filtered = filter === "all" ? entries : entries.filter((e) => e.route.toLowerCase() === filter);

  return (
    <Layout title="Enterprise Pipeline" description="Enterprise lead pipeline" fullWidth>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-7xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>
            Enterprise pipeline
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", color: "rgba(255,255,255,0.90)" }}>
            Lead Pipeline
          </h1>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total leads", value: String(stats.total) },
              { label: "Strategy route", value: String(stats.strategy), color: "rgba(252,165,165,0.60)" },
              { label: "Diagnostic route", value: String(stats.diagnostic), color: `${GOLD}BB` },
              { label: "ER converted", value: String(stats.erConverted), color: "rgba(110,231,183,0.60)" },
              { label: "SR entered", value: String(stats.srEntered), color: "rgba(110,231,183,0.60)" },
              { label: "Avg score", value: String(stats.avgScore) },
            ].map((s) => (
              <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{s.label}</div>
                <div style={{ ...mono, fontSize: "14px", color: s.color ?? "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="mt-6 flex gap-2">
            {(["all", "strategy", "diagnostic"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  border: `1px solid ${filter === f ? `${GOLD}40` : "rgba(255,255,255,0.08)"}`,
                  backgroundColor: filter === f ? `${GOLD}10` : "transparent",
                  color: filter === f ? `${GOLD}CC` : "rgba(255,255,255,0.30)",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Pipeline entries */}
          <div className="mt-6 space-y-3">
            {filtered.map((entry) => (
              <div key={entry.id} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ ...mono, fontSize: "8px", color: routeColor(entry.route), fontWeight: 700 }}>{entry.route}</span>
                      <span style={{ ...mono, fontSize: "7px", color: temperatureColor(entry.predictedTemperature) }}>{entry.predictedTemperature ?? "—"}</span>
                      <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)" }}>
                        Score: {entry.score}
                      </span>
                    </div>
                    <p style={{ ...serif, fontSize: "0.95rem", color: "rgba(255,255,255,0.60)", marginTop: "0.2rem" }}>
                      {entry.name ?? "Anonymous"} {entry.company ? `· ${entry.company}` : ""} {entry.email ? `· ${entry.email}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {entry.hasERResult && (
                      <span style={{ ...mono, fontSize: "6.5px", border: "1px solid rgba(110,231,183,0.25)", padding: "2px 6px", color: "rgba(110,231,183,0.60)" }}>ER</span>
                    )}
                    {entry.hasSRSession && (
                      <span style={{ ...mono, fontSize: "6.5px", border: "1px solid rgba(110,231,183,0.25)", padding: "2px 6px", color: "rgba(110,231,183,0.60)" }}>SR</span>
                    )}
                  </div>
                </div>

                <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.35)", marginTop: "0.35rem" }}>
                  {entry.problem}
                </p>

                <div className="mt-2 flex items-center gap-4 flex-wrap">
                  <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.20)" }}>
                    Revenue: {entry.revenue}
                  </span>
                  {entry.predictedWinProbability != null && (
                    <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.20)" }}>
                      Win: {Math.round(entry.predictedWinProbability * 100)}%
                    </span>
                  )}
                  {entry.predictedNextAction && (
                    <span style={{ ...mono, fontSize: "6.5px", color: `${GOLD}80` }}>
                      Next: {entry.predictedNextAction}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.15)" }}>
                    {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
                <p style={{ ...serif, color: "rgba(255,255,255,0.30)" }}>No leads in this filter.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  const submissions = await prisma.dealFlowSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Check ER results and SR sessions for each email
  const emails = submissions.map((s) => s.email).filter(Boolean) as string[];
  const erJourneys = emails.length > 0
    ? await prisma.diagnosticJourney.findMany({
        where: { email: { in: emails }, diagnosticType: "executive_reporting" },
        select: { email: true },
      })
    : [];
  const srSessions = emails.length > 0
    ? await prisma.strategyRoomExecutionSession.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      })
    : [];
  const erEmails = new Set(erJourneys.map((j) => j.email).filter(Boolean));
  const srEmails = new Set(srSessions.map((s) => s.email).filter(Boolean));

  const entries: PipelineEntry[] = submissions.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    company: null,
    revenue: s.revenue,
    problem: s.problem,
    route: s.route,
    score: s.score,
    aiDealQuality: s.aiDealQuality,
    predictedWinProbability: s.predictedWinProbability,
    predictedNextAction: s.predictedNextAction,
    predictedTemperature: s.predictedTemperature,
    hasERResult: s.email ? erEmails.has(s.email) : false,
    hasSRSession: s.email ? srEmails.has(s.email) : false,
    lastAction: s.email && srEmails.has(s.email) ? "Strategy Room" : s.email && erEmails.has(s.email) ? "Executive Report" : "Qualified",
    createdAt: s.createdAt.toISOString(),
  }));

  const stats = {
    total: entries.length,
    strategy: entries.filter((e) => e.route === "STRATEGY").length,
    diagnostic: entries.filter((e) => e.route === "DIAGNOSTIC").length,
    erConverted: entries.filter((e) => e.hasERResult).length,
    srEntered: entries.filter((e) => e.hasSRSession).length,
    avgScore: entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length) : 0,
  };

  return { props: { entries, stats } };
};

export default EnterprisePipelinePage;
