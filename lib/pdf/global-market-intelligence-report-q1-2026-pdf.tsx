/* lib/pdf/global-market-intelligence-report-q1-2026-pdf.tsx */
/* eslint-disable jsx-a11y/alt-text */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFViewer,
  Svg,
  Rect,
  Line,
  Polyline,
  Circle,
} from "@react-pdf/renderer";

/**
 * Assumes fonts are already registered globally:
 * - AoLSerif
 * - AoLSans
 * - AoLMono
 */

const BRAND = {
  bg: "#030507",
  bg2: "#05080D",
  panel: "#0A0D14",
  panel2: "#0D1119",
  border: "#1A222F",
  borderSoft: "#243043",
  white: "#F8FAFC",
  ink: "#DCE2EA",
  muted: "#93A0AF",
  faint: "#5F6C7D",
  gold: "#E8C07A",
  gold2: "#C99A45",
  silver: "#C6CFDA",
  emerald: "#7BD3AE",
  amber: "#F4BF62",
  red: "#E08A8A",
  blue: "#7DA6F8",
};

const DEFAULT_DOC = {
  docId: "GMI-Q1-2026",
  version: "1.2.0",
  title: "Global Market Intelligence Report Q1 2026",
  subtitle: "Institutional Briefing for Strategic Operators",
  author: "Abraham of London Intelligence",
  date: "15 January 2026",
  classification: "RESTRICTED",
};

type Block =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "callout"; label: string; text: string }
  | { type: "quote"; text: string }
  | { type: "matrix"; rows: Array<{ label: string; value: string }> };

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  kicker?: string;
  blocks: Block[];
};

type ChartBarDatum = {
  label: string;
  value: number;
  color: string;
};

type ScenarioDatum = {
  label: string;
  probability: number;
  color: string;
};

const styles = StyleSheet.create({
  document: { backgroundColor: BRAND.bg },

  coverPage: {
    padding: 0,
    backgroundColor: BRAND.bg,
  },

  page: {
    backgroundColor: BRAND.bg,
    paddingTop: 62,
    paddingBottom: 82,
    paddingHorizontal: 58,
  },

  dividerPage: {
    backgroundColor: BRAND.bg,
    paddingTop: 88,
    paddingBottom: 88,
    paddingHorizontal: 58,
    justifyContent: "space-between",
  },

  coverImageWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3,5,7,0.78)",
  },

  coverFrame: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1,
    borderColor: "rgba(232,192,122,0.22)",
  },

  coverTopRail: {
    position: "absolute",
    top: 42,
    left: 58,
    right: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  coverTopLeft: {},

  eyebrow: {
    fontFamily: "AoLSans",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3.2,
    color: BRAND.gold,
    marginBottom: 8,
  },

  micro: {
    fontFamily: "AoLMono",
    fontSize: 8.3,
    color: BRAND.muted,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },

  coverBadgeRow: {
    flexDirection: "row",
    gap: 10,
  },

  badge: {
    borderWidth: 1,
    borderColor: BRAND.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(10,13,20,0.84)",
  },

  badgePrimary: {
    borderColor: BRAND.gold2,
    backgroundColor: "rgba(232,192,122,0.08)",
  },

  badgeText: {
    fontFamily: "AoLMono",
    fontSize: 8.3,
    color: BRAND.silver,
    textTransform: "uppercase",
    letterSpacing: 1.7,
  },

  badgeTextPrimary: {
    color: BRAND.gold,
  },

  coverBody: {
    position: "absolute",
    left: 58,
    right: 58,
    bottom: 96,
  },

  coverTitle: {
    fontFamily: "AoLSerif",
    fontSize: 34,
    lineHeight: 1.06,
    color: BRAND.white,
    maxWidth: "74%",
    marginBottom: 14,
  },

  coverSubtitle: {
    fontFamily: "AoLSerif",
    fontSize: 15.5,
    lineHeight: 1.34,
    color: BRAND.ink,
    maxWidth: "68%",
    marginBottom: 20,
  },

  coverByline: {
    fontFamily: "AoLSans",
    fontSize: 11,
    color: BRAND.silver,
    textTransform: "uppercase",
    letterSpacing: 2.1,
    marginBottom: 18,
  },

  coverRule: {
    width: 230,
    height: 1,
    backgroundColor: BRAND.gold2,
    opacity: 0.5,
    marginBottom: 18,
  },

  coverTagline: {
    fontFamily: "AoLSans",
    fontSize: 10.6,
    lineHeight: 1.65,
    color: BRAND.muted,
    maxWidth: "76%",
  },

  coverBottomRail: {
    position: "absolute",
    bottom: 34,
    left: 58,
    right: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 10,
  },

  coverBottomText: {
    fontFamily: "AoLMono",
    fontSize: 8,
    color: BRAND.faint,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },

  topRail: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingBottom: 14,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  railEyebrow: {
    fontFamily: "AoLSans",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 2.6,
    color: BRAND.gold,
    marginBottom: 6,
  },

  railTitle: {
    fontFamily: "AoLSerif",
    fontSize: 12.3,
    color: BRAND.white,
  },

  railRight: {
    fontFamily: "AoLMono",
    fontSize: 8.4,
    color: BRAND.muted,
  },

  sectionKicker: {
    fontFamily: "AoLSans",
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 2.3,
    color: BRAND.gold,
    marginBottom: 10,
  },

  h1: {
    fontFamily: "AoLSerif",
    fontSize: 22,
    lineHeight: 1.14,
    color: BRAND.white,
    marginBottom: 10,
  },

  h2: {
    fontFamily: "AoLSerif",
    fontSize: 16.2,
    lineHeight: 1.2,
    color: BRAND.white,
    marginBottom: 8,
  },

  body: {
    fontFamily: "AoLSans",
    fontSize: 10.5,
    lineHeight: 1.66,
    color: BRAND.ink,
    marginBottom: 9,
  },

  smallBody: {
    fontFamily: "AoLSans",
    fontSize: 9.4,
    lineHeight: 1.56,
    color: BRAND.muted,
  },

  divider: {
    marginTop: 10,
    marginBottom: 14,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND.gold,
    paddingLeft: 14,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    backgroundColor: "rgba(232,192,122,0.035)",
    marginBottom: 12,
  },

  quoteText: {
    fontFamily: "AoLSerif",
    fontSize: 11.1,
    lineHeight: 1.5,
    color: BRAND.ink,
    fontStyle: "italic",
  },

  callout: {
    borderWidth: 1,
    borderColor: "rgba(232,192,122,0.28)",
    backgroundColor: BRAND.panel,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  calloutLabel: {
    fontFamily: "AoLSans",
    fontSize: 8.6,
    textTransform: "uppercase",
    letterSpacing: 2.4,
    color: BRAND.gold,
    marginBottom: 6,
  },

  calloutText: {
    fontFamily: "AoLSans",
    fontSize: 10,
    lineHeight: 1.56,
    color: BRAND.ink,
  },

  bulletItem: {
    flexDirection: "row",
    marginBottom: 5,
  },

  bulletDot: {
    width: 12,
    color: BRAND.gold,
    fontSize: 11,
  },

  bulletText: {
    flex: 1,
    fontFamily: "AoLSans",
    fontSize: 10.3,
    lineHeight: 1.58,
    color: BRAND.ink,
  },

  matrixWrap: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.panel,
    marginBottom: 12,
  },

  matrixRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },

  matrixRowLast: {
    borderBottomWidth: 0,
  },

  matrixLabelCell: {
    width: "34%",
    borderRightWidth: 1,
    borderRightColor: BRAND.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  matrixValueCell: {
    width: "66%",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  matrixLabel: {
    fontFamily: "AoLSans",
    fontSize: 8.4,
    textTransform: "uppercase",
    letterSpacing: 1.7,
    color: BRAND.gold,
  },

  matrixValue: {
    fontFamily: "AoLSans",
    fontSize: 9.6,
    lineHeight: 1.45,
    color: BRAND.ink,
  },

  tocTitle: {
    fontFamily: "AoLSerif",
    fontSize: 24,
    color: BRAND.white,
    marginBottom: 14,
  },

  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tocLeft: {
    width: "82%",
    flexDirection: "row",
  },

  tocIndex: {
    width: 28,
    fontFamily: "AoLMono",
    fontSize: 8.6,
    color: BRAND.gold,
  },

  tocLabel: {
    flex: 1,
    fontFamily: "AoLSans",
    fontSize: 10,
    color: BRAND.ink,
  },

  tocPage: {
    fontFamily: "AoLMono",
    fontSize: 8.6,
    color: BRAND.muted,
  },

  dividerMeta: {
    fontFamily: "AoLSans",
    fontSize: 9.6,
    textTransform: "uppercase",
    letterSpacing: 2.8,
    color: BRAND.gold,
  },

  dividerTitle: {
    fontFamily: "AoLSerif",
    fontSize: 34,
    lineHeight: 1.06,
    color: BRAND.white,
    maxWidth: "76%",
    marginTop: 18,
  },

  dividerBody: {
    fontFamily: "AoLSans",
    fontSize: 11,
    lineHeight: 1.64,
    color: BRAND.muted,
    maxWidth: "68%",
    marginTop: 18,
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 58,
    right: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 10,
  },

  footerBrand: {
    fontFamily: "AoLSans",
    fontSize: 8.6,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: BRAND.muted,
  },

  footerPage: {
    fontFamily: "AoLMono",
    fontSize: 8.6,
    color: BRAND.muted,
  },

  chartTitle: {
    fontFamily: "AoLSerif",
    fontSize: 20,
    color: BRAND.white,
    marginBottom: 8,
  },

  chartSubtitle: {
    fontFamily: "AoLSans",
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.muted,
    marginBottom: 18,
  },

  chartPanel: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.panel,
    padding: 14,
    marginBottom: 16,
  },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 6,
  },

  legendSwatch: {
    width: 10,
    height: 10,
    marginRight: 6,
  },

  legendText: {
    fontFamily: "AoLSans",
    fontSize: 8.8,
    color: BRAND.ink,
  },

  appendixBox: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.panel,
    padding: 14,
    marginBottom: 14,
  },

  appendixHeading: {
    fontFamily: "AoLSans",
    fontSize: 9.2,
    color: BRAND.gold,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    marginBottom: 8,
  },
});

function TopRail({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.topRail} fixed>
      <View>
        <Text style={styles.railEyebrow}>{eyebrow}</Text>
        <Text style={styles.railTitle}>{title}</Text>
      </View>
      <Text style={styles.railRight}>abrahamoflondon.org</Text>
    </View>
  );
}

function Footer({ label }: { label?: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerBrand}>
        {label || "Abraham of London · Market Intelligence"}
      </Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function ChapterDivider({
  chapter,
  title,
  body,
}: {
  chapter: string;
  title: string;
  body: string;
}) {
  return (
    <Page size="A4" style={styles.dividerPage}>
      <View>
        <Text style={styles.dividerMeta}>{chapter}</Text>
        <Text style={styles.dividerTitle}>{title}</Text>
        <Text style={styles.dividerBody}>{body}</Text>
      </View>

      <Text style={styles.smallBody}>
        Restricted circulation. Designed for boards, strategic operators, capital
        allocators, and institutional leadership teams who need clarity under
        strain rather than comfort through narrative.
      </Text>
    </Page>
  );
}

function SectionPage({
  eyebrow,
  title,
  kicker,
  blocks,
}: {
  eyebrow: string;
  title: string;
  kicker?: string;
  blocks: Block[];
}) {
  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow={eyebrow} title={title} />
      {kicker ? <Text style={styles.sectionKicker}>{kicker}</Text> : null}
      <Text style={styles.h1}>{title}</Text>

      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Text key={index} style={styles.body}>
              {block.text}
            </Text>
          );
        }

        if (block.type === "bullets") {
          return (
            <View key={index} style={{ marginBottom: 8 }}>
              {block.items.map((item, bulletIndex) => (
                <View key={`${index}-${bulletIndex}`} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === "callout") {
          return (
            <View key={index} style={styles.callout}>
              <Text style={styles.calloutLabel}>{block.label}</Text>
              <Text style={styles.calloutText}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === "quote") {
          return (
            <View key={index} style={styles.quoteBlock}>
              <Text style={styles.quoteText}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === "matrix") {
          return (
            <View key={index} style={styles.matrixWrap}>
              {block.rows.map((row, rowIndex) => (
                <View
                  key={`${index}-${rowIndex}`}
                  style={
                    rowIndex === block.rows.length - 1
                      ? [styles.matrixRow, styles.matrixRowLast]
                      : styles.matrixRow
                  }
                >
                  <View style={styles.matrixLabelCell}>
                    <Text style={styles.matrixLabel}>{row.label}</Text>
                  </View>
                  <View style={styles.matrixValueCell}>
                    <Text style={styles.matrixValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        }

        return null;
      })}

      <Footer />
    </Page>
  );
}

function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <View style={styles.legendRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function VerticalBarChart({
  title,
  subtitle,
  data,
  max = 7,
}: {
  title: string;
  subtitle: string;
  data: ChartBarDatum[];
  max?: number;
}) {
  const width = 430;
  const height = 180;
  const chartBottom = 150;
  const chartTop = 20;
  const usableHeight = chartBottom - chartTop;
  const barWidth = 42;
  const gap = 20;

  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Charts & Panels" title={title} />
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSubtitle}>{subtitle}</Text>

      <View style={styles.chartPanel}>
        <Svg width={width} height={height}>
          <Line x1={20} y1={chartBottom} x2={410} y2={chartBottom} stroke={BRAND.borderSoft} strokeWidth={1} />
          <Line x1={20} y1={chartTop} x2={20} y2={chartBottom} stroke={BRAND.borderSoft} strokeWidth={1} />

          {data.map((item, index) => {
            const x = 40 + index * (barWidth + gap);
            const barHeight = (item.value / max) * usableHeight;
            const y = chartBottom - barHeight;

            return (
              <React.Fragment key={item.label}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  opacity={0.92}
                />
              </React.Fragment>
            );
          })}
        </Svg>

        <ChartLegend
          items={data.map((item) => ({ label: `${item.label} (${item.value.toFixed(1)}%)`, color: item.color }))}
        />
      </View>

      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Interpretation</Text>
        <Text style={styles.calloutText}>
          Growth dispersion remains meaningful. The market is not rewarding broad
          optimism. It is rewarding selective jurisdictional confidence and
          operational resilience.
        </Text>
      </View>

      <Footer />
    </Page>
  );
}

function HeatMapPage() {
  const cells = [
    ["US", BRAND.emerald],
    ["Eurozone", BRAND.amber],
    ["UK", BRAND.amber],
    ["China", BRAND.red],
    ["India", BRAND.emerald],
    ["Japan", BRAND.blue],
    ["Middle East", BRAND.emerald],
    ["Africa", BRAND.amber],
    ["SEA", BRAND.emerald],
  ];

  const cellWidth = 118;
  const cellHeight = 54;

  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Charts & Panels" title="Sector Strength Heatmap" />
      <Text style={styles.chartTitle}>Sector Strength Heatmap</Text>
      <Text style={styles.chartSubtitle}>
        Stylized strategic heatmap showing where capital appears most comfortable:
        infrastructure, cyber resilience, logistics, industrial software, defense-linked supply chains, and data infrastructure remain structurally favored.
      </Text>

      <View style={styles.chartPanel}>
        <Svg width={430} height={210}>
          {cells.map((cell, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const x = 14 + col * (cellWidth + 12);
            const y = 14 + row * (cellHeight + 12);

            return (
              <Rect
                key={cell[0]}
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill={cell[1]}
                opacity={0.78}
              />
            );
          })}
        </Svg>

        <ChartLegend
          items={[
            { label: "Strong", color: BRAND.emerald },
            { label: "Mixed", color: BRAND.amber },
            { label: "Constrained", color: BRAND.red },
            { label: "Reform / selective strength", color: BRAND.blue },
          ]}
        />
      </View>

      <Footer />
    </Page>
  );
}

function ScenarioProbabilityPage({
  data,
}: {
  data: ScenarioDatum[];
}) {
  const width = 430;
  const height = 180;
  const centerX = 215;
  const centerY = 88;
  let startAngle = -90;

  const total = data.reduce((sum, item) => sum + item.probability, 0) || 100;

  const segments = data.map((item) => {
    const angle = (item.probability / total) * 360;
    const start = startAngle;
    const end = start + angle;
    startAngle = end;
    return { ...item, start, end };
  });

  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Charts & Panels" title="Scenario Probability Matrix" />
      <Text style={styles.chartTitle}>Scenario Probability Matrix</Text>
      <Text style={styles.chartSubtitle}>
        Board framing for Q2 2026. This is not a trading probability engine. It is a strategic scenario hierarchy for decision hygiene.
      </Text>

      <View style={styles.chartPanel}>
        <Svg width={width} height={height}>
          {segments.map((segment, index) => {
            const arcLength = (segment.probability / total) * 320;
            return (
              <Rect
                key={segment.label}
                x={50 + index * 88}
                y={60}
                width={52}
                height={Math.max(18, arcLength / 4)}
                fill={segment.color}
                opacity={0.88}
              />
            );
          })}
          <Circle cx={centerX} cy={centerY} r={4} fill={BRAND.gold} />
        </Svg>

        <ChartLegend
          items={data.map((item) => ({
            label: `${item.label} (${item.probability}%)`,
            color: item.color,
          }))}
        />
      </View>

      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Base case</Text>
        <Text style={styles.calloutText}>
          Managed stability remains the primary operating case, but boards should
          preserve explicit contingency logic for policy shock, narrow-strength
          deterioration, and confidence fracture.
        </Text>
      </View>

      <Footer />
    </Page>
  );
}

const CORE_SECTIONS: Section[] = [
  {
    id: "01",
    eyebrow: "Executive Overview",
    title: "Controlled Instability as the Operating Condition",
    kicker: "Quarter framing",
    blocks: [
      {
        type: "paragraph",
        text:
          "Q1 2026 opened under conditions of controlled instability. Global growth remained positive, but tighter financing, uneven disinflation, selective credit conditions, and geopolitical friction continued to shape outcomes. Capital did not rotate blindly into risk. It discriminated between jurisdictions, balance sheets, policy quality, and governance discipline.",
      },
      {
        type: "paragraph",
        text:
          "This was neither a clean crisis nor a clean boom. It was a regime of managed strain. The strategic consequence is simple: governance quality now carries more visible pricing power than it did under the excess-liquidity conditions of the previous decade.",
      },
      {
        type: "callout",
        label: "Bottom line",
        text:
          "The quarter rewarded disciplined positioning under friction, not optimism alone.",
      },
    ],
  },
  {
    id: "02",
    eyebrow: "Quarter Thesis",
    title: "Capital Is Pricing Survivability, Optionality, and Jurisdictional Discipline",
    kicker: "Thesis",
    blocks: [
      {
        type: "paragraph",
        text:
          "Markets are no longer pricing growth alone. They are pricing whether balance sheets can survive tighter capital, whether management teams can preserve strategic optionality under policy disruption, and whether jurisdictions remain investable under security, regulatory, and political strain.",
      },
      {
        type: "bullets",
        items: [
          "Valuations increasingly act as a referendum on balance-sheet integrity.",
          "Geographic diversification is being reframed through sanction, regulatory, and corridor exposure.",
          "Boards must stop reading markets as applause meters and start reading them as stress transmitters.",
        ],
      },
    ],
  },
  {
    id: "03",
    eyebrow: "Macro Dashboard",
    title: "Global Growth and Inflation",
    kicker: "Macro baseline",
    blocks: [
      {
        type: "paragraph",
        text:
          "Consensus global growth for 2026 remains positive but unspectacular. The stronger readings still fall short of the kind of broad-cycle ease that previously justified indiscriminate risk expansion. Inflation has moderated materially from its highs, but its composition remains uneven enough to keep monetary conditions from relaxing into the old cheap-money reflex.",
      },
      {
        type: "matrix",
        rows: [
          {
            label: "Growth frame",
            value:
              "Positive but below older post-Cold-War and pre-GFC expectations.",
          },
          {
            label: "Inflation frame",
            value:
              "Down materially from peak, but not benign enough to erase capital discipline.",
          },
          {
            label: "Rate reality",
            value:
              "Real rates remain restrictive enough to expose weak models.",
          },
          {
            label: "Operator reading",
            value:
              "This is a managed-strain regime, not a restored-normal regime.",
          },
        ],
      },
    ],
  },
  {
    id: "04",
    eyebrow: "Major Economies",
    title: "United States, Eurozone, and the UK",
    kicker: "Regional reading",
    blocks: [
      {
        type: "paragraph",
        text:
          "The U.S. remains the core global pricing engine, but cost-of-capital discipline punishes weak balance sheets more rapidly than in prior cycles. The Eurozone remains defensively sophisticated, attractive for long-duration institutional projects but constrained by energy structure and low-trend growth. The UK remains globally relevant in law, finance, and intermediation, yet domestically fragile enough to demand caution around internal demand assumptions.",
      },
      {
        type: "bullets",
        items: [
          "U.S.: still liquid, still credible, but harsher on leverage.",
          "Eurozone: stability zone, not velocity zone.",
          "UK: globally useful, domestically mixed.",
        ],
      },
    ],
  },
  {
    id: "05",
    eyebrow: "Major Economies",
    title: "China, India, and Japan",
    kicker: "Regional reading",
    blocks: [
      {
        type: "paragraph",
        text:
          "China remains too large to ignore and too policy-shaped to romanticize. India retains one of the strongest long-horizon growth cases among major economies, though execution discipline remains decisive. Japan continues to attract renewed attention through governance reform, capital efficiency improvements, and selective industrial strength.",
      },
      {
        type: "callout",
        label: "Allocation rule",
        text:
          "China should be approached specifically, India selectively, and Japan with renewed structural respect rather than tactical nostalgia.",
      },
    ],
  },
  {
    id: "06",
    eyebrow: "Strategic Regions",
    title: "Middle East, Africa, and Southeast Asia",
    kicker: "Regional reading",
    blocks: [
      {
        type: "paragraph",
        text:
          "The Middle East now matters as a capital source and an infrastructure destination. Africa remains structurally underpriced but operationally demanding. Southeast Asia continues to benefit from manufacturing relocation and multi-polar diversification logic.",
      },
      {
        type: "bullets",
        items: [
          "Middle East: sovereign capital, energy, logistics, transformation agendas.",
          "Africa: not a sentiment trade; requires execution discipline.",
          "Southeast Asia: regional platform logic beats single-point concentration.",
        ],
      },
    ],
  },
  {
    id: "07",
    eyebrow: "Cross-Cutting Markets",
    title: "Commodities, Rates, FX, and Credit",
    kicker: "Cross-market reading",
    blocks: [
      {
        type: "paragraph",
        text:
          "Commodities increasingly behave as geopolitical exposure in disguise. Rates and FX have moved from treasury backwater to front-line strategic variables. Credit continues to distinguish more sharply between systemic fragility and issuer-specific weakness. The protective cover once supplied by cheap money has been stripped away.",
      },
      {
        type: "quote",
        text:
          "When money is no longer free, weak models no longer hide inside rising tides.",
      },
    ],
  },
  {
    id: "08",
    eyebrow: "Sector Opportunity Map",
    title: "Where the Premium Still Lives",
    kicker: "Opportunity structure",
    blocks: [
      {
        type: "paragraph",
        text:
          "Infrastructure, energy systems, cyber resilience, logistics, industrial software, defense-linked supply chains, and data infrastructure continue to attract strategic attention because they solve real capacity problems. High-leverage discretionary stories, fragile transition narratives, and revenue-thin technology theater remain materially less attractive.",
      },
      {
        type: "bullets",
        items: [
          "Necessary systems continue to clear investment thresholds.",
          "Narrative without cash logic is being repriced.",
          "Durability now behaves like an offensive premium, not merely a defensive one.",
        ],
      },
    ],
  },
  {
    id: "09",
    eyebrow: "Board Scenarios",
    title: "Base Case and Shock Cases",
    kicker: "Scenario set",
    blocks: [
      {
        type: "paragraph",
        text:
          "The base case remains managed stability. Yet policy shock, narrow-strength broad-weakness, and confidence fracture remain sufficiently plausible to require explicit board-level contingency posture.",
      },
      {
        type: "matrix",
        rows: [
          { label: "Managed stability", value: "Base case. Selective strength with continuing friction." },
          { label: "Policy shock", value: "Tariffs, sanctions, fiscal surprise, or security escalation." },
          { label: "Narrow strength", value: "Indices hold while real-economy weakness deepens." },
          { label: "Confidence fracture", value: "Funding or sovereign event breaks the managed-strain frame." },
        ],
      },
    ],
  },
  {
    id: "10",
    eyebrow: "Board Recommendations",
    title: "What Leadership Should Actually Do",
    kicker: "Execution logic",
    blocks: [
      {
        type: "bullets",
        items: [
          "Re-price optimism under structurally higher real rates.",
          "Audit jurisdictional exposure with real sanction and policy logic.",
          "Treat liquidity as a strategic weapon, not a passive reserve.",
          "Favor resilience, repeatable cash flows, and governance credibility.",
          "Build optionality deliberately, not accidentally.",
        ],
      },
      {
        type: "callout",
        label: "Board rule",
        text:
          "Optionality is not indecision. It is conviction engineered to survive regime change.",
      },
    ],
  },
];

const APPENDIX_SOURCE_NOTES = [
  "IMF World Economic Outlook updates and regional assessments.",
  "UNCTAD growth and trade-fragmentation framing.",
  "ECB professional forecaster surveys and inflation expectations.",
  "Major private-house macro and market commentary for cross-checking spread and sentiment behavior.",
  "Internal synthesis for board-level decision use rather than trading execution.",
];

const APPENDIX_DEFINITIONS = [
  {
    term: "Managed strain",
    definition:
      "A regime in which conditions are stable enough to avoid systemic breakage but restrictive enough to enforce capital discipline.",
  },
  {
    term: "Governed durability",
    definition:
      "The premium accorded to institutions, issuers, and jurisdictions able to remain investable across multiple stress conditions.",
  },
  {
    term: "Allocational geopolitics",
    definition:
      "The degree to which security, sanctions, trade rules, and industrial policy constrain where capital may be placed.",
  },
  {
    term: "Strategic optionality",
    definition:
      "Deliberately engineered flexibility in supply, funding, market access, and operating capacity.",
  },
];

const APPENDIX_SCORECARDS = [
  {
    region: "United States",
    strength: "High liquidity, institutional depth, technological leadership.",
    risk: "Policy volatility, tariff sensitivity, higher-for-longer real rates.",
    posture: "Remain exposed, but stress-test leverage and political sensitivity.",
  },
  {
    region: "Eurozone",
    strength: "Legal credibility, regulatory quality, long-duration infrastructure appeal.",
    risk: "Energy structure, low trend growth, uneven industrial competitiveness.",
    posture: "Useful for stability and institutional projects, not broad cyclical exuberance.",
  },
  {
    region: "China",
    strength: "Scale, industrial policy weight, strategic manufacturing relevance.",
    risk: "Property drag, regulatory opacity, sanctions and data-control constraints.",
    posture: "Specific and partnership-led exposure only.",
  },
  {
    region: "India",
    strength: "Demographics, infrastructure, manufacturing relevance, policy continuity.",
    risk: "Execution unevenness, state-level variability, implementation friction.",
    posture: "High-conviction long-horizon market with staged deployment discipline.",
  },
  {
    region: "Africa",
    strength: "Critical minerals, agriculture, energy relevance, underpriced growth pockets.",
    risk: "Currency fragility, governance variance, debt stress, execution complexity.",
    posture: "Local intelligence, phased capital, and risk-sharing structures required.",
  },
];

function buildContents(sections: Section[]) {
  return sections.map((section, index) => ({
    index: String(index + 1).padStart(2, "0"),
    title: section.title,
    page: String(index + 5),
  }));
}

function GrowthDispersionPage() {
  const data: ChartBarDatum[] = [
    { label: "US", value: 2.2, color: BRAND.emerald },
    { label: "Eurozone", value: 1.3, color: BRAND.amber },
    { label: "UK", value: 1.2, color: BRAND.amber },
    { label: "China", value: 4.4, color: BRAND.red },
    { label: "India", value: 6.3, color: BRAND.blue },
    { label: "Japan", value: 1.1, color: BRAND.silver },
  ];

  return (
    <VerticalBarChart
      title="Global Growth Dispersion"
      subtitle="Illustrative distribution of relative growth expectations across major economies. The key point is dispersion itself: this is not a single-cycle world."
      data={data}
      max={7}
    />
  );
}

function InflationConvergencePage() {
  const width = 430;
  const height = 190;

  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Charts & Panels" title="Inflation Convergence / Divergence" />
      <Text style={styles.chartTitle}>Inflation Convergence / Divergence</Text>
      <Text style={styles.chartSubtitle}>
        Stylized trend panel showing headline inflation easing while core and services components remain stickier across different blocs.
      </Text>

      <View style={styles.chartPanel}>
        <Svg width={width} height={height}>
          <Line x1={24} y1={150} x2={408} y2={150} stroke={BRAND.borderSoft} strokeWidth={1} />
          <Line x1={24} y1={24} x2={24} y2={150} stroke={BRAND.borderSoft} strokeWidth={1} />

          <Polyline
            points="30,48 90,62 150,74 210,88 270,100 330,108 390,116"
            fill="none"
            stroke={BRAND.gold}
            strokeWidth={2}
          />
          <Polyline
            points="30,56 90,70 150,82 210,90 270,96 330,94 390,90"
            fill="none"
            stroke={BRAND.red}
            strokeWidth={2}
          />
          <Polyline
            points="30,66 90,76 150,84 210,86 270,84 330,78 390,70"
            fill="none"
            stroke={BRAND.blue}
            strokeWidth={2}
          />

          {[30, 90, 150, 210, 270, 330, 390].map((x) => (
            <Circle key={x} cx={x} cy={150} r={1.6} fill={BRAND.borderSoft} />
          ))}
        </Svg>

        <ChartLegend
          items={[
            { label: "Headline", color: BRAND.gold },
            { label: "Core / services", color: BRAND.red },
            { label: "Euro-area moderation", color: BRAND.blue },
          ]}
        />
      </View>

      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Interpretation</Text>
        <Text style={styles.calloutText}>
          Disinflation improved the backdrop but did not restore simplicity. The
          persistence of sticky components is enough to keep capital selective.
        </Text>
      </View>

      <Footer />
    </Page>
  );
}

function RatesAndFxPage() {
  const width = 430;
  const height = 180;

  return (
    <Page size="A4" style={styles.page}>
      <TopRail eyebrow="Charts & Panels" title="Rates and FX Pressure Map" />
      <Text style={styles.chartTitle}>Rates and FX Pressure Map</Text>
      <Text style={styles.chartSubtitle}>
        Stylized quadrant view: high real-rate pressure, policy credibility, and
        currency stability shape which jurisdictions remain comfortably investable.
      </Text>

      <View style={styles.chartPanel}>
        <Svg width={width} height={height}>
          <Rect x={20} y={20} width={390} height={130} fill={BRAND.panel2} />
          <Line x1={215} y1={20} x2={215} y2={150} stroke={BRAND.borderSoft} strokeWidth={1} />
          <Line x1={20} y1={85} x2={410} y2={85} stroke={BRAND.borderSoft} strokeWidth={1} />

          <Circle cx={300} cy={50} r={8} fill={BRAND.emerald} />
          <Circle cx={150} cy={55} r={8} fill={BRAND.amber} />
          <Circle cx={120} cy={120} r={8} fill={BRAND.red} />
          <Circle cx={310} cy={118} r={8} fill={BRAND.blue} />
        </Svg>

        <ChartLegend
          items={[
            { label: "High credibility / strong defensive posture", color: BRAND.emerald },
            { label: "Mixed", color: BRAND.amber },
            { label: "Pressure zone", color: BRAND.red },
            { label: "Selective reform / tactical upside", color: BRAND.blue },
          ]}
        />
      </View>

      <Footer />
    </Page>
  );
}

function ScenarioPage() {
  const data: ScenarioDatum[] = [
    { label: "Managed stability", probability: 55, color: BRAND.emerald },
    { label: "Policy shock", probability: 20, color: BRAND.amber },
    { label: "Narrow strength", probability: 15, color: BRAND.blue },
    { label: "Confidence fracture", probability: 10, color: BRAND.red },
  ];

  return <ScenarioProbabilityPage data={data} />;
}

export interface GlobalMarketIntelligenceReportPdfProps {
  coverImagePath: string;
  docId?: string;
  version?: string;
  date?: string;
  classification?: string;
  title?: string;
  subtitle?: string;
  author?: string;
}

export function GlobalMarketIntelligenceReportPdf({
  coverImagePath,
  docId = DEFAULT_DOC.docId,
  version = DEFAULT_DOC.version,
  date = DEFAULT_DOC.date,
  classification = DEFAULT_DOC.classification,
  title = DEFAULT_DOC.title,
  subtitle = DEFAULT_DOC.subtitle,
  author = DEFAULT_DOC.author,
}: GlobalMarketIntelligenceReportPdfProps) {
  const contents = buildContents(CORE_SECTIONS);

  return (
    <Document
      title={title}
      author={author}
      subject="Restricted Institutional Intelligence Briefing"
      keywords="global markets, macro, board briefing, q1 2026, institutional strategy"
    >
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverImageWrap}>
          <Image src={coverImagePath} style={styles.coverImage} />
          <View style={styles.coverShade} />
          <View style={styles.coverFrame} />
        </View>

        <View style={styles.coverTopRail}>
          <View style={styles.coverTopLeft}>
            <Text style={styles.eyebrow}>
              RESTRICTED · MARKET INTELLIGENCE · QUARTERLY REPORT
            </Text>
            <Text style={styles.micro}>
              CAPITAL FLOWS · MACRO STRAIN · STRATEGIC OPTIONALITY
            </Text>
          </View>

          <View style={styles.coverBadgeRow}>
            <View style={[styles.badge, styles.badgePrimary]}>
              <Text style={[styles.badgeText, styles.badgeTextPrimary]}>
                {classification}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{docId}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>v{version}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverBody}>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
          <Text style={styles.coverByline}>by {author}</Text>
          <View style={styles.coverRule} />
          <Text style={styles.coverTagline}>
            A flagship institutional report on global market movements, capital
            discipline, regional stress points, sector opportunity structures, and
            board-level strategic posture entering Q2 2026.
          </Text>
        </View>

        <View style={styles.coverBottomRail}>
          <Text style={styles.coverBottomText}>Issued {date}</Text>
          <Text style={styles.coverBottomText}>abrahamoflondon.org</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Front Matter" title={title} />
        <Text style={styles.tocTitle}>Contents</Text>

        {contents.map((item) => (
          <View key={item.index} style={styles.tocItem}>
            <View style={styles.tocLeft}>
              <Text style={styles.tocIndex}>{item.index}</Text>
              <Text style={styles.tocLabel}>{item.title}</Text>
            </View>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}

        <View style={{ marginTop: 18 }}>
          <Text style={styles.smallBody}>
            This core volume is designed to keep the report elegant in the boardroom.
            Source notes, definitions, and regional scorecards are separated into a
            dedicated appendix volume.
          </Text>
        </View>

        <Footer label="Abraham of London · Front Matter" />
      </Page>

      <ChapterDivider
        chapter="Chapter I"
        title="Macro Regime and Quarter Thesis"
        body="The opening chapter establishes the operating condition of the quarter, the market thesis, and the macro-financial logic shaping capital behavior."
      />

      {CORE_SECTIONS.slice(0, 3).map((section) => (
        <SectionPage
          key={section.id}
          eyebrow={section.eyebrow}
          title={section.title}
          kicker={section.kicker}
          blocks={section.blocks}
        />
      ))}

      <GrowthDispersionPage />
      <InflationConvergencePage />
      <RatesAndFxPage />

      <ChapterDivider
        chapter="Chapter II"
        title="Regional Readings and Strategic Geographies"
        body="This chapter moves from macro to jurisdictional interpretation, focusing on where capital can still move with confidence and where exposure must become more selective."
      />

      {CORE_SECTIONS.slice(3, 6).map((section) => (
        <SectionPage
          key={section.id}
          eyebrow={section.eyebrow}
          title={section.title}
          kicker={section.kicker}
          blocks={section.blocks}
        />
      ))}

      <HeatMapPage />

      <ChapterDivider
        chapter="Chapter III"
        title="Cross-Cutting Markets, Sectors, and Scenarios"
        body="The final core chapter distills cross-market dynamics, sector opportunity logic, and scenario architecture into a board-usable strategic posture."
      />

      {CORE_SECTIONS.slice(6).map((section) => (
        <SectionPage
          key={section.id}
          eyebrow={section.eyebrow}
          title={section.title}
          kicker={section.kicker}
          blocks={section.blocks}
        />
      ))}

      <ScenarioPage />
    </Document>
  );
}

export function GlobalMarketIntelligenceAppendixPdf({
  coverImagePath,
  docId = DEFAULT_DOC.docId,
  version = DEFAULT_DOC.version,
  date = DEFAULT_DOC.date,
  classification = DEFAULT_DOC.classification,
  title = `${DEFAULT_DOC.title} — Appendix Volume`,
  subtitle = "Source Notes, Definitions, and Regional Scorecards",
  author = DEFAULT_DOC.author,
}: GlobalMarketIntelligenceReportPdfProps) {
  return (
    <Document
      title={title}
      author={author}
      subject="Appendix volume for restricted institutional intelligence briefing"
      keywords="appendix, source notes, regional scorecards, q1 2026"
    >
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverImageWrap}>
          <Image src={coverImagePath} style={styles.coverImage} />
          <View style={styles.coverShade} />
          <View style={styles.coverFrame} />
        </View>

        <View style={styles.coverTopRail}>
          <View>
            <Text style={styles.eyebrow}>APPENDIX VOLUME · RESTRICTED</Text>
            <Text style={styles.micro}>SOURCE NOTES · DEFINITIONS · SCORECARDS</Text>
          </View>

          <View style={styles.coverBadgeRow}>
            <View style={[styles.badge, styles.badgePrimary]}>
              <Text style={[styles.badgeText, styles.badgeTextPrimary]}>
                {classification}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{docId}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>v{version}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverBody}>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
          <Text style={styles.coverByline}>by {author}</Text>
          <View style={styles.coverRule} />
          <Text style={styles.coverTagline}>
            Companion appendix for institutional reference, evidential grounding,
            and governance use beyond the core board-facing report.
          </Text>
        </View>

        <View style={styles.coverBottomRail}>
          <Text style={styles.coverBottomText}>Issued {date}</Text>
          <Text style={styles.coverBottomText}>abrahamoflondon.org</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Appendix A" title="Source Notes" />
        <Text style={styles.h1}>Source Notes</Text>

        <View style={styles.appendixBox}>
          <Text style={styles.appendixHeading}>Method note</Text>
          <Text style={styles.body}>
            The core report is written as a board document, not a citation-heavy
            academic paper. This appendix restores the deeper reference layer for
            auditability, discussion, and internal challenge.
          </Text>
        </View>

        {APPENDIX_SOURCE_NOTES.map((note) => (
          <View key={note} style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{note}</Text>
          </View>
        ))}

        <Footer label="Abraham of London · Appendix A" />
      </Page>

      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Appendix B" title="Executive Definitions" />
        <Text style={styles.h1}>Executive Definitions</Text>

        {APPENDIX_DEFINITIONS.map((item) => (
          <View key={item.term} style={styles.appendixBox}>
            <Text style={styles.appendixHeading}>{item.term}</Text>
            <Text style={styles.body}>{item.definition}</Text>
          </View>
        ))}

        <Footer label="Abraham of London · Appendix B" />
      </Page>

      <Page size="A4" style={styles.page}>
        <TopRail eyebrow="Appendix C" title="Regional Scorecards" />
        <Text style={styles.h1}>Regional Scorecards</Text>

        {APPENDIX_SCORECARDS.map((item) => (
          <View key={item.region} style={styles.appendixBox}>
            <Text style={styles.appendixHeading}>{item.region}</Text>
            <Text style={styles.body}>
              <Text style={{ color: BRAND.white }}>Strength: </Text>
              {item.strength}
            </Text>
            <Text style={styles.body}>
              <Text style={{ color: BRAND.white }}>Risk: </Text>
              {item.risk}
            </Text>
            <Text style={styles.body}>
              <Text style={{ color: BRAND.white }}>Strategic posture: </Text>
              {item.posture}
            </Text>
          </View>
        ))}

        <Footer label="Abraham of London · Appendix C" />
      </Page>
    </Document>
  );
}

export function GlobalMarketIntelligenceReportPreview(
  props: GlobalMarketIntelligenceReportPdfProps,
) {
  return (
    <PDFViewer width="100%" height="1000px" style={{ border: "none" }}>
      <GlobalMarketIntelligenceReportPdf {...props} />
    </PDFViewer>
  );
}

export function GlobalMarketIntelligenceAppendixPreview(
  props: GlobalMarketIntelligenceReportPdfProps,
) {
  return (
    <PDFViewer width="100%" height="1000px" style={{ border: "none" }}>
      <GlobalMarketIntelligenceAppendixPdf {...props} />
    </PDFViewer>
  );
}

export default GlobalMarketIntelligenceReportPdf;