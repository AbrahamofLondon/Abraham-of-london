/* components/print/BriefHeaderBar.tsx — V5.0 (QUIET AUTHORITY / INSTITUTIONAL CALM) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type Props = {
  title: string;
  reference: string;
  classification: string;
};

/* -------------------------------------------------------------------------- */
/* Premium Design Tokens — Quiet Luxury                                       */
/* -------------------------------------------------------------------------- */
const INK = "#1E1C1A";
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const DARK_MIST = "#D9D0C0";
const CHIP_BG = "#FDFAF5";

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: MIST,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  left: {
    flex: 1,
    paddingRight: 20,
  },

  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 6,
  },

  reference: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: SILVER_LIGHT,
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  title: {
    fontFamily: "Times-Bold",
    fontSize: 11.5,
    lineHeight: 1.32,
    color: INK,
    maxWidth: 400,
  },

  right: {
    marginLeft: 18,
    alignItems: "flex-end",
  },

  chip: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 100,
    alignItems: "center",
  },

  chipText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRASS,
  },

  // Optional: subtle brand mark
  brandMark: {
    marginTop: 8,
    width: 24,
    height: 1,
    backgroundColor: BRASS_SOFT,
    opacity: 0.4,
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

function formatClassification(classification: string): string {
  const clean = classification.toUpperCase().trim();
  if (clean === "PUBLIC") return "PUBLIC";
  if (clean === "RESTRICTED") return "RESTRICTED";
  if (clean === "CONFIDENTIAL") return "CONFIDENTIAL";
  if (clean === "SECRET") return "SECRET";
  if (clean === "TOP SECRET") return "TOP SECRET";
  if (clean === "HARDENED") return "HARDENED";
  return clean || "UNCLASSIFIED";
}

/* -------------------------------------------------------------------------- */
/* Main Component — Quiet Authority                                           */
/* -------------------------------------------------------------------------- */
export const BriefHeaderBar: React.FC<Props> = ({
  title,
  reference,
  classification,
}) => {
  const formattedRef = safeString(reference).toUpperCase();
  const formattedClassification = formatClassification(classification);
  const displayTitle = safeString(title) || "Institutional Brief";

  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <Text style={styles.eyebrow}>Institutional Brief</Text>
        <Text style={styles.reference}>{formattedRef}</Text>
        <Text style={styles.title}>{displayTitle}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{formattedClassification}</Text>
        </View>
        {/* Subtle brand mark — quiet presence */}
        <View style={styles.brandMark} />
      </View>
    </View>
  );
};

export default BriefHeaderBar;