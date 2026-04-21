// lib/admin/reporting/executive-report-pdf.tsx

import * as React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReturnTypeSerializeExecutiveReportToPdfPayload } from "./types";

export type ExecutiveReportPdfPayload = ReturnTypeSerializeExecutiveReportToPdfPayload;

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
    color: "#111111",
    fontSize: 11,
    lineHeight: 1.45,
  },

  coverPage: {
    paddingTop: 50,
    paddingBottom: 42,
    paddingHorizontal: 40,
    backgroundColor: "#F8F6F1",
    color: "#111111",
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  eyebrowLine: {
    width: 42,
    height: 1,
    backgroundColor: "#B58A3A",
    marginRight: 10,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#8A6A2F",
  },

  title: {
    fontSize: 34,
    fontWeight: 300,
    lineHeight: 1.05,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#5B5B5B",
    marginBottom: 18,
  },

  generatedAt: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 22,
  },

  stateBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#D7C29A",
    backgroundColor: "#FBF7EE",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 22,
  },

  stateBadgeText: {
    fontSize: 10,
    color: "#8A6A2F",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  section: {
    marginTop: 18,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#7A7A7A",
    marginBottom: 10,
  },

  narrativePanel: {
    borderWidth: 1,
    borderColor: "#E8E2D5",
    backgroundColor: "#FCFAF6",
    padding: 16,
    marginBottom: 18,
  },

  headline: {
    fontSize: 22,
    lineHeight: 1.2,
    marginBottom: 10,
    color: "#111111",
  },

  body: {
    fontSize: 11,
    lineHeight: 1.65,
    color: "#333333",
  },

  actionPanel: {
    borderWidth: 1,
    borderColor: "#DCC18F",
    backgroundColor: "#FBF3E3",
    padding: 14,
    marginTop: 14,
  },

  actionLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#8A6A2F",
    marginBottom: 8,
  },

  actionText: {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#4A3A16",
  },

  gridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#E8E4DA",
    backgroundColor: "#FAFAF8",
    padding: 12,
    minHeight: 74,
  },

  statLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#7A7A7A",
    marginBottom: 6,
  },

  statValue: {
    fontSize: 17,
    color: "#111111",
  },

  statSubtle: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
    lineHeight: 1.4,
  },

  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  pill: {
    borderWidth: 1,
    borderColor: "#E7E2D7",
    backgroundColor: "#FAFAF8",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },

  pillText: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.2,
  },

  domainTable: {
    borderWidth: 1,
    borderColor: "#E6E1D7",
    marginTop: 6,
  },

  domainHeader: {
    flexDirection: "row",
    backgroundColor: "#F7F4EE",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1D7",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  domainHeaderCell: {
    fontSize: 8,
    color: "#6A6A6A",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },

  domainRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE3",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  cellDomain: {
    width: "38%",
    fontSize: 10,
    color: "#111111",
  },

  cellNum: {
    width: "15%",
    fontSize: 10,
    color: "#333333",
    textAlign: "right",
  },

  recommendationCard: {
    borderWidth: 1,
    borderColor: "#E8E4DA",
    backgroundColor: "#FCFBF8",
    padding: 12,
    marginBottom: 10,
  },

  recommendationMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  recommendationMeta: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#777777",
  },

  recommendationScore: {
    fontSize: 8,
    color: "#8A6A2F",
    letterSpacing: 1.1,
  },

  recommendationTitle: {
    fontSize: 12,
    color: "#111111",
    marginBottom: 6,
  },

  recommendationSummary: {
    fontSize: 10.5,
    lineHeight: 1.55,
    color: "#333333",
    marginBottom: 8,
  },

  recommendationReason: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: "#555555",
    marginBottom: 4,
  },

  rationaleBlock: {
    borderWidth: 1,
    borderColor: "#ECE6DB",
    backgroundColor: "#FAFAF8",
    padding: 10,
    marginBottom: 8,
  },

  rationaleText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: "#444444",
  },

  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#E8E4DA",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerLeft: {
    fontSize: 8,
    color: "#8A8A8A",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  footerRight: {
    fontSize: 8,
    color: "#8A8A8A",
  },
});

function PageFooter({ right }: { right: string }) {
  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerLeft}>Abraham of London · Executive Reporting</Text>
      <Text style={styles.footerRight}>{right}</Text>
    </View>
  );
}

function NarrativePanel({
  title,
  body,
  nextAction,
}: {
  title: string;
  body: string;
  nextAction?: string;
}) {
  return (
    <View style={styles.narrativePanel}>
      <Text style={styles.headline}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {nextAction ? (
        <View style={styles.actionPanel}>
          <Text style={styles.actionLabel}>Next Action</Text>
          <Text style={styles.actionText}>{nextAction}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtext ? <Text style={styles.statSubtle}>{subtext}</Text> : null}
    </View>
  );
}

function PillList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.pillWrap}>
        {items.length ? (
          items.map((item) => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))
        ) : (
          <View style={styles.pill}>
            <Text style={styles.pillText}>None isolated</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function DomainTable({
  domains,
}: {
  domains: Array<{
    label: string;
    intent: number;
    reality: number;
    dissonance: number;
  }>;
}) {
  return (
    <View style={styles.domainTable}>
      <View style={styles.domainHeader}>
        <Text style={[styles.domainHeaderCell, { width: "38%" }]}>Domain</Text>
        <Text style={[styles.domainHeaderCell, { width: "15%", textAlign: "right" }]}>
          Intent
        </Text>
        <Text style={[styles.domainHeaderCell, { width: "15%", textAlign: "right" }]}>
          Reality
        </Text>
        <Text style={[styles.domainHeaderCell, { width: "20%", textAlign: "right" }]}>
          Dissonance
        </Text>
      </View>

      {domains.map((domain) => (
        <View key={domain.label} style={styles.domainRow}>
          <Text style={styles.cellDomain}>{domain.label}</Text>
          <Text style={styles.cellNum}>{domain.intent}%</Text>
          <Text style={styles.cellNum}>{domain.reality}%</Text>
          <Text style={[styles.cellNum, { width: "20%" }]}>{domain.dissonance}%</Text>
        </View>
      ))}
    </View>
  );
}

function RecommendationHierarchy({
  recommendations,
}: {
  recommendations: ExecutiveReportPdfPayload["recommendations"];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Governed Recommendations</Text>

      {recommendations.length ? (
        recommendations.map((item, idx) => (
          <View key={item.id || `${idx}-${item.title}`} style={styles.recommendationCard}>
            <View style={styles.recommendationMetaRow}>
              <Text style={styles.recommendationMeta}>
                #{idx + 1} • {item.kind}
              </Text>
              <Text style={styles.recommendationScore}>
                Score {Number(item.score).toFixed(1)}
              </Text>
            </View>

            <Text style={styles.recommendationTitle}>{item.title}</Text>
            <Text style={styles.recommendationSummary}>{item.summary}</Text>

            {item.reasons.map((reason) => (
              <Text key={`${item.id}-${reason}`} style={styles.recommendationReason}>
                • {reason}
              </Text>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationSummary}>
            No constitutionally suitable recommendations were available.
          </Text>
        </View>
      )}
    </View>
  );
}

function RationaleHierarchy({
  rationale,
}: {
  rationale: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rationale</Text>

      {rationale.length ? (
        rationale.slice(0, 6).map((item, idx) => (
          <View key={`${idx}-${item}`} style={styles.rationaleBlock}>
            <Text style={styles.rationaleText}>{item}</Text>
          </View>
        ))
      ) : (
        <View style={styles.rationaleBlock}>
          <Text style={styles.rationaleText}>No rationale captured.</Text>
        </View>
      )}
    </View>
  );
}

function ConstitutionalPostureGrid({
  constitution,
}: {
  constitution: ExecutiveReportPdfPayload["constitution"];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Constitutional Posture</Text>

      <View style={styles.gridRow}>
        <MetricCard
          label="Route"
          value={constitution.route}
          subtext="Issued posture"
        />
        <MetricCard
          label="Readiness"
          value={constitution.readinessTier}
          subtext="Execution condition"
        />
        <MetricCard
          label="Authority"
          value={constitution.authorityType}
          subtext="Sponsor posture"
        />
      </View>

      <View style={styles.gridRow}>
        <MetricCard
          label="Org State"
          value={constitution.orgState}
          subtext="Structural state"
        />
        <MetricCard
          label="Priority"
          value={constitution.priority}
          subtext="Decision urgency"
        />
        <MetricCard
          label="Temperature"
          value={constitution.temperature}
          subtext="Escalation heat"
        />
      </View>

      <View style={styles.gridRow}>
        <MetricCard
          label="Market Risk"
          value={constitution.marketRiskBand}
          subtext="Risk environment"
        />
        <MetricCard
          label="Revenue Band"
          value={constitution.revenueBand}
          subtext="Commercial tier"
        />
        <MetricCard
          label="Clarity"
          value={`${constitution.clarityScore}%`}
          subtext="Signal clarity"
        />
      </View>
    </View>
  );
}

export function ExecutiveReportPdfDocument({
  payload,
  campaign,
}: {
  payload: ExecutiveReportPdfPayload;
  campaign?: {
    id?: string;
    title?: string;
    organisationName?: string;
    generatedAt?: string;
  };
}) {
  return (
    <Document
      title={`${campaign?.organisationName || "Executive"} Report`}
      author="Abraham of London"
      subject="Executive Diagnostic Report"
      creator="Sovereign Reporting Engine"
      producer="Sovereign Reporting Engine"
    >
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrow}>Executive Report · Abraham of London</Text>
        </View>

        <Text style={styles.title}>{payload.title}</Text>
        <Text style={styles.subtitle}>{payload.subtitle}</Text>

        <Text style={styles.generatedAt}>
          {campaign?.organisationName || "Sovereign Client"}
          {campaign?.title ? ` • ${campaign.title}` : ""}
          {" • "}
          {campaign?.generatedAt || payload.generatedAt}
        </Text>

        <View style={styles.stateBadge}>
          <Text style={styles.stateBadgeText}>{payload.state}</Text>
        </View>

        <NarrativePanel
          title={payload.headline}
          body={payload.constitution.narrativeSummary || payload.summary}
          nextAction={payload.mandate}
        />

        <ConstitutionalPostureGrid constitution={payload.constitution} />

        <PillList
          title="Dominant Domains"
          items={payload.constitution.dominantDomains}
        />

        <PillList
          title="Failure Modes"
          items={payload.constitution.failureModes}
        />

        <PillList
          title="Required Interventions"
          items={payload.constitution.requiredInterventions}
        />

        <PageFooter right="Cover" />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Strategic Domain Analysis</Text>
        <DomainTable domains={payload.domains} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Exposure</Text>

          <View style={styles.gridRow}>
            <MetricCard
              label="Replacement Cost"
              value={payload.exposure.replacementCost}
              subtext="Replacement liability"
            />
            <MetricCard
              label="Execution Loss"
              value={payload.exposure.executionLoss}
              subtext="Observed loss drag"
            />
            <MetricCard
              label="Total Exposure"
              value={payload.exposure.totalExposure}
              subtext="Composite exposure"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrity Snapshot</Text>

          <View style={styles.gridRow}>
            <MetricCard
              label="Sovereign Certainty"
              value={`${payload.integrity.sovereignCertainty.toFixed(0)}%`}
              subtext="Confidence posture"
            />
            <MetricCard
              label="Avg Dissonance"
              value={`${payload.integrity.averageDissonance}%`}
              subtext="Structural strain"
            />
            <MetricCard
              label="Burnout Index"
              value={`${payload.integrity.burnoutIndex}%`}
              subtext="Human capital pressure"
            />
          </View>
        </View>

        <RecommendationHierarchy recommendations={payload.recommendations} />

        <PageFooter right="Analysis" />
      </Page>

      <Page size="A4" style={styles.page}>
        <NarrativePanel
          title="Decision Logic"
          body={payload.summary}
          nextAction={payload.mandate}
        />

        <PillList title="Priority Stack" items={payload.priorities} />

        <PillList title="Worldview Anchors" items={payload.constitution.worldviewAnchors} />

        <PillList title="Sponsor Types" items={payload.constitution.sponsorTypes} />

        <RationaleHierarchy rationale={payload.constitution.rationale} />

        <PageFooter right="Rationale" />
      </Page>
    </Document>
  );
}