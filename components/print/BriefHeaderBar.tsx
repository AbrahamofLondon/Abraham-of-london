/* components/print/BriefHeaderBar.tsx — V4.0 (PREMIUM INSTITUTIONAL HEADER) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

type Props = {
  title: string;
  reference: string;
  classification: string;
};

const INK = "#121416";
const BRASS = "#8A6A2F";
const SILVER = "#56606C";
const MIST = "#E8E1D4";
const DARK_MIST = "#C7C0B0";
const CHIP_BG = "#FBF9F4";

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 0.8,
    borderBottomColor: DARK_MIST,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  left: {
    flex: 1,
    paddingRight: 18,
  },

  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    letterSpacing: 1.35,
    textTransform: "uppercase",
    color: BRASS,
    marginBottom: 5,
  },

  reference: {
    fontFamily: "Helvetica",
    fontSize: 7.3,
    color: SILVER,
    letterSpacing: 0.7,
    marginBottom: 6,
  },

  title: {
    fontFamily: "Times-Bold",
    fontSize: 11.2,
    lineHeight: 1.3,
    color: INK,
    maxWidth: 400,
  },

  right: {
    marginLeft: 16,
    alignItems: "flex-end",
  },

  chip: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 98,
    alignItems: "center",
  },

  chipText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: BRASS,
  },
});

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export const BriefHeaderBar: React.FC<Props> = ({
  title,
  reference,
  classification,
}) => {
  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <Text style={styles.eyebrow}>Institutional Brief</Text>
        <Text style={styles.reference}>{safeString(reference).toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{classification}</Text>
        </View>
      </View>
    </View>
  );
};

export default BriefHeaderBar;