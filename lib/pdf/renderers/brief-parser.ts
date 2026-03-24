/* lib/pdf/renderers/brief-parser.ts — INSTITUTIONAL BRIEF PARSER V3.1 */

import type {
  BriefBlock,
  BriefTone,
  ParsedBriefDocument,
} from "./brief-types";

/* --------------------------------------------------------------------------
   UTILITY HELPERS
-------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return value ? String(value) : "";
}

function normalizeNewlines(value: string): string {
  return safeString(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function cleanText(text: string): string {
  return safeString(text)
    .replace(/[ \t]+/g, " ")
    .replace(/<[^>]+>/g, "") // Strip MDX/HTML tags
    .trim();
}

function parseKeyValueLine(line: string): { key: string; value: string } | null {
  const match = line.match(/^([A-Za-z0-9 _-]+)\s*:\s*(.+)$/);
  return match ? { key: match[1].trim().toLowerCase(), value: match[2].trim() } : null;
}

/* --------------------------------------------------------------------------
   DIRECTIVE PARSERS (:::block)
-------------------------------------------------------------------------- */

function tryParseDirective(
  lines: string[],
  index: number
): { block: BriefBlock | null; nextIndex: number } | null {
  const first = lines[index]?.trim();
  if (!first.startsWith(":::")) return null;

  const type = first.replace(/^:::/, "").trim().toLowerCase();
  const bodyLines: string[] = [];
  let i = index + 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === ":::") break;
    bodyLines.push(lines[i]);
    i += 1;
  }

  // Handle Table Directive (Common in Audit Practices)
  if (type === "table") {
    let caption = "";
    const dataRows: string[][] = [];

    bodyLines.forEach(line => {
      const kv = parseKeyValueLine(line);
      if (kv && kv.key === "caption") {
        caption = kv.value;
      } else if (line.includes("|")) {
        const cells = line.split("|").map(c => cleanText(c)).filter(Boolean);
        if (cells.length > 0) dataRows.push(cells);
      }
    });

    return {
      block: {
        type: "table",
        headers: dataRows[0] || [],
        rows: dataRows.slice(1),
        caption: caption || undefined,
      },
      nextIndex: i,
    };
  }

  // Handle Callout/Alert Directive
  if (type === "callout" || type === "alert") {
    let title = "";
    let tone: BriefTone = "note";
    const content: string[] = [];

    bodyLines.forEach(line => {
      const kv = parseKeyValueLine(line);
      if (kv && kv.key === "title") title = kv.value;
      else if (kv && kv.key === "tone") tone = kv.value as BriefTone;
      else content.push(line);
    });

    return {
      block: { type: "callout", title: title || undefined, tone, text: cleanText(content.join(" ")) },
      nextIndex: i,
    };
  }

  return { block: null, nextIndex: i };
}

/* --------------------------------------------------------------------------
   STANDARD MARKDOWN PARSERS
-------------------------------------------------------------------------- */

function tryParseMarkdownTable(lines: string[], index: number): { block: BriefBlock; nextIndex: number } | null {
  const row1 = lines[index]?.trim();
  const row2 = lines[index + 1]?.trim();
  if (!row1?.includes("|") || !row2?.includes("|") || !row2.match(/^[:|\-\s]+$/)) return null;

  const rows: string[][] = [];
  let i = index;
  while (i < lines.length && lines[i].trim().includes("|")) {
    const cells = lines[i].split("|").map(c => cleanText(c)).filter(Boolean);
    if (cells.length > 0) rows.push(cells);
    i++;
  }

  return {
    block: { type: "table", headers: rows[0], rows: rows.slice(2) }, // slice(2) skips header + divider
    nextIndex: i - 1,
  };
}

/* --------------------------------------------------------------------------
   MAIN ORCHESTRATOR
-------------------------------------------------------------------------- */

export function parseBriefBody(content: string): ParsedBriefDocument {
  const lines = normalizeNewlines(content).split("\n");
  const blocks: BriefBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    // 1. Check for Directives (:::table, etc.)
    const directive = tryParseDirective(lines, i);
    if (directive) {
      if (directive.block) blocks.push(directive.block);
      i = directive.nextIndex + 1;
      continue;
    }

    // 2. Check for Markdown Tables
    const table = tryParseMarkdownTable(lines, i);
    if (table) {
      blocks.push(table.block);
      i = table.nextIndex + 1;
      continue;
    }

    // 3. Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: cleanText(headingMatch[2])
      });
      i++;
      continue;
    }

    // 4. Lists (Unordered & Ordered)
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const isOrdered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (isOrdered ? /^\d+\.\s+/.test(lines[i].trim()) : /^[-*•]\s+/.test(lines[i].trim()))) {
        items.push(cleanText(lines[i].trim().replace(/^([-*•]|\d+\.)\s+/, "")));
        i++;
      }
      blocks.push({ type: "list", items, ordered: isOrdered });
      continue;
    }

    // 5. Paragraphs (Fallback)
    blocks.push({ type: "paragraph", text: cleanText(line) });
    i++;
  }

  return { blocks };
}