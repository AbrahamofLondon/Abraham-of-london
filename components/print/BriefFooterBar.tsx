/* components/print/BriefFooterBar.tsx — V4.0 (PREMIUM INSTITUTIONAL FOOTER) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";

type Props = {
  watermark: WatermarkPayload;
  reference: string;
  signAs?: string;
};

const BRASS = "#8A6A2F";
const BRASS_SOFT = "#B49861";
const SILVER = "#56606C";
const SOFTER = "#747D89";
const MIST = "#E8E1D4";
const DARK_MIST = "#C7C0B0";

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 28,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 0.8,
    borderTopColor: DARK_MIST,
  },

  left: {
    flex: 2.1,
    paddingRight: 12,
  },

  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  traceId: {
    fontFamily: "Courier",
    fontSize: 6.6,
    color: SILVER,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  separator: {
    marginHorizontal: 6,
    fontFamily: "Helvetica",
    fontSize: 6.6,
    color: SOFTER,
  },

  sig: {
    fontFamily: "Courier",
    fontSize: 6.6,
    color: SILVER,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  referenceLine: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: SILVER,
    letterSpacing: 0.45,
  },

  referenceBrand: {
    fontFamily: "Helvetica-Bold",
    color: BRASS,
  },

  right: {
    flex: 1,
    alignItems: "flex-end",
  },

  signRule: {
    width: 36,
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 5,
  },

  sign: {
    fontFamily: "Times-Italic",
    fontSize: 9.1,
    color: BRASS,
    letterSpacing: 0.25,
    marginBottom: 4,
  },

  folio: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: SILVER,
    letterSpacing: 0.45,
  },
});

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export const BriefFooterBar: React.FC<Props> = ({
  watermark,
  reference,
  signAs = "The Architect",
}) => {
  const metadata = watermark?.metadata as Record<string, unknown> | undefined;
  const aol = ((metadata?.aol as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;

  const traceId = safeString(aol.traceId) || "TRACE-NULL";
  const sig = safeString(aol.sig) || "UNVERIFIED";
  const institutionalReference = safeString(reference).toUpperCase() || "UNFILED";

  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <View style={styles.topMeta}>
          <Text style={styles.traceId}>{traceId}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.sig}>SIG {sig}</Text>
        </View>

        <Text style={styles.referenceLine}>
          <Text style={styles.referenceBrand}>ABRAHAM OF LONDON</Text>
          {` · REF ${institutionalReference}`}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.signRule} />
        <Text style={styles.sign}>{signAs}</Text>
        <Text
          style={styles.folio}
          render={({ pageNumber, totalPages }) =>
            `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
          }
        />
      </View>
    </View>
  );
};

export default BriefFooterBar;