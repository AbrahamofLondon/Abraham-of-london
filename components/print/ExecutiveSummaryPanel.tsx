/* components/print/ExecutiveSummaryPanel.tsx — V4.1 (PREMIUM INSTITUTIONAL PANEL) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type Props = {
  text: string;
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
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
  },

  topRule: {
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 12,
    width: 48,
  },

  headerBlock: {
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
    fontSize: 14,
    color: INK,
    marginBottom: 6,
  },

  subline: {
    fontFamily: "Helvetica",
    fontSize: 8.4,
    lineHeight: 1.48,
    color: SILVER_LIGHT,
    maxWidth: 380,
  },

  bodyBand: {
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
    paddingLeft: 14,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 12,
  },

  lead: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    lineHeight: 1.55,
    color: INK,
    marginBottom: 8,
  },

  body: {
    fontFamily: "Helvetica",
    fontSize: 9.2,
    lineHeight: 1.62,
    color: SILVER,
    textAlign: "justify",
  },

  footerBand: {
    marginTop: 10,
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

function normalizeText(value: string): string {
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

function splitLeadSentence(value: string): { lead: string; rest: string } {
  const clean = normalizeText(value);
  if (!clean) {
    return {
      lead: "No strategic summary provided for this brief.",
      rest: "",
    };
  }

  // Try to extract the first sentence
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return { lead: clean, rest: "" };
  }

  if (sentences.length === 1) {
    return { lead: capitalizeFirst(sentences[0]), rest: "" };
  }

  // Try to find a natural break (first paragraph or first 2-3 sentences)
  const leadSentence = sentences[0];
  const remaining = sentences.slice(1).join(" ");

  // If lead is very short, combine with next sentence
  if (leadSentence.length < 60 && sentences[1]) {
    return {
      lead: capitalizeFirst(`${leadSentence} ${sentences[1]}`),
      rest: sentences.slice(2).join(" "),
    };
  }

  return {
    lead: capitalizeFirst(leadSentence),
    rest: remaining,
  };
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export const ExecutiveSummaryPanel: React.FC<Props> = ({ 
  text, 
  showHeader = true, 
  showFooter = true 
}) => {
  const normalized = normalizeText(text);
  const { lead, rest } = splitLeadSentence(normalized);

  if (!normalized) {
    return (
      <View style={styles.wrap} wrap={false}>
        <View style={styles.panel}>
          <View style={styles.topRule} />
          <View style={styles.bodyBand}>
            <Text style={styles.lead}>
              Executive summary not available for this brief.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap} wrap={false}>
      <View style={styles.panel}>
        <View style={styles.topRule} />

        {showHeader && (
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>Executive Summary</Text>
            <Text style={styles.title}>Strategic Position</Text>
            <Text style={styles.subline}>
              The governing interpretation of the brief, distilled from principal
              posture, reading logic, and decision context.
            </Text>
          </View>
        )}

        <View style={styles.bodyBand}>
          <Text style={styles.lead}>{lead}</Text>
          {rest ? <Text style={styles.body}>{rest}</Text> : null}
        </View>

        {showFooter && (
          <View style={styles.footerBand}>
            <Text style={styles.footerText}>
              This summary serves as the governing interpretation of the body that follows,
              not as a substitute for the full brief.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ExecutiveSummaryPanel;