/* lib/pdf/templates/InstitutionalBriefDocument.tsx */
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../intelligence/watermark-delegate";

import BriefCoverPage from "../../../components/print/BriefCoverPage";
import ForensicMarkLayer from "../../../components/print/ForensicMarkLayer";
import BriefHeaderBar from "../../../components/print/BriefHeaderBar";
import BriefFooterBar from "../../../components/print/BriefFooterBar";
import { InstitutionalBriefInteriorPage } from "../renderers/InstitutionalBriefDocument";

interface InstitutionalBriefTemplateProps {
  config: {
    id?: string;
    title?: string;
    classification?: string;
    reference?: string;
    signAs?: string;
    summary?: string;
    description?: string;
    type?: string;
    version?: string;
    subtitle?: string;
    [key: string]: unknown;
  };
  content: string;
  watermark: WatermarkPayload;
  qrCode?: string;
  classification?: string;
  reference?: string;
}

const PAPER = "#FCFAF6";
const INK = "#1A1713";
const INK_SOFT = "#49443C";
const INK_MUTE = "#7B7367";
const BRASS = "#8E7A53";
const BRASS_SOFT = "#C7B89B";
const LINE = "#DED5C5";
const PANEL = "#F5EFE5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 60,
    paddingBottom: 70,
    paddingHorizontal: 56,
    fontFamily: "AoLInter",
    color: INK,
    fontSize: 10,
    lineHeight: 1.58,
  },

  frameTop: {
    position: "absolute",
    top: 28,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: LINE,
  },

  frameBottom: {
    position: "absolute",
    bottom: 48,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: LINE,
  },

  masthead: {
    marginTop: 8,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },

  eyebrow: {
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: BRASS,
    marginBottom: 8,
  },

  title: {
    fontFamily: "AoLSerif",
    fontSize: 28,
    fontWeight: 700,
    color: INK,
    lineHeight: 1.08,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 10.2,
    lineHeight: 1.55,
    color: INK_SOFT,
  },

  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  metaPill: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PANEL,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  metaLabel: {
    fontSize: 6.8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: BRASS,
    marginBottom: 3,
  },

  metaValue: {
    fontSize: 8.6,
    color: INK_SOFT,
    lineHeight: 1.35,
  },

  executivePanel: {
    marginTop: 18,
    marginBottom: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: LINE,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  executiveKicker: {
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: BRASS,
    marginBottom: 8,
  },

  executiveSummary: {
    fontSize: 10,
    lineHeight: 1.64,
    color: INK_SOFT,
  },

  attestationBlock: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },

  attestationKicker: {
    fontSize: 7.4,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: BRASS,
    marginBottom: 8,
  },

  attestationText: {
    fontSize: 8.5,
    lineHeight: 1.48,
    color: INK_MUTE,
    marginBottom: 4,
  },

  footerStamp: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
  },

  footerText: {
    fontSize: 7,
    color: INK_MUTE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function summarize(content: string, fallbackSummary?: string): string {
  const cleaned = safeString(content)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const base = safeString(fallbackSummary) || cleaned;
  if (!base) return "Institutional brief prepared for structured reading and executive judgment.";
  return base.length > 360 ? `${base.slice(0, 359).trim()}…` : base;
}

export const InstitutionalBriefDocument: React.FC<InstitutionalBriefTemplateProps> = ({
  config,
  content,
  watermark,
  qrCode,
  classification,
  reference,
}) => {
  const resolvedClassification =
    safeString(classification) ||
    safeString(config.classification) ||
    "PUBLIC";

  const resolvedReference =
    safeString(reference) ||
    safeString(config.reference) ||
    safeString(config.id).slice(0, 8).toUpperCase() ||
    "UNFILED";

  const title = safeString(config.title, "Institutional Brief");
  const subtitle =
    safeString(config.subtitle) ||
    `${safeString(config.type, "Institutional Brief")} prepared for disciplined reading, executive clarity, and governed action.`;

  const summary = summarize(
    content,
    safeString(config.summary) || safeString(config.description),
  );

  const coverConfig = {
    ...config,
    classification: resolvedClassification,
    reference: resolvedReference,
  };

  return (
    <Document
      title={title}
      author="Abraham of London"
      subject="Institutional Brief"
      language="en-GB"
      creator="Abraham of London"
      producer="Abraham of London"
    >
      <BriefCoverPage
        config={coverConfig}
        watermark={watermark}
        qrCode={qrCode}
        classification={resolvedClassification}
        reference={resolvedReference}
      />

      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title={title}
          reference={resolvedReference}
          classification={resolvedClassification}
        />

        <View style={styles.masthead}>
          <Text style={styles.eyebrow}>Institutional Brief</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Classification</Text>
              <Text style={styles.metaValue}>{resolvedClassification}</Text>
            </View>

            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Reference</Text>
              <Text style={styles.metaValue}>{resolvedReference}</Text>
            </View>

            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Version</Text>
              <Text style={styles.metaValue}>{safeString(config.version, "1.0")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.executivePanel}>
          <Text style={styles.executiveKicker}>Executive Summary</Text>
          <Text style={styles.executiveSummary}>{summary}</Text>
        </View>

        <InstitutionalBriefInteriorPage content={content} />

        <View style={styles.attestationBlock}>
          <Text style={styles.attestationKicker}>Attestation</Text>
          <Text style={styles.attestationText}>
            Issued under the authority of {safeString(config.signAs, "The Architect")}.
          </Text>
          <Text style={styles.attestationText}>
            Classification: {resolvedClassification}
          </Text>
          <Text style={styles.attestationText}>
            Reference: {resolvedReference}
          </Text>
        </View>

        <View style={styles.footerStamp}>
          <Text style={styles.footerText}>© Abraham of London</Text>
          <Text style={styles.footerText}>Protocol Verified</Text>
          <Text style={styles.footerText}>Sovereign Registry</Text>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={resolvedReference}
          signAs={safeString(config.signAs, "The Architect")}
        />
      </Page>
    </Document>
  );
};

export default InstitutionalBriefDocument;