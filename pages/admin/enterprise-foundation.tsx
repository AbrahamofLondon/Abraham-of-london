import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import {
  getExecutiveRiskSnapshot,
  getFoundationTelemetrySummary,
} from "@/lib/enterprise-foundation/authority-foundation";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type PageProps = {
  snapshot: Awaited<ReturnType<typeof getExecutiveRiskSnapshot>>;
  telemetry: Awaited<ReturnType<typeof getFoundationTelemetrySummary>>;
};

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "risk" | "ok" }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "0.8rem" }}>
      <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{label}</div>
      <div style={{ ...mono, fontSize: "16px", color: tone === "risk" ? "rgba(252,165,165,0.72)" : tone === "ok" ? "rgba(110,231,183,0.68)" : GOLD, marginTop: "0.25rem" }}>{value}</div>
    </div>
  );
}

const EnterpriseFoundationPage: NextPage<PageProps> = ({ snapshot, telemetry }) => {
  return (
    <AdminLayout>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-7xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>
            Admin authority center
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
            Enterprise foundation.
          </h1>
          <p className="mt-3 max-w-2xl" style={{ ...serif, color: "rgba(255,255,255,0.46)", lineHeight: 1.7 }}>
            Decision chains, stakeholder blockage, enforcement history, playbook usage, and operator strain.
          </p>

          <section className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Launch risk" value={snapshot.launchRisk} tone={snapshot.launchRisk === "CONTROLLED" ? "ok" : "risk"} />
            <Metric label="Active contracts" value={snapshot.activeContracts} />
            <Metric label="Active decisions" value={snapshot.activeDecisions} />
            <Metric label="AI exposed" value={snapshot.criticalAiDecisions} tone={snapshot.criticalAiDecisions > 0 ? "risk" : undefined} />
            <Metric label="Blocking stakeholders" value={snapshot.blockingStakeholders} tone={snapshot.blockingStakeholders > 0 ? "risk" : undefined} />
            <Metric label="Open cycles" value={snapshot.unresolvedCycles} />
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1rem" }}>
              <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}90` }}>Usage patterns</div>
              <div className="mt-4 space-y-3">
                {telemetry.recurrence.length === 0 ? (
                  <p style={{ ...serif, color: "rgba(255,255,255,0.38)" }}>No foundation telemetry recorded yet.</p>
                ) : telemetry.recurrence.map((row: any) => (
                  <div key={row.eventType} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                    <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.48)" }}>{row.eventType}</span>
                    <span style={{ ...mono, fontSize: "8px", color: GOLD }}>{row._count.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1rem" }}>
              <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}90` }}>Stakeholder blockage</div>
              <div className="mt-4 space-y-3">
                {telemetry.stakeholderDivergence.map((row: any) => (
                  <div key={row.alignmentState} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                    <span style={{ ...mono, fontSize: "8px", color: row.alignmentState === "BLOCKING" ? "rgba(252,165,165,0.68)" : "rgba(255,255,255,0.48)" }}>{row.alignmentState}</span>
                    <span style={{ ...mono, fontSize: "8px", color: GOLD }}>{row._count.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5" style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1rem" }}>
            <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}90` }}>Recent audit trail</div>
            <div className="mt-4 space-y-3">
              {snapshot.recentAuditEvents.map((event) => (
                <div key={event.id} className="grid gap-2 border-b border-white/5 pb-3 md:grid-cols-[160px_160px_1fr]">
                  <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.32)" }}>{new Date(event.createdAt).toLocaleString("en-GB")}</span>
                  <span style={{ ...mono, fontSize: "7px", color: `${GOLD}90` }}>{event.objectType} · {event.actionType}</span>
                  <span style={{ ...serif, fontSize: "0.85rem", color: "rgba(255,255,255,0.50)" }}>{event.summary}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  const [snapshot, telemetry] = await Promise.all([
    getExecutiveRiskSnapshot(),
    getFoundationTelemetrySummary(),
  ]);

  return { props: { snapshot, telemetry } };
};

export default EnterpriseFoundationPage;
