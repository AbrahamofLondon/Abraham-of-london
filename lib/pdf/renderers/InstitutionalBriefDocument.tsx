/* lib/pdf/renderers/InstitutionalBriefDocument.tsx — V5.0
   ---------------------------------------------------------------------------
   SHARED INTERIOR RENDERER — PREMIUM PRINT BODY
   Stable, readable, React-PDF-safe, and pleasant enough to revisit
   --------------------------------------------------------------------------- */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/* Brand Tokens                                                               */
/* -------------------------------------------------------------------------- */
const INK = "#1A1815";
const INK_SOFT = "#4B463E";
const INK_MUTE = "#7A7367";
const BRASS = "#8C7750";
const BRASS_SOFT = "#C0AF91";
const LINE = "#DDD5C6";
const PANEL = "#F5EFE5";
const PANEL_SOFT = "#FAF7F2";
const PAPER = "#FCFAF6";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  body: {
    marginTop: 4,
  },

  sectionGap: {
    marginTop: 8,
  },

  h1: {
    fontFamily: "AoLSerif",
    fontSize: 19,
    fontWeight: 700,
    lineHeight: 1.15,
    color: INK,
    marginTop: 18,
    marginBottom: 8,
  },

  h2: {
    fontFamily: "AoLInter",
    fontSize: 11,
    fontWeight: 700,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },

  h3: {
    fontFamily: "AoLInter",
    fontSize: 10.5,
    fontWeight: 700,
    color: INK,
    marginTop: 14,
    marginBottom: 6,
  },

  h4: {
    fontFamily: "AoLInter",
    fontSize: 9.8,
    fontWeight: 600,
    color: INK_SOFT,
    marginTop: 12,
    marginBottom: 5,
  },

  lead: {
    fontFamily: "AoLInter",
    fontSize: 10.3,
    lineHeight: 1.62,
    color: INK,
    marginBottom: 11,
  },

  paragraph: {
    fontFamily: "AoLInter",
    fontSize: 9.8,
    lineHeight: 1.62,
    color: INK_SOFT,
    marginBottom: 9,
  },

  paragraphTight: {
    fontFamily: "AoLInter",
    fontSize: 9.6,
    lineHeight: 1.56,
    color: INK_SOFT,
    marginBottom: 7,
  },

  blockquote: {
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: PANEL,
    borderLeftWidth: 2,
    borderLeftColor: BRASS_SOFT,
  },

  blockquoteText: {
    fontFamily: "AoLInter",
    fontSize: 9.3,
    lineHeight: 1.5,
    color: INK_SOFT,
    fontStyle: "italic",
  },

  pullQuoteWrap: {
    marginVertical: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: LINE,
    borderBottomColor: LINE,
  },

  pullQuote: {
    fontFamily: "AoLSerif",
    fontSize: 12,
    lineHeight: 1.45,
    color: BRASS,
    textAlign: "center",
    fontStyle: "italic",
  },

  unorderedList: {
    marginTop: 2,
    marginBottom: 10,
    marginLeft: 2,
  },

  orderedList: {
    marginTop: 2,
    marginBottom: 10,
    marginLeft: 2,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  bullet: {
    width: 12,
    fontSize: 8,
    color: BRASS,
    marginTop: 1,
  },

  orderedNumber: {
    width: 18,
    fontSize: 8.8,
    fontWeight: 700,
    color: BRASS,
    marginTop: 0.2,
  },

  listText: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: "AoLInter",
    fontSize: 9.4,
    lineHeight: 1.52,
    color: INK_SOFT,
  },

  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: LINE,
  },

  callout: {
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: LINE,
  },

  calloutTitle: {
    fontFamily: "AoLInter",
    fontSize: 7.8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: BRASS,
    marginBottom: 5,
  },

  calloutText: {
    fontFamily: "AoLInter",
    fontSize: 9,
    lineHeight: 1.5,
    color: INK_SOFT,
  },

  tableWrap: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: PAPER,
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: PANEL,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },

  tableCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },

  tableHeaderText: {
    fontFamily: "AoLInter",
    fontSize: 7.2,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: BRASS,
  },

  tableCellText: {
    fontFamily: "AoLInter",
    fontSize: 8.3,
    color: INK_SOFT,
    lineHeight: 1.35,
  },

  codeBlock: {
    marginVertical: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: LINE,
  },

  codeText: {
    fontFamily: "Courier",
    fontSize: 7.8,
    color: INK,
    lineHeight: 1.35,
  },

  smallNote: {
    fontFamily: "AoLInter",
    fontSize: 8.4,
    lineHeight: 1.42,
    color: INK_MUTE,
    marginBottom: 7,
  },
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
type ParsedNode = {
  type:
    | "heading1"
    | "heading2"
    | "heading3"
    | "heading4"
    | "paragraph"
    | "lead"
    | "pullquote"
    | "blockquote"
    | "list"
    | "orderedList"
    | "table"
    | "divider"
    | "callout"
    | "code";
  content?: string;
  items?: string[];
  rows?: string[][];
  title?: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function cleanInline(text: string): string {
  return safeString(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isDivider(line: string): boolean {
  return line === "---" || line === "***" || line === "___";
}

function isLikelyTableSeparator(line: string): boolean {
  return /^\|?[\-:\s|]+\|?$/.test(line.trim());
}

function normalizeTableRows(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (maxCols <= 0) return rows;

  return rows.map((row) => {
    const next = [...row];
    while (next.length < maxCols) next.push("");
    return next.slice(0, maxCols).map((cell) => cleanInline(cell));
  });
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */
function parseContent(content: string): ParsedNode[] {
  const lines = safeString(content).replace(/\r\n/g, "\n").split("\n");
  const nodes: ParsedNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] || "").trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !(lines[i] || "").trim().startsWith("```")) {
        codeLines.push(lines[i] || "");
        i++;
      }

      i++;
      nodes.push({
        type: "code",
        content: codeLines.join("\n").trim(),
      });
      continue;
    }

    if (line.startsWith("# ") && !line.startsWith("## ")) {
      nodes.push({ type: "heading1", content: cleanInline(line.slice(2)) });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push({ type: "heading2", content: cleanInline(line.slice(3)) });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push({ type: "heading3", content: cleanInline(line.slice(4)) });
      i++;
      continue;
    }

    if (line.startsWith("#### ")) {
      nodes.push({ type: "heading4", content: cleanInline(line.slice(5)) });
      i++;
      continue;
    }

    if (isDivider(line)) {
      nodes.push({ type: "divider" });
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];

      while (i < lines.length && (lines[i] || "").trim().startsWith("> ")) {
        quoteLines.push((lines[i] || "").trim().slice(2));
        i++;
      }

      const quote = cleanInline(quoteLines.join(" "));

      if (quote.startsWith('"') || quote.startsWith("“")) {
        nodes.push({
          type: "pullquote",
          content: quote.replace(/^["“]/, "").replace(/["”]$/, "").trim(),
        });
      } else {
        nodes.push({
          type: "blockquote",
          content: quote,
        });
      }
      continue;
    }

    if (line.startsWith("[!") && line.includes("]")) {
      const titleMatch = line.match(/\[!([^\]]+)\]/);
      const title = titleMatch ? titleMatch[1] : "Note";
      let calloutContent = cleanInline(line.replace(/\[![^\]]+\]/, "").trim());

      let j = i + 1;
      while (j < lines.length && (lines[j] || "").trim() !== "") {
        const next = (lines[j] || "").trim();
        if (
          next.startsWith("#") ||
          next.startsWith("> ") ||
          next.startsWith("|") ||
          next.startsWith("- ") ||
          next.startsWith("* ") ||
          /^\d+\.\s/.test(next) ||
          next.startsWith("```")
        ) {
          break;
        }
        calloutContent += ` ${cleanInline(next)}`;
        j++;
      }

      nodes.push({
        type: "callout",
        title: cleanInline(title),
        content: calloutContent.trim(),
      });

      i = j;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];

      while (i < lines.length && (lines[i] || "").trim().startsWith("|")) {
        const row = (lines[i] || "").trim();
        if (!isLikelyTableSeparator(row)) {
          const cells = row
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean);

          if (cells.length > 0) rows.push(cells);
        }
        i++;
      }

      if (rows.length > 0) {
        nodes.push({
          type: "table",
          rows: normalizeTableRows(rows),
        });
      }
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];

      while (
        i < lines.length &&
        (((lines[i] || "").trim().startsWith("- ")) ||
          ((lines[i] || "").trim().startsWith("* ")))
      ) {
        items.push(cleanInline((lines[i] || "").trim().slice(2)));
        i++;
      }

      nodes.push({ type: "list", items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];

      while (i < lines.length && /^\d+\.\s/.test((lines[i] || "").trim())) {
        items.push(cleanInline((lines[i] || "").trim().replace(/^\d+\.\s/, "")));
        i++;
      }

      nodes.push({ type: "orderedList", items });
      continue;
    }

    let paragraph = cleanInline(line);
    let j = i + 1;

    while (j < lines.length) {
      const next = (lines[j] || "").trim();

      if (
        !next ||
        next.startsWith("#") ||
        next.startsWith("|") ||
        next.startsWith("- ") ||
        next.startsWith("* ") ||
        /^\d+\.\s/.test(next) ||
        next.startsWith("> ") ||
        next.startsWith("[!") ||
        next.startsWith("```") ||
        isDivider(next)
      ) {
        break;
      }

      paragraph += ` ${cleanInline(next)}`;
      j++;
    }

    nodes.push({
      type: nodes.length === 0 ? "lead" : "paragraph",
      content: paragraph.trim(),
    });

    i = j;
  }

  return nodes;
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */
function renderTable(rows: string[][], index: number): React.ReactNode {
  if (!rows.length) return null;

  const normalizedRows = normalizeTableRows(rows);
  const header = normalizedRows[0] || [];
  const bodyRows = normalizedRows.slice(1);

  return (
    <View key={index} style={styles.tableWrap}>
      <View style={styles.tableHeaderRow}>
        {header.map((cell, cellIdx) => (
          <View key={cellIdx} style={styles.tableCell}>
            <Text style={styles.tableHeaderText}>{cell}</Text>
          </View>
        ))}
      </View>

      {bodyRows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.tableRow}>
          {row.map((cell, cellIdx) => (
            <View key={cellIdx} style={styles.tableCell}>
              <Text style={styles.tableCellText}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function renderNode(node: ParsedNode, index: number): React.ReactNode {
  switch (node.type) {
    case "heading1":
      return (
        <Text key={index} style={styles.h1}>
          {node.content}
        </Text>
      );

    case "heading2":
      return (
        <Text key={index} style={styles.h2}>
          {node.content}
        </Text>
      );

    case "heading3":
      return (
        <Text key={index} style={styles.h3}>
          {node.content}
        </Text>
      );

    case "heading4":
      return (
        <Text key={index} style={styles.h4}>
          {node.content}
        </Text>
      );

    case "lead":
      return (
        <Text key={index} style={styles.lead}>
          {node.content}
        </Text>
      );

    case "paragraph":
      return (
        <Text key={index} style={styles.paragraph}>
          {node.content}
        </Text>
      );

    case "pullquote":
      return (
        <View key={index} style={styles.pullQuoteWrap}>
          <Text style={styles.pullQuote}>“{node.content}”</Text>
        </View>
      );

    case "blockquote":
      return (
        <View key={index} style={styles.blockquote}>
          <Text style={styles.blockquoteText}>{node.content}</Text>
        </View>
      );

    case "list":
      return (
        <View key={index} style={styles.unorderedList}>
          {(node.items || []).map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "orderedList":
      return (
        <View key={index} style={styles.orderedList}>
          {(node.items || []).map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.orderedNumber}>{idx + 1}.</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "table":
      return renderTable(node.rows || [], index);

    case "divider":
      return <View key={index} style={styles.divider} />;

    case "callout":
      return (
        <View key={index} style={styles.callout}>
          <Text style={styles.calloutTitle}>{node.title || "Note"}</Text>
          <Text style={styles.calloutText}>{node.content}</Text>
        </View>
      );

    case "code":
      return (
        <View key={index} style={styles.codeBlock}>
          <Text style={styles.codeText}>{node.content || ""}</Text>
        </View>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Public Component                                                           */
/* -------------------------------------------------------------------------- */
interface InstitutionalBriefInteriorPageProps {
  content: string;
}

export const InstitutionalBriefInteriorPage: React.FC<
  InstitutionalBriefInteriorPageProps
> = ({ content }) => {
  const parsedContent = parseContent(content || "");

  return (
    <View style={styles.body}>
      {parsedContent.map((node, idx) => renderNode(node, idx))}
      <View style={styles.sectionGap} />
      <Text style={styles.smallNote}>
        This document is structured for deliberate reading, not hurried scanning.
      </Text>
    </View>
  );
};

export default InstitutionalBriefInteriorPage;