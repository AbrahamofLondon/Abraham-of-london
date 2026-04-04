/* lib/admin/reporting/report-pdf.tsx
   ---------------------------------------------------------------------------
   BOARD-READY PDF DOCUMENT
   React PDF template for executive institutional diagnostics.
   --------------------------------------------------------------------------- */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type DomainMetric = {
  label: string;
  intent: number;
  reality: number;
  dissonance: number;
};

type PdfReportPayload = {
  state?: string;
  narrative?: {
    headline?: string;
    summary?: string;
    mandate?: string;
  };
  resonance?: {
    telemetry?: {
      averageDissonance?: number;
      domains?: DomainMetric[];
    };
  };
  hcdAggregate?: {
    overallBurnoutIndex?: number;
  };
  financialExposure?: {
    replacementCost?: number | string;
    executionLoss?: number | string;
    totalExposure?: number | string;
  };
  priorityStack?: string[];
  failureModes?: string[];
  ogr?: {
    sovereignCertainty?: number;
    isAuthorizedToExecute?: boolean;
  };
};

type Props = {
  payload: PdfReportPayload;
  constitution?: unknown;
  guidance?: unknown;
  campaign?: {
    id?: string;
    title?: string;
    organisationName?: string;
    generatedAt?: string;
  };
  metadata?: {
    generatedAt?: string;
    reportState?: string;
    integrityIndex?: number;
    participantCount?: number;
    constitutionalConfidence?: number;
    constitutionalRoute?: string;
  };
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 10,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#8A6A2F",
    marginBottom: 12,
  },
  title: {
    fontSize: 27,
    marginBottom: 6,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #E5E5E5",
    borderBottom: "1 solid #E5E5E5",
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 22,
  },
  metaCol: {
    width: "32%",
  },
  metaLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#777777",
    marginBottom: 4,
    letterSpacing: 1.4,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  headlineBox: {
    borderLeft: "3 solid #8A6A2F",
    paddingLeft: 14,
    marginBottom: 20,
  },
  headline: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },
  summary: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#333333",
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#8A6A2F",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    border: "1 solid #E8E8E8",
    padding: 12,
  },
  cardLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#777777",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 3,
  },
  cardBody: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.45,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.45,
    color: "#222222",
  },
  domainTable: {
    marginTop: 8,
    border: "1 solid #E5E5E5",
  },
  domainRowHeader: {
    flexDirection: "row",
    backgroundColor: "#F7F7F7",
    borderBottom: "1 solid #E5E5E5",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  domainRow: {
    flexDirection: "row",
    borderBottom: "1 solid #EFEFEF",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  domainCellLabel: {
    width: "40%",
    fontSize: 9,
    fontWeight: 700,
  },
  domainCell: {
    width: "20%",
    fontSize: 9,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 20,
    borderTop: "1 solid #E5E5E5",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#777777",
  },
});

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  return fallback;
}

export function ExecutiveReportPdfDocument({
  payload,
  constitution,
  guidance,
  campaign,
  metadata,
}: Props) {
  const organisationName = safeString(
    campaign?.organisationName,
    "Unknown Organisation",
  );
  const campaignId = safeString(campaign?.id, "Unknown Campaign");
  const generatedAt =
    safeString(metadata?.generatedAt) ||
    safeString(campaign?.generatedAt) ||
    new Date().toISOString();

  const headline = safeString(
    payload?.narrative?.headline,
    "Institutional Diagnostics Executive Brief",
  );
  const summary = safeString(
    payload?.narrative?.summary,
    "Executive institutional diagnostic generated from campaign telemetry.",
  );
  const mandate = safeString(
    payload?.narrative?.mandate,
    "Use this report to guide disciplined institutional intervention.",
  );

  const state = safeString(metadata?.reportState || payload?.state, "GENERATED");
  const certainty = safeNumber(payload?.ogr?.sovereignCertainty, 0);
  const authorized = Boolean(payload?.ogr?.isAuthorizedToExecute);
  const averageDissonance = safeNumber(
    payload?.resonance?.telemetry?.averageDissonance,
    0,
  );
  const burnoutIndex = safeNumber(payload?.hcdAggregate?.overallBurnoutIndex, 0);

  const replacementCost = safeNumber(
    payload?.financialExposure?.replacementCost,
    0,
  );
  const executionLoss = safeNumber(payload?.financialExposure?.executionLoss, 0);
  const totalExposure = safeNumber(payload?.financialExposure?.totalExposure, 0);

  const priorities = Array.isArray(payload?.priorityStack)
    ? payload.priorityStack
    : [];
  const failureModes = Array.isArray(payload?.failureModes)
    ? payload.failureModes
    : [];
  const domains = Array.isArray(payload?.resonance?.telemetry?.domains)
    ? payload.resonance.telemetry.domains
    : [];

  return (
    <Document
      title={`Executive Report — ${organisationName}`}
      author="Abraham of London"
      subject="Institutional Diagnostics Executive Report"
      creator="Abraham of London"
      producer="Abraham of London"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Institutional Diagnostics Engine</Text>
        <Text style={styles.title}>{headline}</Text>
        <Text style={styles.subtitle}>
          {safeString(campaign?.title, "Executive Intelligence Brief")}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Organisation</Text>
            <Text style={styles.metaValue}>{organisationName}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Campaign</Text>
            <Text style={styles.metaValue}>{campaignId}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>
              {new Date(generatedAt).toLocaleString("en-GB")}
            </Text>
          </View>
        </View>

        <View style={styles.headlineBox}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.summary}>{summary}</Text>
          <Text style={[styles.summary, { marginTop: 8 }]}>{mandate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System State</Text>
          <View style={styles.twoCol}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>State</Text>
              <Text style={styles.cardValue}>{state}</Text>
              <Text style={styles.cardBody}>
                Current institutional operating posture after combining resonance,
                human-capital strain, and execution certainty.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Sovereign Certainty</Text>
              <Text style={styles.cardValue}>{certainty.toFixed(2)}%</Text>
              <Text style={styles.cardBody}>
                Authorization: {authorized ? "Verified" : "Suspended"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrity & Exposure</Text>
          <View style={styles.twoCol}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Average Dissonance</Text>
              <Text style={styles.cardValue}>{averageDissonance.toFixed(2)}%</Text>
              <Text style={styles.cardBody}>
                Structural drag across strategic intent, clarity, trust, and cohesion.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Burnout Index</Text>
              <Text style={styles.cardValue}>{burnoutIndex.toFixed(0)}%</Text>
              <Text style={styles.cardBody}>
                Human capital pressure across the operating system.
              </Text>
            </View>
          </View>

          <View style={[styles.twoCol, { marginTop: 12 }]}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Replacement Cost</Text>
              <Text style={styles.cardValue}>
                {replacementCost.toLocaleString()}
              </Text>
              <Text style={styles.cardBody}>
                Estimated liability from talent disruption and continuity risk.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Execution Loss</Text>
              <Text style={styles.cardValue}>{executionLoss.toLocaleString()}</Text>
              <Text style={styles.cardBody}>
                Revenue drag attributable to misalignment and decision inefficiency.
              </Text>
            </View>
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardLabel}>Total Exposure</Text>
            <Text style={styles.cardValue}>{totalExposure.toLocaleString()}</Text>
            <Text style={styles.cardBody}>
              Combined projected exposure across human capital loss and execution drag.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Stack</Text>
          {priorities.length > 0 ? (
            priorities.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.listItem}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text style={styles.listItem}>No active priority stack recorded.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Failure Modes</Text>
          {failureModes.length > 0 ? (
            failureModes.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.listItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.listItem}>No active failure modes detected.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domain Matrix</Text>

          <View style={styles.domainTable}>
            <View style={styles.domainRowHeader}>
              <Text style={styles.domainCellLabel}>Domain</Text>
              <Text style={styles.domainCell}>Intent</Text>
              <Text style={styles.domainCell}>Reality</Text>
              <Text style={styles.domainCell}>Gap</Text>
            </View>

            {domains.map((domain, index) => (
              <View key={`${domain.label}-${index}`} style={styles.domainRow}>
                <Text style={styles.domainCellLabel}>{domain.label}</Text>
                <Text style={styles.domainCell}>
                  {safeNumber(domain.intent).toFixed(0)}%
                </Text>
                <Text style={styles.domainCell}>
                  {safeNumber(domain.reality).toFixed(0)}%
                </Text>
                <Text style={styles.domainCell}>
                  {safeNumber(domain.dissonance).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {(constitution || guidance || metadata?.constitutionalRoute) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Constitutional Overlay</Text>
            <Text style={styles.listItem}>
              Route:{" "}
              {safeString(
                metadata?.constitutionalRoute,
                typeof constitution === "object" && constitution !== null
                  ? safeString((constitution as any)?.route, "N/A")
                  : "N/A",
              )}
            </Text>
            <Text style={styles.listItem}>
              Confidence: {safeNumber(metadata?.constitutionalConfidence, 0).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Restricted • Executive Use</Text>
          <Text style={styles.footerText}>Sovereign Protocol v2.0</Text>
        </View>
      </Page>
    </Document>
  );
}