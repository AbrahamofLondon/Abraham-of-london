// lib/mdx-sanitize.ts
// Requires: dompurify, jsdom (server only usage)
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const isBrowser = typeof window !== "undefined";

const FORBID_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "style",
];

function stripDangerousUrlAttrs(el: Element) {
  // kill javascript:/data: in href/src
  const urlAttrs = ["href", "src", "xlink:href"];
  for (const name of urlAttrs) {
    const val = el.getAttribute(name);
    if (!val) continue;
    const v = val.trim().toLowerCase();
    if (v.startsWith("javascript:") || v.startsWith("data:") || v.startsWith("vbscript:")) {
      el.removeAttribute(name);
    }
  }

  // kill on* handlers
  for (const attr of Array.from(el.attributes)) {
    if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
  }
}

export function sanitizeMdxContent(content: string): string {
  if (!content || typeof content !== "string") return "";

  try {
    if (isBrowser) {
      // Browser: use DOMPurify directly
      const purify = createDOMPurify(window as any);
      return purify.sanitize(content, { FORBID_TAGS });
    }

    // Server: DOMPurify + JSDOM
    const dom = new JSDOM(`<!doctype html><body>${content}</body>`);
    const purify = createDOMPurify(dom.window as any);

    const cleaned = purify.sanitize(dom.window.document.body.innerHTML, { FORBID_TAGS });

    // Extra hardening: remove event handlers + dangerous URL schemes
    const doc = new JSDOM(`<!doctype html><body>${cleaned}</body>`).window.document;
    doc.querySelectorAll("*").forEach(stripDangerousUrlAttrs);

    return doc.body.innerHTML;
  } catch (e) {
    console.error("sanitizeMdxContent failed:", e);
    return "";
  }
}

