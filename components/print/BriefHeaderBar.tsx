/* components/print/BriefHeaderBar.tsx — V6.0
   ---------------------------------------------------------------------------
   PREMIUM INSTITUTIONAL HEADER BAR
   Built for authority, restraint, and strong first-page presence.
   React-PDF-safe. No decorative instability.
   --------------------------------------------------------------------------- */

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
type Props = {
  title: string;
  reference: string;
  classification: string;
};

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const INK = "#1E1C1A";
const INK_SOFT = "#5B534A";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const BRASS_DARK = "#7A6848";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const PANEL = "#F9F6EF";
const CHIP_BG = "#FDFAF5";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (value === null || value === undefined) return fallback;

  try {
    const stringified = String(value).trim();
    return stringified || fallback;
  } catch {
    return fallback;
  }
}

function cleanPdfText(value: unknown, fallback = ""): string {
  return safeString(value, fallback)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampText(value: unknown, maxLength: number, fallback = ""): string {
  const text = cleanPdfText(value, fallback);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function formatClassification(classification: string): string {
  const clean = cleanPdfText(classification, "UNCLASSIFIED").toUpperCase();

  if (clean === "PUBLIC") return "PUBLIC";
  if (clean === "RESTRICTED") return "RESTRICTED";
  if (clean === "CONFIDENTIAL") return "CONFIDENTIAL";
  if (clean === "SECRET") return "SECRET";
  if (clean === "TOP SECRET") return "TOP SECRET";
  if (clean === "HARDENED") return "HARDENED";

  return clean || "UNCLASSIFIED";
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: MIST,
    paddingBottom: 14,
    marginBottom: 10,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  left: {
    flex: 1,
    paddingRight: 18,
  },

  right: {
    width: 122,
    alignItems: "flex-end",
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  eyebrowRule: {
    width: 18,
    height: 1,
    backgroundColor: BRASS,
    marginRight: 7,
  },

  eyebrow: {
    fontFamily: "AoLInter",
    fontSize: 7.1,
    fontWeight: 700,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: BRASS,
  },

  reference: {
    fontFamily: "AoLInter",
    fontSize: 6.9,
    color: SILVER_LIGHT,
    letterSpacing: 0.6,
    marginBottom: 9,
  },

  title: {
    fontFamily: "AoLSerif",
    fontSize: 12.3,
    fontWeight: 700,
    lineHeight: 1.28,
    color: INK,
    maxWidth: 392,
  },

  subtitleRail: {
    marginTop: 9,
    width: 54,
    height: 1,
    backgroundColor: BRASS_SOFT,
  },

  chip: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minWidth: 112,
    alignItems: "center",
  },

  chipText: {
    fontFamily: "AoLInter",
    fontSize: 7.1,
    fontWeight: 700,
    letterSpacing: 1.25,
    textTransform: "uppercase",
    color: BRASS_DARK,
  },

  rightMeta: {
    marginTop: 9,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: BRASS_SOFT,
    width: 84,
    alignItems: "flex-end",
  },

  rightMetaLabel: {
    fontFamily: "AoLInter",
    fontSize: 5.8,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 2,
  },

  rightMetaValue: {
    fontFamily: "AoLInter",
    fontSize: 6.4,
    color: SILVER,
    letterSpacing: 0.35,
  },

  bottomRow: {
    marginTop: 12,
    paddingTop: 7,
    borderTopWidth: 0.5,
    borderTopColor: MIST,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomLeft: {
    fontFamily: "AoLInter",
    fontSize: 6.4,
    color: INK_SOFT,
    letterSpacing: 0.25,
  },

  bottomRight: {
    fontFamily: "AoLInter",
    fontSize: 6.2,
    color: SILVER,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  brandAccent: {
    color: BRASS,
    fontWeight: 700,
  },
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export const BriefHeaderBar: React.FC<Props> = ({
  title,
  reference,
  classification,
}) => {
  const formattedRef = clampText(reference, 48, "UNFILED").toUpperCase();
  const formattedClassification = formatClassification(classification);
  const displayTitle = clampText(title, 220, "Institutional Brief");

  return (
    <View style={styles.wrap} fixed>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowRule} />
            <Text style={styles.eyebrow}>Institutional Brief</Text>
          </View>

          <Text style={styles.reference}>REFERENCE · {formattedRef}</Text>
          <Text style={styles.title}>{displayTitle}</Text>
          <View style={styles.subtitleRail} />
        </View>

        <View style={styles.right}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formattedClassification}</Text>
          </View>

          <View style={styles.rightMeta}>
            <Text style={styles.rightMetaLabel}>Series</Text>
            <Text style={styles.rightMetaValue}>AOL / BRIEF</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomLeft}>
          <Text style={styles.brandAccent}>Abraham of London</Text>
          <Text>{` · governed portfolio issue`}</Text>
        </Text>

        <Text style={styles.bottomRight}>Controlled circulation</Text>
      </View>
    </View>
  );
};

export default BriefHeaderBar;