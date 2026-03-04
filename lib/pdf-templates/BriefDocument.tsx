// lib/pdf-templates/BriefDocument.tsx — PREMIUM PRODUCTION VERSION (WATERMARK-READY, COMPILE-SAFE)

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { PDFRegistryEntry as PDFConfig } from "../pdf/registry";
import { formatMDXForPDF } from "../pdf/formatter";

type WatermarkPayload = {
  visibleFooter: string;
  overlayToken: string;
  overlayHints?: {
    rotationDeg?: number;
    opacity?: number;
    fontSize?: number;
    letterSpacing?: number;
  };
  metadata?: Record<string, unknown>;
};

// ============================================================================
// PALETTE
// ============================================================================
const COLORS = {
  ink: "#0B0F17",
  inkSoft: "#131A26",
  muted: "#5B6472",
  muted2: "#7B8596",
  rule: "#D9DEE7",
  paper: "#FFFFFF",
  panel: "#F6F8FB",
  panel2: "#EEF2F7",
  gold: "#B8860B",
  charcoal: "#131A26",
} as const;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingHorizontal: 54,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "AoLInter",
  },

  // Watermark overlay layer (absolute)
  overlayWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },

  // We render repeated lines; engine decides actual opacity via color/alpha limitations,
  // so we keep it subtle by using muted color and small font.
  overlayLine: {
    fontFamily: "AoLInter",
    fontSize: 10,
    letterSpacing: 1.6,
    color: COLORS.rule,
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.rule,
    marginTop: 14,
    marginBottom: 18,
  },

  coverPage: {
    paddingTop: 76,
    paddingBottom: 60,
    paddingHorizontal: 62,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "AoLInter",
  },

  coverBrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },

  coverBrand: {
    fontSize: 12.2,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: COLORS.charcoal,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  coverBadge: {
    fontSize: 8,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: COLORS.gold,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  coverTitle: {
    marginTop: 34,
    fontSize: 38,
    lineHeight: 1.1,
    fontFamily: "Times-Roman",
    color: COLORS.ink,
  },

  coverSubtitle: {
    marginTop: 12,
    fontSize: 12.6,
    lineHeight: 1.55,
    color: COLORS.muted,
    fontFamily: "AoLInter",
  },

  coverCallout: {
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.panel,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },

  coverCalloutKicker: {
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 700,
    marginBottom: 6,
    fontFamily: "AoLInter",
  },

  coverCalloutText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.inkSoft,
    fontFamily: "AoLInter",
  },

  coverMetaPanel: {
    marginTop: 18,
    padding: 14,
    backgroundColor: COLORS.panel2,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },

  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  coverMetaLabel: {
    width: 96,
    fontSize: 8,
    letterSpacing: 1.15,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  coverMetaValue: {
    flex: 1,
    fontSize: 9,
    color: COLORS.ink,
    fontFamily: "AoLInter",
  },

  coverFooter: {
    position: "absolute",
    left: 62,
    right: 62,
    bottom: 54,
  },

  coverFooterRule: {
    height: 1,
    backgroundColor: COLORS.rule,
    marginBottom: 10,
  },

  coverFooterText: {
    fontSize: 8,
    color: COLORS.muted,
    fontFamily: "AoLInter",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
  },

  brandName: {
    fontSize: 11.4,
    letterSpacing: 2.0,
    textTransform: "uppercase",
    color: COLORS.charcoal,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  docRef: {
    fontSize: 8,
    color: COLORS.muted,
    fontFamily: "AoLInter",
  },

  tierChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: COLORS.charcoal,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 2,
  },

  tierChipGold: {
    backgroundColor: COLORS.gold,
  },

  tierChipText: {
    fontSize: 8,
    letterSpacing: 1.25,
    textTransform: "uppercase",
    fontWeight: 700,
    color: COLORS.paper,
    fontFamily: "AoLInter",
  },

  title: {
    marginTop: 16,
    fontSize: 22,
    lineHeight: 1.18,
    fontFamily: "Times-Roman",
    color: COLORS.ink,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 1.55,
    color: COLORS.muted,
    fontFamily: "AoLInter",
  },

  sectionKicker: {
    marginTop: 18,
    fontSize: 9,
    letterSpacing: 1.55,
    textTransform: "uppercase",
    color: COLORS.gold,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  contentPanel: {
    marginTop: 10,
    paddingTop: 12,
  },

  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: "justify",
    color: COLORS.inkSoft,
    fontFamily: "AoLInter",
  },

  mono: {
    fontFamily: "Courier",
    fontSize: 9.8,
    lineHeight: 1.45,
    color: COLORS.inkSoft,
  },

  metaPanel: {
    marginTop: 18,
    padding: 14,
    backgroundColor: COLORS.panel2,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },

  metaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  metaLabel: {
    width: 96,
    fontSize: 8,
    letterSpacing: 1.15,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 700,
    fontFamily: "AoLInter",
  },

  metaValue: {
    flex: 1,
    fontSize: 9,
    color: COLORS.ink,
    fontFamily: "AoLInter",
  },

  footer: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 34,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },

  footerText: {
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    fontFamily: "AoLInter",
  },

  watermarkFooter: {
    marginTop: 6,
    fontSize: 6.2,
    color: COLORS.muted2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "AoLInter",
  },

  disclaimer: {
    marginTop: 6,
    fontSize: 6.5,
    color: COLORS.muted2,
    lineHeight: 1.35,
    textAlign: "center",
    fontFamily: "AoLInter",
  },
});

// ============================================================================
// HELPERS
// ============================================================================
function formatIssuedDate(): string {
  try {
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

function normalizeTier(raw?: string) {
  const t = String(raw || "public").trim().toLowerCase();
  return t === "free" ? "public" : t;
}

function tierLabel(tier: string) {
  const t = normalizeTier(tier);
  if (t === "public") return "PUBLIC";
  if (t === "member") return "MEMBER";
  if (t === "inner-circle") return "INNER CIRCLE";
  if (t === "architect") return "ARCHITECT";
  if (t === "owner") return "OWNER";
  return t.toUpperCase();
}

function isGoldTier(tier: string) {
  const t = normalizeTier(tier);
  return t === "inner-circle" || t === "architect" || t === "owner";
}

function safeString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v == null) return fallback;
  try {
    return String(v);
  } catch {
    return fallback;
  }
}

function safeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => safeString(x)).filter(Boolean);
  return [];
}

function renderContent(content: string | undefined) {
  if (!content || content.trim().length === 0) {
    return (
      <View>
        <Text style={styles.paragraph}>
          Analysis pending for this asset. Please consult the digital terminal.
        </Text>
      </View>
    );
  }

  try {
    return formatMDXForPDF(content, styles);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PDF] MDX formatting failed:", error);
    return (
      <View>
        <Text style={styles.paragraph}>
          Content formatting encountered an issue. Please refer to the original brief.
        </Text>
      </View>
    );
  }
}

function renderOverlay(watermark?: WatermarkPayload) {
  if (!watermark?.overlayToken) return null;

  // Create a subtle repeated pattern (no loops so big that layout slows)
  const lines = Array.from({ length: 10 }).map((_, i) => `${watermark.overlayToken} • ${i + 1}`);

  return (
    <View style={styles.overlayWrap}>
      <View
        style={{
          position: "absolute",
          left: -80,
          top: 120,
          transform: `rotate(${watermark.overlayHints?.rotationDeg ?? -28}deg)`,
        }}
      >
        {lines.map((t, idx) => (
          <Text
            key={idx}
            style={{
              ...styles.overlayLine,
              fontSize: watermark.overlayHints?.fontSize ?? 10,
              letterSpacing: watermark.overlayHints?.letterSpacing ?? 1.6,
              // opacity is not consistently supported; we keep it light via color + small text
              marginBottom: 18,
            }}
          >
            {t}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export interface BriefDocumentProps {
  config: PDFConfig;
  content?: string;
  watermark?: WatermarkPayload;
}

export const BriefDocument: React.FC<BriefDocumentProps> = ({ config, content, watermark }) => {
  const issuedDate = formatIssuedDate();

  const title = safeString((config as any).title, "Untitled Brief");
  const id = safeString((config as any).id, "unknown");

  const tier = normalizeTier(safeString((config as any).tier ?? (config as any).accessLevel, "public"));
  const classification = tierLabel(tier);

  const category = safeString((config as any).category, "General Intelligence");
  const version = safeString((config as any).version, "1.0.0");
  const tags = safeStringArray((config as any).tags);

  const tierChipStyle = isGoldTier(tier) ? [styles.tierChip, styles.tierChipGold] : styles.tierChip;

  const coverSubtitle =
    safeString((config as any).description).trim() ||
    "Institutional intelligence brief formatted for distribution, annotation, and archival reference.";

  const subject = `Intelligence Brief: ${title}`;
  const keywordsBase = tags.length ? tags.join(", ") : "abraham of london, intelligence, brief";
  const keywords = watermark?.metadata?.keywords
    ? `${String(watermark.metadata.keywords)}, ${keywordsBase}`
    : keywordsBase;

  return (
    <Document
      title={`${title} | Abraham of London`}
      author="Abraham of London"
      subject={subject}
      keywords={keywords}
      creator="Abraham of London PDF Generator"
      producer="React-PDF"
    >
      {/* ========================= COVER PAGE ========================= */}
      <Page size="A4" style={styles.coverPage}>
        {renderOverlay(watermark)}

        <View style={styles.coverBrandRow}>
          <Text style={styles.coverBrand}>Abraham of London</Text>
          <Text style={styles.coverBadge}>{classification} FILE</Text>
        </View>

        <View style={styles.rule} />

        <Text style={styles.coverTitle}>{title}</Text>
        <Text style={styles.coverSubtitle}>{coverSubtitle}</Text>

        <View style={styles.coverCallout}>
          <Text style={styles.coverCalloutKicker}>Purpose</Text>
          <Text style={styles.coverCalloutText}>
            This brief exists to reduce drift, clarify standards, and compress decision-time under pressure.
          </Text>
        </View>

        <View style={styles.coverMetaPanel}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Reference</Text>
            <Text style={styles.coverMetaValue}>{id.toUpperCase()}</Text>
          </View>

          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Issued</Text>
            <Text style={styles.coverMetaValue}>{issuedDate}</Text>
          </View>

          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Category</Text>
            <Text style={styles.coverMetaValue}>{category}</Text>
          </View>

          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Version</Text>
            <Text style={styles.coverMetaValue}>{version}</Text>
          </View>

          {tags.length > 0 ? (
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Tags</Text>
              <Text style={styles.coverMetaValue}>{tags.join(" • ")}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.coverFooter}>
          <View style={styles.coverFooterRule} />
          <Text style={styles.coverFooterText}>
            © 2026 Abraham of London • Proprietary & Confidential • abrahamoflondon.org
          </Text>
          {watermark?.visibleFooter ? (
            <Text style={styles.watermarkFooter}>{watermark.visibleFooter}</Text>
          ) : null}
        </View>
      </Page>

      {/* ========================= CONTENT PAGE ========================= */}
      <Page size="A4" style={styles.page}>
        {renderOverlay(watermark)}

        <View style={styles.header}>
          <Text style={styles.brandName}>Abraham of London</Text>
          <Text style={styles.docRef}>Ref: {id.toUpperCase()}</Text>
        </View>

        <View style={styles.rule} />

        <View style={tierChipStyle}>
          <Text style={styles.tierChipText}>Classification: {classification}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {safeString((config as any).description).trim() ? (
          <Text style={styles.subtitle}>{safeString((config as any).description)}</Text>
        ) : null}

        <Text style={styles.sectionKicker}>Executive Analysis</Text>

        <View style={styles.contentPanel}>{renderContent(content)}</View>

        <View style={styles.metaPanel}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issued</Text>
            <Text style={styles.metaValue}>{issuedDate}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{category}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Version</Text>
            <Text style={styles.metaValue}>{version} (Stable)</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Classification</Text>
            <Text style={styles.metaValue}>{classification}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>© 2026 Abraham of London • Proprietary & Confidential</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>

          {watermark?.visibleFooter ? (
            <Text style={styles.watermarkFooter}>{watermark.visibleFooter}</Text>
          ) : null}

          <Text style={styles.disclaimer}>
            This document contains informed analysis for informational purposes only and does not constitute legal,
            financial, or professional advice.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BriefDocument;