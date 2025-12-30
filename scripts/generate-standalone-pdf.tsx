/* scripts/generate-standalone-pdf.tsx */
import fs from "fs";
import path from "path";
import React from "react";
import {
  renderToFile,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ---------------------------------------------------------
// 1. ASSETS & FONTS
// ---------------------------------------------------------

// Helper to load image as Buffer
const loadImageBuffer = (relativePath: string) => {
  try {
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath);
  } catch (e) { return null; }
  return null;
};

// Load Cover Image
const coverBuffer = loadImageBuffer("assets/images/purpose-cover.jpg") || 
                    loadImageBuffer("assets/images/writing-desk.webp");

// USE STANDARD FONTS (Guarantees perfect formatting & alignment)
// We map your brand names to standard PDF fonts.
// - AoLSerif -> Times-Roman (Professional Serif)
// - AoLSans  -> Helvetica (Clean Sans)
// - AoLMono  -> Courier (Technical Mono)
Font.register({ family: "AoLSerif", src: "Times-Roman" });
Font.register({ family: "AoLSerif", fontStyle: "italic", src: "Times-Italic" });
Font.register({ family: "AoLSans", src: "Helvetica" });
Font.register({ family: "AoLMono", src: "Courier" });

// ---------------------------------------------------------
// 2. STYLES
// ---------------------------------------------------------
const BRAND = {
  bg: "#050609",
  gold: "#D4AF37",
  gold2: "#FBBF24",
  white: "#F9FAFB",
  ink: "#E5E7EB",
  muted: "#9CA3AF",
  border: "#1b2230",
};

const styles = StyleSheet.create({
  document: { backgroundColor: BRAND.bg },
  page: { paddingTop: 52, paddingBottom: 62, paddingHorizontal: 56, backgroundColor: BRAND.bg },
  
  // Header / Footer
  topRail: {
    marginBottom: 14, paddingBottom: 10, borderBottomWidth: 0.7, borderBottomColor: BRAND.border,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  railLeft: { flexDirection: "column" },
  railEyebrow: { fontFamily: "AoLSans", fontSize: 8, textTransform: "uppercase", letterSpacing: 2.2, color: BRAND.gold2 },
  railTitle: { marginTop: 3, fontFamily: "AoLSerif", fontSize: 11, color: BRAND.white },
  railRight: { fontFamily: "AoLMono", fontSize: 8, color: BRAND.muted },
  
  footer: {
    position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between",
    fontFamily: "AoLSans", fontSize: 9, color: BRAND.muted, borderTopWidth: 0.6, borderTopColor: BRAND.border, paddingTop: 8,
  },
  
  // Cover
  coverPage: { padding: 0, backgroundColor: BRAND.bg },
  coverImageWrapper: { width: "100%", height: "55%" },
  coverImage: { width: "100%", height: "100%", objectFit: "cover" },
  coverOverlay: { position: "absolute", left: 0, right: 0, top: 0, height: "55%", backgroundColor: "rgba(0,0,0,0.25)" },
  coverContent: { paddingHorizontal: 56, paddingTop: 44 },
  coverEyebrow: { fontFamily: "AoLSans", fontSize: 9, textTransform: "uppercase", letterSpacing: 2.6, color: BRAND.gold2, marginBottom: 12 },
  coverTitle: { fontFamily: "AoLSerif", fontSize: 32, color: BRAND.white, letterSpacing: 1, marginBottom: 10 },
  coverSubtitle: { fontFamily: "AoLSerif", fontSize: 14, color: BRAND.ink, marginBottom: 18 },
  coverByline: { fontFamily: "AoLSans", fontSize: 11, color: "#C7CBD3", marginBottom: 18 },
  coverRule: { height: 1, width: 160, backgroundColor: "rgba(212,175,55,0.45)", marginBottom: 16 },
  coverTagline: { fontFamily: "AoLSans", fontSize: 10, color: BRAND.muted, lineHeight: 1.55, maxWidth: "84%" },

  // Content
  h1: { fontFamily: "AoLSerif", fontSize: 22, color: BRAND.white, marginBottom: 6 },
  h2: { fontFamily: "AoLSerif", fontSize: 15, color: BRAND.white, marginTop: 16, marginBottom: 6 },
  h3: { fontFamily: "AoLSerif", fontSize: 12.5, color: BRAND.ink, marginTop: 10, marginBottom: 3 },
  bodyText: { fontFamily: "AoLSans", fontSize: 10.3, lineHeight: 1.62, color: BRAND.ink, marginBottom: 7 },
  strong: { fontFamily: "AoLSans", fontSize: 10.3, color: BRAND.white },
  
  divider: { marginTop: 12, marginBottom: 12, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  
  quoteBlock: {
    borderLeftWidth: 2, borderLeftColor: BRAND.gold2, paddingLeft: 10, marginTop: 10, marginBottom: 10,
    backgroundColor: "rgba(212,175,55,0.06)", paddingTop: 8, paddingBottom: 8, paddingRight: 10,
  },
  quoteText: { fontFamily: "AoLSerif", fontSize: 11, color: BRAND.ink, fontStyle: "italic", lineHeight: 1.45 },
  
  callout: {
    marginTop: 10, marginBottom: 10, borderWidth: 0.9, borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "rgba(11,12,18,0.85)", borderRadius: 10, padding: 10,
  },
  calloutLabel: { fontFamily: "AoLSans", fontSize: 8, textTransform: "uppercase", letterSpacing: 2.2, color: BRAND.gold2, marginBottom: 6 },
  calloutText: { fontFamily: "AoLSans", fontSize: 10, color: BRAND.ink, lineHeight: 1.55 },
  
  bulletList: { marginVertical: 6, paddingLeft: 6 },
  bulletItem: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, fontSize: 10, color: BRAND.gold2 },
  bulletText: { flex: 1, fontFamily: "AoLSans", fontSize: 10.2, lineHeight: 1.55, color: BRAND.ink },
});

// ---------------------------------------------------------
// 3. COMPONENTS
// ---------------------------------------------------------
const TopRail = ({ eyebrow, title }: any) => (
  <View style={styles.topRail} fixed>
    <View style={styles.railLeft}>
      <Text style={styles.railEyebrow}>{eyebrow}</Text>
      <Text style={styles.railTitle}>{title}</Text>
    </View>
    <Text style={styles.railRight}>abrahamoflondon.org</Text>
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.smallBrand}>Abraham of London · Strategic Editorials</Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </View>
);

const UltimatePurposeOfManPdf = ({ coverImage }: { coverImage: any }) => (
  <Document title="The Ultimate Purpose of Man">
    {/* --- COVER --- */}
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverImageWrapper}>
        {coverImage && <Image src={coverImage} style={styles.coverImage} />}
        <View style={styles.coverOverlay} />
      </View>
      <View style={styles.coverContent}>
        <Text style={styles.coverEyebrow}>Strategic Editorial · Theology · Leadership · Purpose</Text>
        <Text style={styles.coverTitle}>THE ULTIMATE PURPOSE OF MAN</Text>
        <Text style={styles.coverSubtitle}>A Strategic Essay for an Age Searching for Itself</Text>
        <Text style={styles.coverByline}>by Abraham of London</Text>
        <View style={styles.coverRule} />
        <Text style={styles.coverTagline}>
          A definitive editorial examining how human purpose is structured, grounded, and lived — from Eden’s design to modern civilisation.
        </Text>
      </View>
    </Page>

    {/* --- PAGE 1: Intro & Garden --- */}
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Editorial · Foundations" title="Purpose is not a sentiment" />
      <Text style={styles.h1}>INTRODUCTION — PURPOSE IS NOT A SENTIMENT</Text>
      <Text style={styles.bodyText}>
        Purpose is not discovered by accident. It is not unlocked by slogans, or summoned by emotional intensity. Purpose is structure, not abstraction; order, not inspiration.
      </Text>
      <Text style={styles.bodyText}>
        The modern world has mastered activity and forgotten meaning. It has perfected progress and lost direction. It has multiplied options and erased foundations.
      </Text>
      <View style={styles.divider} />
      <Text style={styles.h2}>1. THE GARDEN — PURPOSE AS STRUCTURE, NOT MYTH</Text>
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>
          “The Lord God took the man and put him in the garden to work it and keep it.” — Genesis 2:15
        </Text>
      </View>
      <Text style={styles.bodyText}>
        Eden was not a paradise escape; it was a deployment zone. Man was placed into order — with identity, work, boundaries, and presence.
      </Text>
      <View style={styles.bulletList}>
        {[
          { strong: "Placed —", text: " location as intentionality" },
          { strong: "Given identity —", text: " Imago Dei" },
          { strong: "Given work —", text: " cultivate, govern, develop" },
          { strong: "Given boundaries —", text: " responsibility frames freedom" },
        ].map((b, i) => (
          <View key={i} style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.strong}>{b.strong}</Text> {b.text}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Operating sequence</Text>
        <Text style={styles.calloutText}>
          <Text style={styles.strong}>Identity → Assignment → Responsibility → Culture</Text>
          {"\n"}Purpose begins long before ambition enters the conversation. Eden is not nostalgia; it is design.
        </Text>
      </View>
      <Footer />
    </Page>

    {/* --- PAGE 2: Ancient Lives --- */}
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Editorial · Pattern Recognition" title="Purpose under pressure" />
      <Text style={styles.h2}>2. ANCIENT LIVES — WHAT PURPOSE LOOKS LIKE UNDER PRESSURE</Text>
      <Text style={styles.bodyText}>
        Scripture is not a collection of inspirational stories; it is the record of how purpose behaves under suffering, delay, power, loss, and restoration.
      </Text>

      <Text style={styles.h3}>Job — Integrity under suffering</Text>
      <Text style={styles.bodyText}>
        Purpose holds even when everything else collapses. Job dismantles the myth that purpose is proven only in success.
      </Text>

      <Text style={styles.h3}>Moses — Assignment after delay</Text>
      <Text style={styles.bodyText}>
        Delay is often formation. The man who fled in fear returned with clarity, authority, and mandate.
      </Text>

      <Text style={styles.h3}>Abraham — Direction through trust</Text>
      <Text style={styles.bodyText}>
        Called without a map, promised without timelines. Purpose is walked out step-by-step.
      </Text>

      <Text style={styles.h3}>David — Formation in hiddenness</Text>
      <Text style={styles.bodyText}>
        Before the throne, there was the field. Leadership was forged in worship and obedience long before coronation.
      </Text>

      <Text style={styles.h3}>Solomon — Discernment through wisdom</Text>
      <Text style={styles.bodyText}>
        Purpose without wisdom becomes vanity. Capacity without alignment leads to waste.
      </Text>
      <Footer />
    </Page>

    {/* --- PAGE 3: Jesus & Worldviews --- */}
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Editorial · The Blueprint" title="The Original Design" />
      <Text style={styles.h2}>3. JESUS — THE BLUEPRINT FOR HUMAN FUNCTION</Text>
      <Text style={styles.bodyText}>
        Jesus does not only save mankind; He reveals mankind. He is the perfect expression of aligned identity, disciplined action, sacrificial leadership, and integrated purpose.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.h2}>4. WORLDVIEWS — ATTEMPTS TO REPLACE THE ORIGINAL DESIGN</Text>
      <Text style={styles.bodyText}>
        Civilisations rise and fall on their answer to the question of human purpose.
      </Text>

      <View style={styles.bulletList}>
        {[
          { strong: "Hinduism —", text: " dissolution of self." },
          { strong: "Buddhism —", text: " escape from desire." },
          { strong: "Confucianism —", text: " order without a Father." },
          { strong: "Islam —", text: " obedience without sonship." },
          { strong: "Atheism —", text: " meaning manufactured from meaninglessness." },
        ].map((b, i) => (
          <View key={i} style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.strong}>{b.strong}</Text> {b.text}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>The complete sequence</Text>
        <Text style={styles.calloutText}>
          <Text style={styles.strong}>Origin → Identity → Meaning → Morality → Destiny</Text>
          {"\n"}Alternatives can manufacture ethic or discipline — but not the full chain that sustains civilisation over time.
        </Text>
      </View>
      <Footer />
    </Page>

    {/* --- PAGE 4: Christianity & Modern World --- */}
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Editorial · Civilisation" title="Purpose becomes public" />
      <Text style={styles.h2}>5. WHY CHRISTIANITY BUILT THE MODERN WORLD</Text>
      <Text style={styles.bodyText}>
        Christianity did not merely inspire private faith; it reshaped civilisation. Much of what we call “modern” is the outworking of biblical ideas entering public life.
      </Text>

      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Still the hidden engine</Text>
        <Text style={styles.calloutText}>
          Much of what the world now treats as “obvious” grew directly from Christian convictions about God, people, and order.
        </Text>
      </View>

      <View style={styles.bulletList}>
        {[
          { title: "Human Dignity (Imago Dei)", body: "Every human carries divine worth regardless of status. This doctrine dismantled ancient hierarchies and seeded human rights reasoning." },
          { title: "Scientific Rationalism", body: "Belief in an orderly God produced expectation of discoverable laws — a driver of the scientific revolution." },
          { title: "The Rule of Law", body: "Even kings answer to a higher authority — foundations for constitutional government." },
          { title: "Vocation", body: "The sacred–secular divide collapses: farmer, merchant, mother, statesman all serve through craft and responsibility." },
        ].map((b, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={styles.h3}>• {b.title}</Text>
            <Text style={styles.bodyText}>{b.body}</Text>
          </View>
        ))}
      </View>
      <Footer />
    </Page>

    {/* --- PAGE 5: Conclusion --- */}
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Editorial · Conclusion" title="The Whole Duty of Man" />
      <Text style={styles.h2}>6. ECCLESIASTES — THE TWO-SENTENCE BLUEPRINT</Text>
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>
          “Fear God and keep His commandments… this is the whole duty of man.” — Ecclesiastes 12:13
        </Text>
      </View>
      <Text style={styles.bodyText}>
        This is not fear as terror; it is fear as proper orientation — reality accepted, order respected, authority acknowledged.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.h2}>7. CONCLUSION — PURPOSE IS A MANDATE, NOT A MYSTERY</Text>
      <Text style={styles.bodyText}>
        You were not designed for drift. The purpose of man is not hidden: align with God’s order, embody His love, steward His world, build with clarity.
      </Text>
      <Text style={[styles.bodyText, { color: BRAND.white, marginTop: 12 }]}>
        Fear God. Keep His commandments. Walk in love. Build with precision. Everything else is commentary.
      </Text>
      <Footer />
    </Page>
  </Document>
);

// ---------------------------------------------------------
// 4. MAIN EXECUTION
// ---------------------------------------------------------
async function main() {
  try {
    const outDir = path.join(process.cwd(), "public", "downloads");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");

    console.log("📄 Generating Full PDF (Standard Fonts)...");
    
    // Pass the Image Buffer, NOT a path string
    await renderToFile(<UltimatePurposeOfManPdf coverImage={coverBuffer} />, outFile);
    
    console.log(`✅ Success! PDF saved to: ${outFile}`);

  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();