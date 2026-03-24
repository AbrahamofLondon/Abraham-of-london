/* lib/pdf/renderers/brief-blocks.tsx — INSTITUTIONAL BLOCK RENDERER V3.1 */

import React from "react";
import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BriefBlock, InlineToken } from "./brief-types";

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const INK = "#121416";
const SOFT = "#555E6A";
const BRASS = "#8A6A2F";
const BRASS_SOFT = "#B49861";
const MIST = "#E8E1D4";
const PANEL = "#F6F2EA";
const PANEL_AUDIT = "rgba(247, 243, 236, 0.4)";

const styles = StyleSheet.create({
  section: { marginBottom: 16 },

  h1: { fontFamily: "Times-Bold", fontSize: 20.5, lineHeight: 1.14, color: INK, marginTop: 2, marginBottom: 12 },
  
  // Specific styling for the 4D Framework Headings (Discern, Detach, etc.)
  h2: { 
    fontFamily: "Helvetica-Bold", 
    fontSize: 10.7, 
    letterSpacing: 1.5, 
    textTransform: "uppercase", 
    color: BRASS, 
    marginTop: 16, 
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BRASS_SOFT,
    paddingBottom: 2
  },

  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.4, color: INK, marginTop: 10, marginBottom: 6 },

  paragraph: { fontFamily: "Helvetica", fontSize: 10.05, lineHeight: 1.64, color: INK, textAlign: "justify", marginBottom: 8 },

  /* -------------------------------------------------------------------------- */
  /* Audit Table Styling (Ref: image_5cbeac.png)                                */
  /* -------------------------------------------------------------------------- */
  tableWrap: { marginVertical: 13, borderTopWidth: 1, borderTopColor: MIST },
  tableCaption: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: PANEL_AUDIT, fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 1.3, color: BRASS },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BRASS_SOFT, backgroundColor: "transparent" },
  tableBodyRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(232, 225, 212, 0.4)" }, // Softer MIST for rows
  
  tableCellHeader: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, fontFamily: "Helvetica-Bold", fontSize: 8, color: "rgba(138, 106, 47, 0.75)", textTransform: "uppercase", letterSpacing: 1.2 },
  tableCellBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, fontFamily: "Helvetica", fontSize: 8.75, color: SOFT, lineHeight: 1.45 },
  
  // Monospace first column (The "Day" column in practice audit)
  tableCellMonospace: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, fontFamily: "Courier", fontSize: 8, color: "rgba(138, 106, 47, 0.65)" },

  bold: { fontFamily: "Helvetica-Bold", color: INK },
  italic: { fontFamily: "Times-Italic", color: INK },
  link: { color: BRASS, textDecoration: "none" },
  
  listRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  listMarker: { width: 18, fontFamily: "Helvetica-Bold", fontSize: 9.7, color: BRASS, marginTop: 1 },
  listBody: { flex: 1, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.58, color: INK },
});

/* -------------------------------------------------------------------------- */
/* Inline Parsers                                                             */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return value ? String(value) : "";
}

function renderInline(text: string): React.ReactNode[] {
  const input = safeString(text);
  const parts = input.split(/(\*\*.*?\*\*|\*.*?\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <Link key={i} src={linkMatch[2]} style={styles.link}>{linkMatch[1]}</Link>;
    }
    return part;
  });
}

/* -------------------------------------------------------------------------- */
/* Block Switcher                                                             */
/* -------------------------------------------------------------------------- */

export function renderBriefBlock(block: BriefBlock, index: number): React.ReactNode {
  switch (block.type) {
    case "heading":
      const hStyle = block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
      return <Text key={index} style={hStyle}>{block.text}</Text>;

    case "paragraph":
      return <Text key={index} style={styles.paragraph}>{renderInline(block.text)}</Text>;

    case "list":
      return (
        <View key={index} style={styles.section}>
          {block.items.map((item, ii) => (
            <View key={ii} style={styles.listRow}>
              <Text style={styles.listMarker}>{block.ordered ? `${ii + 1}.` : "•"}</Text>
              <Text style={styles.listBody}>{renderInline(item)}</Text>
            </View>
          ))}
        </View>
      );

    case "table":
      return (
        <View key={index} style={styles.tableWrap} wrap={false}>
          {block.caption && <Text style={styles.tableCaption}>{block.caption}</Text>}
          <View style={styles.tableHeaderRow}>
            {block.headers.map((h, hi) => (
              <View key={hi} style={{ flex: 1 }}>
                <Text style={styles.tableCellHeader}>{h}</Text>
              </View>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View key={ri} style={styles.tableBodyRow}>
              {row.map((cell, ci) => (
                <View key={ci} style={{ flex: 1 }}>
                  <Text style={ci === 0 ? styles.tableCellMonospace : styles.tableCellBody}>
                    {renderInline(cell)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}