/* lib/pdf/renderers/renderBriefBody.tsx — INSTITUTIONAL BODY ORCHESTRATOR V5 */

import React from "react";
import type { ParsedBriefDocument, BriefBlock } from "@/lib/pdf/renderers/brief-types";
import { parseBriefBody } from "@/lib/pdf/renderers/brief-parser";
import { renderBriefBlock } from "@/lib/pdf/renderers/brief-blocks";

/* -------------------------------------------------------------------------- */
/* Safe Utilities — Production Hardened                                       */
/* -------------------------------------------------------------------------- */
const SAFE_CONFIG = {
  MAX_SUMMARY_CHARS: 1800,
  MAX_FIRST_PARAGRAPH_CHARS: 900,
  MAX_KEY_JUDGEMENTS: 6,
  MAX_BULLET_ITEMS: 6,
} as const;

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return String(value);
  } catch {
    return "";
  }
}

function normalizeNewlines(value: string): string {
  return safeString(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function normalizeLines(content: string): string[] {
  return normalizeNewlines(content).split("\n");
}

function compactWhitespace(text: string): string {
  return safeString(text)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* Sanitization — Safe Removal of MDX/JSX Markers                             */
/* -------------------------------------------------------------------------- */
function stripFenceBlocks(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
}

function stripImportsAndExports(content: string): string {
  return normalizeLines(content)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^import\s+/i.test(trimmed)) return false;
      if (/^export\s+default\s+/i.test(trimmed)) return false;
      if (/^export\s+const\s+/i.test(trimmed)) return false;
      if (/^export\s+function\s+/i.test(trimmed)) return false;
      if (/^export\s+\{.*\}\s*;?\s*$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

function stripJsxFragments(content: string): string {
  return content.replace(/<>/g, "").replace(/<\/>/g, "");
}

function replaceKnownComponentBlocks(content: string): string {
  return content
    .replace(
      /<BriefAlert[\s\S]*?variant=["'](.*?)["'][\s\S]*?>([\s\S]*?)<\/BriefAlert>/gi,
      (_match, variant: string, body: string) =>
        `\n:::callout\ntitle: ${safeString(variant).toUpperCase()} Alert\ntone: strategy\n${compactWhitespace(body)}\n:::\n`
    )
    .replace(
      /<Callout[\s\S]*?title=["'](.*?)["'][\s\S]*?>([\s\S]*?)<\/Callout>/gi,
      (_match, title: string, body: string) =>
        `\n:::callout\ntitle: ${safeString(title)}\ntone: note\n${compactWhitespace(body)}\n:::\n`
    )
    .replace(/<DocumentHeader[\s\S]*?\/>/gi, "")
    .replace(/<DocumentFooter[\s\S]*?>[\s\S]*?<\/DocumentFooter>/gi, "")
    .replace(/<[^>]+\/>/g, "")
    .replace(/<\/?[^>]+>/g, "");
}

function stripInlineMdxExpressions(content: string): string {
  return content
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\{[^{}\n]{1,200}\}/g, "");
}

function sanitizeSource(content: string): string {
  const input = safeString(content);
  if (!input) return "";

  const sanitized = replaceKnownComponentBlocks(
    stripInlineMdxExpressions(
      stripJsxFragments(stripImportsAndExports(stripFenceBlocks(input)))
    )
  );

  return compactWhitespace(sanitized);
}

/* -------------------------------------------------------------------------- */
/* Content Analysis — Safe Extraction Functions                               */
/* -------------------------------------------------------------------------- */
function isHeading(line: string): boolean {
  return /^#{1,6}\s+/.test(line.trim());
}

function getHeadingLevel(line: string): 1 | 2 | 3 {
  const raw = line.match(/^#+/)?.[0]?.length || 1;
  return Math.min(raw, 3) as 1 | 2 | 3;
}

function getHeadingText(line: string): string {
  return line.trim().replace(/^#{1,6}\s+/, "").trim();
}

function isExecutiveSummaryHeading(line: string): boolean {
  const heading = getHeadingText(line).toLowerCase();
  const summaryKeywords = ["executive summary", "summary", "management summary", "overview", "executive overview"];
  return summaryKeywords.some(keyword => heading === keyword);
}

function isKeyJudgementsHeading(line: string): boolean {
  const heading = getHeadingText(line).toLowerCase();
  const judgementKeywords = [
    "key judgements", "key judgments", "judgements", "judgments",
    "key findings", "findings", "critical findings", "principal findings"
  ];
  return judgementKeywords.some(keyword => heading === keyword);
}

function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  return /^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
}

function cleanBulletLine(line: string): string {
  return line
    .trim()
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
}

function isDividerLine(line: string): boolean {
  const trimmed = line.trim();
  return /^\*{3,}$/.test(trimmed) || /^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed);
}

function collectSectionContent(
  lines: string[],
  predicate: (line: string) => boolean,
  maxChars = SAFE_CONFIG.MAX_SUMMARY_CHARS
): string[] {
  let capture = false;
  const bucket: string[] = [];
  let charCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!capture && isHeading(line) && predicate(line)) {
      capture = true;
      continue;
    }

    if (capture && isHeading(line)) {
      break;
    }

    if (capture && line) {
      bucket.push(line);
      charCount += line.length;
      if (charCount >= maxChars) break;
    }
  }

  return bucket;
}

function extractFirstParagraph(lines: string[], maxChars = SAFE_CONFIG.MAX_FIRST_PARAGRAPH_CHARS): string {
  const bucket: string[] = [];
  let charCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (bucket.length > 0) break;
      continue;
    }

    if (isHeading(line)) continue;
    if (isBulletLine(line)) continue;
    if (isDividerLine(line)) continue;

    bucket.push(line);
    charCount += line.length;

    if (charCount >= maxChars) break;
  }

  return compactWhitespace(bucket.join(" "));
}

function extractLeadBullets(lines: string[], maxItems = SAFE_CONFIG.MAX_BULLET_ITEMS): string[] {
  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isBulletLine(line)) {
      const cleaned = cleanBulletLine(line);
      if (cleaned) out.push(cleaned);
    }

    if (out.length >= maxItems) break;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Block Processing — Safe Merging and Rendering                              */
/* -------------------------------------------------------------------------- */
function mergeAdjacentListBlocks(blocks: BriefBlock[]): BriefBlock[] {
  const merged: BriefBlock[] = [];

  for (const block of blocks) {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      previous.type === "list" &&
      block.type === "list" &&
      Boolean(previous.ordered) === Boolean(block.ordered)
    ) {
      previous.items.push(...block.items);
      continue;
    }

    merged.push(block);
  }

  return merged;
}

function buildFallbackBlocksFromText(content: string): BriefBlock[] {
  const lines = normalizeLines(content);
  const blocks: BriefBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = (): void => {
    const text = compactWhitespace(paragraphBuffer.join(" "));
    if (text) {
      blocks.push({
        type: "paragraph",
        text,
      });
    }
    paragraphBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (isDividerLine(line)) {
      flushParagraph();
      blocks.push({ type: "divider" });
      continue;
    }

    if (isHeading(line)) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: getHeadingLevel(line),
        text: getHeadingText(line),
      });
      continue;
    }

    if (isBulletLine(line)) {
      flushParagraph();
      blocks.push({
        type: "list",
        items: [cleanBulletLine(line)],
        ordered: /^\d+\.\s+/.test(line),
      });
      continue;
    }

    if (/^>\s*/.test(line)) {
      flushParagraph();
      blocks.push({
        type: "quote",
        text: compactWhitespace(line.replace(/^>\s*/, "")),
      });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();

  const normalized = mergeAdjacentListBlocks(blocks);

  if (normalized.length === 0) {
    const text = compactWhitespace(content);
    if (text) {
      return [{ type: "paragraph", text }];
    }
  }

  return normalized;
}

function renderBlocksWithEditorialPriority(blocks: BriefBlock[]): React.ReactNode[] {
  let firstParagraphSeen = false;

  return blocks.map((block, index) => {
    const isFirstParagraph = block.type === "paragraph" && !firstParagraphSeen;

    if (block.type === "paragraph" && !firstParagraphSeen) {
      firstParagraphSeen = true;
    }

    return renderBriefBlock(block, index);
  });
}

/* -------------------------------------------------------------------------- */
/* Public API — Safe Export Functions                                         */
/* -------------------------------------------------------------------------- */
export function extractExecutiveSummary(content: string): string | null {
  const source = sanitizeSource(content);
  if (!source) return null;

  const lines = normalizeLines(source);

  const sectionBucket = collectSectionContent(lines, isExecutiveSummaryHeading);
  const sectionSummary = compactWhitespace(sectionBucket.join(" "));
  if (sectionSummary) return sectionSummary;

  const firstParagraph = extractFirstParagraph(lines);
  if (firstParagraph) return firstParagraph;

  return null;
}

export function extractKeyJudgements(content: string): string[] {
  const source = sanitizeSource(content);
  if (!source) return [];

  const lines = normalizeLines(source);

  // Try to extract from dedicated section first
  const sectionLines = collectSectionContent(lines, isKeyJudgementsHeading);
  const sectionBullets = sectionLines
    .filter((line) => isBulletLine(line))
    .map((line) => cleanBulletLine(line))
    .filter(Boolean);

  if (sectionBullets.length > 0) {
    return sectionBullets.slice(0, SAFE_CONFIG.MAX_KEY_JUDGEMENTS);
  }

  // Fallback to global bullets
  const globalBullets = extractLeadBullets(lines);
  if (globalBullets.length > 0) {
    return globalBullets;
  }

  // Final fallback: split executive summary
  const summary = extractExecutiveSummary(source);
  if (!summary) return [];

  return summary
    .split(/(?<=[.!?])\s+/)
    .map((item) => compactWhitespace(item))
    .filter(Boolean)
    .slice(0, SAFE_CONFIG.MAX_KEY_JUDGEMENTS);
}

export function renderBriefBody(content: string): React.ReactNode[] {
  const sanitized = sanitizeSource(content);
  if (!sanitized) return [];

  // Primary: Use the parser
  try {
    const parsed: ParsedBriefDocument = parseBriefBody(sanitized);

    if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      return renderBlocksWithEditorialPriority(parsed.blocks);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[renderBriefBody] Parser failed, using fallback:", error);
    }
  }

  // Secondary: Use fallback block builder
  try {
    const fallbackBlocks = buildFallbackBlocksFromText(sanitized);
    return renderBlocksWithEditorialPriority(fallbackBlocks);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[renderBriefBody] Fallback renderer failed:", error);
    }
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Re-exports for API compatibility                                            */
/* -------------------------------------------------------------------------- */
export { parseBriefBody } from "@/lib/pdf/renderers/brief-parser";
export type { BriefBlock, ParsedBriefDocument } from "@/lib/pdf/renderers/brief-types";