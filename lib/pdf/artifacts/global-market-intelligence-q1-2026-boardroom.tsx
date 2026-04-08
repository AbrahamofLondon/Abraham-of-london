import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingRight: 42,
    paddingBottom: 50,
    paddingLeft: 42,
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#0B1623",
  },
  eyebrow: {
    fontSize: 9,
    color: "#8A6A2F",
    letterSpacing: 1.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 21,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#4B5563",
    marginBottom: 18,
  },
  strap: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginBottom: 18,
  },
  strapText: {
    fontSize: 10.5,
    color: "#111827",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },
  paragraph: {
    marginBottom: 8,
    color: "#1F2937",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bullet: {
    width: 10,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    color: "#1F2937",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 42,
    right: 42,
    fontSize: 8.5,
    color: "#6B7280",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
});

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

export default function GlobalMarketIntelligenceQ12026BoardroomPdf() {
  return (
    <Document
      title="Global Market Intelligence Report Q1 2026"
      author="Abraham of London Intelligence"
      subject="Boardroom briefing"
      keywords="market intelligence, macro, board briefing, strategy, Q1 2026"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Restricted · Architect Tier</Text>
        <Text style={styles.title}>Global Market Intelligence Report Q1 2026</Text>
        <Text style={styles.subtitle}>
          Boardroom Edition · Strategic reading for serious operators
        </Text>

        <View style={styles.strap}>
          <Text style={styles.strapText}>
            Markets are no longer pricing growth alone. They are increasingly
            pricing survivability, jurisdictional resilience, and supply-chain
            optionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Read</Text>
          <Text style={styles.paragraph}>
            Q1 2026 began under managed strain and closed under materially harder
            conditions. The operating environment is now shaped by tighter
            financing, policy friction, tariff distortion, and more selective
            capital allocation.
          </Text>
          <Text style={styles.paragraph}>
            Serious boards should assume that pre-escalation assumptions around
            cost, flow, and policy predictability are now stale.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quarter-Defining Realities</Text>
          <Bullet>Disinflation did not restore simplicity.</Bullet>
          <Bullet>Policy has become an operating variable, not background noise.</Bullet>
          <Bullet>Capital is favouring governed durability over narrative-led expansion.</Bullet>
          <Bullet>
            Supply-chain design has become a board-level strategic question.
          </Bullet>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Boards Should Be Doing</Text>
          <Bullet>Re-price cross-border revenue and cost assumptions.</Bullet>
          <Bullet>Audit tariff exposure by node, vendor, and end-market.</Bullet>
          <Bullet>Preserve cash discipline and financing flexibility.</Bullet>
          <Bullet>
            Build optionality through dual sourcing, nearshoring, or jurisdictional
            diversification where economics support it.
          </Bullet>
          <Bullet>
            Elevate trade policy monitoring into standing board review.
          </Bullet>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Bias</Text>
          <Text style={styles.paragraph}>
            Base case remains managed fragmentation rather than clean
            de-escalation. That means slower flows, tighter judgment, and greater
            reward for resilience over elegance.
          </Text>
        </View>

        <Text style={styles.footer}>
          Abraham of London Intelligence · GMI-Q1-2026 · Boardroom PDF Edition
        </Text>
      </Page>
    </Document>
  );
}