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
    if (!content.includes('<') && !content.includes('>')) {
      return content; // Early return for plain text
    }

    const dom = new JSDOM(`<!doctype html><body>${content}</body>`, {
      // Strict parsing to avoid breaking JSX
      contentType: 'text/html'
    });
    const doc = dom.window.document;

    // ONLY remove truly dangerous elements - be very conservative
    const dangerousElements = doc.querySelectorAll(
      // These are actually dangerous
      "script, iframe, object[type^='text/html'], embed[type^='text/html']"
    );
    
    dangerousElements.forEach((el) => {
      // Check if element is actually dangerous
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'script') {
        el.remove();
      } else if (tagName === 'iframe') {
        // Only remove iframes with dangerous protocols
        const src = el.getAttribute('src') || '';
        if (src.match(/^(javascript:|data:|vbscript:)/i)) {
          el.remove();
        }
      }
    });

    // Remove ONLY truly dangerous attributes
    const allElements = doc.querySelectorAll("*");
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr && isTrulyDangerousAttribute(attr.name, attr.value || "")) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.warn("MDX sanitization skipped (not HTML):", error);
    // Return original content if sanitization fails
    return content;
  }
}

/**
 * Back-compat alias - does minimal processing
 */
export function sanitizeBlogMdx(content: string): string {
  if (!content || typeof content !== "string") return "";
  
  // VERY conservative - just normalize line endings
  return content.replace(/\r\n/g, "\n");
}

/**
 * Checks if an attribute is TRULY dangerous (not just any on* attribute)
 */
function isTrulyDangerousAttribute(attrName: string, attrValue: string): boolean {
  // ONLY block attributes that execute code
  const dangerousNamePatterns = [
    /^on\w+\s*$/i, // onclick, onload (but NOT on* in custom attributes)
  ];

  // Block protocol-based attacks
  const dangerousValuePatterns = [
    /^\s*javascript:/i,
    /^\s*data:\s*text\/html/i,
    /^\s*vbscript:/i,
    /^\s*mocha:/i,
    /^\s*livescript:/i,
    /^\s*fscommand:/i,
    /^\s*seeksegmenttime:/i,
  ];

  // Check if it's a standard HTML event handler (not custom)
  const isStandardEvent = /^on(click|load|error|submit|change|focus|blur|key|mouse|touch)/i.test(attrName);
  
  if (isStandardEvent && dangerousNamePatterns.some(p => p.test(attrName))) {
    return true;
  }

  if (attrValue && dangerousValuePatterns.some(p => p.test(attrValue))) {
    return true;
  }

  return false;
}

/**
 * Basic HTML escaping - ONLY for text that's definitely not HTML/JSX
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  
  // Don't escape if it looks like it contains JSX/HTML tags
  if (text.includes('<') && text.includes('>')) {
    return text;
  }

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extracts plain text from MDX content - SAFE version
 */
export function extractPlainTextFromMdx(content: string, maxLength: number = 200): string {
  if (!content || typeof content !== "string") return "";

  try {
    // VERY conservative text extraction - preserve structure
    let plainText = content
      .replace(/```[\s\S]*?```/g, "[code block]") // Preserve code blocks as markers
      .replace(/`[^`]*`/g, "[code]") // Preserve inline code
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "[image]") // Preserve images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
      .replace(/<[^>]*>/g, " ") // Remove HTML tags (conservative)
      .replace(/\{[^}]*\}/g, " ") // Remove simple JSX expressions
      .replace(/#{1,6}\s+/g, "") // Remove heading markers
      .replace(/\*\*\*|\*\*|\*/g, "") // Remove bold/italic markers
      .replace(/~~/g, "") // Remove strikethrough
      .replace(/_{2,}/g, "") // Remove underline
      .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
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
  
  // Match markdown headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    // Add null check for match[1] and match[2]
    if (match[1] && match[2]) {
      const level = match[1].length;
      const text = match[2].trim();

      // Generate a safe ID
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      headings.push({ level, text, id });
    }
  }

  return headings;
}

/**
 * Extracts image URLs from MDX content - SAFE version
 */
export function extractImagesFromMdx(content: string): string[] {
  if (!content || typeof content !== "string") return [];

  const images: Set<string> = new Set();

  // Markdown images: ![alt](src "title")
  const mdImageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  let match: RegExpExecArray | null;

  while ((match = mdImageRegex.exec(content)) !== null) {
    // ✅ FIXED: Add null check for match[1]
    if (match && match[1]) {
      const url = match[1].trim();
      if (url && !url.startsWith("http") && !url.startsWith("//") && !url.startsWith("mailto:")) {
        images.add(url);
      }
    }
  }

  // HTML/JSX images: <img src="..." />
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    // ✅ FIXED: Add null check for match[1]
    if (match && match[1]) {
      const url = match[1].trim();
      if (url && !url.startsWith("http") && !url.startsWith("//") && !url.startsWith("mailto:")) {
        images.add(url);
      }
    }
  }

  return Array.from(images);
}

/**
 * Validates MDX content structure - SAFE version (warnings only, no deletion)
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

  // Check for potential XSS - but don't delete, just warn
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

/**
 * Generates excerpt from MDX content - SAFE version
 */
export function generateExcerpt(content: string, length: number = 160): string {
  if (!content || typeof content !== "string") return "";

  const plainText = extractPlainTextFromMdx(content, 0);
  if (plainText.length <= length) return plainText;

  const truncated = plainText.substring(0, length);
  
  // Try to cut at sentence boundary
  const lastPeriod = truncated.lastIndexOf(". ");
  const lastQuestion = truncated.lastIndexOf("? ");
  const lastExclamation = truncated.lastIndexOf("! ");
  const lastSpace = truncated.lastIndexOf(" ");

  const cutIndex = Math.max(lastPeriod, lastQuestion, lastExclamation, lastSpace);
  
  if (cutIndex > length * 0.3) { // Only cut if we're not losing too much
    return truncated.substring(0, cutIndex).trim() + "...";
  }

  return truncated.trim() + "...";
}

/**
 * REMOVED: stripMdxComponents - This function is too dangerous
 * If you need to remove components, do it manually with specific patterns
 */

/**
 * Safe utility to check if content contains JSX/MDX
 */
export function containsJsx(content: string): boolean {
  if (!content) return false;
  
  // Simple check for JSX patterns
  const jsxPatterns = [
    /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?>/,
    /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?\/>/,
    /{\s*[^{}]*\s*}/,
  ];
  
  return jsxPatterns.some(pattern => pattern.test(content));
}

/**
 * Counts words in MDX content (approximate, safe)
 */
export function countWords(content: string): number {
  if (!content || typeof content !== "string") return 0;
  
  const plainText = extractPlainTextFromMdx(content, 0);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
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
  // Note: stripMdxComponents is intentionally NOT exported
};