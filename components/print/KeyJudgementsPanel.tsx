/* components/print/KeyJudgementsPanel.tsx — V4.0 (PREMIUM INSTITUTIONAL PANEL) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

type Props = {
  items: string[];
};

const INK = "#121416";
const BRASS = "#8A6A2F";
const BRASS_SOFT = "#B49861";
const SILVER = "#56606C";
const MIST = "#E8E1D4";
const PANEL = "#F7F3EC";
const PANEL_ALT = "#FBF9F4";

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },

  panel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },

  topRule: {
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 9,
  },

  headerRow: {
    marginBottom: 10,
  },

  kicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 5,
  },

  title: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: INK,
    marginBottom: 2,
  },

  subtitle: {
    fontFamily: "Helvetica",
    fontSize: 8.7,
    lineHeight: 1.45,
    color: SILVER,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: MIST,
  },

  firstRow: {
    borderTopWidth: 0,
    paddingTop: 4,
  },

  indexWrap: {
    width: 28,
    paddingRight: 6,
  },

  index: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.4,
    letterSpacing: 0.7,
    color: BRASS,
    marginTop: 1,
  },

  textWrap: {
    flex: 1,
  },

  text: {
    fontFamily: "Helvetica",
    fontSize: 9.35,
    lineHeight: 1.58,
    color: INK,
  },

  emphasis: {
    marginTop: 3,
    fontFamily: "Helvetica",
    fontSize: 8.25,
    lineHeight: 1.45,
    color: SILVER,
  },

  footerBand: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: MIST,
    backgroundColor: PANEL_ALT,
  },

  footerText: {
    fontFamily: "Helvetica",
    fontSize: 7.8,
    lineHeight: 1.4,
    color: SILVER,
    letterSpacing: 0.2,
  },
});

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeItemText(value: string): string {
  return safeString(value)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitJudgementText(value: string): { main: string; tail: string } {
  const clean = normalizeItemText(value);

  const separatorMatch =
    clean.match(/^(.{20,}?[.:;])\s+(.+)$/) ||
    clean.match(/^(.{20,}?[—-])\s+(.+)$/);

  if (separatorMatch) {
    return {
      main: separatorMatch[1].trim(),
      tail: separatorMatch[2].trim(),
    };
  }

  return {
    main: clean,
    tail: "",
  };
}

export const KeyJudgementsPanel: React.FC<Props> = ({ items }) => {
  const safeItems = (items || [])
    .map((item) => normalizeItemText(item))
    .filter((item) => item.length > 0)
    .slice(0, 6);

  if (safeItems.length === 0) return null;

  return (
    <View style={styles.wrap} wrap={false}>
      <View style={styles.panel}>
        <View style={styles.topRule} />

        <View style={styles.headerRow}>
          <Text style={styles.kicker}>Key Judgements</Text>
          <Text style={styles.title}>Board-Level Reading</Text>
          <Text style={styles.subtitle}>
            The points below represent the highest-value conclusions requiring
            disciplined attention and executive clarity.
          </Text>
        </View>

        {safeItems.map((item, index) => {
          const parsed = splitJudgementText(item);

          return (
            <View
              key={`${index}-${item.slice(0, 28)}`}
              style={[styles.row, index === 0 ? styles.firstRow : undefined]}
            >
              <View style={styles.indexWrap}>
                <Text style={styles.index}>{String(index + 1).padStart(2, "0")}</Text>
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.text}>{parsed.main}</Text>
                {parsed.tail ? <Text style={styles.emphasis}>{parsed.tail}</Text> : null}
              </View>
            </View>
          );
        })}

        <View style={styles.footerBand}>
          <Text style={styles.footerText}>
            Judgements are ordered for strategic readability, not necessarily for
            chronological sequence.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default KeyJudgementsPanel;