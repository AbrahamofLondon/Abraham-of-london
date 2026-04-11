/* components/print/BriefCoverPage.tsx — V5.0
   ---------------------------------------------------------------------------
   PREMIUM INSTITUTIONAL COVER
   Rebuilt for stronger React-PDF stability, cleaner hierarchy,
   safer layout behaviour, and more disciplined luxury presentation.
   --------------------------------------------------------------------------- */

import React from "react";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PDFRegistryEntry as PDFConfig } from "../../lib/pdf/registry";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";
import ForensicMarkLayer from "./ForensicMarkLayer";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
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
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const PAPER = "#FDFBF7";
const INK = "#1E1C1A";
const INK_SOFT = "#595249";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const BRASS_DARK = "#7A6848";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const DARK_MIST = "#D9D0C0";
const PANEL = "#F9F6EF";
const CHIP_BG = "#FDFAF5";

/* -------------------------------------------------------------------------- */
/* Safety Helpers                                                             */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (value === null || value === undefined) return fallback;

  try {
    const stringified = String(value).trim();
    return stringified || fallback;
  } catch {
    return fallback;
  }
}

function clampText(value: unknown, maxLength: number, fallback = ""): string {
  const text = safeString(value, fallback);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function cleanPdfText(value: unknown, fallback = ""): string {
  return clampText(
    safeString(value, fallback)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[‐-‒–—]/g, "-")
      .replace(/\u00A0/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    1200,
    fallback,
  );
}

function formatDate(value: unknown): string {
  const raw = safeString(value);
  if (!raw) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function deriveIssueDate(config: Props["config"]): string {
  return formatDate(config.date);
}

function deriveVersion(config: Props["config"]): string {
  return cleanPdfText(config.version, "1.0.0");
}

function deriveTransmission(
  watermark: WatermarkPayload,
  config: Props["config"],
): string {
  const metadata = watermark?.metadata as Record<string, unknown> | undefined;
  const aol = (metadata?.aol as Record<string, unknown> | undefined) ?? {};

  const traceId = cleanPdfText(aol.traceId);
  if (traceId) return traceId;

  const sig = cleanPdfText(aol.sig);
  if (sig) return sig;

  const institutionalId = cleanPdfText(config.institutionalId);
  if (institutionalId) return institutionalId;

  const fallbackId = cleanPdfText(config.id).slice(0, 12).toUpperCase();
  return fallbackId || "UNTRACKED";
}

function deriveAuthor(config: Props["config"]): string {
  return cleanPdfText(config.author, "Abraham of London");
}

function deriveSubtitle(
  config: Props["config"],
  explicitSubtitle?: string,
): string {
  return cleanPdfText(
    explicitSubtitle ||
      config.subtitle ||
      config.description ||
      "A governed institutional briefing prepared for disciplined reading, executive interpretation, and controlled circulation.",
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 46,
    paddingBottom: 42,
    paddingHorizontal: 48,
    color: INK,
    position: "relative",
    fontFamily: "AoLInter",
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
    marginBottom: 42,
  },

  identityWrap: {
    maxWidth: 360,
  },

  identityKicker: {
    fontFamily: "AoLSerif",
    fontSize: 9.2,
    fontStyle: "italic",
    letterSpacing: 0.6,
    color: BRASS,
    marginBottom: 6,
  },

  identityName: {
    fontFamily: "AoLSerif",
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.08,
    color: INK,
  },

  identitySubline: {
    marginTop: 7,
    fontFamily: "AoLInter",
    fontSize: 8.8,
    lineHeight: 1.48,
    color: SILVER,
    maxWidth: 300,
  },

  classificationChip: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 116,
    alignItems: "center",
  },

  classificationText: {
    fontFamily: "AoLInter",
    fontSize: 7.6,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: BRASS_DARK,
  },

  body: {
    flex: 1,
    marginTop: 12,
  },

  referenceLine: {
    fontFamily: "AoLInter",
    fontSize: 7.6,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: SILVER_LIGHT,
    marginBottom: 20,
  },

  title: {
    fontFamily: "AoLSerif",
    fontSize: 35,
    fontWeight: 700,
    lineHeight: 1.08,
    color: INK,
    marginBottom: 16,
    maxWidth: 490,
  },

  titleRuleWrap: {
    marginBottom: 20,
  },

  titleRule: {
    width: 76,
    height: 1.4,
    backgroundColor: BRASS,
    marginBottom: 6,
  },

  titleRuleSub: {
    width: 32,
    height: 1,
    backgroundColor: BRASS_SOFT,
  },

  subtitle: {
    fontFamily: "AoLInter",
    fontSize: 10.4,
    lineHeight: 1.58,
    color: INK_SOFT,
    maxWidth: 470,
    marginBottom: 28,
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
    fontFamily: "AoLInter",
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 11,
  },

  metadataRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  metadataKey: {
    width: 118,
    fontFamily: "AoLInter",
    fontSize: 7.1,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: SILVER,
  },

  metadataValue: {
    flex: 1,
    fontFamily: "AoLInter",
    fontSize: 8.4,
    lineHeight: 1.4,
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
    fontFamily: "AoLInter",
    fontSize: 7.4,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 6,
  },

  bottomText: {
    fontFamily: "AoLInter",
    fontSize: 7.8,
    lineHeight: 1.44,
    color: SILVER,
  },

  qrWrap: {
    alignItems: "flex-end",
  },

  qrCaption: {
    fontFamily: "AoLInter",
    fontSize: 6.7,
    color: SILVER_LIGHT,
    letterSpacing: 0.3,
    marginBottom: 5,
  },

  qr: {
    width: 54,
    height: 54,
  },

  monogramWrap: {
    position: "absolute",
    right: 48,
    bottom: 78,
    opacity: 0.06,
  },

  monogram: {
    fontFamily: "AoLSerif",
    fontSize: 28,
    fontStyle: "italic",
    color: BRASS,
  },
});

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
  const displaySubtitle = deriveSubtitle(config, subtitle);

  const safeClassification = cleanPdfText(classification, "PUBLIC");
  const safeReference = cleanPdfText(reference, "UNFILED");
  const safeTitle = cleanPdfText(config.title, "Institutional Brief");
  const circulation = "Controlled distribution within portfolio";

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.outerFrame} fixed />
      <View style={styles.innerFrame} fixed />

      <ForensicMarkLayer watermark={watermark} mode="cover" />

      <View style={styles.monogramWrap} fixed>
        <Text style={styles.monogram}>AOL</Text>
      </View>

      <View style={styles.topBand}>
        <View style={styles.identityWrap}>
          <Text style={styles.identityKicker}>{author}</Text>
          <Text style={styles.identityName}>Institutional Briefing Series</Text>
          <Text style={styles.identitySubline}>
            Portfolio-controlled strategy, doctrine, intelligence, and operating papers.
          </Text>
        </View>

        <View style={styles.classificationChip}>
          <Text style={styles.classificationText}>{safeClassification}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.referenceLine}>Folio · {safeReference}</Text>

        <Text style={styles.title}>{safeTitle}</Text>

        <View style={styles.titleRuleWrap}>
          <View style={styles.titleRule} />
          <View style={styles.titleRuleSub} />
        </View>

        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}

        <View style={styles.metadataPanel}>
          <View style={styles.metadataTopRule} />
          <Text style={styles.metadataPanelTitle}>Control Metadata</Text>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataKey}>Reference</Text>
            <Text style={styles.metadataValue}>{safeReference}</Text>
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
            <Text style={styles.metadataValue}>{circulation}</Text>
          </View>
        </View>
      </View>

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