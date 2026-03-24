/* lib/pdf/renderers/renderBriefBody.tsx — INSTITUTIONAL BODY ORCHESTRATOR V3.2 */

import React from "react";
import { View, StyleSheet, Text } from "@react-pdf/renderer";

import { parseBriefBody } from "./brief-parser";
import { renderBriefBlock } from "./brief-blocks";

/* --------------------------------------------------------------------------
   UTILITY & SANITIZATION HELPERS
-------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Specifically cleans MDX artifacts and ensures the surrender framework
 * formatting (e.g., [Surrender](/lexicon/surrender)) is preserved or cleaned.
 */
function sanitizeSource(content: string): string {
  let input = safeString(content);
  if (!input) return "";

  return input
    // Remove MDX Imports/Exports
    .split("\n")
    .filter(line => !/^(import|export)\s+/.test(line.trim()))
    .join("\n")
    // Strip Jsx tags but keep content inside known wrappers if needed
    .replace(/<BriefAlert[\s\S]*?>([\s\S]*?)<\/BriefAlert>/gi, "\n> ALERT: $1\n")
    .replace(/<[^>]+>/g, "")
    // Handle specific lexicon links from your image: [Text](link) -> Text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") 
    .trim();
}

/* --------------------------------------------------------------------------
   STYLING
-------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bodyContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  // Fallback styling for unexpected raw text nodes
  rawText: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    color: "#121416"
  }
});

/* --------------------------------------------------------------------------
   EXTRACTION LOGIC (For Frontmatter Panels)
-------------------------------------------------------------------------- */

export function extractExecutiveSummary(content: string): string | null {
  const sanitized = sanitizeSource(content);
  const match = sanitized.match(/#+\s+Executive Summary\s*\n([\s\S]*?)(?=\n#+|$)/i);
  return match ? match[1].trim() : null;
}

export function extractKeyJudgements(content: string): string[] {
  const sanitized = sanitizeSource(content);
  const match = sanitized.match(/#+\s+(?:Key Judgements|Judgements)\s*\n([\s\S]*?)(?=\n#+|$)/i);
  if (!match) return [];
  
  return match[1]
    .split("\n")
    .filter(line => /^[-*•]\s+/.test(line.trim()))
    .map(line => line.replace(/^[-*•]\s+/, "").trim());
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
  
  // Use the system's parser to turn the string into an array of BriefBlocks
  const parsedDoc = parseBriefBody(cleanContent);

  return (
    <View style={styles.bodyContainer}>
      {parsedDoc.blocks.map((block, index) => {
        try {
          // renderBriefBlock handles Headings, Lists, Paragraphs, and Tables
          return (
            <React.Fragment key={`${block.type}-${index}`}>
              {renderBriefBlock(block, index)}
            </React.Fragment>
          );
        } catch (err) {
          // Robustness: If a complex block fails, render as simple text
          return <Text key={index} style={styles.rawText}>{String(block.content || "")}</Text>;
        }
      })}
    </View>
  );
};

export default RenderBriefBody;