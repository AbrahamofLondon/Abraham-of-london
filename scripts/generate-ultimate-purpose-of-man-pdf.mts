// scripts/generate-ultimate-purpose-of-man-pdf.mts
// -----------------------------------------------------------------------------
// Premium PDF Generator for "The Ultimate Purpose of Man"
// Enhanced with luxury aesthetics and production-grade quality
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
  Link,
  Font,
} from "@react-pdf/renderer";

// -----------------------------------------------------------------------------
// Font Registration (Premium Typography)
// -----------------------------------------------------------------------------

// Register fonts for luxury typography
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFufAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Playfair Display",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtXK-F2qC0s.woff2",
      fontWeight: 600,
    },
  ],
});

// -----------------------------------------------------------------------------
// Constants / Paths
// -----------------------------------------------------------------------------

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "downloads");
const OUTPUT_PATH = path.join(
  OUTPUT_DIR,
  "the-ultimate-purpose-of-man-premium-edition.pdf",
);

const COVER_IMAGE_PATH = path.join(
  ROOT,
  "public",
  "assets",
  "images",
  "purpose-cover.jpg",
);

// -----------------------------------------------------------------------------
// Luxury Design System
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Document
  document: {
    fontFamily: "Inter",
    fontSize: 11,
  },

  // Page Layout
  page: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 60,
    backgroundColor: "#0a0a0f",
    position: "relative",
  },

  // Premium Cover
  coverPage: {
    paddingTop: 80,
    paddingBottom: 80,
    paddingHorizontal: 80,
    backgroundColor: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
    position: "relative",
    overflow: "hidden",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 10, 15, 0.8)",
  },
  coverContent: {
    position: "relative",
    zIndex: 2,
  },
  coverLabel: {
    fontFamily: "Inter",
    fontSize: 9,
    color: "#d4af37",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 20,
    fontWeight: 600,
  },
  coverTitle: {
    fontFamily: "Playfair Display",
    fontSize: 36,
    color: "#ffffff",
    marginBottom: 12,
    lineHeight: 1.1,
    fontWeight: 600,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 32,
    lineHeight: 1.4,
    fontStyle: "italic",
  },
  coverTagline: {
    fontSize: 11,
    color: "#d1d5db",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  coverAuthor: {
    fontSize: 12,
    color: "#fbbf24",
    marginTop: 32,
    fontWeight: 600,
  },
  coverBrand: {
    marginTop: 4,
    fontSize: 9,
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  coverDivider: {
    marginVertical: 32,
    height: 1,
    backgroundColor: "linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)",
  },
  coverImageWrapper: {
    marginTop: 32,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  },
  coverImage: {
    width: "100%",
    height: 240,
    objectFit: "cover",
  },

  // Typography System
  heading1: {
    fontFamily: "Playfair Display",
    fontSize: 20,
    color: "#ffffff",
    marginBottom: 16,
    fontWeight: 600,
    letterSpacing: -0.2,
  },
  heading2: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    color: "#f3f4f6",
    marginTop: 24,
    marginBottom: 12,
    fontWeight: 600,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.3)",
  },
  heading3: {
    fontSize: 12,
    color: "#e5e7eb",
    marginTop: 16,
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  introLead: {
    fontSize: 11,
    color: "#e5e7eb",
    marginBottom: 12,
    lineHeight: 1.6,
    letterSpacing: 0.1,
  },
  paragraph: {
    fontSize: 10,
    color: "#d1d5db",
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: "justify",
    letterSpacing: 0.05,
  },
  quote: {
    fontSize: 10,
    color: "#e5e7eb",
    borderLeftWidth: 3,
    borderLeftColor: "#d4af37",
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 12,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  smallCapsLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#d4af37",
    marginBottom: 8,
    fontWeight: 600,
  },

  // Lists
  bulletList: {
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 12,
    fontSize: 8,
    color: "#d4af37",
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 9,
    color: "#d1d5db",
    flex: 1,
    lineHeight: 1.4,
  },

  // Premium Components
  frameworkBox: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  frameworkTitle: {
    fontSize: 10,
    color: "#d4af37",
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  frameworkLine: {
    fontSize: 9,
    color: "#d1d5db",
    marginBottom: 3,
    lineHeight: 1.4,
  },
  calloutBox: {
    marginTop: 14,
    marginBottom: 14,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(75, 85, 99, 0.4)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  calloutTitle: {
    fontSize: 10,
    color: "#d4af37",
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 0.3,
  },

  // Links
  link: {
    color: "#d4af37",
    textDecoration: "none",
    fontWeight: 600,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 8,
    color: "#6b7280",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(75, 85, 99, 0.3)",
    paddingTop: 8,
  },
  pageNumber: {
    fontFamily: "Inter",
    fontSize: 8,
    color: "#9ca3af",
  },
});

// -----------------------------------------------------------------------------
// Enhanced Content Structure
// -----------------------------------------------------------------------------

const CONTENT = {
  intro: {
    title: "THE ULTIMATE PURPOSE OF MAN",
    subtitle: "A Strategic Essay for an Age Searching for Itself",
    label: "Premium Edition · Theology · Strategy · Civilisation",
    tagline: "From Eden to modern civilisation — tracing how divine purpose becomes structure, culture, and systems that endure.",
    paragraphs: [
      "Purpose is not discovered by accident. It is not achieved through self-expression, or unlocked by motivational slogans, or summoned by emotional intensity. Purpose is structure, not abstraction — order, not inspiration.",
      "The modern world has mastered activity and forgotten meaning. It has perfected progress and lost direction. It has multiplied options and erased foundations.",
      "This essay is not a pep talk. It is not a promise. It is a demonstration of how purpose actually functions in reality — historically, theologically, strategically.",
      "Purpose is not something we chase. It is something we align with."
    ]
  },

  sections: [
    {
      title: "1. THE GARDEN — PURPOSE AS STRUCTURE, NOT MYTH",
      quote: "“The Lord God took the man and put him in the garden to work it and keep it.” — Genesis 2:15",
      points: [
        "Eden was not a paradise escape. It was a deployment zone.",
        "The man was placed — location as intentionality",
        "Given identity — Imago Dei before task-bearer",
        "Given work — cultivate, govern, develop, extend order",
        "Given boundaries — responsibility frames freedom",
        "Given presence — relationship as operating environment"
      ],
      framework: {
        title: "Garden Operating Model — Identity to Culture",
        model: "Identity → Assignment → Responsibility → Culture",
        note: "Eden is not nostalgia. It is design. Purpose begins in alignment with created order."
      }
    },

    {
      title: "2. ANCIENT LIVES — WHAT PURPOSE LOOKS LIKE UNDER PRESSURE",
      intro: "Scripture is not a collection of inspirational stories; it is a record of how purpose behaves in conflict, delay, loss, power, failure, and restoration.",
      figures: [
        { name: "Job — Integrity Under Suffering", text: "Purpose holds even when everything else collapses." },
        { name: "Moses — Assignment After Delay", text: "Purpose waits until character can carry weight." },
        { name: "Abraham — Direction Through Trust", text: "Purpose is walked out step-by-step, not leap-by-leap." },
        { name: "David — Formation in Hiddenness", text: "Purpose is shaped in obscurity long before influence." },
        { name: "Solomon — Discernment Through Wisdom", text: "Purpose without wisdom becomes vanity." }
      ],
      conclusion: "These lives demonstrate one thing with clarity: purpose is operational even in disorder."
    }
  ]
};

// -----------------------------------------------------------------------------
// Premium PDF Component
// -----------------------------------------------------------------------------

const UltimatePurposeOfManPdf = ({ hasCoverImage }: { hasCoverImage: boolean }) => (
  <Document
    title="The Ultimate Purpose of Man - Premium Edition"
    author="AbrahamofLondon"
    subject="Theology, Strategy, Leadership"
    keywords="purpose, theology, strategy, leadership, civilisation"
    style={styles.document}
  >
    {/* Luxury Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverOverlay} />
      <View style={styles.coverContent}>
        <Text style={styles.coverLabel}>PREMIUM STRATEGIC ESSAY</Text>
        <Text style={styles.coverTitle}>THE ULTIMATE{'\n'}PURPOSE OF MAN</Text>
        <Text style={styles.coverSubtitle}>
          A Strategic Examination for an Age{'\n'}in Search of Itself
        </Text>
        
        <View style={styles.coverDivider} />
        
        <Text style={styles.coverTagline}>
          From the structured order of Eden to the architectural foundations of modern civilisation — 
          this essay traces how divine purpose becomes operational structure, enduring culture, 
          and systems that withstand the pressure of centuries.
        </Text>

        <Text style={styles.coverAuthor}>by AbrahamofLondon</Text>
        <Text style={styles.coverBrand}>
          Abraham of London · Faith-rooted strategy for fathers, founders, and leaders
        </Text>

        {hasCoverImage && (
          <View style={styles.coverImageWrapper}>
            <Image src={COVER_IMAGE_PATH} style={styles.coverImage} />
          </View>
        )}
      </View>
    </Page>

    {/* Introduction Page */}
    <Page size="A4" style={styles.page}>
      <View wrap={false}>
        <Text style={styles.heading1}>The Ultimate Purpose of Man</Text>
        <Text style={styles.smallCapsLabel}>
          Introduction — Purpose Is Not a Sentiment
        </Text>
        
        {CONTENT.intro.paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>

      {/* Section 1 */}
      <View wrap={false}>
        <Text style={styles.heading2}>{CONTENT.sections[0].title}</Text>
        <Text style={styles.quote}>{CONTENT.sections[0].quote}</Text>
        
        <View style={styles.bulletList}>
          {CONTENT.sections[0].points.map((point, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.frameworkBox}>
          <Text style={styles.frameworkTitle}>
            {CONTENT.sections[0].framework.title}
          </Text>
          <Text style={styles.frameworkLine}>
            {CONTENT.sections[0].framework.model}
          </Text>
          <Text style={styles.frameworkLine}>
            {CONTENT.sections[0].framework.note}
          </Text>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text>“The Ultimate Purpose of Man” — Premium Edition</Text>
        <Text style={styles.pageNumber}>Page 1</Text>
      </View>
    </Page>

    {/* Additional sections would continue here... */}
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.heading2}>Continuing the Exploration</Text>
        <Text style={styles.paragraph}>
          This premium edition continues with detailed examinations of ancient lives under pressure, 
          the blueprint revealed in Jesus, comparative worldview analysis, and the historical impact 
          of Christian thought on modern civilisation.
        </Text>
        
        <View style={styles.calloutBox}>
          <Text style={styles.calloutTitle}>Complete Framework Included</Text>
          <Text style={styles.paragraph}>
            The full essay includes operational frameworks for dominion, leadership matrices, 
            and strategic protocols that transform purpose from abstract concept to lived reality.
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Each section builds upon the last, creating a comprehensive architecture for understanding 
          and implementing human purpose at both individual and civilisational levels.
        </Text>
      </View>

      <View style={styles.footer} fixed>
        <Text>
          Visit{" "}
          <Link src="https://abrahamoflondon.org" style={styles.link}>
            abrahamoflondon.org
          </Link>{" "}
          for complete content
        </Text>
        <Text style={styles.pageNumber}>Page 2</Text>
      </View>
    </Page>
  </Document>
);

// -----------------------------------------------------------------------------
// Main Execution
// -----------------------------------------------------------------------------

async function main() {
  console.log("[pdf] Generating 'The Ultimate Purpose of Man - Premium Edition'...");

  const hasCoverImage = fs.existsSync(COVER_IMAGE_PATH);
  if (!hasCoverImage) {
    console.warn(
      "[pdf] Cover image not found at:",
      COVER_IMAGE_PATH,
      "\n[pdf] The PDF will be generated without a cover image."
    );
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    const doc = <UltimatePurposeOfManPdf hasCoverImage={hasCoverImage} />;
    const instance = pdf(doc);
    const buffer = await instance.toBuffer();
    
    fs.writeFileSync(OUTPUT_PATH, buffer);
    
    console.log("[pdf] ✅ Premium PDF generated successfully!");
    console.log("[pdf] 📁 Output:", OUTPUT_PATH);
    console.log("[pdf] 💎 Features: Luxury typography, premium layout, enhanced readability");
    
  } catch (error) {
    console.error("[pdf] ❌ Error generating PDF:", error);
    process.exit(1);
  }
}

// Execute with proper error handling
main().catch((error) => {
  console.error("[pdf] Fatal error:", error);
  process.exit(1);
});