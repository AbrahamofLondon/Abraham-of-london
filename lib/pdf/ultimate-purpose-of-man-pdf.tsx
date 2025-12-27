// lib/pdf/ultimate-purpose-of-man-pdf.tsx
/* eslint-disable jsx-a11y/alt-text */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  type DocumentProps,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Fonts (brand)
// ---------------------------------------------------------------------------

try {
  Font.register({
    family: "AoLSerif",
    src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYhig.woff2",
  });
  Font.register({
    family: "AoLSans",
    src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boK.woff2",
  });
  Font.register({
    family: "AoLMono",
    src: "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2oWUg0MKqScQ7Z7o_vo0qZxP9kFz.woff2",
  });
} catch {
  // fall back to built-ins
}

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------

const BRAND = {
  bg: "#050609",
  bg2: "#070812",
  card: "#0b0c12",
  border: "#1b2230",
  ink: "#E5E7EB",
  muted: "#9CA3AF",
  faint: "#6B7280",
  gold: "#D4AF37",
  gold2: "#FBBF24",
  white: "#F9FAFB",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  document: { backgroundColor: BRAND.bg },

  page: {
    paddingTop: 52,
    paddingBottom: 62,
    paddingHorizontal: 56,
    backgroundColor: BRAND.bg,
  },

  topRail: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.7,
    borderBottomColor: BRAND.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  railLeft: { flexDirection: "column" },
  railEyebrow: {
    fontFamily: "AoLSans",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    color: BRAND.gold2,
  },
  railTitle: {
    marginTop: 3,
    fontFamily: "AoLSerif",
    fontSize: 11,
    color: BRAND.white,
  },
  railRight: {
    fontFamily: "AoLMono",
    fontSize: 8,
    color: BRAND.muted,
  },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "AoLSans",
    fontSize: 9,
    color: BRAND.muted,
    borderTopWidth: 0.6,
    borderTopColor: BRAND.border,
    paddingTop: 8,
  },
  pageNumber: { fontFamily: "AoLMono" },
  smallBrand: {
    fontFamily: "AoLSans",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 8,
    color: "#C7CBD3",
  },

  coverPage: { padding: 0, backgroundColor: BRAND.bg },
  coverImageWrapper: { width: "100%", height: "55%" },
  coverImage: { width: "100%", height: "100%" },

  coverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  coverContent: { paddingHorizontal: 56, paddingTop: 44 },
  coverEyebrow: {
    fontFamily: "AoLSans",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2.6,
    color: BRAND.gold2,
    marginBottom: 12,
  },
  coverTitle: {
    fontFamily: "AoLSerif",
    fontSize: 32,
    color: BRAND.white,
    letterSpacing: 1,
    marginBottom: 10,
  },
  coverSubtitle: {
    fontFamily: "AoLSerif",
    fontSize: 14,
    color: BRAND.ink,
    marginBottom: 18,
  },
  coverByline: {
    fontFamily: "AoLSans",
    fontSize: 11,
    color: "#C7CBD3",
    marginBottom: 18,
  },

  coverRule: {
    height: 1,
    width: 160,
    backgroundColor: "rgba(212,175,55,0.45)",
    marginBottom: 16,
  },

  coverTagline: {
    fontFamily: "AoLSans",
    fontSize: 10,
    color: BRAND.muted,
    lineHeight: 1.55,
    maxWidth: "84%",
  },

  h1: {
    fontFamily: "AoLSerif",
    fontSize: 22,
    color: BRAND.white,
    marginBottom: 6,
  },
  h2: {
    fontFamily: "AoLSerif",
    fontSize: 15,
    color: BRAND.white,
    marginTop: 16,
    marginBottom: 6,
  },
  h3: {
    fontFamily: "AoLSerif",
    fontSize: 12.5,
    color: BRAND.ink,
    marginTop: 10,
    marginBottom: 3,
  },
  eyebrow: {
    fontFamily: "AoLSans",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 2.4,
    color: BRAND.gold2,
    marginBottom: 6,
  },

  bodyText: {
    fontFamily: "AoLSans",
    fontSize: 10.3,
    lineHeight: 1.62,
    color: BRAND.ink,
    marginBottom: 7,
  },
  strong: {
    fontFamily: "AoLSans",
    fontSize: 10.3,
    color: BRAND.white,
  },

  divider: {
    marginTop: 12,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: BRAND.gold2,
    paddingLeft: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "rgba(212,175,55,0.06)",
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
  },
  quoteText: {
    fontFamily: "AoLSerif",
    fontSize: 11,
    color: BRAND.ink,
    fontStyle: "italic",
    lineHeight: 1.45,
  },

  callout: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 0.9,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "rgba(11,12,18,0.85)",
    borderRadius: 10,
    padding: 10,
  },
  calloutLabel: {
    fontFamily: "AoLSans",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    color: BRAND.gold2,
    marginBottom: 6,
  },
  calloutText: {
    fontFamily: "AoLSans",
    fontSize: 10,
    color: BRAND.ink,
    lineHeight: 1.55,
  },

  bulletList: { marginVertical: 6, paddingLeft: 6 },
  bulletItem: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, fontSize: 10, color: BRAND.gold2 },
  bulletText: {
    flex: 1,
    fontFamily: "AoLSans",
    fontSize: 10.2,
    lineHeight: 1.55,
    color: BRAND.ink,
  },
});

function TopRail({ eyebrow, title }: { eyebrow: string; title: string }): JSX.Element {
  return (
    <View style={styles.topRail} fixed>
      <View style={styles.railLeft}>
        <Text style={styles.railEyebrow}>{eyebrow}</Text>
        <Text style={styles.railTitle}>{title}</Text>
      </View>
      <Text style={styles.railRight}>{`abrahamoflondon.org`}</Text>
    </View>
  );
}

function Footer(): JSX.Element {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.smallBrand}>{`Abraham of London · Strategic Editorials`}</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// ✅ CRITICAL: return type tells TS this component produces a <Document /> element
export default function UltimatePurposeOfManDocument({
  coverImagePath,
}: {
  coverImagePath: string;
}): React.ReactElement<DocumentProps> {
  return (
    <Document>
      {/* COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverImageWrapper}>
          <Image src={coverImagePath} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
        </View>

        <View style={styles.coverContent}>
          <Text style={styles.coverEyebrow}>
            {`Strategic Editorial · Theology · Leadership · Purpose`}
          </Text>
          <Text style={styles.coverTitle}>{`THE ULTIMATE PURPOSE OF MAN`}</Text>
          <Text style={styles.coverSubtitle}>
            {`A Strategic Essay for an Age Searching for Itself`}
          </Text>

          <Text style={styles.coverByline}>{`by Abraham of London`}</Text>
          <View style={styles.coverRule} />

          <Text style={styles.coverTagline}>
            {`A definitive editorial examining how human purpose is structured, grounded, and lived — from Eden’s design to modern civilisation, leadership, and legacy.`}
          </Text>
        </View>
      </Page>

      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Editorial · Foundations" title="Purpose is not a sentiment" />

        <Text style={styles.h1}>{`INTRODUCTION — PURPOSE IS NOT A SENTIMENT`}</Text>

        <Text style={styles.bodyText}>
          {`Purpose is not discovered by accident. It is not unlocked by slogans, or summoned by emotional intensity. Purpose is structure, not abstraction; order, not inspiration.`}
        </Text>
        <Text style={styles.bodyText}>
          {`The modern world has mastered activity and forgotten meaning. It has perfected progress and lost direction. It has multiplied options and erased foundations.`}
        </Text>
        <Text style={styles.bodyText}>
          {`This editorial is not a pep talk. It is not another promise. It is a demonstration of how purpose actually functions in reality — historically, theologically, strategically.`}
        </Text>
        <Text style={styles.bodyText}>
          {`Purpose is not something we chase. It is something we align with.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>{`1. THE GARDEN — PURPOSE AS STRUCTURE, NOT MYTH`}</Text>

        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            {`“The Lord God took the man and put him in the garden to work it and keep it.” — Genesis 2:15`}
          </Text>
        </View>

        <Text style={styles.bodyText}>
          {`Eden was not a paradise escape; it was a deployment zone. Man was not dropped into chaos. He was placed into order — with identity, work, boundaries, and presence.`}
        </Text>

        <View style={styles.bulletList}>
          {[
            { strong: "Placed —", text: " location as intentionality" },
            { strong: "Given identity —", text: " Imago Dei" },
            { strong: "Given work —", text: " cultivate, govern, develop" },
            { strong: "Given boundaries —", text: " responsibility frames freedom" },
            { strong: "Given presence —", text: " fellowship with God as operating environment" },
          ].map((b) => (
            <View key={b.strong} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>{`•`}</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.strong}>{b.strong}</Text>
                {b.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>{`Operating sequence`}</Text>
          <Text style={styles.calloutText}>
            <Text style={styles.strong}>{`Identity → Assignment → Responsibility → Culture`}</Text>
            {`\n`}
            {`Purpose begins long before ambition enters the conversation. Eden is not nostalgia; it is design.`}
          </Text>
        </View>

        <Footer />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Editorial · Pattern recognition" title="Purpose under pressure" />

        <Text style={styles.h2}>
          {`2. ANCIENT LIVES — WHAT PURPOSE LOOKS LIKE UNDER PRESSURE`}
        </Text>
        <Text style={styles.bodyText}>
          {`Scripture is not a collection of inspirational stories; it is the record of how purpose behaves under suffering, delay, power, loss, and restoration.`}
        </Text>

        <Text style={styles.h3}>{`Job — Integrity under suffering`}</Text>
        <Text style={styles.bodyText}>
          {`Purpose holds even when everything else collapses. Job’s story dismantles the myth that purpose is proven only in success. It is proven in faithfulness.`}
        </Text>

        <Text style={styles.h3}>{`Moses — Assignment after delay`}</Text>
        <Text style={styles.bodyText}>
          {`Purpose can be delayed, but in God’s economy, delay is often formation. The man who fled Egypt in fear returned with clarity, authority, and a mandate.`}
        </Text>

        <Text style={styles.h3}>{`Abraham — Direction through trust`}</Text>
        <Text style={styles.bodyText}>
          {`Abraham is called without a map, given promises without timelines. His life shows that purpose is walked out step-by-step, not leap-by-leap.`}
        </Text>

        <Text style={styles.h3}>{`David — Formation in hiddenness`}</Text>
        <Text style={styles.bodyText}>
          {`Before the throne, there was the field. Before influence, there were lions and bears. David’s leadership was forged in worship and obedience long before coronation.`}
        </Text>

        <Text style={styles.h3}>{`Solomon — Discernment through wisdom`}</Text>
        <Text style={styles.bodyText}>
          {`Solomon shows us that purpose without wisdom becomes vanity. Capacity without alignment leads to waste.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>{`3. JESUS — THE BLUEPRINT FOR HUMAN FUNCTION`}</Text>
        <Text style={styles.bodyText}>
          {`Jesus does not only save mankind; He reveals mankind. He is the perfect expression of ordered desires, aligned identity, disciplined action, sacrificial leadership, and integrated purpose.`}
        </Text>
        <Text style={styles.bodyText}>
          {`The disciples and early Church turn this blueprint into lived practice: ordinary men and women whose lives became architecture because they were aligned, not exceptional.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>
          {`4. WORLDVIEWS — HUMANITY’S ATTEMPT TO REPLACE THE ORIGINAL DESIGN`}
        </Text>
        <Text style={styles.bodyText}>
          {`Civilisations rise and fall on their answer to the question of human purpose.`}
        </Text>

        <View style={styles.bulletList}>
          {[
            { strong: "Hinduism —", text: " dissolution of self." },
            { strong: "Buddhism —", text: " escape from desire." },
            { strong: "Confucianism —", text: " order without a Father." },
            { strong: "Islam —", text: " obedience without sonship." },
            { strong: "Atheism —", text: " meaning manufactured from meaninglessness." },
          ].map((b) => (
            <View key={b.strong} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>{`•`}</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.strong}>{b.strong}</Text>
                {b.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>{`The complete sequence`}</Text>
          <Text style={styles.calloutText}>
            <Text style={styles.strong}>{`Origin → Identity → Meaning → Morality → Destiny`}</Text>
            {`\n`}
            {`Each alternative can manufacture ethic or discipline — but not the full chain that sustains civilisation over time.`}
          </Text>
        </View>

        <Footer />
      </Page>

      {/* PAGE 3 */}
      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Editorial · Civilisation" title="Purpose becomes public" />

        <Text style={styles.h2}>{`5. WHY CHRISTIANITY BUILT THE MODERN WORLD`}</Text>
        <Text style={styles.bodyText}>
          {`This is not ideology. It is documented history. Christianity did not merely inspire private faith; it reshaped civilisation. Much of what we call “modern” is the outworking of biblical ideas entering public life.`}
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>{`Made accessible · still powerful`}</Text>
          <Text style={styles.calloutText}>
            {`Much of what our world now treats as “obvious” or “secular progress” grew directly from Christian convictions about God, people, and order.`}
          </Text>
        </View>

        {[
          {
            title: "Human Dignity — Imago Dei (Genesis 1:26–27)",
            body:
              "The idea that every human being carries divine worth, regardless of status, tribe, or power. This doctrine dismantled ancient class hierarchies and fuelled human rights movements.",
          },
          {
            title: "Scientific Rationalism — A rational Creator, a rational universe",
            body:
              "Because Christians believed God was orderly, they expected the world to operate by discoverable laws. This conviction powered the scientific revolution.",
          },
          {
            title: "The Rule of Law — No one is above God",
            body:
              "The biblical insistence that even kings answer to a higher authority produced foundations for constitutional government.",
          },
          {
            title: "Economic Freedom — Stewardship, vocation, responsibility",
            body:
              "Christian theology honoured the dignity of work, private stewardship, and moral limits on exploitation — seeds of many modern economic models.",
          },
          {
            title: "Personal Responsibility — Each person answers to God",
            body:
              "Not the state. Not the tribe. Not blind fate. This built conscience, moral agency, and self-governance.",
          },
          {
            title: "Charitable Systems — Love your neighbour",
            body:
              "Christians built hospitals, orphanages, and structured charity — not as philanthropy, but as obedience.",
          },
          {
            title: "Justice as moral principle — Righteousness and equity",
            body:
              "Justice became public duty, not private privilege. Christian ethics insisted the poor, foreigner, and vulnerable be protected.",
          },
          {
            title: "Vocation as sacred work — Work as worship",
            body:
              "Christianity erased the divide between “sacred” and “secular” work: farmer, mother, merchant, or statesman could serve God through craft.",
          },
        ].map((b) => (
          <View key={b.title} style={{ marginTop: 8 }}>
            <Text style={styles.h3}>{`• ${b.title}`}</Text>
            <Text style={styles.bodyText}>{b.body}</Text>
          </View>
        ))}

        <Text style={styles.bodyText}>
          {`When purpose is grounded in reality, it becomes productive. When it aligns with divine order, it becomes transformative — at personal, household, and civilisational scale.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>{`6. ECCLESIASTES — THE TWO-SENTENCE BLUEPRINT`}</Text>

        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            {`“Fear God and keep His commandments… this is the whole duty of man.” — Ecclesiastes 12:13`}
          </Text>
        </View>

        <Text style={styles.bodyText}>
          {`The entire architecture of human purpose — condensed. This is not fear as terror; it is fear as proper orientation.`}
        </Text>

        <Text style={styles.h3}>{`To fear God is to:`}</Text>
        <View style={styles.bulletList}>
          {["recognise His structure", "submit to His wisdom", "respect His order", "align with His design"].map(
            (t) => (
              <View key={t} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>{`•`}</Text>
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            )
          )}
        </View>

        <Text style={styles.bodyText}>
          {`Jesus completes the blueprint: Love God. Love your neighbour as yourself. Not poetry — governance. Not emotion — protocol. Love is the engine of divine order, and order is the environment where purpose flourishes.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>{`7. FRAMEWORKS — THE STRATEGIC GRID OF HUMAN EXISTENCE`}</Text>
        <Text style={styles.bodyText}>
          {`Purpose is not philosophical; it is functional. These frameworks express that function in operational form:`}
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutLabel}>{`Framework set`}</Text>
          <Text style={styles.calloutText}>
            <Text style={styles.strong}>{`Dominion Framework:`}</Text>
            {` Stewardship + Responsibility = Influence\n`}
            <Text style={styles.strong}>{`Garden Mandate Model:`}</Text>
            {` Identity → Work → Influence → Culture\n`}
            <Text style={styles.strong}>{`Ancient–Future Leadership Matrix:`}</Text>
            {` (Abrahamic Faith) + (Mosaic Governance) + (Davidic Devotion) + (Pauline Strategy) + (Early-Church Resilience) = Enduring Leadership\n`}
            <Text style={styles.strong}>{`Ecclesiastes Operating System (EOS):`}</Text>
            {` Truth → Wisdom → Alignment → Flourishing\n`}
            <Text style={styles.strong}>{`Love-Alignment Protocol:`}</Text>
            {` Love God → Love Self → Love Neighbour → Transform Environment.`}
          </Text>
        </View>

        <Text style={styles.bodyText}>
          {`These are not predictions of future work. They are work already done — codified, articulated, structured.`}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>{`8. CONCLUSION — PURPOSE IS A MANDATE, NOT A MYSTERY`}</Text>
        <Text style={styles.bodyText}>
          {`You were not designed for drift. You were not born for confusion. You were not placed here merely to survive time and hope for comfort.`}
        </Text>
        <Text style={styles.bodyText}>
          {`The purpose of man is not hidden: to align with God’s order, embody His love, steward His world, and build with clarity.`}
        </Text>
        <Text style={styles.bodyText}>
          {`Your decisions, leadership, discipline, relationships, work, and words all sit under one mandate:`}
        </Text>
        <Text style={[styles.bodyText, { color: BRAND.white }]}>
          {`Fear God. Keep His commandments. Walk in love. Build with precision. Everything else is commentary.`}
        </Text>

        <Footer />
      </Page>
    </Document>
  );
}