/* components/print/KeyJudgementsPanel.tsx — V4.1 (PREMIUM INSTITUTIONAL PANEL) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type Props = {
  items: string[];
  maxItems?: number;
  showHeader?: boolean;
  showFooter?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Premium Design Tokens — Quiet Luxury                                       */
/* -------------------------------------------------------------------------- */
const INK = "#1E1C1A";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const BRASS_DARK = "#7A6848";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const PANEL = "#F9F6EF";
const PANEL_ALT = "#FDFAF5";

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },

  panel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },

  topRule: {
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 11,
    width: 48,
  },

  headerRow: {
    marginBottom: 14,
  },

  kicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 6,
  },

  title: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: INK,
    marginBottom: 4,
  },

  subtitle: {
    fontFamily: "Helvetica",
    fontSize: 8.4,
    lineHeight: 1.48,
    color: SILVER_LIGHT,
    maxWidth: 380,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: MIST,
  },

  firstRow: {
    borderTopWidth: 0,
    paddingTop: 4,
  },

  indexWrap: {
    width: 30,
    paddingRight: 8,
  },

  index: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.2,
    letterSpacing: 0.8,
    color: BRASS,
    marginTop: 2,
  },

  textWrap: {
    flex: 1,
  },

  text: {
    fontFamily: "Helvetica",
    fontSize: 9.2,
    lineHeight: 1.55,
    color: INK,
  },

  emphasis: {
    marginTop: 4,
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.48,
    color: SILVER,
  },

  footerBand: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MIST,
    backgroundColor: PANEL_ALT,
  },

  footerText: {
    fontFamily: "Helvetica",
    fontSize: 7.6,
    lineHeight: 1.42,
    color: SILVER_LIGHT,
    letterSpacing: 0.2,
  },
});

/* -------------------------------------------------------------------------- */
/* Safe Utilities                                                             */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
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

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function splitJudgementText(value: string): { main: string; tail: string } {
  const clean = normalizeItemText(value);
  if (!clean) return { main: "", tail: "" };

  // Try to split at natural break points
  const separatorMatch =
    clean.match(/^(.{25,}?[.:;])\s+(.+)$/) ||
    clean.match(/^(.{25,}?[—-])\s+(.+)$/) ||
    clean.match(/^(.{30,}?\.\.\.)\s*(.+)$/);

  if (separatorMatch) {
    return {
      main: capitalizeFirst(separatorMatch[1].trim()),
      tail: capitalizeFirst(separatorMatch[2].trim()),
    };
  }

  // If the judgement is very long, try to split at the second sentence
  const sentences = clean.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1 && sentences[0].length > 40) {
    return {
      main: capitalizeFirst(sentences[0]),
      tail: sentences.slice(1).join(" "),
    };
  }

  return {
    main: capitalizeFirst(clean),
    tail: "",
  };
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export const KeyJudgementsPanel: React.FC<Props> = ({ 
  items, 
  maxItems = 6,
  showHeader = true,
  showFooter = true,
}) => {
  const safeItems = (items || [])
    .map((item) => normalizeItemText(item))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);

  if (safeItems.length === 0) return null;

  return (
    <View style={styles.wrap} wrap={false}>
      <View style={styles.panel}>
        <View style={styles.topRule} />

        {showHeader && (
          <View style={styles.headerRow}>
            <Text style={styles.kicker}>Key Judgements</Text>
            <Text style={styles.title}>Board-Level Reading</Text>
            <Text style={styles.subtitle}>
              The points below represent the highest-value conclusions requiring
              disciplined attention and executive clarity.
            </Text>
          </View>
        )}

        {safeItems.map((item, index) => {
          const parsed = splitJudgementText(item);

          return (
            <View
              key={`${index}-${item.slice(0, 28)}`}
              style={[styles.row, index === 0 ? styles.firstRow : undefined]}
            >
              <View style={styles.indexWrap}>
                <Text style={styles.index}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.text}>{parsed.main}</Text>
                {parsed.tail ? (
                  <Text style={styles.emphasis}>{parsed.tail}</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {showFooter && (
          <View style={styles.footerBand}>
            <Text style={styles.footerText}>
              Judgements are ordered for strategic readability, not necessarily for
              chronological sequence. Each point represents a distinct institutional
              reading requiring governance attention.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default KeyJudgementsPanel;