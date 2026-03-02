// lib/pdf-templates/BriefDocument.tsx — PREMIUM PRODUCTION VERSION (LOCAL FONTS, COMPILE-SAFE)
// Abraham of London — Institutional Brief Template (React-PDF)
//
// FIXES INCLUDED (no excuses):
// ✅ Uses your LOCAL fonts under /public/fonts/optimized (no network)
// ✅ Safe font registration (exists checks + try/catch)
// ✅ React-PDF TS-safe styles (NO null/undefined in style arrays)
// ✅ Premium cover + disciplined hierarchy + print-safe palette
//
// NOTES:
// - React-PDF runs in Node during generation; we can read fonts from disk.
// - We DO NOT import external fonts. Offline = deterministic.

import fs from "fs";
import path from "path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

import type { PDFRegistryEntry as PDFConfig } from "../pdf/registry";
import { formatMDXForPDF } from "../pdf/formatter";

// ============================================================================
// LOCAL FONT REGISTRATION (OFFLINE, DETERMINISTIC)
// ============================================================================

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, "public", "fonts", "optimized");

function fontPath(file: string) {
  return path.join(FONT_DIR, file);
}

function registerLocalFonts() {
  // Guard: don’t crash builds if fonts move; fall back to built-ins.
  try {
    const interRegular = fontPath("Inter-Regular.ttf");
    const interSemiBold = fontPath("Inter-SemiBold.ttf");
    const interBold = fontPath("Inter_18pt-Bold.ttf"); // fallback to one of your many Inter variants
    const editorialWoff2 = fontPath("PPEditorialNew-Regular-BF644b214ff145f.woff2");
    const geistMono = fontPath("GeistMono-Regular.woff2");

    // Inter (body)
    if (fs.existsSync(interRegular)) {
      Font.register({
        family: "AoLInter",
        fonts: [
          { src: interRegular, fontWeight: 400 },
          ...(fs.existsSync(interSemiBold) ? [{ src: interSemiBold, fontWeight: 600 as any }] : []),
          ...(fs.existsSync(interBold) ? [{ src: interBold, fontWeight: 700 as any }] : []),
        ],
      });
    }

    // Editorial (headings) — WOFF2 supported in most React-PDF setups; if your env fails, it silently falls back.
    if (fs.existsSync(editorialWoff2)) {
      Font.register({
        family: "AoLEditorial",
        fonts: [{ src: editorialWoff2, fontWeight: 400 }],
      });
    }

    // Mono (code)
    if (fs.existsSync(geistMono)) {
      Font.register({
        family: "AoLMono",
        fonts: [{ src: geistMono, fontWeight: 400 }],
      });
    }
  } catch {
    // Silent by design — we never fail builds for typography.
  }
}

// Register once on module import (safe for Node workers)
registerLocalFonts();

// ============================================================================
// PALETTE (print-safe, conservative, premium)
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
  slate: "#243042",
} as const;

// ============================================================================
// STYLES (NO EXTERNAL FONTS; prefer local; fallback to built-ins)
// ============================================================================
const styles = StyleSheet.create({
  // ---------- Shared ----------
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingHorizontal: 54,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    // If AoLInter wasn't registered, React-PDF uses built-in Helvetica.
    fontFamily: "AoLInter",
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
    lineHeight: 1.10,
    // If AoLEditorial isn't available, fall back to Times-Roman look.
    fontFamily: "AoLEditorial",
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

  // ---------- Inside pages ----------
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
    fontFamily: "AoLEditorial",
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

  // Optional mono style for formatter consumers
  mono: {
    fontFamily: "AoLMono",
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
// HELPERS (safe + deterministic)
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

// ============================================================================
// MAIN
// ============================================================================
export interface BriefDocumentProps {
  config: PDFConfig;
  content?: string;
}

export const BriefDocument: React.FC<BriefDocumentProps> = ({ config, content }) => {
  const issuedDate = formatIssuedDate();

  const title = safeString((config as any).title, "Untitled Brief");
  const id = safeString((config as any).id, "unknown");

  const tier = normalizeTier(safeString((config as any).tier ?? (config as any).accessLevel, "public"));
  const classification = tierLabel(tier);

  const category = safeString((config as any).category, "General Intelligence");
  const version = safeString((config as any).version, "1.0.0");
  const tags = safeStringArray((config as any).tags);

  // ✅ TS-safe: NO undefined/null in style arrays
  const tierChipStyle = isGoldTier(tier) ? [styles.tierChip, styles.tierChipGold] : styles.tierChip;

  const coverSubtitle =
    safeString((config as any).description).trim() ||
    "Institutional intelligence brief formatted for distribution, annotation, and archival reference.";

  const subject = `Intelligence Brief: ${title}`;
  const keywords = tags.length ? tags.join(", ") : "abraham of london, intelligence, brief";

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
        </View>
      </Page>

      {/* ========================= CONTENT PAGE ========================= */}
      <Page size="A4" style={styles.page}>
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