/**
 * Utility functions for sanitizing and processing MDX content
 *
 * Notes:
 * - MDX is not pure HTML. We treat "sanitization" as best-effort.
 * - This file must be safe for server-only usage. Do not import in edge runtime.
 */

import { JSDOM } from "jsdom";

/**
 * Sanitizes HTML-ish content by removing potentially unsafe elements and attributes.
 * If content is not valid HTML, we fall back safely.
 */
export function sanitizeMdxContent(content: string): string {
  if (!content || typeof content !== "string") return "";

  try {
    // JSDOM expects HTML. MDX may contain JSX/Markdown — still OK as best-effort.
    const dom = new JSDOM(`<!doctype html><body>${content}</body>`);
    const doc = dom.window.document;

    // Remove unsafe elements
    const unsafeElements = doc.querySelectorAll(
      "script, iframe, object, embed, form, input, button, select, textarea, style"
    );
    unsafeElements.forEach((el) => el.remove());

    // Remove unsafe attributes
    const allElements = doc.querySelectorAll("*");
    allElements.forEach((el) => {
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (isUnsafeAttribute(attr.name, attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.error("Error sanitizing MDX content:", error);
    return escapeHtml(content);
  }
}

/**
 * Back-compat alias expected by pages/blog/[slug].tsx
 * Keep it conservative: blog MDX should preserve structure, so do minimal changes.
 */
export function sanitizeBlogMdx(content: string): string {
  // If you want strict sanitization for blog, use sanitizeMdxContent(content)
  // For now, avoid breaking MDX/JSX by over-sanitizing:
  return (content ?? "").replace(/\r\n/g, "\n");
}

/**
 * Checks if an attribute is unsafe.
 * Important: check both name and value for protocol-based payloads.
 */
function isUnsafeAttribute(attrName: string, attrValue?: string): boolean {
  // Unsafe attribute names (event handlers etc.)
  const namePatterns = [
    /^on/i, // onclick, onload...
  ];

  // Unsafe attribute values (javascript:, data:text/html, vbscript, etc.)
  const valuePatterns = [
    /^\s*javascript:/i,
    /^\s*data:\s*text\/html/i,
    /^\s*vbscript:/i,
    /^\s*mocha:/i,
    /^\s*livescript:/i,
    /^\s*fscommand:/i,
    /^\s*seeksegmenttime:/i,
  ];

  if (namePatterns.some((p) => p.test(attrName))) return true;

  if (typeof attrValue === "string" && valuePatterns.some((p) => p.test(attrValue))) {
    return true;
  }

  return false;
}

/**
 * Basic HTML escaping
 */
function escapeHtml(text: string): string {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extracts plain text from MDX content
 */
export function extractPlainTextFromMdx(content: string, maxLength: number = 200): string {
  if (!content || typeof content !== "string") return "";

  try {
    let plainText = content
      .replace(/```[\s\S]*?```/g, " ") // Remove code blocks first
      .replace(/`[^`]*`/g, " ") // Remove inline code
      .replace(/<[^>]*>/g, " ") // Remove HTML tags
      .replace(/\{[^}]*\}/g, " ") // Remove JSX expressions
      .replace(/#{1,6}\s+/g, "") // Remove headings
      .replace(/\*\*\*|\*\*|\*/g, "") // Remove bold/italic markers
      .replace(/~~/g, "") // Remove strikethrough
      .replace(/\n/g, " ") // Replace newlines
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

/**
 * Extracts headings from MDX content
 */
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

/**
 * Extracts image URLs from MDX content
 */
export function extractImagesFromMdx(content: string): string[] {
  if (!content || typeof content !== "string") return [];

  const images: string[] = [];

  // Markdown: ![alt](src "title")
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = mdImageRegex.exec(content)) !== null) {
    const url = match[1].split(" ")[0];
    if (url && !url.startsWith("http") && !url.startsWith("//")) {
      images.push(url);
    }
  }

  // HTML/JSX: <img src="..." />
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    const url = match[1];
    if (url && !url.startsWith("http") && !url.startsWith("//")) {
      images.push(url);
    }
  }

  return [...new Set(images)];
}

/**
 * Validates MDX content structure
 */
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

  const jsxTags = content.match(/<([A-Z][A-Za-z0-9]*)(?:\s+[^>]*)?>/g) || [];
  const closingTags = content.match(/<\/([A-Z][A-Za-z0-9]*)>/g) || [];

  const openedTags = jsxTags
    .map((tag) => tag.match(/<([A-Z][A-Za-z0-9]*)/)?.[1] ?? "")
    .filter(Boolean);

  const closedTags = closingTags
    .map((tag) => tag.match(/<\/([A-Z][A-Za-z0-9]*)>/)?.[1] ?? "")
    .filter(Boolean);

  openedTags.forEach((tag) => {
    if (!closedTags.includes(tag)) result.warnings.push(`Unclosed JSX tag: <${tag}>`);
  });

  const xssPatterns = [/javascript:/i, /data:text\/html/i, /on\w+\s*=/i, /<\s*script/i, /<\s*iframe/i];
  if (xssPatterns.some((p) => p.test(content))) {
    result.warnings.push("Potential XSS pattern detected");
  }

  const relativeImages = extractImagesFromMdx(content);
  relativeImages.forEach((img) => {
    if (img.startsWith("./") || img.startsWith("../")) {
      result.warnings.push(`Relative image path found: ${img}`);
    }
  });

  return result;
}

/**
 * Generates excerpt from MDX content
 */
export function generateExcerpt(content: string, length: number = 160): string {
  if (!content || typeof content !== "string") return "";

  const plainText = extractPlainTextFromMdx(content, 0);
  if (plainText.length <= length) return plainText;

  const truncated = plainText.substring(0, length);
  const lastPeriod = truncated.lastIndexOf(". ");
  const lastQuestion = truncated.lastIndexOf("? ");
  const lastExclamation = truncated.lastIndexOf("! ");

  const cutIndex = Math.max(lastPeriod, lastQuestion, lastExclamation);
  if (cutIndex > length * 0.5) return truncated.substring(0, cutIndex + 1) + "..";

  return truncated.trim() + "...";
}

/**
 * Strips MDX/JSX components from content
 */
export function stripMdxComponents(content: string): string {
  if (!content || typeof content !== "string") return "";

  return content
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>.*?<\/[A-Z][A-Za-z0-9]*>/gs, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?\/>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/import\s+.*?\s+from\s+['"][^'"]+['"]/g, "")
    .replace(/export\s+(?:const|function|default)\s+[^;]+;/g, "");
}

export default {
  sanitizeMdxContent,
  sanitizeBlogMdx,
  extractPlainTextFromMdx,
  extractHeadingsFromMdx,
  extractImagesFromMdx,
  validateMdxContent,
  generateExcerpt,
  stripMdxComponents,
};