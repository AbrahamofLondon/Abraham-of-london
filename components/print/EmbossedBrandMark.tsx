/* components/print/EmbossedBrandMark.tsx — V2.0
   ---------------------------------------------------------------------------
   EMBOSSED BRAND MARK (PREMIUM)
   Simulates letterpress / embossed foil effect using layered rendering.
   Quiet, authoritative, no gimmicks.
   --------------------------------------------------------------------------- */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const INK = "#171614";
const INK_SOFT = "#2A2622";
const SHADOW = "#000000";
const HIGHLIGHT = "#FFFFFF";
const GOLD = "#8A6F3D";
const LINE = "#D8CFBF";

const styles = StyleSheet.create({
  container: {
    marginBottom: 34,
  },

  markWrap: {
    position: "relative",
    height: 52,
    justifyContent: "flex-end",
  },

  /* Base (main visible mark) */
  brandText: {
    fontFamily: "AoLSerif",
    fontSize: 44,
    letterSpacing: -1.6,
    color: INK,
  },

  /* Subtle shadow layer (depth) */
  shadow: {
    position: "absolute",
    top: 1.2,
    left: 1.2,
    fontFamily: "AoLSerif",
    fontSize: 44,
    letterSpacing: -1.6,
    color: SHADOW,
    opacity: 0.12,
  },

  /* Highlight layer (emboss illusion) */
  highlight: {
    position: "absolute",
    top: -0.6,
    left: -0.6,
    fontFamily: "AoLSerif",
    fontSize: 44,
    letterSpacing: -1.6,
    color: HIGHLIGHT,
    opacity: 0.25,
  },

  ruleWrap: {
    marginTop: 6,
    alignItems: "flex-start",
  },

  rulePrimary: {
    width: 36,
    height: 1,
    backgroundColor: GOLD,
    marginBottom: 3,
  },

  ruleSecondary: {
    width: 14,
    height: 1,
    backgroundColor: LINE,
  },

  descriptor: {
    marginTop: 6,
    fontFamily: "AoLInter",
    fontSize: 6.6,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_SOFT,
  },
});

type Props = {
  label?: string;
};

export const EmbossedBrandMark: React.FC<Props> = ({
  label = "Abraham of London",
}) => {
  return (
    <View style={styles.container} wrap={false}>
      <View style={styles.markWrap}>
        {/* Shadow (bottom layer) */}
        <Text style={styles.shadow}>AoL</Text>

        {/* Highlight (top light edge) */}
        <Text style={styles.highlight}>AoL</Text>

        {/* Main mark */}
        <Text style={styles.brandText}>AoL</Text>
      </View>

      <View style={styles.ruleWrap}>
        <View style={styles.rulePrimary} />
        <View style={styles.ruleSecondary} />
      </View>

      <Text style={styles.descriptor}>{label}</Text>
    </View>
  );
};

export default EmbossedBrandMark;