/* lib/pdf/templates/InstitutionalBriefDocument.tsx — V7.3 (Production Ready) */
import React from "react";
import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../intelligence/watermark-delegate";

import BriefCoverPage from "../../../components/print/BriefCoverPage";
import ForensicMarkLayer from "../../../components/print/ForensicMarkLayer";
import BriefHeaderBar from "../../../components/print/BriefHeaderBar";
import BriefFooterBar from "../../../components/print/BriefFooterBar";
import ExecutiveSummaryPanel from "../../../components/print/ExecutiveSummaryPanel";
import KeyJudgementsPanel from "../../../components/print/KeyJudgementsPanel";
import RenderBriefBody from "../renderers/InstitutionalBriefDocument";   // ← Correct import

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */
type ExpandedPDFConfig = {
  id?: string;
  title?: string;
  subtitle?: string;
  classification?: string;
  reference?: string;
  type?: string;
  version?: string;
  summary?: string;
  description?: string;
  signAs?: string;
  outputPath?: string;
  tier?: string;
  [key: string]: unknown;
};

type BriefDocumentProps = {
  config?: ExpandedPDFConfig;
  content?: string;
  summaryText?: string;
  watermark?: WatermarkPayload;
  qrCode?: string;
  frontmatter?: Record<string, unknown>;
  sourceMeta?: any;
};

/* -------------------------------------------------------------------------- */
/* Design Tokens */
/* -------------------------------------------------------------------------- */
const PAPER = "#FCFAF6";
const INK = "#1A1713";
const INK_SOFT = "#49443C";
const INK_MUTE = "#7B7367";
const BRASS = "#8E7A53";
const LINE = "#DED5C5";
const PANEL = "#F5EFE5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 58,
    paddingBottom: 68,
    paddingHorizontal: 54,
    fontFamily: "AoLInter",
    fontSize: 10.1,
    lineHeight: 1.58,
  },
  frameTop: {
    position: "absolute",
    top: 30,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: LINE,
  },
  frameBottom: {
    position: "absolute",
    bottom: 50,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: LINE,
  },
  masthead: {
    marginTop: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  eyebrow: {
    fontSize: 7.6,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: BRASS,
    marginBottom: 6,
  },
  title: {
    fontFamily: "AoLSerif",
    fontSize: 27,
    fontWeight: 700,
    color: INK,
    lineHeight: 1.1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10.4,
    lineHeight: 1.55,
    color: INK_SOFT,
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PANEL,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginRight: 10,
  },
  metaPillLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PANEL,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  metaLabel: {
    fontSize: 6.9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: BRASS,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 8.8,
    color: INK_SOFT,
    lineHeight: 1.4,
  },
  executivePanel: {
    marginTop: 20,
    marginBottom: 26,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: LINE,
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  executiveKicker: {
    fontSize: 7.6,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.45,
    color: BRASS,
    marginBottom: 9,
  },
  executiveSummary: {
    fontSize: 10.1,
    lineHeight: 1.65,
    color: INK_SOFT,
  },
  attestationBlock: {
    marginTop: 32,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  attestationKicker: {
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.25,
    color: BRASS,
    marginBottom: 8,
  },
  attestationText: {
    fontSize: 8.6,
    lineHeight: 1.5,
    color: INK_MUTE,
    marginBottom: 5,
  },
  footerStamp: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 11,
  },
  footerText: {
    fontSize: 7.1,
    color: INK_MUTE,
    textTransform: "uppercase",
    letterSpacing: 0.85,
  },
  fallbackBox: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PANEL,
  },
  fallbackTitle: {
    fontSize: 8.4,
    fontWeight: 700,
    color: BRASS,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fallbackText: {
    fontSize: 9,
    color: INK_SOFT,
    lineHeight: 1.5,
  },
});

/* -------------------------------------------------------------------------- */
/* Safe Utilities */
/* -------------------------------------------------------------------------- */
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

function summarize(content: string, fallback?: string): string {
  const cleaned = safeString(content)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, " ")
    .trim();

  const base = safeString(fallback) || cleaned;
  return base.length > 380 ? `${base.slice(0, 379).trim()}…` : base;
}

/* -------------------------------------------------------------------------- */
/* Main Document */
/* -------------------------------------------------------------------------- */
export const InstitutionalBriefDocument: React.FC<BriefDocumentProps> = ({
  config: configProp,
  content = "",
  summaryText,
  watermark = { fingerprint: "institutional", issuedAt: new Date().toISOString(), metadata: {} },
  qrCode,
  frontmatter,
}) => {
  const mergedConfig = { ...(configProp || {}), ...(frontmatter || {}) };

  const title = safeString(mergedConfig.title, "Institutional Brief");
  const subtitle = safeString(mergedConfig.subtitle) || 
    `${safeString(mergedConfig.type, "Institutional Brief")} prepared for disciplined reading.`;

  const resolvedContent = safeString(content).trim();
  const executiveSummary = summarize(resolvedContent, safeString(summaryText) || safeString(mergedConfig.summary));

  const classification = safeString(mergedConfig.classification, "PUBLIC").toUpperCase();
  const reference = safeString(mergedConfig.reference || mergedConfig.id, "UNFILED").toUpperCase();
  const signAs = safeString(mergedConfig.signAs, "The Architect");

  return (
    <Document
      title={title}
      author="Abraham of London"
      subject={subtitle}
      language="en-GB"
    >
      <BriefCoverPage
        config={mergedConfig}
        watermark={watermark}
        qrCode={qrCode}
        classification={classification}
        reference={reference}
      />

      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />

        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title={title}
          reference={reference}
          classification={classification}
        />

        <View style={styles.masthead}>
          <Text style={styles.eyebrow}>Institutional Brief</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Executive Summary */}
        {executiveSummary && (
          <View style={styles.executivePanel}>
            <ExecutiveSummaryPanel text={executiveSummary} />
          </View>
        )}

        {/* Main Body - Now using the strong renderer */}
        {resolvedContent.length > 20 ? (
          <RenderBriefBody content={resolvedContent} />
        ) : (
          <View style={styles.fallbackBox}>
            <Text style={styles.fallbackTitle}>Content Unavailable</Text>
            <Text style={styles.fallbackText}>
              The document resolved successfully, but no body content was available for rendering.
            </Text>
          </View>
        )}

        <View style={styles.attestationBlock}>
          <Text style={styles.attestationKicker}>Attestation</Text>
          <Text style={styles.attestationText}>
            Issued under the authority of {signAs}.
          </Text>
          <Text style={styles.attestationText}>Classification: {classification}</Text>
          <Text style={styles.attestationText}>Reference: {reference}</Text>
        </View>

        <View style={styles.footerStamp}>
          <Text style={styles.footerText}>© Abraham of London</Text>
          <Text style={styles.footerText}>Protocol Verified</Text>
          <Text style={styles.footerText}>Sovereign Registry</Text>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs={signAs}
        />
      </Page>
    </Document>
  );
};

export default InstitutionalBriefDocument;