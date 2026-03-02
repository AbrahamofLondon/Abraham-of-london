// lib/pdf-templates/BriefDocument.tsx — PREMIUM PRODUCTION VERSION (SSOT, COMPILE-SAFE)
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { PDFRegistryEntry as PDFConfig } from "../pdf/registry";
import { formatMDXForPDF } from "../pdf/formatter";

// ============================================================================
// PALETTE (print-safe, conservative, premium)
// ============================================================================
const COLORS = {
  ink: "#0B0F17",
  muted: "#5B6472",
  rule: "#D9DEE7",
  paper: "#FFFFFF",
  panel: "#F6F8FB",
  gold: "#B8860B",
  charcoal: "#131A26",
} as const;

// ============================================================================
// STYLES (React-PDF: no external fonts; stick to built-ins)
// ============================================================================
const styles = StyleSheet.create({
  // ---------- Shared ----------
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingHorizontal: 54,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.rule,
    marginTop: 14,
    marginBottom: 18,
  },

  // ---------- Cover ----------
  coverPage: {
    paddingTop: 76,
    paddingBottom: 60,
    paddingHorizontal: 62,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  coverBrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  coverBrand: {
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: COLORS.charcoal,
    fontWeight: 700,
  },
  coverBadge: {
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COLORS.gold,
    fontWeight: 700,
  },
  coverTitle: {
    marginTop: 34,
    fontSize: 34,
    lineHeight: 1.15,
    fontFamily: "Times-Roman",
    fontWeight: 700,
    color: COLORS.ink,
  },
  coverSubtitle: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: COLORS.muted,
  },
  coverMetaPanel: {
    marginTop: 26,
    padding: 14,
    backgroundColor: COLORS.panel,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  coverMetaLabel: {
    width: 92,
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 700,
  },
  coverMetaValue: {
    flex: 1,
    fontSize: 9,
    color: COLORS.ink,
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
  },

  // ---------- Inside pages ----------
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
  },
  brandName: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.charcoal,
    fontWeight: 700,
  },
  docRef: {
    fontSize: 8,
    color: COLORS.muted,
  },
  tierChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: COLORS.charcoal,
    color: COLORS.paper,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  tierChipGold: {
    backgroundColor: COLORS.gold,
    color: COLORS.paper,
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
  },

  sectionKicker: {
    marginTop: 18,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.gold,
    fontWeight: 700,
  },

  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: "justify",
  },

  metaPanel: {
    marginTop: 18,
    padding: 14,
    backgroundColor: COLORS.panel,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  metaLabel: {
    width: 92,
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 700,
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
    color: COLORS.ink,
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  disclaimer: {
    marginTop: 6,
    fontSize: 6.5,
    color: "#7B8596",
    lineHeight: 1.35,
    textAlign: "center",
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

// ============================================================================
// MAIN
// ============================================================================
export interface BriefDocumentProps {
  config: PDFConfig;
  content?: string;
}

export const BriefDocument: React.FC<BriefDocumentProps> = ({ config, content }) => {
  const issuedDate = formatIssuedDate();

  const title = config.title || "Untitled Brief";
  const id = config.id || "unknown";

  const tierRaw = String((config as any).tier ?? (config as any).accessLevel ?? "public");
  const tier = normalizeTier(tierRaw);

  const category = String((config as any).category || "General Intelligence");
  const version = String((config as any).version || "1.0.0");
  const tags = Array.isArray((config as any).tags) ? (config as any).tags : [];

  const classification = tierLabel(tier);

  return (
    <Document
      title={`${title} | Abraham of London`}
      author="Abraham of London"
      subject={`Intelligence Brief: ${title}`}
      keywords={tags.join(", ")}
      creator="Abraham of London PDF Generator"
      producer="React-PDF"
    >
      {/* ========================= COVER PAGE ========================= */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverBrandRow}>
          <Text style={styles.coverBrand}>Abraham of London</Text>
          <Text style={styles.coverBadge}>{classification} FILE</Text>
        </View>

        <View style={styles.rule} />

        <Text style={styles.coverTitle}>{title}</Text>

        {config.description ? (
          <Text style={styles.coverSubtitle}>{String(config.description)}</Text>
        ) : (
          <Text style={styles.coverSubtitle}>
            Institutional intelligence brief formatted for distribution, annotation, and archival reference.
          </Text>
        )}

        <View style={styles.coverMetaPanel}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Reference</Text>
            <Text style={styles.coverMetaValue}>{String(id).toUpperCase()}</Text>
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
        </View>
      </Page>

      {/* ========================= CONTENT PAGE ========================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>Abraham of London</Text>
          <Text style={styles.docRef}>Ref: {String(id).toUpperCase()}</Text>
        </View>

        <View style={styles.rule} />

        <View style={[styles.tierChip, isGoldTier(tier) ? styles.tierChipGold : null]}>
          <Text>Classification: {classification}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {config.description ? <Text style={styles.subtitle}>{String(config.description)}</Text> : null}

        <Text style={styles.sectionKicker}>Executive Analysis</Text>
        {renderContent(content)}

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
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
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