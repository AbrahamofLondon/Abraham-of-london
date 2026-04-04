import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  View,
  Text,
} from "@react-pdf/renderer";

import type { PDFRegistryEntry as PDFConfig } from "../pdf/registry";
import type { WatermarkPayload } from "../intelligence/watermark-delegate";

import BriefCoverPage from "../../../components/print/BriefCoverPage";
import ForensicMarkLayer from "../../../components/print/ForensicMarkLayer";
import BriefHeaderBar from "../../../components/print/BriefHeaderBar";
import BriefFooterBar from "../../../components/print/BriefFooterBar";
import ExecutiveSummaryPanel from "../../../components/print/ExecutiveSummaryPanel";
import KeyJudgementsPanel from "../../../components/print/KeyJudgementsPanel";
import {
  renderBriefBody,
  extractExecutiveSummary,
  extractKeyJudgements,
} from "../renderers/renderBriefBody";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type LooseRecord = Record<string, unknown>;

type SourceMeta = {
  sourcePath?: string;
  sourceFolder?: string;
  sourceType?: string;
};

type ExpandedPDFConfig = PDFConfig & {
  id?: string;
  institutionalId?: string;
  title?: string;
  name?: string;
  slug?: string;
  type?: string;
  summary?: string;
  description?: string;
  outputPath?: string;
  tier?: string;
  isPremium?: boolean;
  hideTOC?: boolean;
  signAs?: string;
  subtitle?: string;
  hideExecutiveSummary?: boolean | string;
  hideKeyJudgements?: boolean | string;
  classification?: string;
  author?: string;
  keywords?: string[] | string;
  [key: string]: unknown;
};

type BriefDocumentProps = {
  config?: ExpandedPDFConfig;
  content?: string;
  summaryText?: string;
  watermark?: WatermarkPayload;
  qrCode?: string;
  frontmatter?: Record<string, unknown>;
  sourceMeta?: SourceMeta;
};

/* -------------------------------------------------------------------------- */
/* Design Tokens — Premium Print Aesthetic                                    */
/* -------------------------------------------------------------------------- */
const PAPER = "#FDFBF7";
const INK = "#1E1C1A";
const BRASS = "#9B8A6B";
const MIST = "#EDE8DE";
const SOFT = "#6B655A";
const PANEL = "#F9F6EF";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 56,
    paddingBottom: 52,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10.2,
    lineHeight: 1.58,
  },

  introBlock: {
    marginTop: 12,
  },

  sectionGap: {
    height: 16,
  },

  divider: {
    height: 1,
    backgroundColor: MIST,
    marginTop: 8,
    marginBottom: 14,
  },

  bodyWrap: {
    marginTop: 8,
  },

  appendixPage: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 56,
    paddingBottom: 52,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 9.6,
    lineHeight: 1.5,
  },

  appendixTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 12,
  },

  appendixRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: MIST,
  },

  appendixLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.4,
    color: BRASS,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  appendixValue: {
    fontSize: 9.2,
    color: SOFT,
    lineHeight: 1.45,
  },

  closingBlock: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: MIST,
  },

  closingTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 7,
  },

  closingText: {
    fontSize: 9,
    color: SOFT,
    lineHeight: 1.55,
  },

  fallbackBox: {
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
  },

  fallbackTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: BRASS,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },

  fallbackText: {
    fontSize: 9.2,
    color: SOFT,
    lineHeight: 1.55,
  },
});

/* -------------------------------------------------------------------------- */
/* Safe Utilities — Production Hardened                                       */
/* -------------------------------------------------------------------------- */
function isObject(value: unknown): value is LooseRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeBoolean(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    return lowered === "true" || lowered === "1" || lowered === "yes";
  }
  return false;
}

function safeConfig(config: unknown): LooseRecord {
  return isObject(config) ? config : {};
}

function mergeConfig(
  config: ExpandedPDFConfig | undefined,
  frontmatter: Record<string, unknown> | undefined
): LooseRecord {
  return {
    ...safeConfig(config),
    ...safeConfig(frontmatter),
  };
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    const result = safeString(value);
    if (result) return result;
  }
  return "";
}

function deriveWatermarkAol(watermark: WatermarkPayload | undefined): LooseRecord {
  if (!watermark || !isObject(watermark.metadata)) return {};
  const aol = watermark.metadata["aol"];
  return isObject(aol) ? aol : {};
}

function deriveClassification(
  config: LooseRecord,
  watermark: WatermarkPayload | undefined
): string {
  const aol = deriveWatermarkAol(watermark);
  const classification = pickFirstString(
    aol.classification,
    config.classification,
    config.tier,
    "PUBLIC"
  );
  return classification.toUpperCase();
}

function deriveReference(config: LooseRecord): string {
  return pickFirstString(
    config.institutionalId,
    config.id,
    config.slug,
    "UNFILED"
  );
}

function deriveTitle(config: LooseRecord): string {
  return pickFirstString(config.title, config.name, "Institutional Brief");
}

function deriveSubtitle(config: LooseRecord, summaryText?: string): string {
  return pickFirstString(
    config.subtitle,
    config.description,
    config.summary,
    summaryText,
    ""
  );
}

function normalizeContent(
  content: string | undefined,
  summaryText: string | undefined,
  config: LooseRecord
): string {
  const primary = safeString(content);
  if (primary) return primary;

  const summary = safeString(summaryText);
  if (summary) return summary;

  const configSummary = safeString(config.summary);
  if (configSummary) return configSummary;

  const description = safeString(config.description);
  if (description) return description;

  return "";
}

function compactWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildFallbackBody(title: string, subtitle: string, content: string): string {
  const intro = subtitle
    ? `${subtitle}\n\n`
    : `${title}\n\n`;

  return compactWhitespace(`${intro}${content || "No body content was available for this document."}`);
}

function deriveExecutiveSummaryBlock(
  config: LooseRecord,
  summaryText: string | undefined,
  resolvedContent: string
): string {
  const explicitSummary = pickFirstString(summaryText, config.summary, config.description);
  if (explicitSummary) return explicitSummary;
  return extractExecutiveSummary(resolvedContent);
}

function deriveKeywords(config: LooseRecord, title: string): string {
  const raw = config.keywords;

  if (Array.isArray(raw)) {
    const values = raw.map((item) => safeString(item)).filter(Boolean);
    if (values.length > 0) return values.join(", ");
  }

  const str = safeString(raw);
  if (str) return str;

  return `${title}, institutional brief, abraham of london`;
}

function buildAppendixRows(
  config: LooseRecord,
  watermark: WatermarkPayload | undefined,
  sourceMeta: SourceMeta | undefined
): Array<{ label: string; value: string }> {
  const aol = deriveWatermarkAol(watermark);
  const rows: Array<{ label: string; value: string }> = [];

  const reference = deriveReference(config);
  const classification = deriveClassification(config, watermark);
  const slug = safeString(config.slug);
  const route = pickFirstString(config.outputPath, aol.route);
  const traceId = pickFirstString(aol.traceId, watermark?.fingerprint);
  const signature = pickFirstString(aol.sig, "");
  const issuedAt = pickFirstString(watermark?.issuedAt, "");
  const sourcePath = pickFirstString(sourceMeta?.sourcePath, "");
  const sourceFolder = pickFirstString(sourceMeta?.sourceFolder, "");
  const sourceType = pickFirstString(sourceMeta?.sourceType, config.type);

  rows.push({ label: "Reference", value: reference });
  rows.push({ label: "Classification", value: classification });

  if (slug) rows.push({ label: "Slug", value: slug });
  if (route) rows.push({ label: "Route", value: route });
  if (sourceType) rows.push({ label: "Source Type", value: sourceType });
  if (sourceFolder) rows.push({ label: "Source Folder", value: sourceFolder });
  if (sourcePath) rows.push({ label: "Source Path", value: sourcePath });
  if (issuedAt) rows.push({ label: "Issued At", value: issuedAt });
  if (traceId) rows.push({ label: "Trace / Fingerprint", value: traceId });
  if (signature) rows.push({ label: "Signature", value: signature });

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Main Component — Production Safe                                           */
/* -------------------------------------------------------------------------- */
export const InstitutionalBriefDocument: React.FC<BriefDocumentProps> = ({
  config: configProp,
  content,
  summaryText,
  watermark = {
    fingerprint: "institutional",
    issuedAt: new Date().toISOString(),
    metadata: { aol: { classification: "PUBLIC" } },
  },
  qrCode,
  frontmatter,
  sourceMeta,
}) => {
  const mergedConfig = mergeConfig(configProp, frontmatter);

  const title = deriveTitle(mergedConfig);
  const subtitle = deriveSubtitle(mergedConfig, summaryText);
  const resolvedRawContent = normalizeContent(content, summaryText, mergedConfig);
  const resolvedContent = compactWhitespace(
    resolvedRawContent || buildFallbackBody(title, subtitle, "")
  );

  const classification = deriveClassification(mergedConfig, watermark);
  const reference = deriveReference(mergedConfig);
  const signAs = pickFirstString(mergedConfig.signAs, "The Architect");

  const hideExecutiveSummary = safeBoolean(mergedConfig.hideExecutiveSummary);
  const hideKeyJudgements = safeBoolean(mergedConfig.hideKeyJudgements);

  const executiveSummary = compactWhitespace(
    deriveExecutiveSummaryBlock(mergedConfig, summaryText, resolvedContent)
  );

  const keyJudgements = extractKeyJudgements(resolvedContent);
  const bodyNodes = renderBriefBody(resolvedContent);

  const pdfConfig: ExpandedPDFConfig = {
    ...(mergedConfig as ExpandedPDFConfig),
    title,
    subtitle,
    id: reference,
    institutionalId: pickFirstString(mergedConfig.institutionalId, reference),
    classification,
    outputPath: pickFirstString(mergedConfig.outputPath, ""),
  };

  const appendixRows = buildAppendixRows(mergedConfig, watermark, sourceMeta);
  const hasRenderableBody = Array.isArray(bodyNodes)
    ? bodyNodes.length > 0
    : Boolean(bodyNodes);

  return (
    <Document
      author={pickFirstString(mergedConfig.author, "Abraham of London")}
      title={title}
      subject={subtitle || title}
      creator="Abraham of London Briefing System"
      producer="Abraham of London"
      keywords={deriveKeywords(mergedConfig, title)}
      language="en-GB"
    >
      <BriefCoverPage
        config={pdfConfig as PDFConfig}
        watermark={watermark}
        qrCode={qrCode}
        classification={classification}
        reference={reference}
        subtitle={subtitle}
      />

      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />

        <BriefHeaderBar
          title={title}
          reference={reference}
          classification={classification}
        />

        <View style={styles.introBlock}>
          {!hideExecutiveSummary && executiveSummary ? (
            <>
              <ExecutiveSummaryPanel text={executiveSummary} />
              <View style={styles.sectionGap} />
            </>
          ) : null}

          {!hideKeyJudgements && keyJudgements.length > 0 ? (
            <>
              <KeyJudgementsPanel items={keyJudgements} />
              <View style={styles.sectionGap} />
            </>
          ) : null}

          <View style={styles.divider} />

          {hasRenderableBody ? (
            <View style={styles.bodyWrap}>{bodyNodes}</View>
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackTitle}>Body Unavailable</Text>
              <Text style={styles.fallbackText}>
                The document resolved successfully, but no structured body blocks
                were produced by the renderer. The content source may be sparse,
                malformed, or overly dependent on unsupported MDX components.
              </Text>
            </View>
          )}

          <View style={styles.closingBlock} wrap={false}>
            <Text style={styles.closingTitle}>Closing Note</Text>
            <Text style={styles.closingText}>
              This brief is issued as a structured institutional document. Where
              necessary, the record should be read alongside its source material,
              watermark trace, and routing metadata.
            </Text>
          </View>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs={signAs}
        />
      </Page>

      <Page size="A4" style={styles.appendixPage}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />

        <BriefHeaderBar
          title={`${title} — Record Appendix`}
          reference={reference}
          classification={classification}
        />

        <Text style={styles.appendixTitle}>Document Record</Text>

        <View>
          {appendixRows.map((row, index) => (
            <View key={`${row.label}-${index}`} style={styles.appendixRow}>
              <Text style={styles.appendixLabel}>{row.label}</Text>
              <Text style={styles.appendixValue}>{row.value}</Text>
            </View>
          ))}
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