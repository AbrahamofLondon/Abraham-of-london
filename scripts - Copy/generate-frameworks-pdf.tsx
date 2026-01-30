/* scripts/generate-frameworks-pdf.tsx
 *
 * Abraham of London — Canon Frameworks PDF Generator (Institutional / McKinsey polish)
 * -------------------------------------------------------------------------------
 * NOW INCLUDES:
 * - Full PRIVATE dossiers (private/restricted only by default)
 * - 1-page TEASERS (safe by default: generated to private storage)
 * - Optional publish of teasers to /public ONLY if ALLOW_PUBLIC_TEASERS=true
 *
 * GATING RULES (hard):
 * - Private/Restricted full dossiers are NEVER written to /public
 * - Teasers default to PRIVATE storage (app preview)
 * - Public teaser publishing is an explicit opt-in via ENV
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Line,
} from "@react-pdf/renderer";

// FIX: Import the FRAMEWORKS data correctly - adjust path as needed
const FRAMEWORKS_DATA_PATH = path.join(process.cwd(), 'lib', 'resources', 'strategic-frameworks.ts');
let FRAMEWORKS: any[] = [];

// Try to load frameworks data dynamically
try {
  if (fsSync.existsSync(FRAMEWORKS_DATA_PATH)) {
    const { FRAMEWORKS: loadedFrameworks } = await import(FRAMEWORKS_DATA_PATH);
    FRAMEWORKS = loadedFrameworks || [];
  } else {
    console.warn(`⚠️ Framework data not found at ${FRAMEWORKS_DATA_PATH}`);
    // Fallback: create sample framework data for testing
    FRAMEWORKS = [
      {
        slug: "legacy-architecture-canvas",
        title: "Legacy Architecture Canvas",
        tier: ["architect"],
        tag: "framework",
        oneLiner: "A strategic framework for designing and building enduring legacies",
        operatingLogic: [
          {
            title: "Sovereign Thesis",
            body: "Define your core legacy statement and guiding principles"
          },
          {
            title: "Capital Matrix",
            body: "Map and allocate your seven capitals for maximum impact"
          }
        ]
      }
    ];
  }
} catch (error) {
  console.error(`❌ Failed to load frameworks data: ${error}`);
  FRAMEWORKS = [];
}

type Framework = {
  slug: string;
  title: string;
  tier: string | string[];
  tag?: string;
  oneLiner?: string;
  operatingLogic?: Array<{title: string, body: string}>;
};

// ----------------------------------------------------------------------------
// Paths
// ----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// Policy
// ----------------------------------------------------------------------------
type DistributionPolicy = "app-preview-only" | "in-house-only" | "public-teaser";
type Classification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

const ACCESS_POLICY = {
  // primary policy for full dossiers (private only)
  generationMode: "private-only" as "private-only" | "all",

  // tiers considered “private”
  privateTiers: ["private", "restricted"] as const,

  // distribution stamps
  fullDistribution: "app-preview-only" as DistributionPolicy,

  // teaser behavior
  generateTeasers: true,
  teaserDistribution: "app-preview-only" as DistributionPolicy,

  // IMPORTANT: public teasers are OFF by default
  // Enable only if you truly intend to publish 1-page abstracts to /public.
  allowPublicTeasers: process.env.ALLOW_PUBLIC_TEASERS === "true",
};

// ----------------------------------------------------------------------------
// Premium Config
// ----------------------------------------------------------------------------
const PREMIUM_CONFIG = {
  COMPANY: {
    name: "Abraham of London",
    legalName: "Abraham of London Ltd.",
    website: "https://abrahamoflondon.com",
    email: "strategic@abrahamoflondon.com",
    phone: "+44 (0)20 7123 4567",
    address: "28 St James's Square, London SW1Y 4JH, United Kingdom",
    vat: "GB 123 4567 89",
    companyNumber: "01234567",
    tagline: "Institutional Strategy & Leadership Development",
    motto: "Build What Endures",
  },

  BRANDING: {
    logoPath: path.join(__dirname, "../public/assets/brand/logo.png"),
    watermarkPath: path.join(__dirname, "../public/assets/brand/watermark.png"),
    sealPath: path.join(__dirname, "../public/assets/brand/seal.png"),
  },

  DESIGN: {
    colors: {
      primary: {
        main: "#0A192F",
        light: "#172A46",
        dark: "#051225",
        contrast: "#FFFFFF",
      },
      secondary: {
        main: "#C9A96A",
        light: "#E4CFA9",
        dark: "#B08C38",
        contrast: "#0A192F",
      },
      accent: {
        success: "#2E7D32",
        warning: "#F57C00",
        danger: "#C62828",
        info: "#1565C0",
      },
      neutral: {
        white: "#FFFFFF",
        paper: "#FAF9F7",
        light: "#F0F0F0",
        medium: "#9E9E9E",
        dark: "#424242",
        black: "#212121",
      },
    },

    typography: {
      fontFamilies: {
        serif: "AoLSerif",
        sans: "AoLSans",
        mono: "AoLMono",
        display: "AoLDisplay",
      },
      fontSize: {
        display: 48,
        h1: 34,
        h2: 26,
        h3: 20,
        h4: 13,
        body: 11,
        small: 9,
        micro: 7,
        caption: 8,
      },
      lineHeight: {
        tight: 1.15,
        normal: 1.55,
        relaxed: 1.8,
      },
      letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 1.5,
        widest: 3,
      },
    },

    layout: {
      pageSize: "A4" as const,
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
      },
      gutter: 18,
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
        xlarge: 22,
      },
    },
  },

  OUTPUT: {
    // PRIVATE ROOT (safe by default)
    privateRoot: path.join(process.cwd(), "private_storage", "frameworks"),
    directories: {
      frameworks: path.join(process.cwd(), "private_storage", "frameworks", "frameworks"),
      collections: path.join(process.cwd(), "private_storage", "frameworks", "collections"),
      teasers: path.join(process.cwd(), "private_storage", "frameworks", "teasers"),
      meta: path.join(process.cwd(), "private_storage", "frameworks", "meta"),
    },

    // OPTIONAL public teaser directory (only used if allowPublicTeasers === true)
    publicTeasersDir: path.join(process.cwd(), "public", "assets", "frameworks", "teasers"),

    naming: {
      framework: (slug: string) => `AoL-${slug.toUpperCase()}-FRAMEWORK-PRIVATE.pdf`,
      collection: (date: string) => `AoL-PRIVATE-FRAMEWORKS-COLLECTION-${date}.pdf`,
      teaser: (slug: string) => `AoL-${slug.toUpperCase()}-FRAMEWORK-TEASER.pdf`,
      summary: "AoL-FRAMEWORKS-SUMMARY.txt",
      manifest: "AoL-MANIFEST.json",
    },
  },
};

// ----------------------------------------------------------------------------
// Fonts (fail-soft)
// ----------------------------------------------------------------------------
function registerPremiumFonts(): void {
  try {
    Font.register({
      family: "AoLSerif",
      fonts: [
        { src: "Times-Roman" },
        { src: "Times-Bold", fontWeight: "bold" },
        { src: "Times-Italic", fontStyle: "italic" },
        { src: "Times-BoldItalic", fontWeight: "bold", fontStyle: "italic" },
      ],
    });

    Font.register({
      family: "AoLSans",
      fonts: [
        { src: "Helvetica" },
        { src: "Helvetica-Bold", fontWeight: "bold" },
        { src: "Helvetica-Oblique", fontStyle: "italic" },
        { src: "Helvetica-BoldOblique", fontWeight: "bold", fontStyle: "italic" },
      ],
    });

    Font.register({ family: "AoLMono", src: "Courier" });
    Font.register({ family: "AoLDisplay", src: "Times-Bold", fontWeight: "bold" });

    // eslint-disable-next-line no-console
    console.log("✅ Premium fonts registered");
  } catch {
    // eslint-disable-next-line no-console
    console.warn("⚠️ Font registration failed, using system defaults");
  }
}

// ----------------------------------------------------------------------------
// Utils
// ----------------------------------------------------------------------------
class PremiumUtils {
  static formatDate(date: Date): string {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static formatDateTime(date: Date): string {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  static generateDocumentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `AOL-${timestamp}-${random}`.toUpperCase();
  }

  static checksum8(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  }

  static sha256(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async writeFileWithBackup(filePath: string, content: Buffer | string): Promise<void> {
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);

    if (fsSync.existsSync(filePath)) {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      await fs.copyFile(filePath, backupPath);
    }
    await fs.writeFile(filePath, content);
  }

  static async copyFileSafe(src: string, dst: string): Promise<void> {
    await this.ensureDirectory(path.dirname(dst));
    await fs.copyFile(src, dst);
  }

  static normalizeTierList(tier: any): string[] {
    if (!tier) return ["public"];
    if (Array.isArray(tier)) return tier.map(String);
    return [String(tier)];
  }

  static isPrivateFramework(framework: Framework): boolean {
    const tiers = this.normalizeTierList((framework as any).tier);
    return tiers.some((t) => ACCESS_POLICY.privateTiers.includes(t.toLowerCase() as any));
  }

  static tierLabel(framework: Framework): string {
    const tiers = this.normalizeTierList((framework as any).tier);
    if (tiers.some((t) => t.toLowerCase() === "restricted")) return "RESTRICTED";
    if (tiers.some((t) => t.toLowerCase() === "private")) return "CONFIDENTIAL";
    return "INTERNAL";
  }

  static resolveClassification(framework: Framework): Classification {
    const label = this.tierLabel(framework);
    if (label === "RESTRICTED") return "RESTRICTED";
    if (label === "CONFIDENTIAL") return "CONFIDENTIAL";
    return "INTERNAL";
  }

  static tierColor(classification: Classification): string {
    const c = PREMIUM_CONFIG.DESIGN.colors;
    switch (classification) {
      case "RESTRICTED":
        return c.accent.danger;
      case "CONFIDENTIAL":
        return c.accent.warning;
      case "INTERNAL":
        return c.accent.info;
      default:
        return c.neutral.medium;
    }
  }
}

// ----------------------------------------------------------------------------
// Styles (react-pdf safe)
// ----------------------------------------------------------------------------
const PremiumStyles = {
  document: StyleSheet.create({
    root: {
      fontFamily: "AoLSans",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.body,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.normal,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.black,
    },
  }),

  cover: StyleSheet.create({
    page: {
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.primary.main,
      padding: 0,
      position: "relative",
      height: "100%",
    },
    content: {
      position: "relative",
      paddingHorizontal: PREMIUM_CONFIG.DESIGN.layout.margins.left,
      paddingTop: 140,
      paddingBottom: 80,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    brandBadge: {
      fontFamily: "AoLSans",
      fontSize: 8,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.widest,
      color: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      marginBottom: 14,
      fontWeight: "bold",
      backgroundColor: "rgba(255,255,255,0.10)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.small,
      alignSelf: "flex-start",
    },
    mainTitle: {
      fontFamily: "AoLDisplay",
      fontSize: 54,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.white,
      lineHeight: 1.05,
      marginBottom: 16,
      fontWeight: "bold",
    },
    subtitle: {
      fontFamily: "AoLSerif",
      fontSize: 22,
      color: PREMIUM_CONFIG.DESIGN.colors.secondary.light,
      fontStyle: "italic",
      marginBottom: 24,
      lineHeight: 1.35,
    },
    accentLine: {
      width: 150,
      height: 4,
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      marginBottom: 28,
      borderRadius: 2,
    },
    descriptionBox: {
      backgroundColor: "rgba(255,255,255,0.10)",
      padding: 24,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.large,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      maxWidth: 460,
    },
    description: {
      fontFamily: "AoLSerif",
      fontSize: 14,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.white,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.relaxed,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
    },
    metaPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.large,
      fontSize: 9,
      fontFamily: "AoLSans",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.white,
      marginRight: 10,
    },
    metaText: {
      fontFamily: "AoLSans",
      fontSize: 9,
      color: "rgba(255,255,255,0.80)",
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
      marginRight: 14,
    },
    distributionBadge: {
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.large,
      fontSize: 9,
      fontFamily: "AoLSans",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.widest,
      alignSelf: "flex-start",
      marginTop: 14,
    },
    footer: {
      position: "relative",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.18)",
      paddingTop: 18,
      marginTop: 30,
    },
    footerText: {
      fontFamily: "AoLSans",
      fontSize: 8,
      color: "rgba(255,255,255,0.70)",
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
    },
    serialNumber: {
      fontFamily: "AoLMono",
      fontSize: 7,
      color: "rgba(255,255,255,0.55)",
      letterSpacing: 1,
    },
  }),

  page: StyleSheet.create({
    container: {
      paddingTop: PREMIUM_CONFIG.DESIGN.layout.margins.top,
      paddingBottom: PREMIUM_CONFIG.DESIGN.layout.margins.bottom,
      paddingHorizontal: PREMIUM_CONFIG.DESIGN.layout.margins.left,
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.neutral.paper,
      position: "relative",
      minHeight: "100%",
    },
    watermark: {
      position: "absolute",
      top: 310,
      left: 40,
      fontSize: 64,
      fontFamily: "AoLDisplay",
      fontWeight: "bold",
      color: "rgba(10, 25, 47, 0.035)",
      textTransform: "uppercase",
      letterSpacing: 8,
      transform: [{ rotate: "-35deg" }],
    },
    header: {
      position: "absolute",
      top: 36,
      left: PREMIUM_CONFIG.DESIGN.layout.margins.left,
      right: PREMIUM_CONFIG.DESIGN.layout.margins.right,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: PREMIUM_CONFIG.DESIGN.colors.neutral.light,
    },
    headerLeft: {
      flexDirection: "column",
    },
    headerEyebrow: {
      fontFamily: "AoLSans",
      fontSize: 7,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.widest,
      color: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      marginBottom: 4,
      fontWeight: "bold",
    },
    headerTitle: {
      fontFamily: "AoLSerif",
      fontSize: 11,
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
      fontWeight: "bold",
    },
    headerRight: {
      fontFamily: "AoLMono",
      fontSize: 7,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.medium,
      textAlign: "right",
    },
    content: {
      marginTop: 88,
      marginBottom: 58,
    },
    footer: {
      position: "absolute",
      bottom: 36,
      left: PREMIUM_CONFIG.DESIGN.layout.margins.left,
      right: PREMIUM_CONFIG.DESIGN.layout.margins.right,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: PREMIUM_CONFIG.DESIGN.colors.neutral.light,
    },
    footerBrand: {
      fontFamily: "AoLSans",
      fontSize: 7,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.medium,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
    },
    pageNumber: {
      fontFamily: "AoLSans",
      fontSize: 8,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.dark,
    },
    copyright: {
      fontFamily: "AoLSans",
      fontSize: 6,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.medium,
      textAlign: "center",
    },
  }),

  typography: StyleSheet.create({
    h1: {
      fontFamily: "AoLDisplay",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.h1,
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
      marginBottom: 18,
      fontWeight: "bold",
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.tight,
    },
    h2: {
      fontFamily: "AoLDisplay",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.h2,
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
      marginTop: 28,
      marginBottom: 16,
      fontWeight: "bold",
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.tight,
    },
    h3: {
      fontFamily: "AoLSerif",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.h3,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.black,
      marginTop: 22,
      marginBottom: 12,
      fontWeight: "bold",
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.tight,
    },
    lead: {
      fontFamily: "AoLSerif",
      fontSize: 13,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.relaxed,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.dark,
      marginBottom: 18,
      fontStyle: "italic",
    },
    body: {
      fontFamily: "AoLSans",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.body,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.normal,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.black,
      marginBottom: 12,
      textAlign: "justify",
    },
    small: {
      fontFamily: "AoLSans",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.small,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.normal,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.dark,
      marginBottom: 10,
    },
    caption: {
      fontFamily: "AoLSans",
      fontSize: PREMIUM_CONFIG.DESIGN.typography.fontSize.caption,
      lineHeight: 1.35,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.medium,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
    },
    strong: {
      fontFamily: "AoLSans",
      fontWeight: "bold",
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
    },
  }),

  components: StyleSheet.create({
    accentDivider: {
      marginVertical: 18,
      height: 3,
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      width: 250,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.small,
    },
    callout: {
      marginVertical: 18,
      padding: 18,
      backgroundColor: "rgba(201, 169, 106, 0.08)",
      borderLeftWidth: 5,
      borderLeftColor: PREMIUM_CONFIG.DESIGN.colors.secondary.main,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.medium,
      borderWidth: 1,
      borderColor: "rgba(201, 169, 106, 0.2)",
    },
    calloutTitle: {
      fontFamily: "AoLSans",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.widest,
      color: PREMIUM_CONFIG.DESIGN.colors.secondary.dark,
      marginBottom: 10,
      fontWeight: "bold",
    },
    calloutText: {
      fontFamily: "AoLSans",
      fontSize: 11,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.black,
      lineHeight: PREMIUM_CONFIG.DESIGN.typography.lineHeight.relaxed,
    },
    labelPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.large,
      fontSize: 8,
      fontFamily: "AoLSans",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.white,
    },
    docControlBox: {
      marginTop: 16,
      padding: 16,
      backgroundColor: "rgba(10,25,47,0.03)",
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.medium,
      borderWidth: 1,
      borderColor: "rgba(10,25,47,0.10)",
    },
    docControlRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    docControlKey: {
      fontFamily: "AoLSans",
      fontSize: 8,
      color: PREMIUM_CONFIG.DESIGN.colors.neutral.medium,
      textTransform: "uppercase",
      letterSpacing: PREMIUM_CONFIG.DESIGN.typography.letterSpacing.wide,
    },
    docControlVal: {
      fontFamily: "AoLMono",
      fontSize: 8,
      color: PREMIUM_CONFIG.DESIGN.colors.primary.main,
    },
    card: {
      backgroundColor: PREMIUM_CONFIG.DESIGN.colors.neutral.white,
      borderRadius: PREMIUM_CONFIG.DESIGN.layout.borderRadius.medium,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: PREMIUM_CONFIG.DESIGN.colors.neutral.light,
    },
  }),
};

// ----------------------------------------------------------------------------
// Backdrop (SVG)
// ----------------------------------------------------------------------------
const CoverBackdrop: React.FC = () => (
  <Svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
    <Rect x="0" y="0" width="100%" height="100%" fill={PREMIUM_CONFIG.DESIGN.colors.primary.dark} />
    <Rect x="-200" y="160" width="900" height="180" fill={PREMIUM_CONFIG.DESIGN.colors.primary.main} opacity={0.65} />
    <Rect x="-240" y="390" width="980" height="190" fill={PREMIUM_CONFIG.DESIGN.colors.primary.light} opacity={0.55} />
    <Rect x="-260" y="650" width="1020" height="210" fill={PREMIUM_CONFIG.DESIGN.colors.secondary.dark} opacity={0.20} />
    <Line x1="0" y1="0" x2="700" y2="0" stroke={PREMIUM_CONFIG.DESIGN.colors.secondary.main} strokeWidth={6} opacity={0.35} />
  </Svg>
);

// ----------------------------------------------------------------------------
// Header/Footer
// ----------------------------------------------------------------------------
interface PremiumHeaderProps {
  framework: Framework;
  classification: Classification;
  distribution: DistributionPolicy;
}
const PremiumHeader: React.FC<PremiumHeaderProps> = ({ framework, classification, distribution }) => (
  <View style={PremiumStyles.page.header} fixed>
    <View style={PremiumStyles.page.headerLeft}>
      <Text style={PremiumStyles.page.headerEyebrow}>
        {classification} • {distribution.replace(/-/g, " ").toUpperCase()} • CANON
      </Text>
      <Text style={PremiumStyles.page.headerTitle}>{framework.title}</Text>
    </View>
    <Text style={PremiumStyles.page.headerRight}>
      {PREMIUM_CONFIG.COMPANY.name.toUpperCase()} • CONTROLLED DISTRIBUTION
    </Text>
  </View>
);

const PremiumFooter: React.FC<{ label: string }> = ({ label }) => (
  <View style={PremiumStyles.page.footer} fixed>
    <Text style={PremiumStyles.page.footerBrand}>
      {PREMIUM_CONFIG.COMPANY.name.toUpperCase()} • {label.toUpperCase()}
    </Text>
    <Text
      style={PremiumStyles.page.pageNumber}
      render={({ pageNumber, totalPages }) => `${pageNumber} | ${totalPages}`}
    />
    <Text style={PremiumStyles.page.copyright}>
      © {new Date().getFullYear()} {PREMIUM_CONFIG.COMPANY.legalName}
    </Text>
  </View>
);

// ----------------------------------------------------------------------------
// PRIVATE DOSSIER (full)
// ----------------------------------------------------------------------------
interface PremiumFrameworkDossierProps {
  framework: Framework;
  documentId: string;
  classification: Classification;
  distribution: DistributionPolicy;
}

const PremiumFrameworkDossier: React.FC<PremiumFrameworkDossierProps> = ({
  framework,
  documentId,
  classification,
  distribution,
}) => {
  const generatedAt = new Date();
  const tag = String((framework as any).tag || "framework");
  const oneLiner = String((framework as any).oneLiner || "");
  const operatingLogic = Array.isArray((framework as any).operatingLogic) ? (framework as any).operatingLogic : [];
  const checksum = PremiumUtils.checksum8(`${framework.slug}|${framework.title}|${documentId}|FULL`);

  const canonLead =
    "This dossier is a leadership-formation instrument and an institutional design tool. It translates intent into governance, operating cadence, and decision discipline—so execution becomes repeatable, not heroic.";

  return (
    <Document
      title={`${framework.title} | Private Strategic Framework | ${PREMIUM_CONFIG.COMPANY.name}`}
      author={PREMIUM_CONFIG.COMPANY.name}
      subject={`${oneLiner} — ${classification} — ${distribution}`}
      keywords={[...PremiumUtils.normalizeTierList((framework as any).tier), tag, "institutional design", "leadership formation"]}
      creator={`${PREMIUM_CONFIG.COMPANY.name} Canon Framework Engine`}
      producer="AoL Private PDF Generator"
      language="en-GB"
    >
      {/* COVER */}
      <Page size="A4" style={PremiumStyles.cover.page}>
        <CoverBackdrop />
        <View style={PremiumStyles.cover.content}>
          <View>
            <Text style={PremiumStyles.cover.brandBadge}>CANON FRAMEWORKS • PRIVATE SERIES</Text>
            <Text style={PremiumStyles.cover.mainTitle}>{framework.title}</Text>
            <Text style={PremiumStyles.cover.subtitle}>Leadership Formation + Institutional Design</Text>
            <View style={PremiumStyles.cover.accentLine} />

            <View style={PremiumStyles.cover.descriptionBox}>
              <Text style={PremiumStyles.cover.description}>
                {oneLiner}
                {"\n\n"}
                {canonLead}
              </Text>

              <View style={PremiumStyles.cover.metaRow}>
                <Text style={[PremiumStyles.cover.metaPill, { backgroundColor: PremiumUtils.tierColor(classification) }]}>
                  {classification}
                </Text>
                <Text style={PremiumStyles.cover.metaText}>TAG: {tag.toUpperCase()}</Text>
                <Text style={PremiumStyles.cover.metaText}>VERSION: 1.0</Text>
              </View>

              <Text style={PremiumStyles.cover.distributionBadge}>
                {distribution.replace(/-/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={PremiumStyles.cover.footer}>
            <Text style={PremiumStyles.cover.footerText}>{PremiumUtils.formatDate(generatedAt).toUpperCase()}</Text>
            <Text style={PremiumStyles.cover.serialNumber}>DOC ID: {documentId} • CHK: {checksum}</Text>
            <Text style={PremiumStyles.cover.footerText}>{PREMIUM_CONFIG.COMPANY.website.toUpperCase()}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 1 — EXEC SUMMARY */}
      <Page size="A4" style={PremiumStyles.page.container}>
        <PremiumHeader framework={framework} classification={classification} distribution={distribution} />
        <Text style={PremiumStyles.page.watermark}>{PREMIUM_CONFIG.COMPANY.name.toUpperCase()}</Text>

        <View style={PremiumStyles.page.content}>
          <Text style={PremiumStyles.typography.h1}>Executive Summary</Text>
          <View style={PremiumStyles.components.accentDivider} />

          <Text style={PremiumStyles.typography.lead}>
            A private, institutional-grade thinking tool—built to create durable capability, not motivational theatre.
          </Text>

          <View style={PremiumStyles.components.callout}>
            <Text style={PremiumStyles.components.calloutTitle}>Control Statement</Text>
            <Text style={PremiumStyles.components.calloutText}>
              Classification: <Text style={PremiumStyles.typography.strong}>{classification}</Text>. Distribution:{" "}
              <Text style={PremiumStyles.typography.strong}>{distribution.replace(/-/g, " ")}</Text>.{" "}
              Do not publish full dossiers under public assets.
            </Text>
          </View>

          <View style={PremiumStyles.components.docControlBox}>
            <View style={PremiumStyles.components.docControlRow}>
              <Text style={PremiumStyles.components.docControlKey}>Document ID</Text>
              <Text style={PremiumStyles.components.docControlVal}>{documentId}</Text>
            </View>
            <View style={PremiumStyles.components.docControlRow}>
              <Text style={PremiumStyles.components.docControlKey}>Checksum</Text>
              <Text style={PremiumStyles.components.docControlVal}>{checksum}</Text>
            </View>
            <View style={PremiumStyles.components.docControlRow}>
              <Text style={PremiumStyles.components.docControlKey}>Generated</Text>
              <Text style={PremiumStyles.components.docControlVal}>{PremiumUtils.formatDateTime(generatedAt)}</Text>
            </View>
          </View>

          <Text style={PremiumStyles.typography.h2}>Operating Logic</Text>
          <View style={PremiumStyles.components.accentDivider} />

          {(operatingLogic.length ? operatingLogic : [{ title: "Operating Principle", body: "Add operatingLogic[] in the framework definition to fully populate this section." }]).map(
            (logic: any, i: number) => (
              <View key={`${framework.slug}-logic-${i}`} style={PremiumStyles.components.card}>
                <Text style={PremiumStyles.typography.caption}>{`PRINCIPLE ${i + 1}`}</Text>
                <Text style={PremiumStyles.typography.h3}>{String(logic.title || `Principle ${i + 1}`)}</Text>
                <Text style={PremiumStyles.typography.body}>{String(logic.body || "")}</Text>
              </View>
            )
          )}
        </View>

        <PremiumFooter label="private dossier" />
      </Page>
    </Document>
  );
};

// ----------------------------------------------------------------------------
// TEASER (1-page abstract)
// ----------------------------------------------------------------------------
interface PremiumFrameworkTeaserProps {
  framework: Framework;
  teaserId: string;
  classification: Classification;
  distribution: DistributionPolicy;
}

const PremiumFrameworkTeaser: React.FC<PremiumFrameworkTeaserProps> = ({
  framework,
  teaserId,
  classification,
  distribution,
}) => {
  const generatedAt = new Date();
  const tag = String((framework as any).tag || "framework");
  const oneLiner = String((framework as any).oneLiner || "");
  const checksum = PremiumUtils.checksum8(`${framework.slug}|${framework.title}|${teaserId}|TEASER`);

  // Canon + McKinsey framing: tight, executive, capability language.
  const teaserBody =
    "This is a strategic capability instrument. It clarifies the institutional outcome, the operating logic required to produce it, and the leadership behaviours that sustain it. Use it to align decision-makers, govern trade-offs, and turn intent into repeatable execution.";

  // "Public teaser" still avoids IP leakage: no deep steps, no full operating logic, no templates.
  const boundaries =
    "This teaser is an abstract. Detailed mechanisms, templates, and operating cadence remain gated within private-tier materials.";

  return (
    <Document
      title={`${framework.title} | Framework Teaser | ${PREMIUM_CONFIG.COMPANY.name}`}
      author={PREMIUM_CONFIG.COMPANY.name}
      subject={`${oneLiner} — TEASER — ${distribution}`}
      keywords={["teaser", "framework", tag, "institutional design", "leadership formation"]}
      creator={`${PREMIUM_CONFIG.COMPANY.name} Canon Teaser Engine`}
      producer="AoL Teaser Generator"
      language="en-GB"
    >
      <Page size="A4" style={PremiumStyles.cover.page}>
        <CoverBackdrop />
        <View style={PremiumStyles.cover.content}>
          <View>
            <Text style={PremiumStyles.cover.brandBadge}>CANON FRAMEWORKS • TEASER</Text>
            <Text style={PremiumStyles.cover.mainTitle}>{framework.title}</Text>
            <Text style={PremiumStyles.cover.subtitle}>Executive Abstract</Text>
            <View style={PremiumStyles.cover.accentLine} />

            <View style={PremiumStyles.cover.descriptionBox}>
              <Text style={PremiumStyles.cover.description}>
                {oneLiner}
                {"\n\n"}
                {teaserBody}
                {"\n\n"}
                {boundaries}
              </Text>

              <View style={PremiumStyles.cover.metaRow}>
                <Text style={[PremiumStyles.cover.metaPill, { backgroundColor: PremiumUtils.tierColor(classification) }]}>
                  {classification}
                </Text>
                <Text style={PremiumStyles.cover.metaText}>TAG: {tag.toUpperCase()}</Text>
                <Text style={PremiumStyles.cover.metaText}>SCOPE: 1-PAGE</Text>
              </View>

              <Text style={PremiumStyles.cover.distributionBadge}>
                {distribution.replace(/-/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={PremiumStyles.cover.footer}>
            <Text style={PremiumStyles.cover.footerText}>{PremiumUtils.formatDate(generatedAt).toUpperCase()}</Text>
            <Text style={PremiumStyles.cover.serialNumber}>TEASER ID: {teaserId} • CHK: {checksum}</Text>
            <Text style={PremiumStyles.cover.footerText}>{PREMIUM_CONFIG.COMPANY.website.toUpperCase()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ----------------------------------------------------------------------------
// Collection (private)
// ----------------------------------------------------------------------------
const PremiumFrameworksCollection: React.FC<{
  frameworks: Framework[];
  collectionId: string;
  distribution: DistributionPolicy;
}> = ({ frameworks, collectionId, distribution }) => {
  const generatedAt = new Date();
  const total = frameworks.length;
  const checksum = PremiumUtils.checksum8(`${collectionId}|${total}|${PremiumUtils.formatDateTime(generatedAt)}`);

  return (
    <Document
      title={`Private Frameworks Collection | ${PREMIUM_CONFIG.COMPANY.name}`}
      author={PREMIUM_CONFIG.COMPANY.name}
      subject={`Private collection — ${distribution}`}
      keywords={["strategic frameworks", "leadership formation", "institutional design", "private"]}
      creator={`${PREMIUM_CONFIG.COMPANY.name} Collection Engine`}
      language="en-GB"
    >
      <Page size="A4" style={PremiumStyles.cover.page}>
        <CoverBackdrop />
        <View style={PremiumStyles.cover.content}>
          <View>
            <Text style={PremiumStyles.cover.brandBadge}>CANON • PRIVATE COLLECTION</Text>
            <Text style={PremiumStyles.cover.mainTitle}>Frameworks Collection</Text>
            <Text style={PremiumStyles.cover.subtitle}>Institutional-Grade Thinking Tools</Text>
            <View style={PremiumStyles.cover.accentLine} />

            <View style={PremiumStyles.cover.descriptionBox}>
              <Text style={PremiumStyles.cover.description}>
                This pack contains {total} private-tier frameworks intended for internal leadership formation and institutional design work.
              </Text>

              <View style={PremiumStyles.cover.metaRow}>
                <Text style={[PremiumStyles.cover.metaPill, { backgroundColor: PREMIUM_CONFIG.DESIGN.colors.accent.warning }]}>
                  CONFIDENTIAL
                </Text>
                <Text style={PremiumStyles.cover.metaText}>FRAMEWORKS: {total}</Text>
                <Text style={PremiumStyles.cover.metaText}>VERSION: 1.0</Text>
              </View>

              <Text style={PremiumStyles.cover.distributionBadge}>
                {distribution.replace(/-/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={PremiumStyles.cover.footer}>
            <Text style={PremiumStyles.cover.footerText}>{PremiumUtils.formatDate(generatedAt).toUpperCase()}</Text>
            <Text style={PremiumStyles.cover.serialNumber}>COLLECTION ID: {collectionId} • CHK: {checksum}</Text>
            <Text style={PremiumStyles.cover.footerText}>{PREMIUM_CONFIG.COMPANY.website.toUpperCase()}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={PremiumStyles.page.container}>
        <View style={PremiumStyles.page.header} fixed>
          <View style={PremiumStyles.page.headerLeft}>
            <Text style={PremiumStyles.page.headerEyebrow}>PRIVATE COLLECTION • CATALOG</Text>
            <Text style={PremiumStyles.page.headerTitle}>Framework Index</Text>
          </View>
          <Text style={PremiumStyles.page.headerRight}>
            {PREMIUM_CONFIG.COMPANY.name.toUpperCase()} • CONTROLLED DISTRIBUTION
          </Text>
        </View>

        <View style={PremiumStyles.page.content}>
          <Text style={PremiumStyles.typography.h1}>Framework Index</Text>
          <View style={PremiumStyles.components.accentDivider} />

          {frameworks.map((fw) => (
            <View key={fw.slug} style={PremiumStyles.components.card}>
              <Text style={PremiumStyles.typography.caption}>
                {PremiumUtils.resolveClassification(fw)} • {String((fw as any).tag || "framework").toUpperCase()}
              </Text>
              <Text style={PremiumStyles.typography.h3}>{fw.title}</Text>
              <Text style={PremiumStyles.typography.body}>{String((fw as any).oneLiner || "")}</Text>
              <Text style={PremiumStyles.typography.caption}>SLUG: {fw.slug}</Text>
            </View>
          ))}
        </View>

        <PremiumFooter label="private collection" />
      </Page>
    </Document>
  );
};

// ----------------------------------------------------------------------------
// Engine types
// ----------------------------------------------------------------------------
type GenerationResult = {
  success: boolean;
  kind: "full" | "teaser" | "collection";
  filePath?: string;
  fileName?: string;
  bytes?: number;
  fileSizeMb?: string;
  sha256?: string;
  error?: string;
  documentId?: string;
  classification?: Classification;
  distribution?: DistributionPolicy;
  publishedToPublic?: boolean;
  publicPath?: string;
};

async function generateFullFrameworkPDF(framework: Framework): Promise<GenerationResult> {
  try {
    const classification = PremiumUtils.resolveClassification(framework);
    const distribution = ACCESS_POLICY.fullDistribution;

    if (!PremiumUtils.isPrivateFramework(framework) && ACCESS_POLICY.generationMode === "private-only") {
      return { success: false, kind: "full", error: "Skipped (not private/restricted under private-only mode)" };
    }

    await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.directories.frameworks);

    const documentId = PremiumUtils.generateDocumentId();
    const component = (
      <PremiumFrameworkDossier
        framework={framework}
        documentId={documentId}
        classification={classification}
        distribution={distribution}
      />
    );

    const buffer = await pdf(component).toBuffer();

    const sha = PremiumUtils.sha256(buffer);
    const bytes = buffer.length;
    const fileSizeMb = (bytes / (1024 * 1024)).toFixed(2);

    const fileName = PREMIUM_CONFIG.OUTPUT.naming.framework(framework.slug);
    const filePath = path.join(PREMIUM_CONFIG.OUTPUT.directories.frameworks, fileName);

    await PremiumUtils.writeFileWithBackup(filePath, buffer);

    return {
      success: true,
      kind: "full",
      filePath,
      fileName,
      bytes,
      fileSizeMb: `${fileSizeMb} MB`,
      sha256: sha,
      documentId,
      classification,
      distribution,
      publishedToPublic: false, // hard
    };
  } catch (error: any) {
    return { success: false, kind: "full", error: error?.message || "Unknown error" };
  }
}

async function generateTeaserPDF(framework: Framework): Promise<GenerationResult> {
  try {
    const classification = PremiumUtils.resolveClassification(framework);

    // Default teaser distribution is app-preview-only.
    // If public teaser publishing is enabled, we stamp as public-teaser.
    const distribution: DistributionPolicy = ACCESS_POLICY.allowPublicTeasers ? "public-teaser" : ACCESS_POLICY.teaserDistribution;

    await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.directories.teasers);

    const teaserId = PremiumUtils.generateDocumentId();
    const component = (
      <PremiumFrameworkTeaser
        framework={framework}
        teaserId={teaserId}
        classification={classification}
        distribution={distribution}
      />
    );

    const buffer = await pdf(component).toBuffer();

    const sha = PremiumUtils.sha256(buffer);
    const bytes = buffer.length;
    const fileSizeMb = (bytes / (1024 * 1024)).toFixed(2);

    const fileName = PREMIUM_CONFIG.OUTPUT.naming.teaser(framework.slug);
    const filePath = path.join(PREMIUM_CONFIG.OUTPUT.directories.teasers, fileName);

    await PremiumUtils.writeFileWithBackup(filePath, buffer);

    // Optional publish to /public (teaser only)
    let publishedToPublic = false;
    let publicPath: string | undefined;

    if (ACCESS_POLICY.allowPublicTeasers) {
      await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.publicTeasersDir);
      publicPath = path.join(PREMIUM_CONFIG.OUTPUT.publicTeasersDir, fileName);
      await PremiumUtils.copyFileSafe(filePath, publicPath);
      publishedToPublic = true;
    }

    return {
      success: true,
      kind: "teaser",
      filePath,
      fileName,
      bytes,
      fileSizeMb: `${fileSizeMb} MB`,
      sha256: sha,
      documentId: teaserId,
      classification,
      distribution,
      publishedToPublic,
      publicPath,
    };
  } catch (error: any) {
    return { success: false, kind: "teaser", error: error?.message || "Unknown error" };
  }
}

async function generateCollection(frameworks: Framework[]): Promise<GenerationResult> {
  try {
    await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.directories.collections);

    const distribution = ACCESS_POLICY.fullDistribution;
    const collectionId = PremiumUtils.generateDocumentId();
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

    const component = (
      <PremiumFrameworksCollection
        frameworks={frameworks}
        collectionId={collectionId}
        distribution={distribution}
      />
    );

    const buffer = await pdf(component).toBuffer();
    const sha = PremiumUtils.sha256(buffer);
    const bytes = buffer.length;
    const fileSizeMb = (bytes / (1024 * 1024)).toFixed(2);

    const fileName = PREMIUM_CONFIG.OUTPUT.naming.collection(dateStr);
    const filePath = path.join(PREMIUM_CONFIG.OUTPUT.directories.collections, fileName);

    await PremiumUtils.writeFileWithBackup(filePath, buffer);

    return {
      success: true,
      kind: "collection",
      filePath,
      fileName,
      bytes,
      fileSizeMb: `${fileSizeMb} MB`,
      sha256: sha,
      documentId: collectionId,
      classification: "CONFIDENTIAL",
      distribution,
      publishedToPublic: false,
    };
  } catch (error: any) {
    return { success: false, kind: "collection", error: error?.message || "Unknown error" };
  }
}

// ----------------------------------------------------------------------------
// Manifest + Summary
// ----------------------------------------------------------------------------
type ManifestEntry = {
  kind: "full" | "teaser";
  slug: string;
  title: string;
  tag: string;
  tiers: string[];
  classification: Classification;
  distribution: DistributionPolicy;
  documentId: string;
  fileName: string;
  filePath: string;
  bytes: number;
  sha256: string;
  generatedAt: string;
  publishedToPublic: boolean;
  publicPath?: string;
};

type ManifestPayload = {
  company: typeof PREMIUM_CONFIG.COMPANY;
  generatedAt: string;
  mode: string;
  allowPublicTeasers: boolean;
  outputRoot: string;
  totals: {
    frameworksSelected: number;
    fullGenerated: number;
    teaserGenerated: number;
    bytesTotal: number;
  };
  collection: null | {
    kind: "collection";
    classification: Classification;
    distribution: DistributionPolicy;
    documentId: string;
    fileName: string;
    filePath: string;
    bytes: number;
    sha256: string;
    generatedAt: string;
  };
  entries: ManifestEntry[];
};

async function writeManifest(payload: ManifestPayload) {
  await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.directories.meta);
  const manifestPath = path.join(PREMIUM_CONFIG.OUTPUT.directories.meta, PREMIUM_CONFIG.OUTPUT.naming.manifest);
  await PremiumUtils.writeFileWithBackup(manifestPath, JSON.stringify(payload, null, 2));
}

async function writeSummary(lines: string[]) {
  await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.directories.meta);
  const summaryPath = path.join(PREMIUM_CONFIG.OUTPUT.directories.meta, PREMIUM_CONFIG.OUTPUT.naming.summary);
  await PremiumUtils.writeFileWithBackup(summaryPath, lines.join("\n"));
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  // eslint-disable-next-line no-console
  console.log("=".repeat(70));
  // eslint-disable-next-line no-console
  console.log("🚀 AoL CANON FRAMEWORKS — PRIVATE PDF GENERATOR (FULL + TEASERS)");
  // eslint-disable-next-line no-console
  console.log("=".repeat(70));

  if (!FRAMEWORKS || FRAMEWORKS.length === 0) {
    // eslint-disable-next-line no-console
    console.error("❌ No frameworks data found.");
    process.exit(1);
  }

  registerPremiumFonts();

  for (const dir of Object.values(PREMIUM_CONFIG.OUTPUT.directories)) {
    await PremiumUtils.ensureDirectory(dir);
  }
  if (ACCESS_POLICY.allowPublicTeasers) {
    await PremiumUtils.ensureDirectory(PREMIUM_CONFIG.OUTPUT.publicTeasersDir);
  }

  const generatedAt = new Date();

  const selected =
    ACCESS_POLICY.generationMode === "private-only"
      ? FRAMEWORKS.filter((f) => PremiumUtils.isPrivateFramework(f))
      : FRAMEWORKS;

  // eslint-disable-next-line no-console
  console.log(`\n⚙️  Mode: ${ACCESS_POLICY.generationMode}`);
  // eslint-disable-next-line no-console
  console.log(`🔒 Selected: ${selected.length}/${FRAMEWORKS.length}`);
  // eslint-disable-next-line no-console
  console.log(`🧾 Teasers: ${ACCESS_POLICY.generateTeasers ? "ON" : "OFF"} | Public publish: ${ACCESS_POLICY.allowPublicTeasers ? "ON" : "OFF"}\n`);

  const manifestEntries: ManifestEntry[] = [];
  const failures: Array<{ kind: string; slug: string; error: string }> = [];

  let fullCount = 0;
  let teaserCount = 0;

  // Generate FULL dossiers (private)
  for (let i = 0; i < selected.length; i++) {
    const fw = selected[i];
    // eslint-disable-next-line no-console
    console.log(`${i + 1}/${selected.length}: FULL — ${fw.title}`);

    const res = await generateFullFrameworkPDF(fw);
    if (!res.success) {
      // eslint-disable-next-line no-console
      console.log(`   ❌ ${res.error}`);
      failures.push({ kind: "full", slug: fw.slug, error: res.error || "Unknown error" });
      continue;
    }

    fullCount++;

    manifestEntries.push({
      kind: "full",
      slug: fw.slug,
      title: fw.title,
      tag: String((fw as any).tag || "framework"),
      tiers: PremiumUtils.normalizeTierList((fw as any).tier),
      classification: res.classification!,
      distribution: res.distribution!,
      documentId: res.documentId!,
      fileName: res.fileName!,
      filePath: res.filePath!,
      bytes: res.bytes!,
      sha256: res.sha256!,
      generatedAt: generatedAt.toISOString(),
      publishedToPublic: false,
    });

    // eslint-disable-next-line no-console
    console.log(`   ✅ ${res.fileName} (${res.fileSizeMb})`);
  }

  // Generate TEASERS (safe by default)
  if (ACCESS_POLICY.generateTeasers) {
    for (let i = 0; i < selected.length; i++) {
      const fw = selected[i];
      // eslint-disable-next-line no-console
      console.log(`${i + 1}/${selected.length}: TEASER — ${fw.title}`);

      const res = await generateTeaserPDF(fw);
      if (!res.success) {
        // eslint-disable-next-line no-console
        console.log(`   ❌ ${res.error}`);
        failures.push({ kind: "teaser", slug: fw.slug, error: res.error || "Unknown error" });
        continue;
      }

      teaserCount++;

      manifestEntries.push({
        kind: "teaser",
        slug: fw.slug,
        title: fw.title,
        tag: String((fw as any).tag || "framework"),
        tiers: PremiumUtils.normalizeTierList((fw as any).tier),
        classification: res.classification!,
        distribution: res.distribution!,
        documentId: res.documentId!,
        fileName: res.fileName!,
        filePath: res.filePath!,
        bytes: res.bytes!,
        sha256: res.sha256!,
        generatedAt: generatedAt.toISOString(),
        publishedToPublic: Boolean(res.publishedToPublic),
        publicPath: res.publicPath,
      });

      // eslint-disable-next-line no-console
      console.log(`   ✅ ${res.fileName} (${res.fileSizeMb})${res.publishedToPublic ? " • PUBLISHED TO /public" : ""}`);
    }
  }

  // Generate collection from FULL docs only (where we actually produced full PDFs)
  const fullSlugs = new Set(manifestEntries.filter((e) => e.kind === "full").map((e) => e.slug));
  const fullFrameworksInOrder = selected.filter((fw) => fullSlugs.has(fw.slug));

  let collectionManifest: ManifestPayload["collection"] = null;
  if (fullFrameworksInOrder.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`\n📚 COLLECTION — generating (${fullFrameworksInOrder.length} full dossiers)...`);

    const col = await generateCollection(fullFrameworksInOrder);
    if (col.success) {
      collectionManifest = {
        kind: "collection",
        classification: col.classification!,
        distribution: col.distribution!,
        documentId: col.documentId!,
        fileName: col.fileName!,
        filePath: col.filePath!,
        bytes: col.bytes!,
        sha256: col.sha256!,
        generatedAt: generatedAt.toISOString(),
      };

      // eslint-disable-next-line no-console
      console.log(`   ✅ ${col.fileName} (${col.fileSizeMb})`);
    } else {
      failures.push({ kind: "collection", slug: "collection", error: col.error || "Unknown error" });
      // eslint-disable-next-line no-console
      console.log(`   ❌ Collection failed: ${col.error}`);
    }
  }

  const bytesTotal = manifestEntries.reduce((s, e) => s + e.bytes, 0);

  await writeManifest({
    company: PREMIUM_CONFIG.COMPANY,
    generatedAt: generatedAt.toISOString(),
    mode: ACCESS_POLICY.generationMode,
    allowPublicTeasers: ACCESS_POLICY.allowPublicTeasers,
    outputRoot: PREMIUM_CONFIG.OUTPUT.privateRoot,
    totals: {
      frameworksSelected: selected.length,
      fullGenerated: fullCount,
      teaserGenerated: teaserCount,
      bytesTotal,
    },
    collection: collectionManifest,
    entries: manifestEntries,
  });

  const summary: string[] = [];
  summary.push("=======================================================================");
  summary.push("ABRAHAM OF LONDON — CANON FRAMEWORKS (PRIVATE) — GENERATION SUMMARY");
  summary.push("=======================================================================");
  summary.push(`Generated: ${PremiumUtils.formatDateTime(generatedAt)}`);
  summary.push(`Mode: ${ACCESS_POLICY.generationMode}`);
  summary.push(`Teasers: ${ACCESS_POLICY.generateTeasers ? "ON" : "OFF"} | Public teaser publish: ${ACCESS_POLICY.allowPublicTeasers ? "ON" : "OFF"}`);
  summary.push("");
  summary.push(`Selected: ${selected.length}`);
  summary.push(`Full generated: ${fullCount}`);
  summary.push(`Teasers generated: ${teaserCount}`);
  summary.push(`Failures: ${failures.length}`);
  summary.push("");

  if (collectionManifest) {
    summary.push(`Collection: ${collectionManifest.fileName}`);
    summary.push(` - Path: ${collectionManifest.filePath}`);
    summary.push(` - SHA: ${collectionManifest.sha256}`);
    summary.push("");
  }

  if (failures.length) {
    summary.push("FAILURES:");
    for (const f of failures) summary.push(` - ${f.kind.toUpperCase()} • ${f.slug}: ${f.error}`);
    summary.push("");
  }

  summary.push("OUTPUT LOCATIONS:");
  summary.push(` - Full dossiers (private): ${PREMIUM_CONFIG.OUTPUT.directories.frameworks}`);
  summary.push(` - Teasers (private):      ${PREMIUM_CONFIG.OUTPUT.directories.teasers}`);
  summary.push(` - Collections (private):  ${PREMIUM_CONFIG.OUTPUT.directories.collections}`);
  summary.push(` - Meta:                  ${PREMIUM_CONFIG.OUTPUT.directories.meta}`);
  if (ACCESS_POLICY.allowPublicTeasers) {
    summary.push(` - Teasers (public):       ${PREMIUM_CONFIG.OUTPUT.publicTeasersDir}`);
  }
  summary.push("");
  summary.push("CONTROL NOTICE:");
  summary.push(" - Full dossiers are PRIVATE/CONFIDENTIAL/RESTRICTED and must never be published under /public.");
  summary.push(" - Teasers are safe abstracts; public publishing is explicit opt-in (ALLOW_PUBLIC_TEASERS=true).");
  summary.push("=======================================================================");

  await writeSummary(summary);

  // eslint-disable-next-line no-console
  console.log("\n" + "=".repeat(70));
  // eslint-disable-next-line no-console
  console.log("✅ COMPLETE — FULL DOSSIERS + TEASERS GENERATED");
  // eslint-disable-next-line no-console
  console.log(`📁 Full:     ${PREMIUM_CONFIG.OUTPUT.directories.frameworks}`);
  // eslint-disable-next-line no-console
  console.log(`📁 Teasers:  ${PREMIUM_CONFIG.OUTPUT.directories.teasers}`);
  // eslint-disable-next-line no-console
  console.log(`📁 Meta:     ${PREMIUM_CONFIG.OUTPUT.directories.meta}`);
  if (ACCESS_POLICY.allowPublicTeasers) {
    // eslint-disable-next-line no-console
    console.log(`🌍 Public teasers: ${PREMIUM_CONFIG.OUTPUT.publicTeasersDir}`);
  } else {
    // eslint-disable-next-line no-console
    console.log("🌍 Public teasers: OFF (set ALLOW_PUBLIC_TEASERS=true to enable)");
  }
  // eslint-disable-next-line no-console
  console.log("=".repeat(70));
}

// ----------------------------------------------------------------------------
// Execute
// ----------------------------------------------------------------------------
if (import.meta.url === `file://${__filename}`) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("💥 Failed to execute:", error);
    process.exit(1);
  });
}

// ----------------------------------------------------------------------------
// Exports (useful for testing)
// ----------------------------------------------------------------------------
export {
  PremiumFrameworkDossier,
  PremiumFrameworkTeaser,
  PremiumFrameworksCollection,
  PremiumUtils,
  PremiumStyles,
  PremiumHeader,
  PremiumFooter,
  PREMIUM_CONFIG,
  ACCESS_POLICY,
};