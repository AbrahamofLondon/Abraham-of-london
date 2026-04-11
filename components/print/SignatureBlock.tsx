/* components/print/SignatureBlock.tsx — V2.0
   ---------------------------------------------------------------------------
   SUPER PREMIUM SIGNATURE BLOCK
   Quiet luxury, ceremonial authority, React-PDF-safe.
   Designed for attestation / closing sections in institutional PDFs.
   --------------------------------------------------------------------------- */

import React from "react";
import { View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";

const INK = "#171614";
const INK_SOFT = "#5D584F";
const GOLD = "#8A6F3D";
const GOLD_SOFT = "#C5B28C";
const LINE = "#D8CFBF";
const PANEL = "#F8F3EA";

const styles = StyleSheet.create({
  container: {
    width: 278,
    alignSelf: "flex-end",
    paddingTop: 10,
  },

  ceremonialRuleWrap: {
    marginBottom: 12,
    alignItems: "flex-end",
  },

  ceremonialRule: {
    width: 72,
    height: 1,
    backgroundColor: GOLD_SOFT,
    marginBottom: 4,
  },

  ceremonialRuleMinor: {
    width: 28,
    height: 1,
    backgroundColor: LINE,
  },

  signatureArea: {
    minHeight: 94,
    justifyContent: "flex-end",
    paddingBottom: 8,
    borderBottomWidth: 0.6,
    borderBottomColor: LINE,
    marginBottom: 11,
    position: "relative",
  },

  signatureGhostPanel: {
    position: "absolute",
    right: 0,
    bottom: 8,
    width: 206,
    height: 58,
    backgroundColor: PANEL,
    opacity: 0.45,
  },

  svgWrap: {
    width: 205,
    height: 72,
    alignSelf: "flex-end",
  },

  printedName: {
    fontFamily: "AoLSerif",
    fontSize: 10.4,
    textTransform: "uppercase",
    letterSpacing: 1.15,
    color: INK,
  },

  authorityLine: {
    fontFamily: "AoLInter",
    fontSize: 7.1,
    textTransform: "uppercase",
    letterSpacing: 1.35,
    color: GOLD,
    marginTop: 4,
  },

  descriptor: {
    fontFamily: "AoLInter",
    fontSize: 7.2,
    color: INK_SOFT,
    marginTop: 4,
    lineHeight: 1.45,
  },

  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 7,
  },

  location: {
    fontFamily: "AoLInter",
    fontSize: 6.9,
    color: INK_SOFT,
    letterSpacing: 0.2,
  },

  archiveStamp: {
    fontFamily: "Courier",
    fontSize: 6.4,
    color: GOLD,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },
});

type SignatureBlockProps = {
  printedName?: string;
  authorityLine?: string;
  descriptor?: string;
  location?: string;
  archiveRef?: string;
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function compactArchiveRef(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean) return "AOL-ATTEST";
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 6)}-${clean.slice(-6)}`;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  printedName = "Abraham of London",
  authorityLine = "Issued under authority",
  descriptor = "Attested for institutional circulation and governed record.",
  location = "St. James's, London",
  archiveRef = "AOL-ATTEST",
}) => {
  const name = safeString(printedName, "Abraham of London");
  const role = safeString(authorityLine, "Issued under authority");
  const note = safeString(
    descriptor,
    "Attested for institutional circulation and governed record.",
  );
  const place = safeString(location, "St. James's, London");
  const ref = compactArchiveRef(safeString(archiveRef, "AOL-ATTEST"));

  return (
    <View style={styles.container} wrap={false}>
      <View style={styles.ceremonialRuleWrap}>
        <View style={styles.ceremonialRule} />
        <View style={styles.ceremonialRuleMinor} />
      </View>

      <View style={styles.signatureArea}>
        <View style={styles.signatureGhostPanel} />

        <View style={styles.svgWrap}>
          <Svg viewBox="0 0 360 120" style={styles.svgWrap}>
            <Path
              d="
                M18,83
                C28,67 34,44 48,39
                C61,35 67,57 76,76
                C82,88 89,91 97,74
                C110,47 116,23 132,21
                C148,19 153,45 163,63
                C173,81 180,82 191,63
                C205,39 215,25 227,29
                C239,33 245,53 255,66
                C266,79 276,76 288,58
                C300,40 314,31 328,34
                C338,36 346,29 352,18
              "
              stroke={INK}
              strokeWidth={1.45}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="
                M72,92
                C122,103 182,105 244,93
                C284,86 316,78 343,68
              "
              stroke={INK}
              strokeWidth={0.9}
              fill="none"
              strokeLinecap="round"
              opacity={0.42}
            />
            <Path
              d="
                M262,54
                C276,49 289,49 303,52
              "
              stroke={GOLD}
              strokeWidth={0.6}
              fill="none"
              strokeLinecap="round"
              opacity={0.45}
            />
          </Svg>
        </View>
      </View>

      <Text style={styles.printedName}>{name}</Text>
      <Text style={styles.authorityLine}>{role}</Text>
      <Text style={styles.descriptor}>{note}</Text>

      <View style={styles.locationRow}>
        <Text style={styles.location}>{place}</Text>
        <Text style={styles.archiveStamp}>{ref}</Text>
      </View>
    </View>
  );
};

export default SignatureBlock;