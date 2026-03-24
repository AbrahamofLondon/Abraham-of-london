import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { StoredPurposeAlignmentAssessment } from "@/lib/alignment/types";
import { ALIGNMENT_DOMAIN_LABELS } from "@/lib/alignment/checklist";
import { buildAlignmentNarrativeFromResult } from "@/lib/alignment/report-language";
import type { WatermarkPayload } from "@/lib/intelligence/watermark-delegate";

import BriefCoverPage from "@/components/print/BriefCoverPage";
import BriefHeaderBar from "@/components/print/BriefHeaderBar";
import BriefFooterBar from "@/components/print/BriefFooterBar";
import ForensicMarkLayer from "@/components/print/ForensicMarkLayer";

const PAPER = "#FCFBF7";
const INK = "#121416";
const BRASS = "#8A6A2F";
const SILVER = "#56606C";
const SOFTER = "#76808C";
const MIST = "#E8E1D4";
const PANEL = "#F7F3EC";
const PANEL_ALT = "#FBF9F4";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 58,
    paddingBottom: 56,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.55,
  },

  frameTop: {
    position: "absolute",
    top: 24,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: MIST,
  },

  frameBottom: {
    position: "absolute",
    bottom: 48,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: MIST,
  },

  leadPanel: {
    marginTop: 14,
    marginBottom: 18,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
    backgroundColor: PANEL_ALT,
  },

  leadText: {
    fontFamily: "Helvetica",
    fontSize: 9.45,
    lineHeight: 1.58,
    color: SILVER,
  },

  summaryPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  executivePanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  sectionKicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  summaryCell: {
    width: "50%",
    marginBottom: 8,
    paddingRight: 10,
  },

  summaryKey: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.1,
    color: SOFTER,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },

  summaryValue: {
    fontFamily: "Helvetica",
    fontSize: 9.4,
    color: INK,
    lineHeight: 1.4,
  },

  executiveText: {
    fontFamily: "Helvetica",
    fontSize: 9.4,
    lineHeight: 1.55,
    color: INK,
  },

  section: {
    marginBottom: 16,
  },

  sectionHeaderRule: {
    height: 1,
    backgroundColor: MIST,
    marginBottom: 6,
  },

  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },

  narrativePanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL_ALT,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },

  narrativeTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: INK,
    marginBottom: 5,
  },

  narrativeBody: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.55,
    color: SILVER,
  },

  domainTable: {
    borderWidth: 1,
    borderColor: MIST,
  },

  domainHeaderRow: {
    flexDirection: "row",
    backgroundColor: PANEL,
    borderBottomWidth: 1,
    borderBottomColor: MIST,
  },

  domainRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: MIST,
  },

  domainLabelHeader: {
    flex: 2.1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: INK,
  },

  domainMetricHeader: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: INK,
    textAlign: "right",
  },

  domainLabel: {
    flex: 2.1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica",
    fontSize: 8.9,
    color: INK,
    lineHeight: 1.35,
  },

  domainMetric: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica",
    fontSize: 8.8,
    color: SILVER,
    textAlign: "right",
  },

  listPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL_ALT,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  bulletMark: {
    width: 12,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.4,
    color: BRASS,
    marginTop: 1,
  },

  bulletText: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.52,
    color: SILVER,
  },

  notesPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },

  notesText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.56,
    color: SILVER,
  },

  closingBand: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MIST,
  },

  closingText: {
    fontFamily: "Helvetica",
    fontSize: 8.3,
    lineHeight: 1.48,
    color: SOFTER,
  },
});

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlignmentReportDocument({
  assessment,
  watermark,
  qrCode,
}: {
  assessment: StoredPurposeAlignmentAssessment;
  watermark: WatermarkPayload;
  qrCode?: string;
}) {
  const narrative = buildAlignmentNarrativeFromResult(assessment);

  const reference = `ALIGN-${assessment.id.slice(0, 8).toUpperCase()}`;
  const classification = "PUBLIC";

  const coverConfig = {
    id: assessment.id,
    title: "Purpose Alignment Report",
    subtitle: "Directional Integrity Diagnostic",
    description:
      "A governed executive report for directional integrity, structural drift, and correction priority.",
    institutionalId: reference,
    version: assessment.reportVersion,
    date: assessment.createdAt,
    author: "Abraham of London",
  };

  return (
    <Document
      author="Abraham of London"
      title="Purpose Alignment Report"
      subject="Directional Integrity Diagnostic"
      creator="Abraham of London Purpose Alignment System"
      producer="Abraham of London"
      keywords={`purpose alignment, diagnostic, ${assessment.band}, ${assessment.sourceInstrumentId}`}
      language="en-GB"
    >
      <BriefCoverPage
        config={coverConfig as never}
        watermark={watermark}
        qrCode={qrCode}
        classification={classification}
        reference={reference}
        subtitle="Executive reading, domain analysis, corrective priority, and governed reassessment posture."
      />

      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title="Purpose Alignment Report"
          reference={reference}
          classification={classification}
        />

        <View style={styles.leadPanel}>
          <Text style={styles.leadText}>{narrative.executiveSummary}</Text>
        </View>

        <View style={styles.summaryPanel}>
          <Text style={styles.sectionKicker}>Assessment Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Score</Text>
              <Text style={styles.summaryValue}>
                {assessment.totalScore}/{assessment.possibleScore}
              </Text>
            </View>

            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Percent</Text>
              <Text style={styles.summaryValue}>{assessment.percentScore}%</Text>
            </View>

            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Band</Text>
              <Text style={styles.summaryValue}>{assessment.band.toUpperCase()}</Text>
            </View>

            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Generated</Text>
              <Text style={styles.summaryValue}>{formatDate(assessment.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.executivePanel}>
          <Text style={styles.sectionKicker}>Executive Reading</Text>
          <Text style={styles.executiveText}>{narrative.posture}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Band Interpretation</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>{narrative.bandInterpretationTitle}</Text>
            <Text style={styles.narrativeBody}>{narrative.bandInterpretationBody}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Domain Scores</Text>

          <View style={styles.domainTable}>
            <View style={styles.domainHeaderRow}>
              <Text style={styles.domainLabelHeader}>Domain</Text>
              <Text style={styles.domainMetricHeader}>Score</Text>
              <Text style={styles.domainMetricHeader}>Percent</Text>
            </View>

            {assessment.domainScores.map((item, index) => (
              <View
                key={item.domain}
                style={[
                  styles.domainRow,
                  index === assessment.domainScores.length - 1
                    ? { borderBottomWidth: 0 }
                    : undefined,
                ]}
              >
                <Text style={styles.domainLabel}>
                  {ALIGNMENT_DOMAIN_LABELS[item.domain]}
                </Text>
                <Text style={styles.domainMetric}>
                  {item.earned}/{item.possible}
                </Text>
                <Text style={styles.domainMetric}>{item.percent}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Primary Correction</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>{narrative.correctivePriorityTitle}</Text>
            <Text style={styles.narrativeBody}>{narrative.correctivePriorityBody}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Strongest Signal</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>{narrative.strongestSignalTitle}</Text>
            <Text style={styles.narrativeBody}>{narrative.strongestSignalBody}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Corrections</Text>
          <View style={styles.listPanel}>
            {assessment.corrections.map((correction) => (
              <View key={correction} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{correction}</Text>
              </View>
            ))}
          </View>
        </View>

        {assessment.notes ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRule} />
            <Text style={styles.sectionTitle}>Operating Notes</Text>
            <View style={styles.notesPanel}>
              <Text style={styles.notesText}>{assessment.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.closingBand}>
          <Text style={styles.closingText}>{narrative.reportClosingNote}</Text>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs="The Architect"
        />
      </Page>
    </Document>
  );
}