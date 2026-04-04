/* components/print/BriefFooterBar.tsx — V5.0 (DELIGHT / QUIET LUXURY) */
import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */
type Props = {
  watermark: WatermarkPayload;
  reference: string;
  signAs?: string;
};

/* -------------------------------------------------------------------------- */
/* Premium Design Tokens — Quiet Luxury                                       */
/* -------------------------------------------------------------------------- */
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const BRASS_DARK = "#7A6848";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";
const DARK_MIST = "#D9D0C0";

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 28,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: MIST,
  },

  left: {
    flex: 2.1,
    paddingRight: 12,
  },

  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },

  traceId: {
    fontFamily: "Courier",
    fontSize: 6.4,
    color: SILVER_LIGHT,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  separator: {
    fontFamily: "Helvetica",
    fontSize: 5,
    color: SILVER_LIGHT,
  },

  sig: {
    fontFamily: "Courier",
    fontSize: 6.4,
    color: SILVER_LIGHT,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  referenceLine: {
    fontFamily: "Helvetica",
    fontSize: 6.8,
    color: SILVER,
    letterSpacing: 0.4,
  },

  referenceBrand: {
    fontFamily: "Helvetica-Bold",
    color: BRASS,
    letterSpacing: 0.3,
  },

  right: {
    flex: 1,
    alignItems: "flex-end",
  },

  signRule: {
    width: 42,
    height: 1,
    backgroundColor: BRASS_SOFT,
    marginBottom: 6,
  },

  sign: {
    fontFamily: "Times-Italic",
    fontSize: 9.4,
    color: BRASS,
    letterSpacing: 0.2,
    marginBottom: 5,
  },

  folio: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: SILVER_LIGHT,
    letterSpacing: 0.45,
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

function formatTraceId(traceId: string): string {
  const clean = traceId.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(-4)}`;
}

function formatSig(sig: string): string {
  const clean = sig.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 6) return clean;
  return clean.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/* Main Component — Delightful Footer                                         */
/* -------------------------------------------------------------------------- */
export const BriefFooterBar: React.FC<Props> = ({
  watermark,
  reference,
  signAs = "The Architect",
}) => {
  const metadata = watermark?.metadata as Record<string, unknown> | undefined;
  const aol = ((metadata?.aol as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;

  const traceIdRaw = safeString(aol.traceId);
  const sigRaw = safeString(aol.sig);
  
  const traceId = traceIdRaw ? formatTraceId(traceIdRaw) : "· · ·";
  const sig = sigRaw ? formatSig(sigRaw) : "· · ·";
  const institutionalReference = safeString(reference).toUpperCase() || "UNFILED";

  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <View style={styles.topMeta}>
          <Text style={styles.traceId}>{traceId}</Text>
          <Text style={styles.separator}>✦</Text>
          <Text style={styles.sig}>{sig}</Text>
        </View>

        <Text style={styles.referenceLine}>
          <Text style={styles.referenceBrand}>ABRAHAM OF LONDON</Text>
          <Text style={{ fontFamily: "Helvetica", fontSize: 6.8, color: SILVER }}>
            {` · `}
          </Text>
          <Text style={styles.referenceLine}>REF {institutionalReference}</Text>
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.signRule} />
        <Text style={styles.sign}>{signAs}</Text>
        <Text
          style={styles.folio}
          render={({ pageNumber, totalPages }) => {
            const current = String(pageNumber).padStart(2, "0");
            const total = String(totalPages).padStart(2, "0");
            return `${current} / ${total}`;
          }}
        />
      </View>
    </View>
  );
};

export default BriefFooterBar;