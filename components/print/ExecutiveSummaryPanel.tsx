/* components/print/ExecutiveSummaryPanel.tsx — V5.0
   ---------------------------------------------------------------------------
   EXECUTIVE SUMMARY PANEL
   Rebuilt to feel native to the institutional folio rather than appended to it.
   Safer for React-PDF, visually calmer, and more integrated with the document.
   --------------------------------------------------------------------------- */

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
type Props = {
  text: string;
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
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    marginBottom: 5,
  },

  subline: {
    fontFamily: "AoLInter",
    fontSize: 8.1,
    lineHeight: 1.44,
    color: INK_MUTE,
    maxWidth: 382,
  },

  summaryBand: {
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
    paddingLeft: 12,
    paddingTop: 1,
    paddingBottom: 1,
  },

  lead: {
    fontFamily: "AoLSerif",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.48,
    color: INK,
    marginBottom: 6,
  },

  body: {
    fontFamily: "AoLInter",
    fontSize: 9.05,
    lineHeight: 1.58,
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

function splitLeadSentence(value: string): { lead: string; rest: string } {
  const clean = cleanPdfText(value);

  if (!clean) {
    return {
      lead: "No executive summary was available for this brief.",
      rest: "",
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return { lead: clean, rest: "" };
  }

  if (sentences.length === 1) {
    return { lead: capitalizeFirst(sentences[0] ?? ""), rest: "" };
  }

  const first = sentences[0] ?? "";
  const second = sentences[1] ?? "";

  if (first.length < 58 && second) {
    return {
      lead: capitalizeFirst(`${first} ${second}`),
      rest: sentences.slice(2).join(" "),
    };
  }

  return {
    lead: capitalizeFirst(first),
    rest: sentences.slice(1).join(" "),
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export const ExecutiveSummaryPanel: React.FC<Props> = ({
  text,
  showHeader = true,
  showFooter = true,
}) => {
  const normalized = cleanPdfText(text);
  const { lead, rest } = splitLeadSentence(normalized);

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <View style={styles.topRail}>
          <View style={styles.topRulePrimary} />
          <View style={styles.topRuleSecondary} />
        </View>

        {showHeader ? (
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>Executive Summary</Text>
            <Text style={styles.title}>Strategic Reading</Text>
            <Text style={styles.subline}>
              The governing interpretation of the brief in compressed form,
              intended to orient judgment before the full body is read.
            </Text>
          </View>
        ) : null}

        <View style={styles.summaryBand}>
          <Text style={styles.lead}>{lead}</Text>
          {rest ? <Text style={styles.body}>{rest}</Text> : null}
        </View>

        {showFooter ? (
          <View style={styles.footerBand}>
            <Text style={styles.footerText}>
              This summary governs orientation, not substitution. The full brief
              remains the authoritative record.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ExecutiveSummaryPanel;