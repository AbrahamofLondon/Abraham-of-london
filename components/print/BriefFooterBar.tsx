/* components/print/BriefFooterBar.tsx — V6.0
   ---------------------------------------------------------------------------
   PREMIUM INSTITUTIONAL FOOTER BAR
   Rebuilt for stronger React-PDF stability, quieter luxury, and cleaner
   forensic trace presentation.
   --------------------------------------------------------------------------- */

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
type Props = {
  watermark: WatermarkPayload;
  reference: string;
  signAs?: string;
};

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const BRASS = "#9B8A6B";
const BRASS_SOFT = "#C9BCA0";
const SILVER = "#7E7A72";
const SILVER_LIGHT = "#9E9A92";
const MIST = "#EDE8DE";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
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
  },

  traceId: {
    fontFamily: "Courier",
    fontSize: 6.3,
    color: SILVER_LIGHT,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  metaDivider: {
    marginHorizontal: 7,
    fontFamily: "AoLInter",
    fontSize: 5.8,
    color: SILVER_LIGHT,
  },

  sig: {
    fontFamily: "Courier",
    fontSize: 6.3,
    color: SILVER_LIGHT,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  referenceLine: {
    fontFamily: "AoLInter",
    fontSize: 6.8,
    color: SILVER,
    letterSpacing: 0.3,
  },

  brand: {
    fontFamily: "AoLInter",
    fontWeight: 700,
    color: BRASS,
    letterSpacing: 0.3,
  },

  refPrefix: {
    fontFamily: "AoLInter",
    color: SILVER,
  },

  refValue: {
    fontFamily: "AoLInter",
    color: SILVER,
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
    fontFamily: "AoLSerif",
    fontStyle: "italic",
    fontSize: 9.1,
    color: BRASS,
    letterSpacing: 0.15,
    marginBottom: 5,
  },

  folio: {
    fontFamily: "AoLInter",
    fontSize: 6.9,
    color: SILVER_LIGHT,
    letterSpacing: 0.4,
  },
});

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

function truncate(value: string, max: number): string {
  const clean = cleanPdfText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function formatTraceId(traceId: string): string {
  const clean = cleanPdfText(traceId)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!clean) return "------";
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(-4)}`;
}

function formatSig(sig: string): string {
  const clean = cleanPdfText(sig)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!clean) return "------";
  if (clean.length <= 6) return clean;
  return clean.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export const BriefFooterBar: React.FC<Props> = ({
  watermark,
  reference,
  signAs = "The Architect",
}) => {
  const metadata = (watermark?.metadata ?? {}) as Record<string, unknown>;
  const aol =
    ((metadata.aol as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >;

  const traceId = formatTraceId(safeString(aol.traceId));
  const sig = formatSig(safeString(aol.sig));
  const institutionalReference = truncate(
    cleanPdfText(reference, "UNFILED").toUpperCase(),
    40,
  );
  const signatureLabel = truncate(cleanPdfText(signAs, "The Architect"), 32);

  return (
    <View style={styles.wrap} fixed>
      <View style={styles.left}>
        <View style={styles.topMeta}>
          <Text style={styles.traceId}>{traceId}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.sig}>{sig}</Text>
        </View>

        <Text style={styles.referenceLine}>
          <Text style={styles.brand}>ABRAHAM OF LONDON</Text>
          <Text style={styles.refPrefix}> · REF </Text>
          <Text style={styles.refValue}>{institutionalReference}</Text>
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.signRule} />
        <Text style={styles.sign}>{signatureLabel}</Text>
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