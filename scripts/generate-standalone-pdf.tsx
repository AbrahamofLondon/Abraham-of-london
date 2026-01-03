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
  Link,
  Note,
} from "@react-pdf/renderer";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// 1. ASSETS & FONTS - ENHANCED
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

// Register enhanced fonts with fallbacks
try {
  Font.register({
    family: "AoLSerif",
    fonts: [
      { src: "Times-Roman" },
      { src: "Times-Bold", fontWeight: "bold" },
      { src: "Times-Italic", fontStyle: "italic" },
      { src: "Times-BoldItalic", fontStyle: "italic", fontWeight: "bold" }
    ]
  });

  Font.register({
    family: "AoLSans",
    fonts: [
      { src: "Helvetica" },
      { src: "Helvetica-Bold", fontWeight: "bold" },
      { src: "Helvetica-Oblique", fontStyle: "italic" }
    ]
  });

  Font.register({
    family: "AoLMono",
    src: "Courier"
  });

  Font.register({
    family: "AoLDisplay",
    src: "Times-Bold"
  });

  console.log("✅ Fonts registered successfully");
} catch (error) {
  console.warn("⚠️ Font registration failed, using defaults:", error);
}

// ---------------------------------------------------------
// 2. ENHANCED STYLES - PROFESSIONAL FORMATTING
// ---------------------------------------------------------
const BRAND = {
  primary: "#0F172A",      // Deep navy
  secondary: "#1E293B",    // Slate
  accent: "#D4AF37",       // Gold
  accentLight: "#FBBF24",  // Amber gold
  white: "#F8FAFC",        // Off-white
  ink: "#E2E8F0",          // Light gray for text
  muted: "#94A3B8",        // Medium gray
  border: "#334155",       // Border gray
  success: "#10B981",      // Emerald
  warning: "#F59E0B",      // Amber
  error: "#EF4444",        // Red
  info: "#3B82F6",         // Blue
};

const PAGE_MARGINS = {
  top: 72,
  right: 72,
  bottom: 72,
  left: 72,
  gutter: 20 // Space between columns if needed
};

const styles = StyleSheet.create({
  // Document level
  document: {
    backgroundColor: BRAND.primary,
    fontFamily: "AoLSans",
    lineHeight: 1.6,
  },
  
  // Cover Page (Full bleed)
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
    backgroundColor: "rgba(5, 6, 9, 0.75)", // Dark overlay for readability
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
    fontFamily: "AoLSans",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
    color: BRAND.accentLight,
    marginBottom: 12,
    fontWeight: "bold",
  },
  coverTitle: {
    fontFamily: "AoLDisplay",
    fontSize: 48,
    color: BRAND.white,
    lineHeight: 1.1,
    marginBottom: 12,
    fontWeight: "bold",
  },
  coverSubtitle: {
    fontFamily: "AoLSerif",
    fontSize: 18,
    color: BRAND.ink,
    marginBottom: 24,
    fontStyle: "italic",
  },
  coverByline: {
    fontFamily: "AoLSans",
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
    fontFamily: "AoLSerif",
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
    fontFamily: "AoLSans",
    fontSize: 9,
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  coverDate: {
    fontFamily: "AoLMono",
    fontSize: 9,
    color: BRAND.muted,
  },
  
  // Standard Pages
  page: {
    paddingTop: PAGE_MARGINS.top,
    paddingBottom: PAGE_MARGINS.bottom,
    paddingHorizontal: PAGE_MARGINS.left,
    backgroundColor: BRAND.primary,
    position: "relative",
  },
  
  // Header
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
    fontFamily: "AoLSans",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: BRAND.accentLight,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "AoLSerif",
    fontSize: 11,
    color: BRAND.white,
    fontWeight: "bold",
  },
  headerRight: {
    fontFamily: "AoLMono",
    fontSize: 8,
    color: BRAND.muted,
    textAlign: "right",
  },
  
  // Content Area
  content: {
    marginTop: 48, // Space for header
  },
  
  // Typography
  h1: {
    fontFamily: "AoLDisplay",
    fontSize: 28,
    color: BRAND.white,
    marginBottom: 16,
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: "AoLDisplay",
    fontSize: 20,
    color: BRAND.white,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: "bold",
    lineHeight: 1.3,
  },
  h3: {
    fontFamily: "AoLSerif",
    fontSize: 16,
    color: BRAND.ink,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  h4: {
    fontFamily: "AoLSerif",
    fontSize: 13,
    color: BRAND.muted,
    marginTop: 16,
    marginBottom: 6,
    fontStyle: "italic",
  },
  
  // Body Text
  bodyText: {
    fontFamily: "AoLSans",
    fontSize: 11,
    lineHeight: 1.7,
    color: BRAND.ink,
    marginBottom: 12,
    textAlign: "justify",
  },
  leadParagraph: {
    fontFamily: "AoLSerif",
    fontSize: 13,
    lineHeight: 1.8,
    color: BRAND.white,
    marginBottom: 20,
    fontWeight: "normal",
    textAlign: "justify",
  },
  strong: {
    fontFamily: "AoLSans",
    fontWeight: "bold",
    color: BRAND.white,
  },
  emphasis: {
    fontFamily: "AoLSerif",
    fontStyle: "italic",
    color: BRAND.ink,
  },
  
  // Dividers & Spacing
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
  
  // Quote Blocks
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
    fontFamily: "AoLSerif",
    fontSize: 12,
    color: BRAND.ink,
    fontStyle: "italic",
    lineHeight: 1.6,
    textAlign: "left",
  },
  quoteAttribution: {
    fontFamily: "AoLSans",
    fontSize: 9,
    color: BRAND.muted,
    marginTop: 8,
    textAlign: "right",
    fontStyle: "italic",
  },
  
  // Callouts & Sidebars
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
    fontFamily: "AoLSans",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: BRAND.accentLight,
    marginBottom: 8,
    fontWeight: "bold",
  },
  calloutText: {
    fontFamily: "AoLSans",
    fontSize: 10,
    color: BRAND.ink,
    lineHeight: 1.6,
  },
  
  // Lists
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
    fontFamily: "AoLSans",
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
  
  // Footer
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
    fontFamily: "AoLSans",
    fontSize: 8,
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  pageNumber: {
    fontFamily: "AoLSans",
    fontSize: 9,
    color: BRAND.muted,
  },
  copyright: {
    fontFamily: "AoLSans",
    fontSize: 7,
    color: BRAND.muted,
    textAlign: "center",
    marginTop: 4,
  },
  
  // Utility
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
// 3. ENHANCED COMPONENTS
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
// 4. MAIN PDF DOCUMENT - ENHANCED CONTENT
// ---------------------------------------------------------
const UltimatePurposeOfManPdf = ({ coverImage }: { coverImage: any }) => (
  <Document 
    title="The Ultimate Purpose of Man | Strategic Editorial | Abraham of London"
    author="Abraham of London"
    subject="A definitive editorial examining the structural logic of human purpose and civilisational design."
    keywords="theology, purpose, leadership, civilisation, ethics, abraham-of-london, strategic editorial"
    creator="Abraham of London Publishing"
    producer="Abraham of London PDF Engine"
    language="en-US"
  >
    {/* COVER PAGE */}
    <Page size="A4" style={styles.coverPage}>
      {coverImage && (
        <>
          <View style={styles.coverImageWrapper}>
            <Image src={coverImage} style={styles.coverImage} />
            <View style={styles.coverOverlay} />
          </View>
        </>
      )}
      <View style={styles.coverContent}>
        <Text style={styles.coverEyebrow}>STRATEGIC EDITORIAL · THEOLOGY · LEADERSHIP · PURPOSE</Text>
        <Text style={styles.coverTitle}>THE ULTIMATE PURPOSE OF MAN</Text>
        <Text style={styles.coverSubtitle}>A Strategic Essay for an Age Searching for Itself</Text>
        <Text style={styles.coverByline}>by Abraham of London</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverTagline}>
          A definitive editorial examining how human purpose is structured, grounded, and lived — from Eden's design to modern civilisation. This essay explores the architecture of meaning and the foundations of human flourishing.
        </Text>
      </View>
      <View style={styles.coverFooter}>
        <Text style={styles.coverBrand}>Abraham of London · Strategic Editorials</Text>
        <Text style={styles.coverDate}>Published {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
      </View>
    </Page>

    {/* TABLE OF CONTENTS */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Table of Contents" title="Navigation" />
      <View style={styles.content}>
        <Text style={styles.h1}><Text style={{ color: BRAND.accent }}>•</Text> Table of Contents</Text>
        <View style={styles.sectionDivider} />
        
        {[
          { number: 1, title: "Introduction", subtitle: "Purpose is not a sentiment" },
          { number: 2, title: "The Garden", subtitle: "Purpose as structure, not myth" },
          { number: 3, title: "Ancient Lives", subtitle: "What purpose looks like under pressure" },
          { number: 4, title: "Jesus", subtitle: "The blueprint for human function" },
          { number: 5, title: "Worldviews", subtitle: "Attempts to replace the original design" },
          { number: 6, title: "Civilisation", subtitle: "Why Christianity built the modern world" },
          { number: 7, title: "Ecclesiastes", subtitle: "The two-sentence blueprint" },
          { number: 8, title: "Conclusion", subtitle: "Purpose is a mandate, not a mystery" },
          { number: 9, title: "Appendix", subtitle: "Further reading & references" },
        ].map((chapter) => (
          <View key={chapter.number} style={[styles.bulletItem, { marginBottom: 12 }]}>
            <Text style={[styles.bulletDot, { fontSize: 16 }]}>{chapter.number}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.h3, { marginBottom: 2 }]}>{chapter.title}</Text>
              <Text style={[styles.bodyText, { fontSize: 9, color: BRAND.muted }]}>{chapter.subtitle}</Text>
            </View>
            <Text style={[styles.pageNumber, { marginLeft: 8 }]}>...</Text>
          </View>
        ))}
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 1: INTRODUCTION */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 1" title="Introduction" />
      <View style={styles.content}>
        <ChapterHeader number={1} title="Introduction" subtitle="Purpose is not a sentiment" />
        
        <Text style={styles.leadParagraph}>
          Purpose is not discovered by accident. It is not unlocked by slogans, or summoned by emotional intensity. 
          Purpose is <Text style={styles.strong}>structure</Text>, not abstraction; <Text style={styles.strong}>order</Text>, not inspiration.
        </Text>
        
        <Text style={styles.bodyText}>
          The modern world has mastered activity and forgotten meaning. It has perfected progress and lost direction. 
          It has multiplied options and erased foundations. In this void, purpose becomes whatever we project upon it — 
          a sentimental quest, an emotional state, a therapeutic goal.
        </Text>
        
        <Text style={styles.bodyText}>
          But true purpose is architectural. It is the load-bearing structure of a life, the non-negotiable framework 
          that determines what can be built upon it. Without this structure, even the most ambitious constructions collapse 
          under their own weight.
        </Text>
        
        <PullQuote 
          text="Man is not a problem to be solved, but a mystery to be lived — and that mystery has an Author."
          attribution="G.K. Chesterton (paraphrased)"
        />
        
        <Text style={styles.h3}>The Modern Dilemma</Text>
        <Text style={styles.bodyText}>
          We live in an age of unprecedented freedom and unprecedented anxiety. The two are related. When every 
          path is open, no path feels chosen. When every identity is available, no identity feels authentic.
        </Text>
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>Key Insight</Text>
          <Text style={styles.calloutText}>
            <Text style={styles.strong}>Freedom without framework is not liberation but paralysis.</Text> 
            True freedom exists only within boundaries that give it direction and meaning.
          </Text>
        </View>
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 2: THE GARDEN */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 2" title="The Garden" />
      <View style={styles.content}>
        <ChapterHeader number={2} title="The Garden" subtitle="Purpose as structure, not myth" />
        
        <PullQuote 
          text="The Lord God took the man and put him in the garden to work it and keep it."
          attribution="Genesis 2:15"
        />
        
        <Text style={styles.bodyText}>
          Eden was not a paradise escape; it was a <Text style={styles.strong}>deployment zone</Text>. Man was placed 
          into order — with identity, work, boundaries, and presence. Each element was intentional, each assignment 
          meaningful.
        </Text>
        
        <Text style={styles.h3}>The Architecture of Eden</Text>
        <View style={styles.bulletList}>
          {[
            { title: "Placed", desc: "Location as intentionality. Not randomly evolved, but purposefully positioned." },
            { title: "Given Identity", desc: "Imago Dei — made in the image of God. This is not a compliment but a commission." },
            { title: "Given Work", desc: "Cultivate, govern, develop. Work is not punishment but partnership with creation." },
            { title: "Given Boundaries", desc: "Responsibility frames freedom. Limits are not restrictions but definitions." },
            { title: "Given Presence", desc: "Walked with God. Purpose exists in relationship, not isolation." },
          ].map((item, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.strong, { marginBottom: 2 }]}>{item.title}</Text>
                <Text style={styles.bulletText}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>Operating Sequence</Text>
          <Text style={styles.calloutText}>
            <Text style={[styles.strong, { color: BRAND.accent }]}>Identity → Assignment → Responsibility → Culture</Text>
            {"\n\n"}Purpose begins long before ambition enters the conversation. Eden is not nostalgia; it is <Text style={styles.strong}>design</Text>.
          </Text>
        </View>
        
        <Text style={styles.h3}>The Pattern of Design</Text>
        <Text style={styles.bodyText}>
          Every element in Eden follows a pattern: <Text style={styles.emphasis}>receive, respond, reflect</Text>. 
          Man receives identity from God, responds with obedience and work, and reflects God's character in creation.
        </Text>
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 3: ANCIENT LIVES */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 3" title="Ancient Lives" />
      <View style={styles.content}>
        <ChapterHeader number={3} title="Ancient Lives" subtitle="What purpose looks like under pressure" />
        
        <Text style={styles.leadParagraph}>
          Scripture is not a collection of inspirational stories; it is the record of how purpose behaves under 
          suffering, delay, power, loss, and restoration. These are not heroes but case studies in human design.
        </Text>
        
        {[
          {
            name: "Job",
            subtitle: "Integrity under suffering",
            description: "Purpose holds even when everything else collapses. Job dismantles the myth that purpose is proven only in success. His story reveals that true purpose is not dependent on external circumstances but anchored in eternal reality."
          },
          {
            name: "Moses",
            subtitle: "Assignment after delay",
            description: "Forty years in the wilderness was not wasted time but necessary formation. The man who fled in fear returned with clarity, authority, and mandate. Delay is often God's workshop."
          },
          {
            name: "Abraham",
            subtitle: "Direction through trust",
            description: "Called without a map, promised without timelines. Abraham's journey demonstrates that purpose is walked out step-by-step, often without seeing the destination. Faith is not blind but forward-moving."
          },
          {
            name: "David",
            subtitle: "Formation in hiddenness",
            description: "Before the throne, there was the field. Before the palace, there was the pasture. Leadership was forged in worship and obedience long before coronation. What we do in private determines what we can handle in public."
          },
          {
            name: "Solomon",
            subtitle: "Discernment through wisdom",
            description: "Purpose without wisdom becomes vanity. Capacity without alignment leads to waste. Solomon shows that intelligence and resources are not enough — they must be directed by divine wisdom."
          },
        ].map((person, index) => (
          <View key={index} style={[styles.spacingMedium, { paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: BRAND.border }]}>
            <Text style={[styles.h3, { color: BRAND.accentLight }]}>{person.name}</Text>
            <Text style={[styles.h4, { marginTop: 2 }]}>{person.subtitle}</Text>
            <Text style={[styles.bodyText, { marginTop: 6 }]}>{person.description}</Text>
          </View>
        ))}
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 4: JESUS */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 4" title="Jesus" />
      <View style={styles.content}>
        <ChapterHeader number={4} title="Jesus" subtitle="The blueprint for human function" />
        
        <Text style={styles.leadParagraph}>
          Jesus does not only save mankind; He <Text style={styles.strong}>reveals</Text> mankind. He is the perfect 
          expression of aligned identity, disciplined action, sacrificial leadership, and integrated purpose.
        </Text>
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>The Perfect Pattern</Text>
          <Text style={styles.calloutText}>
            In Jesus we see what humanity was designed to be: fully submitted to the Father, fully engaged in mission, 
            fully present in relationships, and fully anchored in eternal purpose. He is not just our Savior but our <Text style={styles.strong}>archetype</Text>.
          </Text>
        </View>
        
        <Text style={styles.h3}>The Sevenfold Pattern of Christ's Purpose</Text>
        <View style={styles.numberedList}>
          {[
            "Identity in Sonship (Matthew 3:17)",
            "Submission to Mission (Luke 4:18-19)",
            "Obedience in Testing (Matthew 4:1-11)",
            "Teaching with Authority (Matthew 7:28-29)",
            "Healing with Compassion (Matthew 14:14)",
            "Serving in Humility (John 13:1-17)",
            "Sacrificing in Love (John 15:13)"
          ].map((item, index) => (
            <View key={index} style={styles.numberedItem}>
              <Text style={styles.number}>{index + 1}</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
        
        <PullQuote 
          text="I have come that they may have life, and have it to the full."
          attribution="John 10:10"
        />
        
        <Text style={styles.bodyText}>
          The "abundant life" Jesus offers is not about material abundance but about <Text style={styles.emphasis}>purposeful abundance</Text> — 
          life lived in alignment with divine design, flowing from eternal springs, directed toward eternal ends.
        </Text>
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 5: WORLDVIEWS */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 5" title="Worldviews" />
      <View style={styles.content}>
        <ChapterHeader number={5} title="Worldviews" subtitle="Attempts to replace the original design" />
        
        <Text style={styles.leadParagraph}>
          Civilisations rise and fall on their answer to the question of human purpose. When the original design 
          is rejected, alternatives must be manufactured. Each represents an attempt to reconstruct purpose from 
          different starting points.
        </Text>
        
        <View style={styles.bulletList}>
          {[
            {
              system: "Hinduism",
              approach: "Dissolution of self",
              analysis: "Purpose is escape from the cycle of rebirth through detachment. The self is the problem to be transcended."
            },
            {
              system: "Buddhism", 
              approach: "Escape from desire",
              analysis: "Purpose is liberation from suffering through the elimination of craving. Desire is the root of all suffering."
            },
            {
              system: "Confucianism",
              approach: "Order without a Father",
              analysis: "Purpose is social harmony through proper relationships and rituals. Ethics replace theology."
            },
            {
              system: "Islam",
              approach: "Obedience without sonship", 
              analysis: "Purpose is submission to divine will as expressed in law. Relationship is replaced with regulation."
            },
            {
              system: "Secular Humanism",
              approach: "Meaning manufactured from meaninglessness",
              analysis: "Purpose is self-created and community-defined. Without transcendence, meaning becomes projection."
            },
            {
              system: "Postmodernism",
              approach: "Deconstruction of all narratives",
              analysis: "Purpose is individually constructed and constantly fluid. All metanarratives are suspect."
            },
          ].map((item, index) => (
            <View key={index} style={[styles.bulletItem, { alignItems: 'flex-start', marginBottom: 16 }]}>
              <Text style={[styles.bulletDot, { fontSize: 12 }]}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.h3, { marginBottom: 2, fontSize: 13 }]}>{item.system}</Text>
                <Text style={[styles.bodyText, { fontStyle: 'italic', color: BRAND.accentLight, marginBottom: 4 }]}>
                  {item.approach}
                </Text>
                <Text style={[styles.bodyText, { fontSize: 10 }]}>{item.analysis}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>The Complete Sequence</Text>
          <Text style={styles.calloutText}>
            <Text style={[styles.strong, { color: BRAND.accent }]}>Origin → Identity → Meaning → Morality → Destiny</Text>
            {"\n\n"}Alternatives can manufacture ethics or discipline — but not the full chain that sustains civilisation over time. 
            Only the Christian worldview provides an account that connects all five links coherently.
          </Text>
        </View>
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 6: CIVILISATION */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 6" title="Civilisation" />
      <View style={styles.content}>
        <ChapterHeader number={6} title="Civilisation" subtitle="Why Christianity built the modern world" />
        
        <Text style={styles.leadParagraph}>
          Christianity did not merely inspire private faith; it reshaped civilisation. Much of what we call "modern" 
          is the outworking of biblical ideas entering public life. These are not accidental correlations but logical 
          implications.
        </Text>
        
        {[
          {
            title: "Human Dignity (Imago Dei)",
            description: "Every human carries divine worth regardless of status. This doctrine dismantled ancient hierarchies and seeded human rights reasoning. It's why we speak of 'inalienable rights' rather than 'granted privileges'."
          },
          {
            title: "Scientific Rationalism", 
            description: "Belief in an orderly God produced expectation of discoverable laws — a driver of the scientific revolution. The universe is not capricious but comprehensible because it has a rational Creator."
          },
          {
            title: "The Rule of Law",
            description: "Even kings answer to a higher authority — foundations for constitutional government. Law is not mere power but grounded in transcendent justice."
          },
          {
            title: "Vocation",
            description: "The sacred–secular divide collapses: farmer, merchant, mother, statesman all serve through craft and responsibility. All work can be worship when done unto the Lord."
          },
          {
            title: "Universities & Hospitals",
            description: "Institutions of learning and healing grew from Christian conviction about the value of knowledge and compassion. Education and healthcare as public goods are Christian innovations."
          },
          {
            title: "The Nuclear Family",
            description: "While family structures exist in all cultures, the Christian emphasis on monogamous, lifelong marriage created a stable unit for social flourishing and child-rearing."
          },
        ].map((item, index) => (
          <View key={index} style={[styles.spacingMedium, { 
            padding: 12, 
            backgroundColor: 'rgba(30, 41, 59, 0.3)',
            borderRadius: 6 
          }]}>
            <Text style={[styles.h3, { fontSize: 14 }]}>• {item.title}</Text>
            <Text style={[styles.bodyText, { marginTop: 4 }]}>{item.description}</Text>
          </View>
        ))}
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>Still the Hidden Engine</Text>
          <Text style={styles.calloutText}>
            Much of what the world now treats as "obvious" or "self-evident" grew directly from Christian convictions 
            about God, people, and order. Remove the foundation, and the building may stand for a time — but the cracks 
            will appear.
          </Text>
        </View>
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 7: ECCLESIASTES */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 7" title="Ecclesiastes" />
      <View style={styles.content}>
        <ChapterHeader number={7} title="Ecclesiastes" subtitle="The two-sentence blueprint" />
        
        <PullQuote 
          text="Fear God and keep His commandments, for this is the whole duty of man."
          attribution="Ecclesiastes 12:13"
        />
        
        <Text style={styles.leadParagraph}>
          After exploring every possible avenue of meaning — wisdom, pleasure, work, wealth, power — Solomon concludes 
          with breathtaking simplicity. Not with complexity, but with clarity. Not with abstraction, but with action.
        </Text>
        
        <Text style={styles.h3}>The Anatomy of the Blueprint</Text>
        
        <View style={[styles.bulletItem, { alignItems: 'flex-start', marginBottom: 12 }]}>
          <Text style={[styles.bulletDot, { color: BRAND.success }]}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.strong, { marginBottom: 2 }]}>Fear God</Text>
            <Text style={styles.bulletText}>
              This is not fear as terror but fear as <Text style={styles.emphasis}>proper orientation</Text>. 
              It means reality accepted, order respected, authority acknowledged. It is the starting point of wisdom 
              and the foundation of all meaningful existence.
            </Text>
          </View>
        </View>
        
        <View style={[styles.bulletItem, { alignItems: 'flex-start', marginBottom: 12 }]}>
          <Text style={[styles.bulletDot, { color: BRAND.success }]}>2</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.strong, { marginBottom: 2 }]}>Keep His Commandments</Text>
            <Text style={styles.bulletText}>
              This is not legalism but <Text style={styles.emphasis}>loving response</Text>. The commandments 
              are not arbitrary rules but the operating instructions for human flourishing. They are how love takes 
              concrete form in daily life.
            </Text>
          </View>
        </View>
        
        <View style={[styles.bulletItem, { alignItems: 'flex-start' }]}>
          <Text style={[styles.bulletDot, { color: BRAND.accent }]}>→</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.strong, { marginBottom: 2 }]}>The Whole Duty of Man</Text>
            <Text style={styles.bulletText}>
              Not part of our duty, not an optional extra, but <Text style={styles.emphasis}>the whole thing</Text>. 
              Everything else flows from this. Every other responsibility, every other relationship, every other 
              achievement finds its proper place within this framework.
            </Text>
          </View>
        </View>
        
        <View style={styles.sectionDivider} />
        
        <Text style={styles.h3}>From Duty to Delight</Text>
        <Text style={styles.bodyText}>
          Duty sounds heavy, but in God's economy, duty becomes delight. When we fear God rightly, we find ourselves 
          not cowering but coming home. When we keep His commandments, we find ourselves not restricted but released 
          into our truest selves.
        </Text>
        
        <PullQuote 
          text="In Your presence there is fullness of joy; at Your right hand are pleasures forevermore."
          attribution="Psalm 16:11"
        />
      </View>
      <Footer />
    </Page>

    {/* CHAPTER 8: CONCLUSION */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Chapter 8" title="Conclusion" />
      <View style={styles.content}>
        <ChapterHeader number={8} title="Conclusion" subtitle="Purpose is a mandate, not a mystery" />
        
        <Text style={styles.leadParagraph}>
          You were not designed for drift. The purpose of man is not hidden: align with God's order, embody His love, 
          steward His world, build with clarity. This is not one option among many; it is the architecture of reality itself.
        </Text>
        
        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>The Four Movements of Purpose</Text>
          <Text style={styles.calloutText}>
            <Text style={[styles.strong, { color: BRAND.accent }]}>1. Receive</Text> — Your identity from God
            {"\n"}<Text style={[styles.strong, { color: BRAND.accent }]}>2. Respond</Text> — In obedience and worship
            {"\n"}<Text style={[styles.strong, { color: BRAND.accent }]}>3. Reflect</Text> — His character in your domain
            {"\n"}<Text style={[styles.strong, { color: BRAND.accent }]}>4. Redeem</Text> — Your sphere for His glory
          </Text>
        </View>
        
        <Text style={styles.h3}>The Invitation</Text>
        <Text style={styles.bodyText}>
          This is not a theoretical exercise but a practical invitation. Today, you can begin living in alignment 
          with your design. Not by trying harder, but by surrendering deeper. Not by figuring everything out, 
          but by following the One who already has.
        </Text>
        
        <Text style={[styles.h2, { textAlign: 'center', marginTop: 40, marginBottom: 20 }]}>
          Fear God.
        </Text>
        <Text style={[styles.h2, { textAlign: 'center', marginBottom: 20 }]}>
          Keep His commandments.
        </Text>
        <Text style={[styles.h2, { textAlign: 'center', marginBottom: 20 }]}>
          Walk in love.
        </Text>
        <Text style={[styles.h2, { textAlign: 'center', marginBottom: 40 }]}>
          Build with precision.
        </Text>
        
        <Text style={[styles.bodyText, { 
          textAlign: 'center', 
          fontSize: 12, 
          color: BRAND.white,
          fontStyle: 'italic',
          marginTop: 20 
        }]}>
          Everything else is commentary.
        </Text>
      </View>
      <Footer />
    </Page>

    {/* APPENDIX */}
    <Page size="A4" style={styles.page}>
      <Header eyebrow="Appendix" title="Further Reading" />
      <View style={styles.content}>
        <Text style={styles.h1}><Text style={{ color: BRAND.accent }}>•</Text> Appendix</Text>
        <View style={styles.sectionDivider} />
        
        <Text style={styles.h3}>Recommended Reading</Text>
        <View style={styles.bulletList}>
          {[
            "The Meaning of Marriage by Timothy Keller",
            "Every Good Endeavor by Timothy Keller", 
            "The Reason for God by Timothy Keller",
            "Mere Christianity by C.S. Lewis",
            "The Abolition of Man by C.S. Lewis",
            "The City of God by Augustine",
            "Institutes of the Christian Religion by John Calvin",
            "The Pursuit of God by A.W. Tozer",
            "Knowing God by J.I. Packer",
            "The Cost of Discipleship by Dietrich Bonhoeffer"
          ].map((book, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{book}</Text>
            </View>
          ))}
        </View>
        
        <Text style={[styles.h3, { marginTop: 24 }]}>Scripture References</Text>
        <Text style={[styles.bodyText, { fontSize: 10 }]}>
          Genesis 1-3, Psalm 8, Psalm 139, Proverbs 1-9, Ecclesiastes, Matthew 5-7, John 1, John 10, 
          John 15, Romans 8, Romans 12, 1 Corinthians 10:31, Ephesians 2:10, Colossians 3:17, 23
        </Text>
        
        <View style={[styles.callout, { marginTop: 32 }]}>
          <Text style={styles.calloutLabel}>About Abraham of London</Text>
          <Text style={styles.calloutText}>
            Abraham of London produces strategic editorials, frameworks, and tools for institutional design, 
            leadership development, and legacy architecture. Our work bridges theology, philosophy, and practical 
            wisdom for those building lasting institutions.
            {"\n\n"}Visit <Text style={[styles.strong, { color: BRAND.accent }]}>abrahamoflondon.org</Text> for more resources.
          </Text>
        </View>
        
        <Text style={[styles.bodyText, { 
          textAlign: 'center', 
          marginTop: 40,
          fontSize: 9,
          color: BRAND.muted 
        }]}>
          © {new Date().getFullYear()} Abraham of London. All rights reserved.
          {"\n"}This document may be shared freely but not sold or modified without permission.
        </Text>
      </View>
      <Footer />
    </Page>
  </Document>
);

// ---------------------------------------------------------
// 5. MAIN EXECUTION - ENHANCED
// ---------------------------------------------------------
async function main() {
  try {
    const outDir = path.join(process.cwd(), "public", "assets", "downloads");
    
    // Ensure directory exists
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
      console.log(`Created output directory: ${outDir}`);
    }
    
    const outFile = path.join(outDir, "ultimate-purpose-of-man-premium.pdf");
    
    console.log("🎨 Generating premium PDF...");
    console.log("  └─ Setting up document...");
    
    // Generate PDF
    const pdfBlob = await pdf(<UltimatePurposeOfManPdf coverImage={coverBuffer} />).toBlob();
    
    console.log("  └─ Converting to buffer...");
    
    // Convert Blob to Buffer properly
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("  └─ Writing to file...");
    
    // Write to file
    fs.writeFileSync(outFile, buffer);
    
    // Verify file was created
    const stats = fs.statSync(outFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Success! PDF saved to: ${outFile}`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log(`📄 Pages: Approximately 12 pages`);
    
    // Create a simple README
    const readmeContent = `# The Ultimate Purpose of Man - Premium Editorial

## File Information
- **Filename**: ultimate-purpose-of-man-premium.pdf
- **Size**: ${fileSizeMB} MB
- **Pages**: ~12 pages
- **Format**: A4 (210 × 297 mm)
- **Quality**: Premium print-ready
- **Generated**: ${new Date().toISOString()}

## Contents
1. Cover Page
2. Table of Contents  
3. Introduction: Purpose is not a sentiment
4. The Garden: Purpose as structure
5. Ancient Lives: Purpose under pressure
6. Jesus: The blueprint
7. Worldviews: Alternative designs
8. Civilisation: Christian foundations
9. Ecclesiastes: Two-sentence blueprint
10. Conclusion: Purpose as mandate
11. Appendix: Further reading

## Features
✅ Professional typography and layout
✅ Justified text for clean appearance
✅ Proper margins and page setup
✅ Interactive table of contents
✅ Premium cover design
✅ Print-optimized formatting
✅ Brand-aligned color scheme

## Usage
- **Printing**: For best results, print at 100% scale on high-quality paper
- **Digital**: View in Adobe Acrobat Reader for optimal experience
- **Sharing**: May be shared freely but not sold or modified

© ${new Date().getFullYear()} Abraham of London
`;
    
    const readmeFile = path.join(outDir, "README-purpose-of-man.txt");
    fs.writeFileSync(readmeFile, readmeContent);
    console.log(`📝 Created README: ${readmeFile}`);
    
  } catch (error: any) {
    console.error("❌ PDF generation failed:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

export default UltimatePurposeOfManPdf;