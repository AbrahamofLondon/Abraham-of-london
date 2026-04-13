/* lib/server/diagnostics/report-pdf.tsx */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

import type { StoredDiagnosticRecord } from "@/lib/server/diagnostics/store";
import type { ResolvedDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 44,
    paddingHorizontal: 42,
    backgroundColor: "#0B0B0B",
    color: "#F5F1E8",
    fontSize: 10.5,
    lineHeight: 1.55,
  },

  micro: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#C7A45D",
  },

  monoLite: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A9A39A",
  },

  title: {
    fontSize: 28,
    lineHeight: 1.08,
    marginTop: 14,
    color: "#FFFDF8",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 1.25,
    marginTop: 10,
    color: "#D6D0C6",
  },

  body: {
    fontSize: 10.5,
    color: "#D8D3CA",
    lineHeight: 1.6,
  },

  muted: {
    color: "#9E988E",
  },

  section: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#C7A45D",
    marginBottom: 10,
  },

  heroPanel: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  grid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  metricLabel: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#9D978D",
  },

  metricValue: {
    fontSize: 12,
    marginTop: 5,
    color: "#FFFDF8",
  },

  scoreRow: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  scoreTitle: {
    fontSize: 12,
    color: "#FFFDF8",
  },

  scoreMeta: {
    fontSize: 8,
    color: "#B2ADA4",
  },

  barTrack: {
    height: 6,
    backgroundColor: "#26221C",
    marginTop: 8,
  },

  findingItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },

  recommendationCard: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  recommendationTitle: {
    fontSize: 12,
    color: "#FFFDF8",
    maxWidth: "78%",
  },

  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    fontSize: 7,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  badgeCritical: {
    color: "#FF9C9C",
    borderColor: "#7A3535",
    backgroundColor: "#341515",
  },

  badgeHigh: {
    color: "#F3C67A",
    borderColor: "#7C5822",
    backgroundColor: "#34240E",
  },

  badgeMedium: {
    color: "#A9D2FF",
    borderColor: "#335A84",
    backgroundColor: "#122235",
  },

  badgeLow: {
    color: "#AAE6B2",
    borderColor: "#2E6D41",
    backgroundColor: "#102116",
  },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
});

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function priorityStyle(priority: string) {
  switch (priority) {
    case "critical":
      return styles.badgeCritical;
    case "high":
      return styles.badgeHigh;
    case "medium":
      return styles.badgeMedium;
    default:
      return styles.badgeLow;
  }
}

function clampPct(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function DiagnosticReportPdfDocument({
  item,
  report,
}: {
  item: StoredDiagnosticRecord;
  report: ResolvedDiagnosticReport;
}) {
  const generatedDate = new Date(report.generatedAt).toLocaleDateString("en-GB");

  return (
    <Document
      title={`${item.title} Report`}
      author="Abraham of London"
      subject="Executive Diagnostic Report"
      creator="Abraham of London"
      producer="Abraham of London"
      keywords="diagnostic, executive report, alignment, strategy, governance"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.heroPanel}>
          <Text style={styles.micro}>Executive Diagnostic Report</Text>
          <Text style={styles.title}>{safeString(item.title, "Diagnostic Report")}</Text>
          <Text style={styles.subtitle}>{safeString(report.headline)}</Text>
          <Text style={[styles.monoLite, { marginTop: 10 }]}>
            {safeString(report.strapline)}
          </Text>

          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Reference</Text>
              <Text style={styles.metricValue}>{item.diagnosticRef}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Version</Text>
              <Text style={styles.metricValue}>{safeString(report.version, "2026.1")}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Generated</Text>
              <Text style={styles.metricValue}>{generatedDate}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Condition</Text>
              <Text style={styles.metricValue}>
                {safeString(item.summary?.band, "watch").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.body}>{safeString(report.executiveSummary)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Narrative Summary</Text>
          <Text style={styles.body}>{safeString(report.narrativeSummary)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domain Scores</Text>
          {(item.summary?.sectionScores || []).map((section) => {
            const pct = clampPct(section.pct);
            return (
              <View key={section.sectionId} style={styles.scoreRow}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreTitle}>{safeString(section.title)}</Text>
                  <Text style={styles.scoreMeta}>
                    {section.score}/{section.maxScore} • {pct}%
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={{
                      height: 6,
                      width: `${pct}%`,
                      backgroundColor: "#D6A546",
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Key Findings</Text>
          {(report.keyFindings || []).map((finding, idx) => (
            <View key={`${finding}-${idx}`} style={styles.findingItem}>
              <Text style={styles.body}>• {finding}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {(report.recommendations || []).map((rec, idx) => (
            <View key={rec.id || `${rec.title}-${idx}`} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{safeString(rec.title)}</Text>
                <Text style={[styles.badge, priorityStyle(rec.priority)]}>
                  {safeString(rec.priority)}
                </Text>
              </View>
              <Text style={[styles.body, { marginTop: 8 }]}>{safeString(rec.detail)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.monoLite}>Abraham of London</Text>
          <Text style={styles.monoLite}>Ref {item.diagnosticRef}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function buildDiagnosticReportPdfBuffer(args: {
  item: StoredDiagnosticRecord;
  report: ResolvedDiagnosticReport;
}): Promise<Buffer> {
  const instance = pdf(
    <DiagnosticReportPdfDocument item={args.item} report={args.report} />,
  );

  const out = await instance.toBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.isBuffer(out) ? out : Buffer.from(out as any);
}