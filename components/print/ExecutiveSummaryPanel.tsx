/* components/print/ExecutiveSummaryPanel.tsx — V4.0 (PREMIUM INSTITUTIONAL PANEL) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

type Props = {
  text: string;
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
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
  },

  topRule: {
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 10,
  },

  headerBlock: {
    marginBottom: 12,
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
    fontSize: 13,
    color: INK,
    marginBottom: 4,
  },

  subline: {
    fontFamily: "Helvetica",
    fontSize: 8.65,
    lineHeight: 1.45,
    color: SILVER,
  },

  bodyBand: {
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
    paddingLeft: 12,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 10,
  },

  lead: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.15,
    lineHeight: 1.52,
    color: INK,
    marginBottom: 6,
  },

  body: {
    fontFamily: "Helvetica",
    fontSize: 9.3,
    lineHeight: 1.62,
    color: SILVER,
    textAlign: "justify",
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

function normalizeText(value: string): string {
  return safeString(value)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLeadSentence(value: string): { lead: string; rest: string } {
  const clean = normalizeText(value);
  if (!clean) {
    return {
      lead: "No strategic summary provided for this brief.",
      rest: "",
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return {
      lead: clean,
      rest: "",
    };
  }

  return {
    lead: sentences[0],
    rest: sentences.slice(1).join(" "),
  };
}

export const ExecutiveSummaryPanel: React.FC<Props> = ({ text }) => {
  const normalized = normalizeText(text);
  const { lead, rest } = splitLeadSentence(normalized);

  return (
    <View style={styles.wrap} wrap={false}>
      <View style={styles.panel}>
        <View style={styles.topRule} />

        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>Executive Summary</Text>
          <Text style={styles.title}>Strategic Position</Text>
          <Text style={styles.subline}>
            This section distils the principal posture, reading logic, and
            decision context of the brief into one governed summary.
          </Text>
        </View>

        <View style={styles.bodyBand}>
          <Text style={styles.lead}>{lead}</Text>
          {rest ? <Text style={styles.body}>{rest}</Text> : null}
        </View>

        <View style={styles.footerBand}>
          <Text style={styles.footerText}>
            Read this summary as the governing interpretation of the body that follows,
            not as a substitute for the full brief.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ExecutiveSummaryPanel;