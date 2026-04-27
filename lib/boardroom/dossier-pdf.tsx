/**
 * Boardroom Dossier PDF Renderer
 *
 * Professional board-grade PDF document using @react-pdf/renderer.
 * Classification: RESTRICTED
 */

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  BoardroomDossier,
  DecisionPortfolioEntry,
  ContradictionEntry,
  AuthorityMapEntry,
  RiskExposureEntry,
  CommitmentEntry,
  BreachEntry,
  OutcomeEntry,
  BoardAction,
} from "./dossier-types";

const colours = {
  navy: "#0A1628",
  gold: "#B8860B",
  darkGrey: "#1A1713",
  midGrey: "#4A4A4A",
  lightGrey: "#F5F5F3",
  white: "#FFFFFF",
  red: "#8B0000",
  green: "#1B5E20",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: colours.darkGrey,
    lineHeight: 1.5,
  },
  coverPage: {
    padding: 48,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: colours.navy,
    marginBottom: 12,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 14,
    color: colours.midGrey,
    marginBottom: 8,
    textAlign: "center",
  },
  coverClassification: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colours.red,
    marginTop: 36,
    padding: 8,
    borderWidth: 1,
    borderColor: colours.red,
    textAlign: "center",
  },
  coverPeriod: {
    fontSize: 10,
    color: colours.midGrey,
    marginTop: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colours.navy,
    marginBottom: 12,
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: colours.gold,
    paddingBottom: 6,
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colours.darkGrey,
    marginBottom: 6,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.6,
    marginBottom: 8,
    textAlign: "justify",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colours.navy,
    paddingVertical: 4,
    paddingHorizontal: 2,
    backgroundColor: colours.lightGrey,
  },
  tableCell: {
    fontSize: 8.5,
    paddingHorizontal: 3,
  },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 3,
  },
  badge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: colours.midGrey,
  },
  disclaimer: {
    fontSize: 8,
    color: colours.midGrey,
    fontStyle: "italic",
    marginTop: 12,
    padding: 8,
    backgroundColor: colours.lightGrey,
    borderRadius: 2,
  },
  actionItem: {
    marginBottom: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: colours.gold,
    backgroundColor: colours.lightGrey,
  },
  financialHighlight: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colours.navy,
    marginBottom: 4,
  },
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (amount === 0) return `${currency} 0`;
  const prefix = currency === "GBP" ? "\u00A3" : currency === "USD" ? "$" : `${currency} `;
  return `${prefix}${amount.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "critical": return colours.red;
    case "high": return "#B45309";
    case "medium": return colours.gold;
    default: return colours.midGrey;
  }
}

/* --- Sub-components --- */

function CoverPage({ dossier, orgName }: { dossier: BoardroomDossier; orgName: string }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.coverTitle}>BOARDROOM DOSSIER</Text>
        <Text style={styles.coverSubtitle}>{orgName}</Text>
        <Text style={styles.coverPeriod}>
          {formatDate(dossier.period.from)} — {formatDate(dossier.period.to)}
        </Text>
        <Text style={styles.coverClassification}>CLASSIFICATION: RESTRICTED</Text>
        <Text style={{ ...styles.paragraph, marginTop: 24, textAlign: "center", maxWidth: 360 }}>
          This document contains sensitive organisational intelligence.
          Distribution is limited to authorised board members and senior executives.
        </Text>
        <Text style={{ fontSize: 8, color: colours.midGrey, marginTop: 48 }}>
          Generated: {formatDate(dossier.generatedAt)} | Abraham of London
        </Text>
      </View>
    </Page>
  );
}

function ExecutiveSummaryPage({ dossier }: { dossier: BoardroomDossier }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <Text style={styles.paragraph}>{dossier.executiveSummary}</Text>
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function DecisionPortfolioPage({ decisions }: { decisions: DecisionPortfolioEntry[] }) {
  if (decisions.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Decision Portfolio</Text>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableCellBold, width: "35%" }}>Decision</Text>
        <Text style={{ ...styles.tableCellBold, width: "12%" }}>Stage</Text>
        <Text style={{ ...styles.tableCellBold, width: "12%" }}>AI Exposure</Text>
        <Text style={{ ...styles.tableCellBold, width: "12%" }}>Velocity</Text>
        <Text style={{ ...styles.tableCellBold, width: "14%" }}>Terrain</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Date</Text>
      </View>
      {decisions.slice(0, 20).map((d) => (
        <View key={d.decisionId} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, width: "35%" }}>{d.decisionText.slice(0, 60)}</Text>
          <Text style={{ ...styles.tableCell, width: "12%" }}>{d.sourceStage}</Text>
          <Text style={{ ...styles.tableCell, width: "12%" }}>{d.aiExposureLevel}</Text>
          <Text style={{ ...styles.tableCell, width: "12%" }}>{d.decisionVelocityScore}</Text>
          <Text style={{ ...styles.tableCell, width: "14%" }}>{d.forwardTerrainState}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{formatDate(d.createdAt)}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function ContradictionsPage({ contradictions }: { contradictions: ContradictionEntry[] }) {
  if (contradictions.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Structural Contradictions</Text>
      <Text style={styles.paragraph}>
        The following contradictions represent divergences in perception across the organisation.
        These are high-value signals for board intervention.
      </Text>
      {contradictions.map((c, i) => (
        <View key={i} style={{ marginBottom: 10, padding: 8, backgroundColor: colours.lightGrey }}>
          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
            [{c.severity.toUpperCase()}] {c.type.replace(/_/g, " ")}
          </Text>
          <Text style={{ fontSize: 8.5, marginBottom: 2 }}>
            Position A ({c.userA.role ?? "unknown"}): {c.userA.claim}
          </Text>
          <Text style={{ fontSize: 8.5, marginBottom: 2 }}>
            Position B ({c.userB.role ?? "unknown"}): {c.userB.claim}
          </Text>
          <Text style={{ fontSize: 8.5, fontStyle: "italic" }}>{c.message}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function AuthorityMapPage({ authorityMap }: { authorityMap: AuthorityMapEntry[] }) {
  if (authorityMap.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Authority Map</Text>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableCellBold, width: "22%" }}>Name</Text>
        <Text style={{ ...styles.tableCellBold, width: "18%" }}>Role</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Team</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Function</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Seniority</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Status</Text>
      </View>
      {authorityMap.map((m) => (
        <View key={m.membershipId} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, width: "22%" }}>
            {m.fullName ?? m.email}{m.isExecutive ? " [EXEC]" : ""}
          </Text>
          <Text style={{ ...styles.tableCell, width: "18%" }}>{m.roleTitle ?? "-"}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{m.teamName ?? "-"}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{m.functionName ?? "-"}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{m.seniorityBand ?? "-"}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{m.status}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function RiskAndBreachesPage({ riskExposure, breaches }: { riskExposure: RiskExposureEntry[]; breaches: BreachEntry[] }) {
  if (riskExposure.length === 0 && breaches.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Risk Exposure</Text>
      {riskExposure.length > 0 && (
        <>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCellBold, width: "40%" }}>Commitment</Text>
            <Text style={{ ...styles.tableCellBold, width: "15%" }}>Breaches</Text>
            <Text style={{ ...styles.tableCellBold, width: "15%" }}>Escalation</Text>
            <Text style={{ ...styles.tableCellBold, width: "15%" }}>Due</Text>
            <Text style={{ ...styles.tableCellBold, width: "15%" }}>Status</Text>
          </View>
          {riskExposure.map((r) => (
            <View key={r.contractId} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, width: "40%" }}>{r.commitment.slice(0, 50)}</Text>
              <Text style={{ ...styles.tableCell, width: "15%" }}>{r.breachCount}</Text>
              <Text style={{ ...styles.tableCell, width: "15%" }}>{r.escalationLevel}</Text>
              <Text style={{ ...styles.tableCell, width: "15%" }}>{formatDate(r.dueAt)}</Text>
              <Text style={{ ...styles.tableCell, width: "15%" }}>{r.status}</Text>
            </View>
          ))}
        </>
      )}

      {breaches.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Breach Detail</Text>
          {breaches.map((b) => (
            <View key={b.contractId} style={{ marginBottom: 6, padding: 6, backgroundColor: colours.lightGrey }}>
              <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold" }}>
                {b.commitment.slice(0, 80)} — {b.breachCount} breach(es)
              </Text>
              {b.consequenceOfInaction && (
                <Text style={{ fontSize: 8, fontStyle: "italic", marginTop: 2 }}>
                  Consequence: {b.consequenceOfInaction}
                </Text>
              )}
            </View>
          ))}
        </>
      )}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function CommitmentsPage({ commitments }: { commitments: CommitmentEntry[] }) {
  if (commitments.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Open Commitments</Text>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableCellBold, width: "35%" }}>Commitment</Text>
        <Text style={{ ...styles.tableCellBold, width: "20%" }}>Avoided Pattern</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Due</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Status</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Verification</Text>
      </View>
      {commitments.slice(0, 20).map((c) => (
        <View key={c.contractId} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, width: "35%" }}>{c.commitment.slice(0, 50)}</Text>
          <Text style={{ ...styles.tableCell, width: "20%" }}>{(c.avoidedPattern ?? "-").slice(0, 30)}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{formatDate(c.dueAt)}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{c.status}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{c.verificationStatus}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function OutcomesPage({ outcomes }: { outcomes: OutcomeEntry[] }) {
  if (outcomes.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Verified Outcomes</Text>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableCellBold, width: "20%" }}>Classification</Text>
        <Text style={{ ...styles.tableCellBold, width: "15%" }}>Magnitude</Text>
        <Text style={{ ...styles.tableCellBold, width: "17%" }}>Effectiveness</Text>
        <Text style={{ ...styles.tableCellBold, width: "16%" }}>Velocity Delta</Text>
        <Text style={{ ...styles.tableCellBold, width: "16%" }}>Position Shift</Text>
        <Text style={{ ...styles.tableCellBold, width: "16%" }}>Date</Text>
      </View>
      {outcomes.map((o) => (
        <View key={o.outcomeId} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, width: "20%" }}>{o.outcomeClassification}</Text>
          <Text style={{ ...styles.tableCell, width: "15%" }}>{o.magnitudeOfChange.toFixed(1)}</Text>
          <Text style={{ ...styles.tableCell, width: "17%" }}>{o.effectivenessScore.toFixed(1)}</Text>
          <Text style={{ ...styles.tableCell, width: "16%" }}>{o.decisionVelocityDelta.toFixed(1)}</Text>
          <Text style={{ ...styles.tableCell, width: "16%" }}>{o.competitivePositionShift.toFixed(1)}</Text>
          <Text style={{ ...styles.tableCell, width: "16%" }}>{formatDate(o.createdAt)}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function FinancialImpactPage({ dossier }: { dossier: BoardroomDossier }) {
  const { financialImpact } = dossier;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Financial Impact Summary</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
        <View style={{ width: "45%" }}>
          <Text style={{ fontSize: 9, color: colours.midGrey, marginBottom: 4 }}>Total Cost of Delay</Text>
          <Text style={styles.financialHighlight}>
            {formatCurrency(financialImpact.totalCostOfDelay, financialImpact.currency)}
          </Text>
        </View>
        <View style={{ width: "45%" }}>
          <Text style={{ fontSize: 9, color: colours.midGrey, marginBottom: 4 }}>Total Recovered Value</Text>
          <Text style={{ ...styles.financialHighlight, color: colours.green }}>
            {formatCurrency(financialImpact.totalRecovered, financialImpact.currency)}
          </Text>
        </View>
      </View>
      <Text style={{ ...styles.paragraph, marginTop: 24 }}>
        Financial figures are derived from verified outcome records within the reporting period.
        Figures represent aggregated organisational impact as reported through the diagnostic pipeline.
      </Text>
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function BoardActionsPage({ actions }: { actions: BoardAction[] }) {
  if (actions.length === 0) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Recommended Board Actions</Text>
      {actions.map((a, i) => (
        <View key={i} style={{ ...styles.actionItem, borderLeftColor: priorityColor(a.priority) }}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: priorityColor(a.priority), marginBottom: 3 }}>
            [{a.priority.toUpperCase()}] {a.category.replace(/_/g, " ")}
          </Text>
          <Text style={{ fontSize: 9 }}>{a.description}</Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

function DataCompletenessPage({ dossier }: { dossier: BoardroomDossier }) {
  const { dataCompleteness } = dossier;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Data Completeness Disclaimer</Text>
      <Text style={{ ...styles.paragraph, marginBottom: 16 }}>
        This dossier reflects data available within the Abraham of London platform for the
        specified reporting period. Data completeness score: {dataCompleteness.score}%.
      </Text>
      {dataCompleteness.missingFields.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Sections With Insufficient Data</Text>
          {dataCompleteness.missingFields.map((field) => (
            <Text key={field} style={{ fontSize: 9, marginBottom: 3, paddingLeft: 8 }}>
              - {field.replace(/([A-Z])/g, " $1").trim()}
            </Text>
          ))}
        </>
      )}
      <View style={styles.disclaimer}>
        <Text>
          This document is generated from structured organisational data and does not contain
          AI-generated analysis or inference. All findings are derived from verified diagnostic
          records, contract states, and outcome measurements. Treat any gaps as indicators of
          incomplete data capture rather than absence of organisational activity.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text>RESTRICTED</Text>
        <Text>Abraham of London — Boardroom Dossier</Text>
      </View>
    </Page>
  );
}

/* --- Main Document --- */

export type DossierPdfProps = {
  dossier: BoardroomDossier;
  organisationName: string;
};

export function BoardroomDossierDocument({ dossier, organisationName }: DossierPdfProps) {
  return (
    <Document
      title={`Boardroom Dossier — ${organisationName}`}
      author="Abraham of London"
      subject="Organisational Decision Governance Dossier"
      creator="Abraham of London Platform"
    >
      <CoverPage dossier={dossier} orgName={organisationName} />
      <ExecutiveSummaryPage dossier={dossier} />
      <DecisionPortfolioPage decisions={dossier.decisionPortfolio} />
      <ContradictionsPage contradictions={dossier.topContradictions} />
      <AuthorityMapPage authorityMap={dossier.authorityMap} />
      <RiskAndBreachesPage riskExposure={dossier.riskExposure} breaches={dossier.breaches} />
      <CommitmentsPage commitments={dossier.openCommitments} />
      <OutcomesPage outcomes={dossier.verifiedOutcomes} />
      <FinancialImpactPage dossier={dossier} />
      <BoardActionsPage actions={dossier.recommendedBoardActions} />
      <DataCompletenessPage dossier={dossier} />
    </Document>
  );
}
