import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { getRetainerDecisionSurface, verifyRetainerAccess } from "@/lib/retainers/retainer-service";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Cycle = {
  id: string;
  cycleDate: string;
  actionsTaken: unknown;
  contradictionsUpdated: unknown;
  outcomeDelta: number | null;
};

type RetainedDecision = {
  id: string;
  priorityLevel: string;
  status: string;
  decisionObjectId: string;
  decisionText: string;
  constraintText: string | null;
  costOfDelayText: string | null;
  sourceStage: string;
  enforcementCycles: Cycle[];
};

type ContractSurface = {
  id: string;
  organisation: { id: string; name: string; slug: string };
  tier: string;
  status: string;
  decisionCapacity: number;
  activeDecisionCount: number;
  retainedDecisions: RetainedDecision[];
};

type PageProps = {
  contracts: ContractSurface[];
  blockedReason: string | null;
};

function formatJsonList(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("; ");
  }
  if (typeof value === "string") return value;
  if (!value) return "None recorded";
  return JSON.stringify(value);
}

const RetainerPage: NextPage<PageProps> = ({ contracts, blockedReason }) => {
  return (
    <Layout title="Decision Authority Retainer" description="Retained decision enforcement" fullWidth>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-6xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: `${GOLD}88` }}>
            Decision Authority as a Service
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.15rem)", color: "rgba(255,255,255,0.92)" }}>
            Retained decisions.
          </h1>

          {blockedReason ? (
            <section className="mt-8" style={{ border: "1px solid rgba(252,165,165,0.24)", padding: "1rem", background: "rgba(252,165,165,0.035)" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.72)" }}>
                Access blocked
              </p>
              <p className="mt-3" style={{ ...serif, color: "rgba(255,255,255,0.68)", lineHeight: 1.65 }}>
                {blockedReason}
              </p>
            </section>
          ) : null}

          {!blockedReason && contracts.length === 0 ? (
            <section className="mt-8" style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1rem" }}>
              <p style={{ ...serif, color: "rgba(255,255,255,0.55)" }}>No active retained decisions are visible for this organisation.</p>
            </section>
          ) : null}

          <div className="mt-10 space-y-8">
            {contracts.map((contract) => (
              <section key={contract.id} style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.025)" }}>
                <header className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-4">
                  {[
                    ["Organisation", contract.organisation.name],
                    ["Tier", contract.tier],
                    ["Decision capacity", `${contract.activeDecisionCount}/${contract.decisionCapacity}`],
                    ["Status", contract.status],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                        {label}
                      </div>
                      <div className="mt-1" style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.70)" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </header>

                <div className="divide-y divide-white/10">
                  {contract.retainedDecisions.map((decision) => (
                    <article key={decision.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                            {decision.priorityLevel} priority · {decision.status} · {decision.sourceStage}
                          </p>
                          <h2 className="mt-2" style={{ ...serif, fontSize: "1.25rem", lineHeight: 1.35, color: "rgba(255,255,255,0.86)" }}>
                            {decision.decisionText}
                          </h2>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div>
                          <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>Constraint</div>
                          <p className="mt-1" style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.58)" }}>{decision.constraintText || "Not recorded"}</p>
                        </div>
                        <div>
                          <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>Cost of delay</div>
                          <p className="mt-1" style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.58)" }}>{decision.costOfDelayText || "Not recorded"}</p>
                        </div>
                        <div>
                          <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>Latest outcome delta</div>
                          <p className="mt-1" style={{ ...mono, fontSize: "12px", color: "rgba(255,255,255,0.58)" }}>
                            {decision.enforcementCycles[0]?.outcomeDelta == null
                              ? "No cycle recorded"
                              : decision.enforcementCycles[0].outcomeDelta > 0
                                ? `+${decision.enforcementCycles[0].outcomeDelta}`
                                : String(decision.enforcementCycles[0].outcomeDelta)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                          Enforcement cycles
                        </div>
                        {decision.enforcementCycles.length === 0 ? (
                          <p style={{ ...serif, color: "rgba(255,255,255,0.38)" }}>No enforcement cycle has been recorded for this retained decision.</p>
                        ) : decision.enforcementCycles.map((cycle) => (
                          <div key={cycle.id} style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.75rem" }}>
                            <div style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.34)" }}>
                              {new Date(cycle.cycleDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div className="mt-2 grid gap-3 md:grid-cols-2">
                              <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>
                                Actions: {formatJsonList(cycle.actionsTaken)}
                              </p>
                              <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>
                                Contradictions: {formatJsonList(cycle.contradictionsUpdated)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { session, access } = await resolvePageAccess(ctx);

  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const organisationId = typeof ctx.query.organisationId === "string" ? ctx.query.organisationId : null;
  const contractId = typeof ctx.query.contractId === "string" ? ctx.query.contractId : null;

  if (!organisationId && !contractId) {
    return { props: { contracts: [], blockedReason: "organisationId or contractId is required." } };
  }

  let resolvedOrganisationId = organisationId;
  if (!resolvedOrganisationId && contractId) {
    const contract = await prisma.retainerContract.findUnique({
      where: { id: contractId },
      select: { organisationId: true },
    });
    resolvedOrganisationId = contract?.organisationId ?? null;
  }

  if (!access.permissions.isAdmin && resolvedOrganisationId) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        organisationId: resolvedOrganisationId,
        email: session.user.email.toLowerCase(),
        status: "active",
      },
      select: { id: true },
    });

    if (!membership) {
      return { props: { contracts: [], blockedReason: "Organisation access is required for this retained decision surface." } };
    }
  }

  const retainerAccess = await verifyRetainerAccess({
    organisationId: resolvedOrganisationId,
    contractId,
    email: session.user.email,
  });

  if (!retainerAccess.ok) {
    return { props: { contracts: [], blockedReason: retainerAccess.reason || "Retainer access is not active." } };
  }

  const contracts = await getRetainerDecisionSurface({ organisationId: resolvedOrganisationId, contractId });
  return { props: { contracts, blockedReason: null } };
};

export default RetainerPage;
