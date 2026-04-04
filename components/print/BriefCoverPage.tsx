/* components/print/BriefCoverPage.tsx — V4.1 (PREMIUM INSTITUTIONAL COVER) */
import React from "react";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PDFRegistryEntry as PDFConfig } from "../../lib/pdf/registry";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";
import ForensicMarkLayer from "./ForensicMarkLayer";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type Props = {
  config: PDFConfig & {
    subtitle?: string;
    description?: string;
    institutionalId?: string;
    version?: string;
    date?: string;
    author?: string;
  };
  watermark: WatermarkPayload;
  qrCode?: string;
  classification: string;
  reference: string;
  subtitle?: string;
};

/* -------------------------------------------------------------------------- */
/* Premium Design Tokens — Quiet Luxury                                       */
/* -------------------------------------------------------------------------- */
const PAPER = "#FDFBF7";
const INK = "#1E1C1A";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const BRASS_DARK = "#7A6848";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const DARK_MIST = "#D9D0C0";
const PANEL = "#F9F6EF";
const CHIP_BG = "#FDFAF5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 46,
    paddingBottom: 42,
    paddingHorizontal: 48,
    color: INK,
    position: "relative",
  },

  outerFrame: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 1,
    borderColor: DARK_MIST,
  },

  innerFrame: {
    position: "absolute",
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderWidth: 0.5,
    borderColor: MIST,
  },

  topBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 46,
  },

  identityWrap: {
    maxWidth: 360,
  },

  identityKicker: {
    fontFamily: "Times-Italic",
    fontSize: 9.2,
    letterSpacing: 0.8,
    color: BRASS,
    marginBottom: 6,
  },

  identityName: {
    fontFamily: "Times-Bold",
    fontSize: 27,
    lineHeight: 1.08,
    letterSpacing: -0.2,
    color: INK,
  },

  identitySubline: {
    marginTop: 7,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.5,
    color: SILVER,
    maxWidth: 300,
  },

  classificationChip: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 108,
    alignItems: "center",
  },

  classificationText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.9,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: BRASS,
  },

  body: {
    flex: 1,
    marginTop: 16,
  },

  referenceLine: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: SILVER_LIGHT,
    marginBottom: 22,
  },

  title: {
    fontFamily: "Times-Bold",
    fontSize: 38,
    lineHeight: 1.07,
    letterSpacing: -0.35,
    color: INK,
    marginBottom: 18,
    maxWidth: 490,
  },

  titleRuleWrap: {
    marginBottom: 22,
  },

  titleRule: {
    width: 78,
    height: 1.5,
    backgroundColor: BRASS,
    marginBottom: 6,
  },

  titleRuleSub: {
    width: 34,
    height: 1,
    backgroundColor: BRASS_SOFT,
  },

  subtitle: {
    fontFamily: "Helvetica",
    fontSize: 10.8,
    lineHeight: 1.62,
    color: SILVER,
    maxWidth: 470,
    marginBottom: 30,
  },

  metadataPanel: {
    width: 372,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: MIST,
    paddingTop: 14,
    paddingBottom: 11,
    paddingHorizontal: 18,
  },

  metadataTopRule: {
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 8,
  },

  metadataPanelTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.9,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 11,
  },

  metadataRow: {
    flexDirection: "row",
    marginBottom: 9,
  },

  metadataKey: {
    width: 118,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SILVER,
  },

  metadataValue: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 8.55,
    lineHeight: 1.42,
    color: INK,
  },

  bottomBand: {
    borderTopWidth: 1,
    borderTopColor: MIST,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  bottomLeft: {
    maxWidth: 432,
  },

  bottomKicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 6,
  },

  bottomText: {
    fontFamily: "Helvetica",
    fontSize: 7.9,
    lineHeight: 1.46,
    color: SILVER,
  },

  qrWrap: {
    alignItems: "flex-end",
  },

  qrCaption: {
    fontFamily: "Helvetica",
    fontSize: 6.8,
    color: SILVER_LIGHT,
    letterSpacing: 0.35,
    marginBottom: 5,
  },

  qr: {
    width: 54,
    height: 54,
  },

  // Optional: Watermark overlay for cover
  watermarkOverlay: {
    position: "absolute",
    bottom: 40,
    right: 40,
    opacity: 0.03,
    transform: "rotate(-15deg)",
  },
});

/* -------------------------------------------------------------------------- */
/* Safe Utilities                                                             */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    const date = new Date(safeString(value));
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function deriveIssueDate(config: Props["config"]): string {
  const explicit = safeString(config.date);
  if (explicit) return explicit;

  const date = safeDate(config.date);
  if (date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function deriveVersion(config: Props["config"]): string {
  return safeString(config.version, "1.0.0");
}

function deriveTransmission(watermark: WatermarkPayload, config: Props["config"]): string {
  const metadata = watermark?.metadata as Record<string, unknown> | undefined;
  const aol = ((metadata?.aol as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;

  const traceId = safeString(aol.traceId);
  if (traceId) return traceId;

  const sig = safeString(aol.sig);
  if (sig) return sig;

  return safeString(config.institutionalId) || safeString(config.id).slice(0, 8) || "UNTRACKED";
}

function deriveAuthor(config: Props["config"]): string {
  return safeString(config.author, "Abraham of London");
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export const BriefCoverPage: React.FC<Props> = ({
  config,
  watermark,
  qrCode,
  classification,
  reference,
  subtitle,
}) => {
  const issueDate = deriveIssueDate(config);
  const version = deriveVersion(config);
  const transmission = deriveTransmission(watermark, config);
  const author = deriveAuthor(config);
  const displaySubtitle = subtitle || config.subtitle || config.description || "";

  return (
    <Page size="A4" style={styles.page}>
      {/* Frames */}
      <View style={styles.outerFrame} fixed />
      <View style={styles.innerFrame} fixed />
      
      {/* Forensic layer */}
      <ForensicMarkLayer watermark={watermark} mode="cover" />

      {/* Optional subtle watermark */}
      <View style={styles.watermarkOverlay} fixed>
        <Text style={{ fontFamily: "Times-Italic", fontSize: 42, color: BRASS }}>AOL</Text>
      </View>

      {/* Header */}
      <View style={styles.topBand}>
        <View style={styles.identityWrap}>
          <Text style={styles.identityKicker}>{author}</Text>
          <Text style={styles.identityName}>Institutional Briefing Series</Text>
          <Text style={styles.identitySubline}>
            Portfolio-controlled strategy, doctrine, intelligence, and operating papers
          </Text>
        </View>

        <View style={styles.classificationChip}>
          <Text style={styles.classificationText}>{classification}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.referenceLine}>Folio · {reference}</Text>
        <Text style={styles.title}>{config.title}</Text>

        <View style={styles.titleRuleWrap}>
          <View style={styles.titleRule} />
          <View style={styles.titleRuleSub} />
        </View>

        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}

        {/* Metadata Panel */}
        <View style={styles.metadataPanel}>
          <View style={styles.metadataTopRule} />
          <Text style={styles.metadataPanelTitle}>Control Metadata</Text>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Reference</Text>
            <Text style={styles.metadataValue}>{reference}</Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Issue Date</Text>
            <Text style={styles.metadataValue}>{issueDate}</Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Version</Text>
            <Text style={styles.metadataValue}>{version}</Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Transmission ID</Text>
            <Text style={styles.metadataValue}>{transmission}</Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Circulation</Text>
            <Text style={styles.metadataValue}>Controlled distribution within portfolio</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.bottomBand}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomKicker}>Institutional Notice</Text>
          <Text style={styles.bottomText}>
            This folio forms part of a governed portfolio. Circulation, derivative use,
            extraction, and onward handling remain subject to transmission trace and
            portfolio control standards.
          </Text>
        </View>

        {qrCode ? (
          <View style={styles.qrWrap}>
            <Text style={styles.qrCaption}>Verification</Text>
            <Image src={qrCode} style={styles.qr} />
          </View>
        ) : null}
      </View>
    </Page>
  );
};

export default BriefCoverPage;