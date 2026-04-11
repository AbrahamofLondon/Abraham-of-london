import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: "1 solid #D1D5DB",
    paddingBottom: 12,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6B7280",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    marginBottom: 6,
  },
  meta: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "right",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6B7280",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    border: "1 solid #E5E7EB",
    padding: 10,
  },
  cardLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6B7280",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 18,
    marginBottom: 4,
  },
  listItem: {
    marginBottom: 6,
    color: "#374151",
  },
  footer: {
    marginTop: 18,
    paddingTop: 10,
    borderTop: "1 solid #E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#6B7280",
    textTransform: "uppercase",
  },
});

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function ExecutiveBriefingPdfDocument({
  canonical,
}: {
  canonical: any;
}) {
  const sections = canonical?.sections || {};
  const campaign = canonical?.campaign || {};
  const report = canonical?.report || {};

  const headline = safeString(
    sections?.executiveSummary?.headline || report?.narrative?.headline,
    "Executive Reporting Board Brief",
  );

  const summary = safeString(
    sections?.executiveSummary?.summary || report?.narrative?.summary,
    "Governed executive reading generated.",
  );

  const priorityStack = safeArray<string>(
    sections?.priorityStack?.items || report?.priorityStack,
  );

  const failureModes = safeArray<string>(
    sections?.failureModes?.items || report?.failureModes,
  );

  const avgDissonance = safeNumber(
    report?.resonance?.telemetry?.averageDissonance,
    0,
  );

  const burnout = safeNumber(report?.hcdAggregate?.overallBurnoutIndex, 0);
  const certainty = safeNumber(report?.ogr?.sovereignCertainty, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Abraham of London · Executive Reporting</Text>
            <Text style={styles.title}>Boardroom Briefing</Text>
            <Text>{safeString(campaign?.organisationName, "Prospective Organisation")}</Text>
          </View>

          <View>
            <Text style={styles.meta}>{safeString(campaign?.id, "report")}</Text>
            <Text style={styles.meta}>
              {safeString(campaign?.generatedAt, new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Average dissonance</Text>
            <Text style={styles.cardValue}>{Math.round(avgDissonance)}%</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Burnout index</Text>
            <Text style={styles.cardValue}>{Math.round(burnout)}%</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sovereign certainty</Text>
            <Text style={styles.cardValue}>{Math.round(certainty)}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>

        {priorityStack.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Intervention Stack</Text>
            {priorityStack.map((item, i) => (
              <Text key={i} style={styles.listItem}>• {item}</Text>
            ))}
          </View>
        )}

        {failureModes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observed Failure Modes</Text>
            {failureModes.map((item, i) => (
              <Text key={i} style={styles.listItem}>• {item}</Text>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Confidential · Sovereign Protocol v2.2</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}