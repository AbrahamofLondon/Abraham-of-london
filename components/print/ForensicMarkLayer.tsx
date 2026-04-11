/* components/print/ForensicMarkLayer.tsx — V5.0
   ---------------------------------------------------------------------------
   FORENSIC MARK LAYER
   Rebuilt for React-PDF stability, restrained luxury, and safer watermarking.
   No transform-based decorative text. No brittle rotated overlays.
   --------------------------------------------------------------------------- */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { WatermarkPayload } from "../../lib/intelligence/watermark-delegate";

type Props = {
  watermark: WatermarkPayload;
  mode?: "cover" | "interior";
};

const MIST = "#E8E1D4";
const DARK_MIST = "#C7C0B0";
const SILVER = "#B9AF9B";
const SOFT_GOLD = "#C9B894";

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  microTopLeft: {
    position: "absolute",
    top: 12,
    left: 28,
    fontFamily: "AoLInter",
    fontSize: 5.8,
    color: SILVER,
    letterSpacing: 0.45,
  },

  microTopRight: {
    position: "absolute",
    top: 12,
    right: 28,
    fontFamily: "AoLInter",
    fontSize: 5.8,
    color: SILVER,
    letterSpacing: 0.45,
    maxWidth: 220,
    textAlign: "right",
  },

  microBottomLeft: {
    position: "absolute",
    bottom: 15,
    left: 28,
    fontFamily: "AoLInter",
    fontSize: 5.8,
    color: SILVER,
    letterSpacing: 0.42,
    maxWidth: 260,
  },

  microBottomRight: {
    position: "absolute",
    bottom: 15,
    right: 28,
    fontFamily: "AoLInter",
    fontSize: 5.8,
    color: SILVER,
    letterSpacing: 0.42,
    textAlign: "right",
  },

  centerBandWrap: {
  position: "absolute",
  left: 56,
  right: 56,
  top: 356,
  alignItems: "center",
},

  centerBandPrimary: {
    fontFamily: "AoLInter",
    fontSize: 7.2,
    color: DARK_MIST,
    letterSpacing: 1.1,
    textAlign: "center",
    opacity: 0.11,
  },

  centerBandSecondary: {
    marginTop: 5,
    fontFamily: "AoLInter",
    fontSize: 6.4,
    color: SILVER,
    letterSpacing: 0.9,
    textAlign: "center",
    opacity: 0.08,
  },

  coverGhostMark: {
    position: "absolute",
    right: 56,
    bottom: 112,
    fontFamily: "AoLSerif",
    fontSize: 22,
    fontStyle: "italic",
    color: MIST,
    opacity: 0.14,
    letterSpacing: 0.2,
  },

  interiorGhostMark: {
    position: "absolute",
    right: 54,
    bottom: 104,
    fontFamily: "AoLSerif",
    fontSize: 14.5,
    fontStyle: "italic",
    color: MIST,
    opacity: 0.09,
    letterSpacing: 0.15,
  },

  leftRail: {
    position: "absolute",
    top: 224,
    left: 10,
    width: 22,
    alignItems: "center",
  },

  leftRailLine1: {
    fontFamily: "AoLInter",
    fontSize: 5.5,
    color: SOFT_GOLD,
    letterSpacing: 0.55,
    textAlign: "center",
    marginBottom: 3,
  },

  leftRailLine2: {
    fontFamily: "AoLInter",
    fontSize: 5.3,
    color: SOFT_GOLD,
    letterSpacing: 0.45,
    textAlign: "center",
  },
});

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  try {
    return String(value).trim();
  } catch {
    return "";
  }
}

function cleanPdfText(value: unknown, fallback = ""): string {
  const text = safeString(value) || fallback;
  return text
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

function buildShortAuthorityLine(params: {
  classification: string;
  trace: string;
  sig: string;
  issuer: string;
}): string {
  return truncate(
    [
      params.classification,
      `TRACE ${params.trace}`,
      `SIG ${params.sig}`,
      params.issuer,
    ]
      .filter(Boolean)
      .join(" · "),
    110,
  );
}

function buildLongAuthorityLine(params: {
  brand: string;
  classification: string;
  reference: string;
  trace: string;
  sig: string;
}): string {
  return truncate(
    [
      params.brand,
      params.classification,
      params.reference,
      `TRACE ${params.trace}`,
      `SIG ${params.sig}`,
    ]
      .filter(Boolean)
      .join(" · "),
    180,
  );
}

export const ForensicMarkLayer: React.FC<Props> = ({
  watermark,
  mode = "interior",
}) => {
  const metadata = (watermark?.metadata ?? {}) as Record<string, unknown>;
  const aol =
    ((metadata.aol as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >;
  const issuer =
    ((aol.issuer as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >;
  const context =
    ((aol.context as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >;

  const brand = cleanPdfText(issuer.brand, "Abraham of London");
  const issuerId = cleanPdfText(issuer.issuerId, "AOL");
  const trace = cleanPdfText(aol.traceId, "TRACE-NULL");
  const sig = cleanPdfText(aol.sig, "UNVERIFIED");
  const classification = cleanPdfText(aol.classification, "PUBLIC").toUpperCase();
  const reference =
    cleanPdfText(context.reference) ||
    cleanPdfText(context.slug) ||
    cleanPdfText(watermark?.overlayToken) ||
    "UNTRACKED";

  const shortLine = buildShortAuthorityLine({
    classification,
    trace,
    sig,
    issuer: issuerId,
  });

  const longLine = buildLongAuthorityLine({
    brand: brand.toUpperCase(),
    classification,
    reference,
    trace,
    sig,
  });

  const ghostMark = mode === "cover" ? "Abraham of London" : "AOL";

  return (
    <View style={styles.layer} fixed>
      <Text style={styles.microTopLeft}>{brand.toUpperCase()}</Text>
      <Text style={styles.microTopRight}>{shortLine}</Text>
      <Text style={styles.microBottomLeft}>{longLine}</Text>
      <Text style={styles.microBottomRight}>{classification}</Text>

      <View style={styles.leftRail}>
        <Text style={styles.leftRailLine1}>{classification}</Text>
        <Text style={styles.leftRailLine2}>{truncate(reference, 18)}</Text>
      </View>

      <View style={styles.centerBandWrap}>
        <Text style={styles.centerBandPrimary}>{longLine}</Text>
        <Text style={styles.centerBandSecondary}>{shortLine}</Text>
      </View>

      {mode === "cover" ? (
        <Text style={styles.coverGhostMark}>{ghostMark}</Text>
      ) : (
        <Text style={styles.interiorGhostMark}>{ghostMark}</Text>
      )}
    </View>
  );
};

export default ForensicMarkLayer;