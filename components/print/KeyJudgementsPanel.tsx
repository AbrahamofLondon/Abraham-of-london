/* components/print/KeyJudgementsPanel.tsx — V5.0
   ---------------------------------------------------------------------------
   KEY JUDGEMENTS PANEL
   Rebuilt to feel integral to the folio, not pasted onto it.
   Cleaner hierarchy, stronger reading rhythm, safer React-PDF behaviour.
   --------------------------------------------------------------------------- */

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
type Props = {
  items: string[];
  maxItems?: number;
  showHeader?: boolean;
  showFooter?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const INK = "#1E1C1A";
const INK_SOFT = "#564F46";
const INK_MUTE = "#7B7367";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const LINE = "#EDE8DE";
const PANEL = "#F7F2EA";
const PANEL_SOFT = "#FCFAF6";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },

  panel: {
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PANEL,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },

  topRail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  topRulePrimary: {
    width: 42,
    height: 1.2,
    backgroundColor: BRASS,
    marginRight: 8,
  },

  topRuleSecondary: {
    width: 16,
    height: 1,
    backgroundColor: BRASS_SOFT,
  },

  headerBlock: {
    marginBottom: 12,
  },

  kicker: {
    fontFamily: "AoLInter",
    fontSize: 7.2,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 5,
  },

  title: {
    fontFamily: "AoLSerif",
    fontSize: 12.8,
    fontWeight: 700,
    color: INK,
    marginBottom: 5,
  },

  subtitle: {
    fontFamily: "AoLInter",
    fontSize: 8.1,
    lineHeight: 1.44,
    color: INK_MUTE,
    maxWidth: 382,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 9,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: LINE,
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
    fontFamily: "AoLInter",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.7,
    color: BRASS,
    marginTop: 1,
  },

  textWrap: {
    flex: 1,
  },

  text: {
    fontFamily: "AoLInter",
    fontSize: 9.05,
    lineHeight: 1.54,
    color: INK,
  },

  emphasis: {
    marginTop: 4,
    fontFamily: "AoLInter",
    fontSize: 7.9,
    lineHeight: 1.44,
    color: INK_SOFT,
  },

  footerBand: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
    backgroundColor: PANEL_SOFT,
  },

  footerText: {
    fontFamily: "AoLInter",
    fontSize: 7.4,
    lineHeight: 1.38,
    color: INK_MUTE,
    letterSpacing: 0.12,
  },
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function cleanPdfText(value: unknown, fallback = ""): string {
  return safeString(value, fallback)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function splitJudgementText(value: string): { main: string; tail: string } {
  const clean = cleanPdfText(value);
  if (!clean) return { main: "", tail: "" };

  const separatorMatch =
    clean.match(/^(.{22,}?[.:;])\s+(.+)$/) ||
    clean.match(/^(.{22,}?[—-])\s+(.+)$/);

  if (separatorMatch) {
    return {
      main: capitalizeFirst(separatorMatch[1].trim()),
      tail: capitalizeFirst(separatorMatch[2].trim()),
    };
  }

  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1 && sentences[0].length > 36) {
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
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export const KeyJudgementsPanel: React.FC<Props> = ({
  items,
  maxItems = 6,
  showHeader = true,
  showFooter = true,
}) => {
  const safeItems = (items || [])
    .map((item) => cleanPdfText(item))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);

  if (safeItems.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <View style={styles.topRail}>
          <View style={styles.topRulePrimary} />
          <View style={styles.topRuleSecondary} />
        </View>

        {showHeader ? (
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>Key Judgements</Text>
            <Text style={styles.title}>Board-Level Reading</Text>
            <Text style={styles.subtitle}>
              The points below represent the highest-value institutional
              conclusions requiring deliberate executive attention.
            </Text>
          </View>
        ) : null}

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

        {showFooter ? (
          <View style={styles.footerBand}>
            <Text style={styles.footerText}>
              Judgements are ordered for strategic readability rather than
              chronology. Each point should be read as a distinct governance
              concern or decision signal.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default KeyJudgementsPanel;