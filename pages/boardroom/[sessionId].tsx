import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma.server";
import { buildBoardroomDossier } from "@/lib/boardroom/dossier-builder";
import type { BoardroomDossier } from "@/lib/boardroom/dossier-types";
import { qualifiesForBoardroom } from "@/lib/constitution/boardroom-mode";
import BoardroomSignalExposure from "@/components/sovereign/BoardroomSignalExposure";

type PageProps = {
  qualified: boolean;
  readinessReason: string;
  missingEvidence: string[];
  organisationId: string | null;
  organisationName: string | null;
  dossier: BoardroomDossier | null;
  sessionId: string;
  error?: string;
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export default function BoardroomPage(props: PageProps) {
  return (
    <Layout title="Boardroom | Abraham of London" fullWidth headerTransparent>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "48px 24px 96px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
            Boardroom dossier
          </span>
          <h1 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.02, color: "rgba(255,255,255,0.90)", fontStyle: "italic", marginTop: "10px" }}>
            {props.organisationName ?? "Boardroom readiness"}
          </h1>

          {props.error && (
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(252,165,165,0.70)", marginTop: "16px" }}>
              {props.error}
            </p>
          )}

          {!props.qualified && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "20px 24px", marginTop: "24px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
                Not qualified yet
              </p>
              <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.74)", marginTop: "8px" }}>
                This case is not yet boardroom-ready.
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "8px" }}>
                {props.readinessReason}
              </p>
              {props.missingEvidence.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  {props.missingEvidence.map((item) => (
                    <p key={item} style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.42)" }}>
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {props.qualified && props.dossier && (
            <>
              <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}05`, padding: "20px 24px", marginTop: "24px" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Boardroom readiness
                </p>
                <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.76)", marginTop: "8px" }}>
                  {props.readinessReason}
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: "8px" }}>
                  Data completeness: {props.dossier.dataCompleteness.score}%
                </p>
                {props.organisationId && (
                  <Link
                    href={`/api/boardroom/dossier/pdf?organisationId=${encodeURIComponent(props.organisationId)}`}
                    style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}CC`, textDecoration: "none", display: "inline-block", marginTop: "12px", border: `1px solid ${GOLD}35`, padding: "8px 12px" }}
                  >
                    Export PDF
                  </Link>
                )}
              </div>

              <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
                <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "18px 20px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                    Executive summary
                  </p>
                  <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.78)", marginTop: "8px" }}>
                    {props.dossier.executiveSummary}
                  </p>
                </section>

                <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "18px 20px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                    Recommended board actions
                  </p>
                  {props.dossier.recommendedBoardActions.length > 0 ? props.dossier.recommendedBoardActions.map((action) => (
                    <p key={`${action.category}-${action.relatedEntityId ?? "none"}`} style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.46)", marginTop: "8px" }}>
                      {action.priority.toUpperCase()}: {action.description}
                    </p>
                  )) : (
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.34)", marginTop: "8px" }}>
                      No board-level action has been published for this period.
                    </p>
                  )}
                </section>

                <section style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "18px 20px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                    Dossier sections
                  </p>
                  {[
                    `Decision portfolio: ${props.dossier.decisionPortfolio.length} tracked decision${props.dossier.decisionPortfolio.length === 1 ? "" : "s"}.`,
                    `Contradictions: ${props.dossier.topContradictions.length} organisation-safe contradiction record${props.dossier.topContradictions.length === 1 ? "" : "s"}.`,
                    `Open commitments: ${props.dossier.openCommitments.length}.`,
                    `Breaches: ${props.dossier.breaches.length}.`,
                    `Verified outcomes: ${props.dossier.verifiedOutcomes.length}.`,
                    `Financial impact: £${props.dossier.financialImpact.totalCostOfDelay.toLocaleString()} cost of delay tracked.`,
                  ].map((line) => (
                    <p key={line} style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.46)", marginTop: "8px" }}>
                      {line}
                    </p>
                  ))}
                </section>

                {/* Institutional Signal Exposure */}
                {props.dossier.sovereignSignalAssessment && (
                  <section style={{ marginTop: "4px" }}>
                    <BoardroomSignalExposure assessment={props.dossier.sovereignSignalAssessment} />
                  </section>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop: "24px" }}>
            <Link href={`/strategy-room/session/${props.sessionId}`} style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>
              Return to Strategy Room session
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const sessionId = ctx.params?.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    return { props: { qualified: false, readinessReason: "Invalid session.", missingEvidence: [], organisationId: null, organisationName: null, dossier: null, sessionId: "" } };
  }

  try {
    const host = ctx.req.headers.host ?? "localhost";
    const proto = ctx.req.headers["x-forwarded-proto"] || "http";
    const baseUrl = `${proto}://${host}`;
    const fetchHeaders: Record<string, string> = {};
    if (ctx.req.headers.cookie) fetchHeaders.cookie = ctx.req.headers.cookie;
    if (typeof ctx.query.access === "string") fetchHeaders["x-strategy-access-token"] = ctx.query.access;

    const response = await fetch(`${baseUrl}/api/strategy-room/execution/${sessionId}`, { headers: fetchHeaders });
    if (!response.ok) {
      return {
        props: {
          qualified: false,
          readinessReason: "Boardroom access could not be established for this session.",
          missingEvidence: [],
          organisationId: null,
          organisationName: null,
          dossier: null,
          sessionId,
          error: response.status === 404 ? "Session not found." : "Access denied.",
        },
      };
    }

    const json = await response.json();
    const session = json.session as Record<string, any>;
    const canonicalSnapshot = session?.canonicalSnapshot ?? {};
    const caseId = canonicalSnapshot?.admission?.caseId ?? null;
    const costText = canonicalSnapshot?.evidenceGraph?.decisionObjects?.[0]?.costOfDelayText ?? null;
    const parsedCost = typeof costText === "string" ? Number(String(costText).replace(/[^\d.]/g, "")) || 0 : 0;
    const qualification = qualifiesForBoardroom({
      economics: { estimatedMonthlyCost: parsedCost },
      accuracyFeedback: {
        response: canonicalSnapshot?.admission?.evidenceTier === "outcome_verified" || canonicalSnapshot?.admission?.evidenceTier === "multi_source" ? "yes" : "partial",
      },
    } as never);

    const missingEvidence: string[] = [];
    if (!caseId) missingEvidence.push("Journey correlation to a durable case is missing.");
    if (!parsedCost) missingEvidence.push("Cost-of-delay evidence has not been priced clearly enough for board handling.");

    const journey = caseId
      ? await prisma.diagnosticJourney.findUnique({
          where: { journeyKey: caseId },
          select: { organisationKey: true, organisation: true },
        })
      : null;
    const organisation = journey?.organisationKey
      ? await prisma.organisation.findFirst({
          where: {
            OR: [
              { slug: journey.organisationKey },
              { name: journey.organisation ?? journey.organisationKey },
            ],
          },
          select: { id: true, name: true },
        })
      : null;

    if (!organisation) {
      missingEvidence.push("Organisation correlation required for boardroom dossier generation is not available.");
    }

    const qualified = qualification.qualified && Boolean(organisation?.id);
    const dossier = qualified && organisation?.id ? await buildBoardroomDossier(organisation.id) : null;

    return {
      props: {
        qualified,
        readinessReason: qualified ? qualification.reason : qualification.reason,
        missingEvidence,
        organisationId: organisation?.id ?? null,
        organisationName: organisation?.name ?? journey?.organisation ?? null,
        dossier,
        sessionId,
      },
    };
  } catch (error) {
    return {
      props: {
        qualified: false,
        readinessReason: "Boardroom dossier loading failed.",
        missingEvidence: [],
        organisationId: null,
        organisationName: null,
        dossier: null,
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error.",
      },
    };
  }
};
