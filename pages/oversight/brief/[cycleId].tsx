import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { loadOversightCycleArchive } from "@/lib/product/oversight-cycle-archive";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OversightCycleAudience, OversightCycleArchiveRecord } from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightCycleComparison } from "@/lib/product/oversight-cycle-comparison";
import { verifyRetainerAccess } from "@/lib/retainers/retainer-service";

type PageProps = {
  blockedReason: string | null;
  cycle: OversightCycleArchiveRecord | null;
  brief: OversightBrief | null;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  nextCycleIntent: OversightCycleArchiveRecord["nextCycleIntent"] | null;
  cycleComparison: OversightCycleComparison | null;
  audience: OversightCycleAudience;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const GOLD = "#C9A96E";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.025)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>{title}</p>
      <div style={{ marginTop: "0.85rem" }}>{children}</div>
    </section>
  );
}

const OversightBriefPage: NextPage<PageProps> = ({
  blockedReason,
  cycle,
  brief,
  suppressions,
  nextCycleIntent,
  cycleComparison,
  audience,
}) => {
  return (
    <Layout title="Oversight Brief" description="Governed monthly oversight brief" fullWidth>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "1.25rem", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Governed Oversight Brief
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Reviewed cycle artifact
            </h1>
            {cycle ? (
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Cycle identity</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{cycle.cycleId}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Oversight period</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>
                    {new Date(cycle.periodStart).toLocaleDateString("en-GB")} to {new Date(cycle.periodEnd).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Delivery state</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{cycle.deliveryStatus}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Audience</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{audience}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Evidence boundary</div>
                  <div className="mt-1" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>
                    {audience === "BOARD_LEVEL" ? "Board-safe consequence view" : "Sponsor-safe governed view"}
                  </div>
                </div>
              </div>
            ) : null}
          </header>

          {blockedReason ? (
            <Section title="Access Blocked">
              <p style={{ ...serif, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>{blockedReason}</p>
            </Section>
          ) : null}

          {!blockedReason && brief && (
            <>
              <Section title="Executive Summary">
                <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>{brief.executiveSummary}</p>
              </Section>

              {cycleComparison?.available && (
                <Section title="What Changed">
                  <div className="space-y-4">
                    {cycleComparison.deltas.filter((delta) => delta.direction !== "UNCHANGED").map((delta) => (
                      <div key={`${delta.dimension}-${delta.explanation}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                          {delta.dimension} · {delta.direction}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{delta.explanation}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {brief.cadence && (
                <Section title="Cadence Status">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.cadence.explanation}</p>
                  <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                    {brief.cadence.status} · {brief.cadence.health}
                    {brief.cadence.nextCycleDueDate ? ` · Next review ${new Date(brief.cadence.nextCycleDueDate).toLocaleDateString("en-GB")}` : ""}
                  </p>
                </Section>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <Section title="What Repeated">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.patternRecurrence
                      ? `${brief.patternRecurrence.explanation} (${brief.patternRecurrence.priorCount} prior case${brief.patternRecurrence.priorCount !== 1 ? "s" : ""}).`
                      : "No persisted recurrence signal was published in this cycle."}
                  </p>
                </Section>

                <Section title="What Became More Expensive">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.costOfInaction
                      ? `£${brief.costOfInaction.totalEstimated.toLocaleString()} estimated across ${brief.costOfInaction.casesIncluded} case${brief.costOfInaction.casesIncluded !== 1 ? "s" : ""}.`
                      : "No verified cost basis was published in this cycle."}
                  </p>
                </Section>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Section title="What Became Harder To Reverse">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {brief.irreversibility
                      ? `${brief.irreversibility.level} (${brief.irreversibility.score}/100). ${brief.irreversibility.explanation}`
                      : "No irreversibility signal was published in this cycle."}
                  </p>
                </Section>

                <Section title="What Options Are Closing">
                  {brief.strategicOptions?.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length ? (
                    <ul className="space-y-3">
                      {brief.strategicOptions.options
                        .filter((item) => item.status === "CLOSING" || item.status === "EXPIRED")
                        .map((item) => (
                          <li key={item.id} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                            {item.label}: {item.closingReason || item.status.toLowerCase()}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>No option-decay signal was published in this cycle.</p>
                  )}
                </Section>
              </div>

              {brief.organisationDivergence && brief.organisationDivergence.count > 0 && (
                <Section title="Organisation Divergence">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.organisationDivergence.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.organisationDivergence.items.map((item) => (
                      <div key={`${item.type}-${item.affectedDomain}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {item.type} · {item.confidence}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item.sponsorSafeSummary}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {(brief.boardroomArchive || brief.counselHistory) && (
                <div className="grid gap-6 md:grid-cols-2">
                  {brief.boardroomArchive && (
                    <Section title="Boardroom Memory">
                      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.boardroomArchive.summary}</p>
                      <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                        {brief.boardroomArchive.previousDossierCount} prior dossier{brief.boardroomArchive.previousDossierCount === 1 ? "" : "s"} · {brief.boardroomArchive.repeatedExposureCount} repeated exposure{brief.boardroomArchive.repeatedExposureCount === 1 ? "" : "s"}
                      </p>
                    </Section>
                  )}
                  {brief.counselHistory && (
                    <Section title="Counsel Status">
                      <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.counselHistory.summary}</p>
                      <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                        {brief.counselHistory.totalEvents} event{brief.counselHistory.totalEvents === 1 ? "" : "s"} · {brief.counselHistory.openCount} open
                      </p>
                    </Section>
                  )}
                </div>
              )}

              <Section title="What Must Be Decided Now">
                {brief.structuredActions?.length ? (
                  <div className="space-y-4">
                    {brief.structuredActions.map((action) => (
                      <div key={action.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {action.actionType} · {action.severity}
                        </p>
                        <p className="mt-2" style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>{action.action}</p>
                        {action.consequenceIfIgnored ? (
                          <p className="mt-2" style={{ ...serif, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{action.consequenceIfIgnored}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {brief.requiredActions.map((action) => (
                      <li key={action} style={{ ...serif, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>{action}</li>
                    ))}
                  </ul>
                )}
              </Section>

              {brief.valueProtected && (
                <Section title="Value Protected">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.valueProtected.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.valueProtected.missedSignals.map((signal) => (
                      <div key={signal.label}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {signal.label} · {signal.severity}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{signal.whyItMatters}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {brief.cancellationLoss && (
                <Section title="Visibility Preserved">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.cancellationLoss.summary}</p>
                  <div className="mt-4 space-y-4">
                    {brief.cancellationLoss.lostVisibility.map((item) => (
                      <div key={`${item.area}-${item.description}`}>
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                          {item.area} · {item.severity}
                        </p>
                        <p className="mt-1" style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {brief.indispensability && (
                <Section title="What Would Be Missed">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{brief.indispensability.headline}</p>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Preserved visibility</p>
                      <ul className="mt-2 space-y-2">
                        {brief.indispensability.preservedVisibility.map((item) => (
                          <li key={item} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Would be lost</p>
                      <ul className="mt-2 space-y-2">
                        {brief.indispensability.wouldLose.map((item) => (
                          <li key={item} style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Section>
              )}

              {suppressions.length > 0 && (
                <Section title="Suppression Notice">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    Some detail has been withheld to preserve privacy, entitlement boundaries, or small-sample safety.
                  </p>
                </Section>
              )}

              {nextCycleIntent && (
                <Section title="Next Review Window">
                  <p style={{ ...serif, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                    {nextCycleIntent.reason}
                  </p>
                  <p className="mt-2" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.62)" }}>
                    {nextCycleIntent.cadence} · {new Date(nextCycleIntent.nextCycleRecommendedDate).toLocaleDateString("en-GB")}
                  </p>
                </Section>
              )}
            </>
          )}
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

  const cycleId = typeof ctx.query.cycleId === "string" ? ctx.query.cycleId : null;
  const audience = ctx.query.audience === "BOARD_LEVEL" ? "BOARD_LEVEL" : "CLIENT_SPONSOR";
  if (!cycleId) {
    return { props: { blockedReason: "Cycle id is required.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience } };
  }

  const archive = await loadOversightCycleArchive({ cycleId });
  if (!archive) {
    return { props: { blockedReason: "Oversight cycle could not be found.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience } };
  }

  const email = session.user.email.toLowerCase();
  const isAdmin = access.permissions.isAdmin;

  if (!isAdmin && archive.record.organisationId) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        organisationId: archive.record.organisationId,
        email,
        status: "active",
      },
      select: { id: true },
    });
    if (!membership) {
      return { props: { blockedReason: "Organisation access is required for this oversight brief.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience } };
    }
  }

  const retainerAccess = await verifyRetainerAccess({
    contractId: archive.record.accountId,
    organisationId: archive.record.organisationId ?? null,
    email,
  });
  if (!retainerAccess.ok && !isAdmin) {
    return { props: { blockedReason: "Retainer access is not active for this account.", cycle: null, brief: null, suppressions: [], nextCycleIntent: null, cycleComparison: null, audience } };
  }

  return {
    props: {
      blockedReason: null,
      cycle: archive.record,
      brief: archive.audienceBriefs[audience] ?? archive.clientSafeBrief,
      suppressions: archive.record.suppressions,
      nextCycleIntent: archive.record.nextCycleIntent ?? null,
      cycleComparison: archive.cycleComparison ?? null,
      audience,
    },
  };
};

export default OversightBriefPage;
