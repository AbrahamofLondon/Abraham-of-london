// scripts/pdf/parse-ebook-content.ts
import { logger } from "../../lib/logging";

export type EbookBlock =
  | { type: "opening"; text: string }
  | { type: "markdown"; markdown: string }
  | { type: "chapter"; numeral?: string; title: string; intro?: string }
  | { type: "callout"; label: string; body: string }
  | { type: "pullquote"; text: string }
  | { type: "figure"; title: string; body: string };

function safeString(input: unknown): string {
  return typeof input === "string" ? input : "";
}

function normalizeMarkdown(input: string): string {
  return safeString(input)
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function trimLines(input: string): string {
  return safeString(input)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function collapseExcessBlankLines(input: string): string {
  return safeString(input).replace(/\n{3,}/g, "\n\n");
}

function stripFrontmatterIfPresent(input: string): string {
  const normalized = normalizeMarkdown(input);

  if (!normalized.startsWith("---\n")) {
    return normalized;
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }

  return normalized.slice(end + 5).trim();
}

function extractRomanAndTitle(text: string): { numeral?: string; title: string } {
  const cleaned = safeString(text).trim();
  const match = cleaned.match(/^([IVXLCDM]+)\.\s+(.*)$/i);

  if (!match) {
    return {
      title: cleaned || "Untitled Chapter",
    };
  }

  const numeral = match[1]?.toUpperCase();
  const title = match[2]?.trim() || cleaned;

  return {
    numeral: numeral || undefined,
    title,
  };
}

function isStructuralMarker(line: string): boolean {
  const trimmed = safeString(line).trim();

  return (
    trimmed.startsWith("## ") ||
    trimmed.startsWith("> [OPENING]") ||
    trimmed.startsWith("> [CALLOUT:") ||
    trimmed.startsWith("> [PULLQUOTE]") ||
    trimmed.startsWith("> [FIGURE:")
  );
}

function isSubheading(line: string): boolean {
  const trimmed = safeString(line).trim();
  return trimmed.startsWith("### ") || trimmed.startsWith("#### ");
}

function extractCalloutLabel(line: string): string {
  const match = safeString(line).trim().match(/^>\s\[CALLOUT:(.+?)\]\s*$/i);
  return match?.[1]?.trim() || "Key Insight";
}

function extractFigureTitle(line: string): string {
  const match = safeString(line).trim().match(/^>\s\[FIGURE:(.+?)\]\s*$/i);
  return match?.[1]?.trim() || "Figure";
}

function collectQuotedBlock(
  lines: string[],
  startIndex: number,
): { text: string; nextIndex: number } {
  const collected: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const raw = safeString(lines[i]);
    const trimmed = raw.trim();

    if (!trimmed) {
      if (collected.length === 0) {
        i += 1;
        continue;
      }
      collected.push("");
      i += 1;
      continue;
    }

    if (!trimmed.startsWith(">")) {
      break;
    }

    if (/^>\s\[(OPENING|CALLOUT:|PULLQUOTE|FIGURE:)/i.test(trimmed)) {
      break;
    }

    collected.push(raw.replace(/^>\s?/, ""));
    i += 1;
  }

  return {
    text: collapseExcessBlankLines(trimLines(collected.join("\n"))),
    nextIndex: i - 1,
  };
}

function collectChapterIntro(
  lines: string[],
  startIndex: number,
): { intro?: string; nextIndex: number } {
  const introLines: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const raw = safeString(lines[i]);
    const trimmed = raw.trim();

    if (!trimmed) {
      if (introLines.length === 0) {
        i += 1;
        continue;
      }
      break;
    }

    if (isStructuralMarker(raw) || isSubheading(raw)) {
      break;
    }

    if (trimmed.startsWith("|")) {
      break;
    }

    introLines.push(raw);
    i += 1;
  }

  const intro = collapseExcessBlankLines(trimLines(introLines.join("\n")));

  return {
    intro: intro || undefined,
    nextIndex: i - 1,
  };
}

function pushMarkdownBuffer(blocks: EbookBlock[], buffer: string[]): void {
  const markdown = collapseExcessBlankLines(trimLines(buffer.join("\n")));
  if (!markdown) return;

  blocks.push({
    type: "markdown",
    markdown,
  });
}

export function parseEbookBlocks(markdown: string): EbookBlock[] {
  const requestId = Math.random().toString(36).slice(2, 8);

  const normalized = stripFrontmatterIfPresent(normalizeMarkdown(markdown));

  if (!normalized) {
    logger.warn(`[Parser:${requestId}] Empty markdown provided`);
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: EbookBlock[] = [];
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = safeString(lines[i]);
    const trimmed = line.trim();

    if (trimmed.startsWith("> [OPENING]")) {
      pushMarkdownBuffer(blocks, buffer);
      buffer = [];

      const { text, nextIndex } = collectQuotedBlock(lines, i + 1);

      if (text) {
        blocks.push({ type: "opening", text });
      } else {
        logger.warn(`[Parser:${requestId}] Empty opening block`, {
          line: i + 1,
        });
      }

      i = nextIndex;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      pushMarkdownBuffer(blocks, buffer);
      buffer = [];

      const rawTitle = trimmed.slice(3).trim();
      const parsed = extractRomanAndTitle(rawTitle);
      const { intro, nextIndex } = collectChapterIntro(lines, i + 1);

      blocks.push({
        type: "chapter",
        numeral: parsed.numeral,
        title: parsed.title,
        intro,
      });

      i = nextIndex;
      continue;
    }

    if (trimmed.startsWith("> [CALLOUT:")) {
      pushMarkdownBuffer(blocks, buffer);
      buffer = [];

      const label = extractCalloutLabel(line);
      const { text, nextIndex } = collectQuotedBlock(lines, i + 1);

      if (text) {
        blocks.push({
          type: "callout",
          label,
          body: text,
        });
      } else {
        logger.warn(`[Parser:${requestId}] Empty callout block`, {
          line: i + 1,
          label,
        });
      }

      i = nextIndex;
      continue;
    }

    if (trimmed.startsWith("> [PULLQUOTE]")) {
      pushMarkdownBuffer(blocks, buffer);
      buffer = [];

      const { text, nextIndex } = collectQuotedBlock(lines, i + 1);

      if (text) {
        blocks.push({
          type: "pullquote",
          text,
        });
      } else {
        logger.warn(`[Parser:${requestId}] Empty pullquote block`, {
          line: i + 1,
        });
      }

      i = nextIndex;
      continue;
    }

    if (trimmed.startsWith("> [FIGURE:")) {
      pushMarkdownBuffer(blocks, buffer);
      buffer = [];

      const title = extractFigureTitle(line);
      const { text, nextIndex } = collectQuotedBlock(lines, i + 1);

      if (text) {
        blocks.push({
          type: "figure",
          title,
          body: text,
        });
      } else {
        logger.warn(`[Parser:${requestId}] Empty figure block`, {
          line: i + 1,
          title,
        });
      }

      i = nextIndex;
      continue;
    }

    buffer.push(line);
  }

  pushMarkdownBuffer(blocks, buffer);

  logger.info(`[Parser:${requestId}] Parsed ebook blocks`, {
    total: blocks.length,
    opening: blocks.filter((b) => b.type === "opening").length,
    chapters: blocks.filter((b) => b.type === "chapter").length,
    callouts: blocks.filter((b) => b.type === "callout").length,
    pullquotes: blocks.filter((b) => b.type === "pullquote").length,
    figures: blocks.filter((b) => b.type === "figure").length,
    markdown: blocks.filter((b) => b.type === "markdown").length,
  });

  return blocks;
}