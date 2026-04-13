/* lib/pdf/renderers/brief-blocks.tsx — INSTITUTIONAL BLOCK RENDERER V4.0
   ---------------------------------------------------------------------------
   Premium PDF block renderer rebuilt for stronger stability, cleaner visual
   hierarchy, safer inline handling, and calmer institutional output.
   --------------------------------------------------------------------------- */

import React from "react";
import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BriefBlock, InlineToken } from "./brief-types";

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const INK = "#161412";
const INK_SOFT = "#4C463F";
const INK_MUTE = "#7C7368";
const BRASS = "#8A6A2F";
const BRASS_SOFT = "#B79D6A";
const MIST = "#E6DDD0";
const PANEL = "#F6F1E8";
const PANEL_SOFT = "#FAF7F2";
const PANEL_AUDIT = "#F7F3EC";
const PAPER = "#FCFAF6";

/* -------------------------------------------------------------------------- */
/* Safety Constants                                                           */
/* -------------------------------------------------------------------------- */
const MAX_INLINE_LENGTH = 1200;
const MAX_PARAGRAPH_LENGTH = 2200;
const MAX_LIST_ITEM_LENGTH = 800;
const MAX_TABLE_CELL_LENGTH = 260;
const MAX_CALLOUT_TEXT_LENGTH = 1200;
const MAX_HEADING_LENGTH = 240;

/* -------------------------------------------------------------------------- */
/* Styling                                                                    */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },

  headingBlock: {
    marginBottom: 2,
  },

  h1: {
    fontFamily: "AoLSerif",
    fontSize: 18.8,
    lineHeight: 1.16,
    color: INK,
    marginTop: 4,
    marginBottom: 8,
  },

  h2: {
    fontFamily: "AoLInter",
    fontSize: 10.8,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: BRASS,
    marginTop: 14,
    marginBottom: 7,
    borderBottomWidth: 0.8,
    borderBottomColor: BRASS_SOFT,
    paddingBottom: 3,
  },

  h3: {
    fontFamily: "AoLInter",
    fontSize: 10.1,
    fontWeight: 700,
    color: INK,
    marginTop: 10,
    marginBottom: 5,
  },

  paragraphWrap: {
    marginBottom: 7,
  },

  paragraph: {
    fontFamily: "AoLInter",
    fontSize: 9.65,
    lineHeight: 1.56,
    color: INK_SOFT,
    textAlign: "justify",
  },

  leadParagraph: {
    fontFamily: "AoLInter",
    fontSize: 10,
    lineHeight: 1.6,
    color: INK,
    textAlign: "justify",
  },

  tableWrap: {
    marginVertical: 11,
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PAPER,
  },

  tableCaption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: PANEL_AUDIT,
    fontFamily: "AoLInter",
    fontSize: 7.4,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: BRASS,
  },

  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BRASS_SOFT,
    backgroundColor: PANEL,
  },

  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: MIST,
  },

  tableCellWrap: {
    flex: 1,
    minHeight: 1,
  },

  tableCellHeader: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontFamily: "AoLInter",
    fontSize: 7.2,
    fontWeight: 700,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  tableCellBody: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontFamily: "AoLInter",
    fontSize: 8.2,
    color: INK_SOFT,
    lineHeight: 1.4,
  },

  tableCellMonospace: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontFamily: "Courier",
    fontSize: 7.8,
    color: BRASS,
    lineHeight: 1.35,
  },

  bold: {
    fontFamily: "AoLInter",
    fontWeight: 700,
    color: INK,
  },

  italic: {
    fontFamily: "AoLSerif",
    fontStyle: "italic",
    color: INK,
  },

  link: {
    color: BRASS,
    textDecoration: "none",
  },

  listWrap: {
    marginBottom: 9,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  listMarker: {
    width: 16,
    fontFamily: "AoLInter",
    fontSize: 8.8,
    fontWeight: 700,
    color: BRASS,
    marginTop: 0.8,
  },

  listBody: {
    flex: 1,
    fontFamily: "AoLInter",
    fontSize: 9.35,
    lineHeight: 1.5,
    color: INK_SOFT,
  },

  calloutWrap: {
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: MIST,
  },

  calloutTitle: {
    fontFamily: "AoLInter",
    fontSize: 7.2,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: BRASS,
    marginBottom: 4,
  },

  calloutBody: {
    fontFamily: "AoLInter",
    fontSize: 8.9,
    lineHeight: 1.45,
    color: INK_SOFT,
  },

  divider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: MIST,
  },

  fallbackBox: {
    marginBottom: 9,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: MIST,
  },

  fallbackText: {
    fontFamily: "AoLInter",
    fontSize: 8.9,
    lineHeight: 1.45,
    color: INK_MUTE,
  },
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return value == null ? "" : String(value);
}

function clampText(text: string, maxLength: number): string {
  const clean = safeString(text).trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function sanitizeInline(value: string): string {
  return safeString(value)
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

function cleanInline(text: string, maxLength = MAX_INLINE_LENGTH): string {
  return clampText(sanitizeInline(text), maxLength);
}

function splitLongParagraph(text: string, maxLength = MAX_PARAGRAPH_LENGTH): string[] {
  const cleaned = cleanInline(text, Math.max(maxLength * 4, maxLength));
  if (!cleaned) return [];
  if (cleaned.length <= maxLength) return [cleaned];

  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLength) {
        current = sentence;
      } else {
        const words = sentence.split(/\s+/);
        let wordChunk = "";
        for (const word of words) {
          const next = wordChunk ? `${wordChunk} ${word}` : word;
          if (next.length <= maxLength) {
            wordChunk = next;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        current = wordChunk;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean).map((chunk) => clampText(chunk, maxLength));
}

function tokenizeInline(text: string): Array<
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "link"; content: string; href: string }
> {
  const input = cleanInline(text, MAX_INLINE_LENGTH);
  if (!input) return [];

  const regex = /(\*\*.*?\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = input.split(regex).filter(Boolean);

  return parts.map((part) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, linkText = "", linkHref = ""] = linkMatch;
      return {
        type: "link" as const,
        content: cleanInline(linkText, 240),
        href: safeString(linkHref).trim(),
      };
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return {
        type: "bold" as const,
        content: cleanInline(part.slice(2, -2), 240),
      };
    }

    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**") && part.length > 2) {
      return {
        type: "italic" as const,
        content: cleanInline(part.slice(1, -1), 240),
      };
    }

    return {
      type: "text" as const,
      content: cleanInline(part, MAX_INLINE_LENGTH),
    };
  });
}

function renderInline(text: string): React.ReactNode[] {
  return tokenizeInline(text).map((token, i) => {
    switch (token.type) {
      case "bold":
        return (
          <Text key={i} style={styles.bold}>
            {token.content}
          </Text>
        );

      case "italic":
        return (
          <Text key={i} style={styles.italic}>
            {token.content}
          </Text>
        );

      case "link":
        return (
          <Link key={i} src={token.href} style={styles.link}>
            {token.content}
          </Link>
        );

      default:
        return token.content;
    }
  });
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/* -------------------------------------------------------------------------- */
/* Block Switcher                                                             */
/* -------------------------------------------------------------------------- */

export function renderBriefBlock(
  block: BriefBlock,
  index: number,
): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 2;
      const headingText = cleanInline(block.text, MAX_HEADING_LENGTH);
      const headingStyle =
        level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;

      return (
        <View key={index} style={styles.headingBlock}>
          <Text style={headingStyle}>{headingText}</Text>
        </View>
      );
    }

    case "paragraph": {
      const paragraphs = splitLongParagraph(block.text, MAX_PARAGRAPH_LENGTH);
      if (paragraphs.length === 0) return null;

      return (
        <View key={index} style={styles.section}>
          {paragraphs.map((paragraph, pIndex) => (
            <View key={pIndex} style={styles.paragraphWrap}>
              <Text style={index === 0 && pIndex === 0 ? styles.leadParagraph : styles.paragraph}>
                {renderInline(paragraph)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    case "list": {
      const items = safeArray(block.items)
        .map((item) => cleanInline(item, MAX_LIST_ITEM_LENGTH))
        .filter(Boolean);

      if (items.length === 0) return null;

      return (
        <View key={index} style={styles.listWrap}>
          {items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.listRow}>
              <Text style={styles.listMarker}>
                {block.ordered ? `${itemIndex + 1}.` : "•"}
              </Text>
              <Text style={styles.listBody}>{renderInline(item)}</Text>
            </View>
          ))}
        </View>
      );
    }

    case "table": {
      const headers = safeArray(block.headers)
        .map((header) => cleanInline(header, MAX_TABLE_CELL_LENGTH))
        .filter(Boolean);

      const rows = safeArray(block.rows).map((row) =>
        safeArray(row).map((cell) => cleanInline(cell, MAX_TABLE_CELL_LENGTH)),
      );

      if (headers.length === 0) return null;

      return (
        <View key={index} style={styles.tableWrap} wrap={false}>
          {block.caption ? (
            <Text style={styles.tableCaption}>
              {cleanInline(block.caption, 180)}
            </Text>
          ) : null}

          <View style={styles.tableHeaderRow}>
            {headers.map((header, headerIndex) => (
              <View key={headerIndex} style={styles.tableCellWrap}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableBodyRow}>
              {row.map((cell, cellIndex) => (
                <View key={cellIndex} style={styles.tableCellWrap}>
                  <Text
                    style={
                      cellIndex === 0
                        ? styles.tableCellMonospace
                        : styles.tableCellBody
                    }
                  >
                    {renderInline(cell)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    case "callout": {
      const title = cleanInline(block.title || "Note", 80);
      const text = cleanInline(block.text || "", MAX_CALLOUT_TEXT_LENGTH);

      if (!text) return null;

      return (
        <View key={index} style={styles.calloutWrap} wrap={false}>
          <Text style={styles.calloutTitle}>{title}</Text>
          <Text style={styles.calloutBody}>{renderInline(text)}</Text>
        </View>
      );
    }

    case "divider":
      return <View key={index} style={styles.divider} />;

    default:
      return (
        <View key={index} style={styles.fallbackBox}>
          <Text style={styles.fallbackText}>
            {cleanInline(
              safeString((block as { content?: unknown }).content),
              500,
            )}
          </Text>
        </View>
      );
  }
}