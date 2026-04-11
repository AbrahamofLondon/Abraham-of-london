/* lib/pdf/renderers/renderBriefBody.tsx — INSTITUTIONAL BODY ORCHESTRATOR V4.2
   ---------------------------------------------------------------------------
   Hardened body orchestration for premium PDF briefs.
   FIXED: Proper block text extraction for all block types.
   --------------------------------------------------------------------------- */

import React from "react";
import { View, StyleSheet, Text } from "@react-pdf/renderer";

import { parseBriefBody } from "./brief-parser";
import { renderBriefBlock } from "./brief-blocks";
import type { BriefBlock } from "./brief-types";

/* --------------------------------------------------------------------------
   SAFETY CONSTANTS
-------------------------------------------------------------------------- */

const MAX_SOURCE_LENGTH = 120_000;
const MAX_FALLBACK_TEXT_LENGTH = 2_500;
const MAX_EXEC_SUMMARY_LENGTH = 1_600;
const MAX_JUDGEMENT_LENGTH = 280;
const MAX_JUDGEMENTS = 12;

/* --------------------------------------------------------------------------
   UTILITY & SANITISATION HELPERS
-------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function clampText(text: string, maxLength: number): string {
  const clean = safeString(text).trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function normaliseUnicode(text: string): string {
  return safeString(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ");
}

function cleanInline(text: string, maxLength = 1_200): string {
  const cleaned = normaliseUnicode(
    safeString(text)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1"),
  )
    .replace(/\s+/g, " ")
    .trim();

  return clampText(cleaned, maxLength);
}

function sanitizeSource(content: string): string {
  const input = clampText(normaliseUnicode(content), MAX_SOURCE_LENGTH);
  if (!input) return "";

  return input
    .split("\n")
    .filter((line) => !/^(import|export)\s+/.test(line.trim()))
    .join("\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSectionBody(content: string, headings: string[]): string | null {
  const sanitized = sanitizeSource(content);
  if (!sanitized) return null;

  const headingPattern = headings
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(
    `^#{1,6}\\s+(?:${headingPattern})\\s*$\\n([\\s\\S]*?)(?=^#{1,6}\\s+|$)`,
    "im",
  );

  const match = sanitized.match(regex);
  if (!match) return null;

  const body = safeString(match[1]).trim();
  return body || null;
}

function fallbackParagraphsFromSection(section: string, maxLength: number): string[] {
  const cleaned = sanitizeSource(section);
  if (!cleaned) return [];

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => cleanInline(p, maxLength))
    .filter(Boolean);

  return paragraphs;
}

function fallbackLines(content: unknown, maxLength = MAX_FALLBACK_TEXT_LENGTH): string[] {
  const raw = safeString(content);
  if (!raw) return [];

  const cleaned = sanitizeSource(raw);
  if (!cleaned) return [];

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => cleanInline(p, maxLength))
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : [cleanInline(cleaned, maxLength)];
}

/* --------------------------------------------------------------------------
   FALLBACK BLOCK TEXT EXTRACTION - HARDENED
-------------------------------------------------------------------------- */

function getFallbackBlockText(block: BriefBlock): string {
  switch (block.type) {
    case "heading":
      return (block as any).text || "";
    case "paragraph":
      return (block as any).text || "";
    case "quote":
      return [(block as any).text, (block as any).attribution].filter(Boolean).join(" — ");
    case "callout":
      return [(block as any).title, (block as any).text].filter(Boolean).join(": ");
    case "sidebar":
      return [(block as any).title, (block as any).text].filter(Boolean).join(": ");
    case "list":
      return safeArray((block as any).items).join(" | ");
    case "table": {
      const caption = (block as any).caption || "";
      const headers = safeArray((block as any).headers).join(" | ");
      const rows = safeArray((block as any).rows)
        .map((row: string[]) => row.join(" | "))
        .join(" || ");
      return [caption, headers, rows].filter(Boolean).join(" || ");
    }
    case "exhibit":
      return [(block as any).label, (block as any).title, (block as any).body].filter(Boolean).join(": ");
    case "appendix":
      return [(block as any).title, (block as any).body].filter(Boolean).join(": ");
    case "doctrine":
      return [(block as any).index, (block as any).title, (block as any).body].filter(Boolean).join(": ");
    case "evidence":
      return [(block as any).label, ...safeArray((block as any).items)].filter(Boolean).join(" | ");
    case "divider":
      return "";
    default:
      return "";
  }
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/* --------------------------------------------------------------------------
   STYLING
-------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bodyContainer: {
    paddingTop: 10,
    paddingBottom: 22,
  },

  bodySection: {
    marginBottom: 10,
  },

  fallbackPanel: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F7F2E8",
    borderWidth: 1,
    borderColor: "#DED5C5",
  },

  fallbackKicker: {
    fontFamily: "AoLInter",
    fontSize: 7.4,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8C7750",
    marginBottom: 4,
  },

  rawText: {
    fontFamily: "AoLInter",
    fontSize: 9.2,
    lineHeight: 1.5,
    marginBottom: 6,
    color: "#3C3934",
  },

  footerNote: {
    fontFamily: "AoLInter",
    fontSize: 8.2,
    lineHeight: 1.4,
    marginTop: 8,
    color: "#7A7367",
  },
});

/* --------------------------------------------------------------------------
   EXTRACTION LOGIC
-------------------------------------------------------------------------- */

export function extractExecutiveSummary(content: string): string | null {
  const section = extractSectionBody(content, ["Executive Summary"]);
  if (!section) return null;

  const paragraphs = fallbackParagraphsFromSection(section, 700);
  if (paragraphs.length === 0) return null;

  const joined = paragraphs.join(" ");
  return clampText(joined, MAX_EXEC_SUMMARY_LENGTH);
}

export function extractKeyJudgements(content: string): string[] {
  const section = extractSectionBody(content, ["Key Judgements", "Judgements"]);
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => safeString(line).trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, ""))
    .map((line) => cleanInline(line, MAX_JUDGEMENT_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_JUDGEMENTS);
}

/* --------------------------------------------------------------------------
   MAIN COMPONENT: RenderBriefBody
-------------------------------------------------------------------------- */

interface RenderBriefBodyProps {
  content: string;
}

export const RenderBriefBody: React.FC<RenderBriefBodyProps> = ({ content }) => {
  if (!content) return null;

  const cleanContent = sanitizeSource(content);
  if (!cleanContent) return null;

  let parsedDoc: { blocks: BriefBlock[] } | null = null;

  try {
    parsedDoc = parseBriefBody(cleanContent);
  } catch (err) {
    console.error("[RenderBriefBody] Parse error:", err);
    parsedDoc = null;
  }

  const blocks = parsedDoc?.blocks ?? [];

  return (
    <View style={styles.bodyContainer}>
      {blocks.length > 0 ? (
        blocks.map((block, index) => {
          try {
            const rendered = renderBriefBlock(block, index);

            if (rendered == null) {
              // Use proper block text extraction
              const blockContent = getFallbackBlockText(block);
              const lines = fallbackLines(blockContent);
              if (lines.length === 0) return null;

              return (
                <View key={`fallback-${index}`} style={styles.fallbackPanel}>
                  <Text style={styles.fallbackKicker}>Fallback rendering</Text>
                  {lines.map((line, lineIndex) => (
                    <Text key={lineIndex} style={styles.rawText}>
                      {line}
                    </Text>
                  ))}
                </View>
              );
            }

            return (
              <View key={`${block.type}-${index}`} style={styles.bodySection}>
                {rendered}
              </View>
            );
          } catch (err) {
            console.error(`[RenderBriefBody] Block render error at index ${index}:`, err);
            const blockContent = getFallbackBlockText(block);
            const lines = fallbackLines(blockContent);
            if (lines.length === 0) return null;

            return (
              <View key={`error-fallback-${index}`} style={styles.fallbackPanel}>
                <Text style={styles.fallbackKicker}>Fallback rendering</Text>
                {lines.map((line, lineIndex) => (
                  <Text key={lineIndex} style={styles.rawText}>
                    {line}
                  </Text>
                ))}
              </View>
            );
          }
        })
      ) : (
        <View style={styles.fallbackPanel}>
          <Text style={styles.fallbackKicker}>Recovered body</Text>
          {fallbackLines(cleanContent).map((line, index) => (
            <Text key={index} style={styles.rawText}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.footerNote}>
        This brief is arranged for deliberate reading, disciplined interpretation,
        and governed action.
      </Text>
    </View>
  );
};

export default RenderBriefBody;