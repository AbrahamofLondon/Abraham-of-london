/**
 * Utility functions for sanitizing and processing MDX content
 * SAFE VERSION - Only removes truly dangerous content, preserves legitimate JSX/MDX
 */

import { JSDOM } from "jsdom";

/**
 * Sanitizes HTML-ish content by removing ONLY dangerous elements and attributes.
 * Preserves legitimate JSX/MDX components.
 */
export function sanitizeMdxContent(content: string): string {
  if (!content || typeof content !== "string") return "";

  try {
    // Only process if it looks like it contains HTML/XML-like tags
    if (!content.includes("<") && !content.includes(">")) {
      return content; // Plain text
    }

    const dom = new JSDOM(`<!doctype html><body>${content}</body>`, {
      contentType: "text/html",
    });
    const doc = dom.window.document;

    // Remove truly dangerous elements (conservative)
    const dangerousElements = doc.querySelectorAll(
      "script, iframe, object[type^='text/html'], embed[type^='text/html']"
    );

    dangerousElements.forEach((el: Element) => {
      const tagName = el.tagName.toLowerCase();

      if (tagName === "script") {
        el.remove();
        return;
      }

      if (tagName === "iframe") {
        const src = el.getAttribute("src") || "";
        if (/^(javascript:|data:|vbscript:)/i.test(src.trim())) {
          el.remove();
        }
        return;
      }

      // object/embed of html is dangerous by definition
      el.remove();
    });

    // Remove ONLY truly dangerous attributes
    const allElements = doc.querySelectorAll("*");
    allElements.forEach((el: Element) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (attr && isTrulyDangerousAttribute(attr.name, attr.value || "")) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.warn("MDX sanitization skipped (not HTML):", error);
    return content;
  }
}

/**
 * Back-compat alias - minimal processing only
 */
export function sanitizeBlogMdx(content: string): string {
  if (!content || typeof content !== "string") return "";
  return content.replace(/\r\n/g, "\n");
}

/**
 * Checks if an attribute is TRULY dangerous
 */
function isTrulyDangerousAttribute(attrName: string, attrValue: string): boolean {
  // Block standard HTML event handlers
  const isStandardEvent =
    /^on(click|load|error|submit|change|focus|blur|key|mouse|touch)/i.test(attrName);

  if (isStandardEvent && /^on\w+\s*$/i.test(attrName)) return true;

  // Block protocol-based attacks
  if (attrValue) {
    const v = attrValue.trim();
    if (/^javascript:/i.test(v)) return true;
    if (/^vbscript:/i.test(v)) return true;
    if (/^data:\s*text\/html/i.test(v)) return true;
    if (/^(mocha:|livescript:|fscommand:|seeksegmenttime:)/i.test(v)) return true;
  }

  return false;
}

/**
 * Extracts plain text from MDX content - SAFE version
 */
export function extractPlainTextFromMdx(content: string, maxLength: number = 200): string {
  if (!content || typeof content !== "string") return "";

  try {
    let plainText = content
      .replace(/```[\s\S]*?```/g, "[code block]")
      .replace(/`[^`]*`/g, "[code]")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "[image]")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]*>/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*\*|\*\*|\*/g, "")
      .replace(/~~/g, "")
      .replace(/_{2,}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .trim();

    if (maxLength > 0 && plainText.length > maxLength) {
      plainText = plainText.substring(0, maxLength).trim() + "...";
    }

    return plainText;
  } catch (error) {
    console.error("Error extracting plain text from MDX:", error);
    return "";
  }
}

export interface Heading {
  level: number;
  text: string;
  id?: string;
}

export function extractHeadingsFromMdx(content: string): Heading[] {
  if (!content || typeof content !== "string") return [];

  const headings: Heading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    if (!match[1] || !match[2]) continue;

    const level = match[1].length;
    const text = match[2].trim();

    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    headings.push({ level, text, id });
  }

  return headings;
}

export function extractImagesFromMdx(content: string): string[] {
  if (!content || typeof content !== "string") return [];

  const images: Set<string> = new Set();

  const mdImageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  let match: RegExpExecArray | null;

  while ((match = mdImageRegex.exec(content)) !== null) {
    if (!match[1]) continue;
    const url = match[1].trim();
    if (url && !url.startsWith("http") && !url.startsWith("//") && !url.startsWith("mailto:")) {
      images.add(url);
    }
  }

  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    if (!match[1]) continue;
    const url = match[1].trim();
    if (url && !url.startsWith("http") && !url.startsWith("//") && !url.startsWith("mailto:")) {
      images.add(url);
    }
  }

  return Array.from(images);
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMdxContent(content: string): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!content || typeof content !== "string") {
    result.isValid = false;
    result.errors.push("Content is empty or not a string");
    return result;
  }

  const xssPatterns = [
    /javascript:\s*[^)]/i,
    /data:\s*text\/html[^;]*;base64/i,
    /<\s*script[^>]*>/i,
    /<\s*iframe[^>]*>/i,
  ];

  xssPatterns.forEach((pattern, i) => {
    if (pattern.test(content)) {
      result.warnings.push(`Potential security pattern detected at check ${i + 1}`);
    }
  });

  return result;
}

export function generateExcerpt(content: string, length: number = 160): string {
  if (!content || typeof content !== "string") return "";

  const plainText = extractPlainTextFromMdx(content, 0);
  if (plainText.length <= length) return plainText;

  const truncated = plainText.substring(0, length);

  const lastPeriod = truncated.lastIndexOf(". ");
  const lastQuestion = truncated.lastIndexOf("? ");
  const lastExclamation = truncated.lastIndexOf("! ");
  const lastSpace = truncated.lastIndexOf(" ");

  const cutIndex = Math.max(lastPeriod, lastQuestion, lastExclamation, lastSpace);

  if (cutIndex > length * 0.3) {
    return truncated.substring(0, cutIndex).trim() + "...";
  }

  return truncated.trim() + "...";
}

export function containsJsx(content: string): boolean {
  if (!content) return false;

  const jsxPatterns = [
    /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?>/,
    /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?\/>/,
    /{\s*[^{}]*\s*}/,
  ];

  return jsxPatterns.some((pattern) => pattern.test(content));
}

export function countWords(content: string): number {
  if (!content || typeof content !== "string") return 0;
  const plainText = extractPlainTextFromMdx(content, 0);
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
}

export default {
  sanitizeMdxContent,
  sanitizeBlogMdx,
  extractPlainTextFromMdx,
  extractHeadingsFromMdx,
  extractImagesFromMdx,
  validateMdxContent,
  generateExcerpt,
  containsJsx,
  countWords,
};