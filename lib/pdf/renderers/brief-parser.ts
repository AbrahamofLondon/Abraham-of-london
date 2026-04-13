/* lib/pdf/renderers/brief-parser.ts — INSTITUTIONAL BRIEF PARSER V4.0
   ---------------------------------------------------------------------------
   Rebuilt parser for premium PDF output.
   Handles directives, markdown tables, headings, lists, dividers, and
   paragraph grouping with stronger sanitisation and safer structure.
   --------------------------------------------------------------------------- */

import type {
  BriefBlock,
  BriefTone,
  ParsedBriefDocument,
} from "./brief-types";

/* --------------------------------------------------------------------------
   Utility Helpers
-------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return value == null ? "" : String(value);
}

function normalizeNewlines(value: string): string {
  return safeString(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function sanitizeText(value: string): string {
  return safeString(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ");
}

function cleanText(text: string): string {
  return sanitizeText(text)
    .replace(/[ \t]+/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function clampText(text: string, maxLength: number): string {
  const clean = cleanText(text);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function parseKeyValueLine(
  line: string,
): { key: string; value: string } | null {
  const match = line.match(/^([A-Za-z0-9 _-]+)\s*:\s*(.+)$/);
  if (!match) return null;
  const [, rawKey = "", rawValue = ""] = match;
  return {
    key: rawKey.trim().toLowerCase(),
    value: rawValue.trim(),
  };
}

function isBlank(line: string): boolean {
  return cleanText(line) === "";
}

function isDivider(line: string): boolean {
  const trimmed = cleanText(line);
  return trimmed === "---" || trimmed === "***" || trimmed === "___";
}

function isListLine(line: string): boolean {
  return /^[-*•]\s+/.test(cleanText(line));
}

function isOrderedListLine(line: string): boolean {
  return /^\d+\.\s+/.test(cleanText(line));
}

function isHeadingLine(line: string): boolean {
  return /^(#{1,3})\s+/.test(cleanText(line));
}

function isLikelyTableSeparator(line: string): boolean {
  return /^\|?[\-:\s|]+\|?$/.test(cleanText(line));
}

function splitTableRow(line: string): string[] {
  return safeString(line)
    .split("|")
    .map((cell) => clampText(cell, 260))
    .filter((cell) => cell.length > 0);
}

/* --------------------------------------------------------------------------
   Directive Parsers
-------------------------------------------------------------------------- */

function tryParseDirective(
  lines: string[],
  index: number,
): { block: BriefBlock | null; nextIndex: number } | null {
  const first = cleanText(lines[index] || "");
  if (!first.startsWith(":::")) return null;

  const type = first.replace(/^:::/, "").trim().toLowerCase();
  const bodyLines: string[] = [];
  let i = index + 1;

  while (i < lines.length) {
    const line = cleanText(lines[i] || "");
    if (line === ":::") break;
    bodyLines.push(lines[i] || "");
    i += 1;
  }

  if (type === "table") {
    let caption = "";
    const dataRows: string[][] = [];

    bodyLines.forEach((line) => {
      const kv = parseKeyValueLine(cleanText(line));
      if (kv && kv.key === "caption") {
        caption = clampText(kv.value, 180);
      } else if (line.includes("|")) {
        const cells = splitTableRow(line);
        if (cells.length > 0) dataRows.push(cells);
      }
    });

    const headers = dataRows[0] || [];
    const rows = dataRows.slice(1);

    return {
      block:
        headers.length > 0
          ? {
              type: "table",
              headers,
              rows,
              caption: caption || undefined,
            }
          : null,
      nextIndex: i,
    };
  }

  if (type === "callout" || type === "alert") {
    let title = "";
    let tone: BriefTone = "note";
    const content: string[] = [];

    bodyLines.forEach((line) => {
      const kv = parseKeyValueLine(cleanText(line));
      if (kv && kv.key === "title") title = clampText(kv.value, 80);
      else if (kv && kv.key === "tone") tone = kv.value as BriefTone;
      else content.push(line);
    });

    const text = clampText(content.join(" "), 1200);

    return {
      block: text
        ? {
            type: "callout",
            title: title || undefined,
            tone,
            text,
          }
        : null,
      nextIndex: i,
    };
  }

  return { block: null, nextIndex: i };
}

/* --------------------------------------------------------------------------
   Markdown Table Parser
-------------------------------------------------------------------------- */

function tryParseMarkdownTable(
  lines: string[],
  index: number,
): { block: BriefBlock; nextIndex: number } | null {
  const row1 = cleanText(lines[index] || "");
  const row2 = cleanText(lines[index + 1] || "");

  if (!row1.includes("|") || !row2.includes("|") || !isLikelyTableSeparator(row2)) {
    return null;
  }

  const rows: string[][] = [];
  let i = index;

  while (i < lines.length && cleanText(lines[i] || "").includes("|")) {
    const current = cleanText(lines[i] || "");
    if (!isLikelyTableSeparator(current)) {
      const cells = splitTableRow(current);
      if (cells.length > 0) rows.push(cells);
    }
    i++;
  }

  if (rows.length === 0) return null;

  return {
    block: {
      type: "table",
      headers: rows[0] || [],
      rows: rows.slice(1),
    },
    nextIndex: i - 1,
  };
}

/* --------------------------------------------------------------------------
   Main Orchestrator
-------------------------------------------------------------------------- */

export function parseBriefBody(content: string): ParsedBriefDocument {
  const lines = normalizeNewlines(content).split("\n");
  const blocks: BriefBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = cleanText(lines[i] || "");

    if (!line) {
      i++;
      continue;
    }

    if (isDivider(line)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    const directive = tryParseDirective(lines, i);
    if (directive) {
      if (directive.block) blocks.push(directive.block);
      i = directive.nextIndex + 1;
      continue;
    }

    const table = tryParseMarkdownTable(lines, i);
    if (table) {
      blocks.push(table.block);
      i = table.nextIndex + 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const [, hashes = "", headingText = ""] = headingMatch;
      blocks.push({
        type: "heading",
        level: hashes.length as 1 | 2 | 3,
        text: clampText(headingText, 240),
      });
      i++;
      continue;
    }

    if (isListLine(line) || isOrderedListLine(line)) {
      const ordered = isOrderedListLine(line);
      const items: string[] = [];

      while (
        i < lines.length &&
        (ordered
          ? isOrderedListLine(lines[i] || "")
          : isListLine(lines[i] || ""))
      ) {
        const raw = cleanText(lines[i] || "");
        items.push(
          clampText(raw.replace(/^([-*•]|\d+\.)\s+/, ""), 800),
        );
        i++;
      }

      if (items.length > 0) {
        blocks.push({
          type: "list",
          items,
          ordered,
        });
      }
      continue;
    }

    const paragraphLines: string[] = [line];
    let j = i + 1;

    while (j < lines.length) {
      const next = cleanText(lines[j] || "");

      if (
        !next ||
        isHeadingLine(next) ||
        isDivider(next) ||
        next.startsWith(":::") ||
        isListLine(next) ||
        isOrderedListLine(next) ||
        (next.includes("|") && isLikelyTableSeparator(cleanText(lines[j + 1] || "")))
      ) {
        break;
      }

      paragraphLines.push(next);
      j++;
    }

    const paragraph = clampText(paragraphLines.join(" "), 2200);
    if (paragraph) {
      blocks.push({
        type: "paragraph",
        text: paragraph,
      });
    }

    i = j;
  }

  return { blocks };
}