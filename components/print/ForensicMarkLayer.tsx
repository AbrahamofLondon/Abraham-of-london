/* components/print/ForensicMarkLayer.tsx — V4.0 (CURATED FORENSIC GRAVITAS) */
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
    pointerEvents: "none" as never,
  },

  diagonalPrimary: {
    position: "absolute",
    left: 62,
    top: 344,
    transform: "rotate(-31deg)",
    fontFamily: "Helvetica",
    fontSize: 8.2,
    letterSpacing: 1.55,
    color: DARK_MIST,
    opacity: 0.105,
  },

  diagonalSecondary: {
    position: "absolute",
    left: 86,
    top: 388,
    transform: "rotate(-31deg)",
    fontFamily: "Helvetica",
    fontSize: 7.2,
    letterSpacing: 1.25,
    color: SILVER,
    opacity: 0.075,
  },

  microTopRight: {
    position: "absolute",
    top: 12,
    right: 28,
    fontFamily: "Helvetica",
    fontSize: 5.9,
    color: SILVER,
    letterSpacing: 0.55,
  },

  microTopLeft: {
    position: "absolute",
    top: 12,
    left: 28,
    fontFamily: "Helvetica",
    fontSize: 5.9,
    color: SILVER,
    letterSpacing: 0.55,
  },

  microBottomLeft: {
    position: "absolute",
    bottom: 15,
    left: 28,
    fontFamily: "Helvetica",
    fontSize: 5.9,
    color: SILVER,
    letterSpacing: 0.52,
  },

  microBottomRight: {
    position: "absolute",
    bottom: 15,
    right: 28,
    fontFamily: "Helvetica",
    fontSize: 5.9,
    color: SILVER,
    letterSpacing: 0.52,
  },

  coverGhostMark: {
    position: "absolute",
    right: 56,
    bottom: 112,
    fontFamily: "Times-Italic",
    fontSize: 22,
    color: MIST,
    opacity: 0.14,
    letterSpacing: 0.25,
  },

  interiorGhostMark: {
    position: "absolute",
    right: 54,
    bottom: 104,
    fontFamily: "Times-Italic",
    fontSize: 15,
    color: MIST,
    opacity: 0.09,
    letterSpacing: 0.2,
  },

  spineToken: {
    position: "absolute",
    top: 248,
    left: 8,
    transform: "rotate(-90deg)",
    fontFamily: "Helvetica",
    fontSize: 5.7,
    color: SOFT_GOLD,
    letterSpacing: 0.85,
    opacity: 0.5,
  },
});

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function buildShortAuthorityLine(params: {
  classification: string;
  trace: string;
  sig: string;
  issuer: string;
}): string {
  const parts = [
    params.classification,
    `TRACE ${params.trace}`,
    `SIG ${params.sig}`,
    params.issuer,
  ].filter(Boolean);

  return parts.join(" · ");
}

function buildLongAuthorityLine(params: {
  brand: string;
  classification: string;
  reference: string;
  trace: string;
  sig: string;
}): string {
  const parts = [
    params.brand,
    params.classification,
    params.reference,
    `TRACE ${params.trace}`,
    `SIG ${params.sig}`,
  ].filter(Boolean);

  return parts.join(" · ");
}

export const ForensicMarkLayer: React.FC<Props> = ({
  watermark,
  mode = "interior",
}) => {
  const metadata = (watermark?.metadata ?? {}) as Record<string, unknown>;
  const aol = ((metadata.aol as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const issuer = ((aol.issuer as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const context = ((aol.context as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;

  const brand = safeString(issuer.brand) || "Abraham of London";
  const issuerId = safeString(issuer.issuerId) || "AOL";
  const trace = safeString(aol.traceId) || "TRACE-NULL";
  const sig = safeString(aol.sig) || "UNVERIFIED";
  const classification = safeString(aol.classification).toUpperCase() || "PUBLIC";
  const reference =
    safeString(context.reference) ||
    safeString(context.slug) ||
    safeString(watermark.overlayToken) ||
    "UNTRACKED";

  const shortLine = truncate(
    buildShortAuthorityLine({
      classification,
      trace,
      sig,
      issuer: issuerId,
    }),
    110
  );

  const longLine = truncate(
    buildLongAuthorityLine({
      brand: brand.toUpperCase(),
      classification,
      reference,
      trace,
      sig,
    }),
    180
  );

  const ghostMark = mode === "cover" ? "Abraham of London" : "AOL";
  const spineToken = truncate(`${classification} · ${reference} · ${trace}`, 90);

  return (
    <View style={styles.layer} fixed>
      <Text style={styles.microTopLeft}>{brand.toUpperCase()}</Text>
      <Text style={styles.microTopRight}>{shortLine}</Text>
      <Text style={styles.microBottomLeft}>{longLine}</Text>
      <Text style={styles.microBottomRight}>{classification}</Text>
      <Text style={styles.spineToken}>{spineToken}</Text>

      {mode === "cover" ? (
        <>
          <Text style={styles.diagonalPrimary}>{longLine}</Text>
          <Text style={styles.diagonalSecondary}>{shortLine}</Text>
          <Text style={styles.coverGhostMark}>{ghostMark}</Text>
        </>
      ) : (
        <>
          <Text style={styles.diagonalPrimary}>{shortLine}</Text>
          <Text style={styles.interiorGhostMark}>{ghostMark}</Text>
        </>
      )}
    </View>
  );
};

export default ForensicMarkLayer;