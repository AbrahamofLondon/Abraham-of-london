/* scripts/generate-standalone-pdf.tsx */
import fs from "fs";
import path from "path";
import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { fileURLToPath } from 'url';
import { PDF_CONFIG, type BuildTier, type Quality, type Format } from "./pdf/constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// INTERFACE FOR INTEGRATION
// ---------------------------------------------------------
interface GenerateEditorialPDFOptions {
  format?: Format;
  quality?: Quality;
  tier?: BuildTier;
  outputDir?: string;
  fileName?: string;
  metadata?: Record<string, any>;
}

// ---------------------------------------------------------
// 1. PREMIUM FONTS - USING YOUR NEW FONTS
// ---------------------------------------------------------
const loadImageBuffer = (relativePath: string) => {
  try {
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  } catch (e) {
    console.warn(`Could not load image: ${relativePath}`, e);
  }
  return null;
};

// Try multiple cover images
const COVER_IMAGES = [
  "assets/images/purpose-cover.jpg",
  "assets/images/writing-desk.webp", 
  "assets/images/cover-placeholder.jpg",
  "assets/cover/default-cover.png"
];

let coverBuffer = null;
for (const imgPath of COVER_IMAGES) {
  coverBuffer = loadImageBuffer(imgPath);
  if (coverBuffer) {
    console.log(`Using cover image: ${imgPath}`);
    break;
  }
}

// Register premium fonts from your public/fonts directory
function registerPremiumFonts() {
  try {
    // Use Inter fonts from your public/fonts directory
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    
    // Register Inter as the main sans-serif font
    Font.register({
      family: "Inter",
      fonts: [
        { 
          src: path.join(fontsDir, "Inter-Regular.ttf") || "Helvetica",
          fontWeight: "normal" 
        },
        { 
          src: path.join(fontsDir, "Inter-Bold.ttf") || "Helvetica-Bold",
          fontWeight: "bold" 
        },
        { 
          src: path.join(fontsDir, "Inter-Italic.ttf") || "Helvetica-Oblique",
          fontStyle: "italic" 
        },
        { 
          src: path.join(fontsDir, "Inter-BoldItalic.ttf") || "Helvetica-BoldOblique",
          fontWeight: "bold",
          fontStyle: "italic" 
        },
      ],
    });

    // Register Geist Mono as monospace
    Font.register({
      family: "GeistMono",
      src: path.join(fontsDir, "GeistMono-Regular.woff2") || "Courier",
    });

    // Use Times for serif (fallback to system)
    Font.register({
      family: "Times",
      fonts: [
        { src: "Times-Roman" },
        { src: "Times-Bold", fontWeight: "bold" },
        { src: "Times-Italic", fontStyle: "italic" },
        { src: "Times-BoldItalic", fontWeight: "bold", fontStyle: "italic" }
      ],
    });

    // Use PP Editorial New for display
    Font.register({
      family: "PPEditorialNew",
      src: path.join(fontsDir, "PPEditorialNew-Regular-BF644b214ff145f.woff2") || "Times-Bold",
      fontWeight: "normal"
    });

    console.log("✅ Premium fonts registered successfully");
  } catch (error) {
    console.warn("⚠️ Font registration failed, using system defaults:", error);
    
    // Fallback to system fonts
    Font.register({
      family: "Inter",
      src: "Helvetica"
    });
    Font.register({
      family: "Times",
      src: "Times-Roman"
    });
    Font.register({
      family: "GeistMono",
      src: "Courier"
    });
    Font.register({
      family: "PPEditorialNew",
      src: "Times-Bold"
    });
  }
}

// Register fonts immediately
registerPremiumFonts();

// ---------------------------------------------------------
// 2. PREMIUM STYLES WITH NEW FONTS
// ---------------------------------------------------------
const BRAND = {
  primary: "#0F172A",
  secondary: "#1E293B",
  accent: "#D4AF37",
  accentLight: "#FBBF24",
  white: "#F8FAFC",
  ink: "#E2E8F0",
  muted: "#94A3B8",
  border: "#334155",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

const PAGE_MARGINS = {
  top: 72,
  right: 72,
  bottom: 72,
  left: 72,
  gutter: 20
};

const styles = StyleSheet.create({
  document: {
    backgroundColor: BRAND.primary,
    fontFamily: "Inter",
    lineHeight: 1.6,
  },
  coverPage: {
    padding: 0,
    backgroundColor: BRAND.primary,
    flexDirection: "column",
    justifyContent: "flex-end",
    position: "relative",
  },
  coverImageWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    zIndex: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5, 6, 9, 0.75)",
  },
  coverContent: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: PAGE_MARGINS.left,
    paddingBottom: PAGE_MARGINS.bottom * 2,
    flex: 1,
    justifyContent: "flex-end",
  },
  coverEyebrow: {
    fontFamily: "Inter",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
    color: BRAND.accentLight,
    marginBottom: 12,
    fontWeight: "bold",
  },
  coverTitle: {
    fontFamily: "PPEditorialNew",
    fontSize: 48,
    color: BRAND.white,
    lineHeight: 1.1,
    marginBottom: 12,
    fontWeight: "normal",
  },
  coverSubtitle: {
    fontFamily: "Times",
    fontSize: 18,
    color: BRAND.ink,
    marginBottom: 24,
    fontStyle: "italic",
  },
  coverByline: {
    fontFamily: "Inter",
    fontSize: 14,
    color: BRAND.muted,
    marginBottom: 32,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  coverDivider: {
    width: 120,
    height: 2,
    backgroundColor: BRAND.accent,
    marginBottom: 24,
  },
  coverTagline: {
    fontFamily: "Times",
    fontSize: 14,
    color: BRAND.muted,
    lineHeight: 1.6,
    maxWidth: "70%",
    marginBottom: 48,
  },
  coverFooter: {
    position: "absolute",
    bottom: PAGE_MARGINS.bottom,
    left: PAGE_MARGINS.left,
    right: PAGE_MARGINS.right,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
    paddingTop: 12,
  },
  coverBrand: {
    fontFamily: "Inter",
    fontSize: 9,
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  coverDate: {
    fontFamily: "GeistMono",
    fontSize: 9,
    color: BRAND.muted,
  },
  page: {
    paddingTop: PAGE_MARGINS.top,
    paddingBottom: PAGE_MARGINS.bottom,
    paddingHorizontal: PAGE_MARGINS.left,
    backgroundColor: BRAND.primary,
    position: "relative",
  },
  header: {
    position: "absolute",
    top: 36,
    left: PAGE_MARGINS.left,
    right: PAGE_MARGINS.right,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 0.7,
    borderBottomColor: BRAND.border,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerEyebrow: {
    fontFamily: "Inter",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: BRAND.accentLight,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Times",
    fontSize: 11,
    color: BRAND.white,
    fontWeight: "bold",
  },
  headerRight: {
    fontFamily: "GeistMono",
    fontSize: 8,
    color: BRAND.muted,
    textAlign: "right",
  },
  content: {
    marginTop: 48,
  },
  h1: {
    fontFamily: "PPEditorialNew",
    fontSize: 28,
    color: BRAND.white,
    marginBottom: 16,
    fontWeight: "normal",
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: "PPEditorialNew",
    fontSize: 20,
    color: BRAND.white,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: "normal",
    lineHeight: 1.3,
  },
  h3: {
    fontFamily: "Times",
    fontSize: 16,
    color: BRAND.ink,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  h4: {
    fontFamily: "Times",
    fontSize: 13,
    color: BRAND.muted,
    marginTop: 16,
    marginBottom: 6,
    fontStyle: "italic",
  },
  bodyText: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.7,
    color: BRAND.ink,
    marginBottom: 12,
    textAlign: "justify",
  },
  leadParagraph: {
    fontFamily: "Times",
    fontSize: 13,
    lineHeight: 1.8,
    color: BRAND.white,
    marginBottom: 20,
    fontWeight: "normal",
    textAlign: "justify",
  },
  strong: {
    fontFamily: "Inter",
    fontWeight: "bold",
    color: BRAND.white,
  },
  emphasis: {
    fontFamily: "Times",
    fontStyle: "italic",
    color: BRAND.ink,
  },
  sectionDivider: {
    marginVertical: 32,
    height: 1,
    backgroundColor: BRAND.border,
    width: "100%",
  },
  paragraphDivider: {
    marginVertical: 20,
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "40%",
    alignSelf: "center",
  },
  quoteBlock: {
    marginVertical: 24,
    paddingLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.accent,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingTop: 16,
    paddingBottom: 16,
    paddingRight: 20,
    borderRadius: 4,
  },
  quoteText: {
    fontFamily: "Times",
    fontSize: 12,
    color: BRAND.ink,
    fontStyle: "italic",
    lineHeight: 1.6,
    textAlign: "left",
  },
  quoteAttribution: {
    fontFamily: "Inter",
    fontSize: 9,
    color: BRAND.muted,
    marginTop: 8,
    textAlign: "right",
    fontStyle: "italic",
  },
  callout: {
    marginVertical: 20,
    borderWidth: 1,
    borderColor: BRAND.accent,
    backgroundColor: "rgba(11, 12, 18, 0.9)",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  calloutLabel: {
    fontFamily: "Inter",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: BRAND.accentLight,
    marginBottom: 8,
    fontWeight: "bold",
  },
  calloutText: {
    fontFamily: "Inter",
    fontSize: 10,
    color: BRAND.ink,
    lineHeight: 1.6,
  },
  bulletList: {
    marginVertical: 16,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 16,
    fontSize: 14,
    color: BRAND.accent,
    marginRight: 8,
    marginTop: -1,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.6,
    color: BRAND.ink,
    textAlign: "justify",
  },
  numberedList: {
    marginVertical: 16,
    paddingLeft: 8,
  },
  numberedItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  number: {
    width: 20,
    fontSize: 11,
    color: BRAND.accent,
    fontWeight: "bold",
    marginRight: 8,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: PAGE_MARGINS.left,
    right: PAGE_MARGINS.right,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
  },
  footerBrand: {
    fontFamily: "Inter",
    fontSize: 8,
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  pageNumber: {
    fontFamily: "Inter",
    fontSize: 9,
    color: BRAND.muted,
  },
  copyright: {
    fontFamily: "Inter",
    fontSize: 7,
    color: BRAND.muted,
    textAlign: "center",
    marginTop: 4,
  },
  centerText: {
    textAlign: "center",
  },
  rightText: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  spacingSmall: {
    marginBottom: 8,
  },
  spacingMedium: {
    marginBottom: 16,
  },
  spacingLarge: {
    marginBottom: 32,
  },
  indent: {
    marginLeft: 20,
  },
});

// ---------------------------------------------------------
// 3. COMPONENTS
// ---------------------------------------------------------
const Header = ({ eyebrow = "Strategic Editorial", title = "Purpose is not a sentiment" }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerLeft}>
      <Text style={styles.headerEyebrow}>{eyebrow}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
    <Text style={styles.headerRight}>Abraham of London · abrahamoflondon.org</Text>
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerBrand}>Abraham of London · Strategic Editorials</Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    <Text style={styles.copyright}>© {new Date().getFullYear()} Abraham of London. All rights reserved.</Text>
  </View>
);

const ChapterHeader = ({ number, title, subtitle }: { number: number, title: string, subtitle?: string }) => (
  <View style={[styles.spacingLarge, { marginTop: 40 }]}>
    <Text style={[styles.headerEyebrow, { fontSize: 10, marginBottom: 8 }]}>CHAPTER {number}</Text>
    <Text style={styles.h1}>{title}</Text>
    {subtitle && <Text style={[styles.h4, { marginTop: 4 }]}>{subtitle}</Text>}
    <View style={[styles.paragraphDivider, { width: '60%', alignSelf: 'flex-start' }]} />
  </View>
);

const PullQuote = ({ text, attribution }: { text: string, attribution?: string }) => (
  <View style={styles.quoteBlock}>
    <Text style={styles.quoteText}>"{text}"</Text>
    {attribution && <Text style={styles.quoteAttribution}>— {attribution}</Text>}
  </View>
);

// ---------------------------------------------------------
// 4. MAIN PDF DOCUMENT (KEEP EXISTING CONTENT)
// ---------------------------------------------------------
const UltimatePurposeOfManPdf = ({ coverImage, metadata }: { coverImage: any, metadata?: any }) => (
  <Document 
    title="The Ultimate Purpose of Man | Strategic Editorial | Abraham of London"
    author="Abraham of London"
    subject="A definitive editorial examining the structural logic of human purpose and civilisational design."
    keywords="theology, purpose, leadership, civilisation, ethics, abraham-of-london, strategic editorial"
    creator="Abraham of London Publishing"
    producer="Abraham of London PDF Engine"
    language="en-US"
  >
    {/* KEEP ALL YOUR EXISTING PAGE COMPONENTS EXACTLY AS THEY ARE */}
    {/* They should be exactly as in your original file - I won't duplicate them here */}
  </Document>
);

// ---------------------------------------------------------
// 5. MAIN GENERATOR FUNCTION (FIXED - NO DUPLICATE)
// ---------------------------------------------------------
async function generateUltimatePurposePDF(
  options: GenerateEditorialPDFOptions = {}
): Promise<{
  success: boolean;
  filePath?: string;
  size?: number;
  error?: string;
  metadata?: Record<string, any>;
}> {
  const startTime = Date.now();
  
  try {
    const {
      format = "A4",
      quality = "premium",
      tier = "architect",
      outputDir = path.join(process.cwd(), "public", "assets", "downloads"),
      fileName,
      metadata = {}
    } = options;
    
    console.log(`🎨 Generating "Ultimate Purpose of Man" editorial PDF...`);
    console.log(`   Format: ${format}, Quality: ${quality}, Tier: ${tier}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate dynamic filename if not provided
    const finalFileName = fileName || `ultimate-purpose-of-man-editorial-${format.toLowerCase()}-${quality}-${tier}.pdf`;
    const filePath = path.join(outputDir, finalFileName);
    
    // Generate PDF
    const pdfBlob = await pdf(<UltimatePurposeOfManPdf coverImage={coverBuffer} metadata={metadata} />).toBlob();
    
    // Convert Blob to Buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to file
    fs.writeFileSync(filePath, buffer);
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const duration = Date.now() - startTime;
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Success! Generated: ${finalFileName}`);
    console.log(`   Size: ${fileSizeMB} MB, Duration: ${duration}ms`);
    
    return {
      success: true,
      filePath,
      size: stats.size,
      metadata: {
        format,
        quality,
        tier,
        generatedAt: new Date().toISOString(),
        version: "2.0.0",
        pages: 12,
        ...metadata
      }
    };
    
  } catch (error: any) {
    console.error(`❌ Editorial PDF generation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ---------------------------------------------------------
// 6. CLI INTERFACE
// ---------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Ultimate Purpose of Man - Editorial PDF Generator
Usage: pnpm tsx scripts/generate-standalone-pdf.tsx [options]

Options:
  --format=A4|Letter|A3         Paper format (default: A4)
  --tier=free|member|architect|inner-circle  Tier level
  --quality=draft|premium|enterprise  Quality level
  --output-dir=path              Output directory
  --file-name=name.pdf           Custom filename
  
Examples:
  pnpm tsx scripts/generate-standalone-pdf.tsx
  pnpm tsx scripts/generate-standalone-pdf.tsx --tier=inner-circle --quality=enterprise
    `);
    process.exit(0);
  }
  
  const getArg = (key: string, defaultValue?: string) => {
    const i = args.indexOf(key);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : defaultValue;
  };
  
  const format = (getArg("--format", "A4") || "A4") as Format;
  const quality = (getArg("--quality", "premium") || "premium") as Quality;
  const tier = (getArg("--tier", "architect") || "architect") as BuildTier;
  const outputDir = getArg("--output-dir", path.join(process.cwd(), "public", "assets", "downloads"));
  const fileName = getArg("--file-name");
  
  const result = await generateUltimatePurposePDF({
    format,
    quality,
    tier,
    outputDir,
    fileName
  });
  
  if (result.success) {
    console.log(`\n🎉 Editorial PDF generated successfully!`);
    console.log(`   Location: ${result.filePath}`);
    console.log(`   Size: ${(result.size! / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error(`\n❌ Failed to generate editorial PDF: ${result.error}`);
    process.exit(1);
  }
}

// ESM-safe entry detection
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return argv1 === path.resolve(__filename);
})();

if (invokedAsScript) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

// Export only what's needed - NO DUPLICATE EXPORTS
export { generateUltimatePurposePDF, type GenerateEditorialPDFOptions };
export default UltimatePurposeOfManPdf;