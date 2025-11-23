// lib/pdf/ultimate-purpose-of-man-pdf.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Fonts (adjust paths to match your repo if you have custom font files)
// ---------------------------------------------------------------------------

// Example: use system-safe fonts first; you can swap to brand fonts later.
// If you have brand fonts in /public/fonts, register them here.
try {
  Font.register({
    family: "AoLSerif",
    src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYhig.woff2",
  });
  Font.register({
    family: "AoLSans",
    src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boK.woff2",
  });
} catch {
  // In case remote fonts fail, React-PDF will fall back to built-ins
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  document: {
    backgroundColor: "#0b0c10",
  },
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 56,
    backgroundColor: "#050609",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "AoLSans",
    fontSize: 9,
    color: "#9CA3AF",
    borderTopWidth: 0.5,
    borderTopColor: "#1F2933",
    paddingTop: 8,
  },
  pageNumber: {
    fontFamily: "AoLSans",
  },
  smallBrand: {
    fontFamily: "AoLSans",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 8,
    color: "#D1D5DB",
  },

  // Cover
  coverPage: {
    padding: 0,
  },
  coverImageWrapper: {
    width: "100%",
    height: "55%",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverContent: {
    paddingHorizontal: 56,
    paddingTop: 40,
  },
  coverEyebrow: {
    fontFamily: "AoLSans",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#FBBF24",
    marginBottom: 10,
  },
  coverTitle: {
    fontFamily: "AoLSerif",
    fontSize: 32,
    color: "#F9FAFB",
    letterSpacing: 1,
    marginBottom: 10,
  },
  coverSubtitle: {
    fontFamily: "AoLSerif",
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 18,
  },
  coverByline: {
    fontFamily: "AoLSans",
    fontSize: 11,
    color: "#D1D5DB",
    marginBottom: 32,
  },
  coverTagline: {
    fontFamily: "AoLSans",
    fontSize: 10,
    color: "#9CA3AF",
    lineHeight: 1.5,
    maxWidth: "80%",
  },

  // Headings
  h1: {
    fontFamily: "AoLSerif",
    fontSize: 24,
    color: "#F9FAFB",
    marginBottom: 6,
  },
  h2: {
    fontFamily: "AoLSerif",
    fontSize: 16,
    color: "#F9FAFB",
    marginTop: 18,
    marginBottom: 4,
  },
  h3: {
    fontFamily: "AoLSerif",
    fontSize: 13,
    color: "#E5E7EB",
    marginTop: 10,
    marginBottom: 3,
  },
  eyebrow: {
    fontFamily: "AoLSans",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#FBBF24",
    marginBottom: 6,
  },

  // Body
  bodyText: {
    fontFamily: "AoLSans",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#D1D5DB",
    marginBottom: 6,
  },
  strong: {
    fontFamily: "AoLSans",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#F9FAFB",
  },
  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: "#FBBF24",
    paddingLeft: 10,
    marginVertical: 10,
  },
  quoteText: {
    fontFamily: "AoLSerif",
    fontSize: 11,
    color: "#E5E7EB",
    fontStyle: "italic",
  },
  quoteSource: {
    fontFamily: "AoLSans",
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 3,
  },

  bulletList: {
    marginVertical: 6,
    paddingLeft: 6,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 8,
    fontSize: 9,
    color: "#FBBF24",
  },
  bulletText: {
    flex: 1,
    fontFamily: "AoLSans",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#D1D5DB",
  },

  sectionSpacer: {
    marginTop: 16,
  },
});

const UltimatePurposeOfManDocument: React.FC<{ coverImagePath: string }> = ({
  coverImagePath,
}) => (
  <Document>
    {/* COVER PAGE */}
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverImageWrapper}>
        <Image src={coverImagePath} style={styles.coverImage} />
      </View>
      <View style={styles.coverContent}>
        <Text style={styles.coverEyebrow}>
          Strategic Editorial · Theology · Leadership · Purpose
        </Text>
        <Text style={styles.coverTitle}>THE ULTIMATE PURPOSE OF MAN</Text>
        <Text style={styles.coverSubtitle}>
          A Strategic Essay for an Age Searching for Itself
        </Text>
        <Text style={styles.coverByline}>by AbrahamofLondon</Text>
        <Text style={styles.coverTagline}>
          A definitive editorial examining how human purpose is structured,
          grounded, and lived — from Eden’s design to modern civilisation,
          leadership, and legacy.
        </Text>
      </View>
    </Page>

    {/* MAIN PAGES */}
    <Page size="A4" style={styles.page}>
      {/* Header eyebrow */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.eyebrow}>Editorial · Foundations</Text>
        <Text style={styles.h1}>INTRODUCTION — PURPOSE IS NOT A SENTIMENT</Text>
      </View>

      {/* Intro body */}
      <Text style={styles.bodyText}>
        Purpose is not discovered by accident. It is not unlocked by slogans, or
        summoned by emotional intensity. Purpose is structure, not abstraction;
        order, not inspiration.
      </Text>
      <Text style={styles.bodyText}>
        The modern world has mastered activity and forgotten meaning. It has
        perfected progress and lost direction. It has multiplied options and
        erased foundations.
      </Text>
      <Text style={styles.bodyText}>
        This editorial is not a pep talk. It is not another promise. It is a
        demonstration of how purpose actually functions in reality —
        historically, theologically, strategically.
      </Text>
      <Text style={styles.bodyText}>
        Purpose is not something we chase. It is something we align with.
      </Text>

      <View style={styles.sectionSpacer} />

      {/* 1. The Garden */}
      <Text style={styles.h2}>1. THE GARDEN — PURPOSE AS STRUCTURE, NOT MYTH</Text>

      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>
          “The Lord God took the man and put him in the garden to work it and
          keep it.” — Genesis 2:15
        </Text>
      </View>

      <Text style={styles.bodyText}>
        Eden was not a paradise escape; it was a deployment zone. Man was not
        dropped into chaos. He was placed into order — with identity, work,
        boundaries, and presence.
      </Text>

      <View style={styles.bulletList}>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Placed —</Text> location as intentionality
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Given identity —</Text> Imago Dei
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Given work —</Text> cultivate, govern, develop
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Given boundaries —</Text> responsibility frames
            freedom
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Given presence —</Text> fellowship with God as
            operating environment
          </Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        The Garden is the first strategic model of human existence:
      </Text>
      <Text style={styles.bodyText}>
        <Text style={styles.strong}>
          Identity → Assignment → Responsibility → Culture
        </Text>
      </Text>
      <Text style={styles.bodyText}>
        Purpose begins long before ambition enters the conversation. It begins
        in alignment with created order. Eden is not nostalgia; it is design.
      </Text>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.smallBrand}>Abraham of London · Strategic Editorials</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>

    {/* PAGE 2: Ancient Lives, Jesus, Worldviews (condensed but styled) */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>
        2. ANCIENT LIVES — WHAT PURPOSE LOOKS LIKE UNDER PRESSURE
      </Text>
      <Text style={styles.bodyText}>
        Scripture is not a collection of inspirational stories; it is the record
        of how purpose behaves under suffering, delay, power, loss, and
        restoration.
      </Text>

      <Text style={styles.h3}>Job — Integrity under suffering</Text>
      <Text style={styles.bodyText}>
        Purpose holds even when everything else collapses. Job’s story dismantles
        the myth that purpose is proven only in success. It is proven in
        faithfulness.
      </Text>

      <Text style={styles.h3}>Moses — Assignment after delay</Text>
      <Text style={styles.bodyText}>
        Purpose can be delayed, but in God’s economy, delay is often formation.
        The man who fled Egypt in fear returned with clarity, authority, and a
        mandate.
      </Text>

      <Text style={styles.h3}>Abraham — Direction through trust</Text>
      <Text style={styles.bodyText}>
        Abraham is called without a map, given promises without timelines. His
        life shows that purpose is walked out step-by-step, not leap-by-leap.
      </Text>

      <Text style={styles.h3}>David — Formation in hiddenness</Text>
      <Text style={styles.bodyText}>
        Before the throne, there was the field. Before influence, there were
        lions and bears. David’s leadership was forged in worship and obedience
        long before coronation.
      </Text>

      <Text style={styles.h3}>Solomon — Discernment through wisdom</Text>
      <Text style={styles.bodyText}>
        Solomon shows us that purpose without wisdom becomes vanity. Capacity
        without alignment leads to waste.
      </Text>

      <View style={styles.sectionSpacer} />

      <Text style={styles.h2}>3. JESUS — THE BLUEPRINT FOR HUMAN FUNCTION</Text>
      <Text style={styles.bodyText}>
        Jesus does not only save mankind; He reveals mankind. He is the perfect
        expression of ordered desires, aligned identity, disciplined action,
        sacrificial leadership, and integrated purpose.
      </Text>
      <Text style={styles.bodyText}>
        The disciples and early Church turn this blueprint into lived practice:
        ordinary men and women whose lives became architecture because they were
        aligned, not exceptional.
      </Text>

      <View style={styles.sectionSpacer} />

      <Text style={styles.h2}>
        4. WORLDVIEWS — HUMANITY’S ATTEMPT TO REPLACE THE ORIGINAL DESIGN
      </Text>
      <Text style={styles.bodyText}>
        Civilisations rise and fall on their answer to the question of human
        purpose.
      </Text>

      <View style={styles.bulletList}>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Hinduism —</Text> dissolution of self.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Buddhism —</Text> escape from desire.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Confucianism —</Text> order without a Father.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Islam —</Text> obedience without sonship.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Atheism —</Text> meaning manufactured from
            meaninglessness.
          </Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        Each produces structure, but not identity. Ethic, but not origin.
        Discipline, but not destiny.
      </Text>

      <Text style={styles.bodyText}>
        Christianity alone gives the full sequence:
      </Text>
      <Text style={styles.bodyText}>
        <Text style={styles.strong}>
          Origin → Identity → Meaning → Morality → Destiny
        </Text>
      </Text>

      <View style={styles.footer} fixed>
        <Text style={styles.smallBrand}>Abraham of London · Strategic Editorials</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>

    {/* PAGE 3: Why Christianity built the modern world + Ecclesiastes + Frameworks + Conclusion */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.h2}>5. WHY CHRISTIANITY BUILT THE MODERN WORLD</Text>
      <Text style={styles.bodyText}>
        This is not ideology. It is documented history. Christianity did not
        merely inspire private faith; it reshaped civilisation. Much of what we
        call “modern” is the outworking of biblical ideas entering public life.
      </Text>

      {/* INSERTED ACCESSIBLE BLOCK */}
      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          WHY CHRISTIANITY BUILT THE MODERN WORLD — MADE ACCESSIBLE, STILL
          POWERFUL
        </Text>
        <Text style={styles.bodyText}>
          Much of what our world now treats as “obvious” or “secular progress”
          grew directly from Christian convictions about God, people, and order.
          Here is how those ideas moved from Scripture into history:
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Human Dignity — Imago Dei (Genesis 1:26–27)
        </Text>
        <Text style={styles.bodyText}>
          The idea that every human being carries divine worth, regardless of
          status, tribe, or power. This single doctrine dismantled ancient class
          hierarchies and eventually fuelled human rights movements.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: the abolition movement, early Christian writings,
          Genesis 1–2.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Scientific Rationalism — A rational Creator, a rational universe
        </Text>
        <Text style={styles.bodyText}>
          Because Christians believed God was orderly, they expected the world
          to operate by discoverable laws. This conviction powered the
          scientific revolution.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: Newton, Kepler, Boyle, Pascal — all believers who
          did not see science as an enemy of faith but as worship through
          discovery.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>• The Rule of Law — No one is above God</Text>
        <Text style={styles.bodyText}>
          The biblical insistence that even kings answer to a higher authority
          produced the foundations of constitutional government.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: the Magna Carta, prophets confronting kings, the
          early Church standing before Roman power.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Economic Freedom — Stewardship, vocation, responsibility
        </Text>
        <Text style={styles.bodyText}>
          Christian theology honoured the dignity of work, private stewardship,
          and moral limits on exploitation — the seeds of many modern economic
          models.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: Proverbs, medieval guilds, early Protestant work
          reforms.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Personal Responsibility — Each person answers to God
        </Text>
        <Text style={styles.bodyText}>
          Not the state. Not the tribe. Not blind fate. This created the inner
          architecture for self-governance, conscience, and moral agency.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: Jesus’ parables, Pauline letters, Augustine on
          conscience and will.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>• Charitable Systems — Love your neighbour</Text>
        <Text style={styles.bodyText}>
          Christians were the first to build hospitals, orphanages, and
          structured charity — not as philanthropy, but as obedience.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: early Church history, monastic movements, Basil the
          Great’s early hospital work.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Justice as Moral Principle — Righteousness and equity
        </Text>
        <Text style={styles.bodyText}>
          Justice became a public duty, not a privilege reserved for the
          powerful. Christian ethics insisted that the poor, the foreigner, and
          the vulnerable be protected.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: Mosaic law, the prophets, the Sermon on the Mount.
        </Text>
      </View>

      <View style={styles.sectionSpacer}>
        <Text style={styles.h3}>
          • Vocation as Sacred Work — Work as worship
        </Text>
        <Text style={styles.bodyText}>
          Christianity erased the divide between “sacred” and “secular” work. A
          farmer, mother, merchant, or statesman could serve God through their
          craft with the same dignity as a priest.
        </Text>
        <Text style={styles.bodyText}>
          Where to explore: Colossians 3:23, monastic labour traditions,
          Reformation teaching on calling.
        </Text>
      </View>

      <Text style={styles.bodyText}>
        When purpose is grounded in reality, it becomes productive. When it is
        aligned with divine order, it becomes transformative — at personal,
        household, and civilisational scale.
      </Text>

      <View style={styles.sectionSpacer} />
      <Text style={styles.h2}>6. ECCLESIASTES — THE TWO-SENTENCE BLUEPRINT</Text>

      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>
          “Fear God and keep His commandments… this is the whole duty of man.”
          — Ecclesiastes 12:13
        </Text>
      </View>

      <Text style={styles.bodyText}>
        The entire architecture of human purpose — condensed. This is not fear
        as terror; it is fear as proper orientation.
      </Text>

      <Text style={styles.h3}>To fear God is to:</Text>
      <View style={styles.bulletList}>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>recognise His structure</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>submit to His wisdom</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>respect His order</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>align with His design</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        Jesus completes the blueprint: Love God. Love your neighbour as
        yourself. Not poetry — governance. Not emotion — protocol. Love is the
        engine of divine order, and order is the environment where purpose
        flourishes.
      </Text>

      <View style={styles.sectionSpacer} />
      <Text style={styles.h2}>
        7. FRAMEWORKS — THE STRATEGIC GRID OF HUMAN EXISTENCE
      </Text>
      <Text style={styles.bodyText}>
        Purpose is not philosophical; it is functional. These frameworks express
        that function in operational form:
      </Text>

      <Text style={styles.h3}>⚙️ Dominion Framework</Text>
      <Text style={styles.bodyText}>
        Stewardship + Responsibility = Influence
      </Text>

      <Text style={styles.h3}>⚙️ The Garden Mandate Model</Text>
      <Text style={styles.bodyText}>
        Identity → Work → Influence → Culture
      </Text>

      <Text style={styles.h3}>⚙️ Ancient–Future Leadership Matrix</Text>
      <Text style={styles.bodyText}>
        (Abrahamic Faith) + (Mosaic Governance) + (Davidic Devotion) + (Pauline
        Strategy) + (Early-Church Resilience) = Enduring Leadership.
      </Text>

      <Text style={styles.h3}>⚙️ Ecclesiastes Operating System (EOS)</Text>
      <Text style={styles.bodyText}>
        Truth → Wisdom → Alignment → Flourishing
      </Text>

      <Text style={styles.h3}>⚙️ Love-Alignment Protocol</Text>
      <Text style={styles.bodyText}>
        Love God → Love Self → Love Neighbour → Transform Environment.
      </Text>

      <Text style={styles.bodyText}>
        These are not predictions of future work. They are work already done —
        codified, articulated, structured.
      </Text>

      <View style={styles.sectionSpacer} />
      <Text style={styles.h2}>
        8. CONCLUSION — PURPOSE IS A MANDATE, NOT A MYSTERY
      </Text>

      <Text style={styles.bodyText}>
        You were not designed for drift. You were not born for confusion. You
        were not placed here merely to survive time and hope for comfort.
      </Text>
      <Text style={styles.bodyText}>
        The purpose of man is not hidden: to align with God’s order, embody His
        love, steward His world, and build with clarity.
      </Text>
      <Text style={styles.bodyText}>
        Your decisions, leadership, discipline, relationships, work, and words
        all sit under one mandate:
      </Text>
      <Text style={styles.bodyText}>
        Fear God. Keep His commandments. Walk in love. Build with precision.
        Everything else is commentary.
      </Text>

      <View style={styles.footer} fixed>
        <Text style={styles.smallBrand}>Abraham of London · Strategic Editorials</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

export default UltimatePurposeOfManDocument;