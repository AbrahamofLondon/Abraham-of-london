import { safeString } from "./utils";

export function stripInlineJsxProps(input: string): string {
  return input.replace(/\s+[A-Za-z_:][-A-Za-z0-9_:.]*=(\{[^}]*\}|"[^"]*"|'[^']*')/g, "");
}

export function transformRawMdxToMarkdownLike(input: string): string {
  let s = safeString(input).replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  s = s.replace(/^\s*import\s.+?;?\s*$/gm, "");
  s = s.replace(/^\s*export\s.+?;?\s*$/gm, "");

  s = s.replace(/^\s*<Callout\b([^>]*)>\s*$/gm, (_m, attrs: string) => {
    const titleMatch = attrs.match(/\btitle=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/);
    const title =
      titleMatch?.[1] ||
      titleMatch?.[2] ||
      titleMatch?.[3] ||
      titleMatch?.[4] ||
      titleMatch?.[5] ||
      "Callout";
    return `> **${title}**\n>`;
  });

  s = s.replace(/^\s*<\/Callout>\s*$/gm, "");
  s = s.replace(/^\s*<SectionBreak\s*\/>\s*$/gm, "\n---\n");

  s = s.replace(/^\s*<PullQuote\b([^>]*)>\s*$/gm, (_m, attrs: string) => {
    const textMatch = attrs.match(/\bquote=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/);
    const text =
      textMatch?.[1] ||
      textMatch?.[2] ||
      textMatch?.[3] ||
      textMatch?.[4] ||
      textMatch?.[5] ||
      "";
    return text ? `> *${text}*` : "";
  });

  s = s.replace(/^\s*<\/PullQuote>\s*$/gm, "");
  s = s.replace(/^\s*<Blockquote>\s*$/gm, "> ");
  s = s.replace(/^\s*<\/Blockquote>\s*$/gm, "");

  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*>\s*$/gm, "");
  s = s.replace(/^\s*<\/(div|section|article|span)>\s*$/gm, "");
  s = s.replace(/^\s*<div\b[^>]*id=["']([^"']+)["'][^>]*\/>\s*$/gm, "\n---\n");
  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*\/>\s*$/gm, "");

  s = s.replace(/^\s*\[Link\]\s*$/gm, "**Link**");
  s = s.replace(/^\s*\[Rule\]\s*$/gm, "---");

  s = s.replace(/^\s*<([A-Z][A-Za-z0-9._-]*)\b([^>]*)\/>\s*$/gm, (_m, tag: string) => `**[${tag}]**`);
  s = s.replace(/^\s*<([A-Z][A-Za-z0-9._-]*)\b([^>]*)>\s*$/gm, (_m, tag: string) => `**[${tag}]**`);
  s = s.replace(/^\s*<\/([A-Z][A-Za-z0-9._-]*)>\s*$/gm, "");

  s = s.replace(/^\s*\{\s*\/\*[\s\S]*?\*\/\s*\}\s*$/gm, "");
  s = s.replace(/^\s*\{[^{}\n]*\}\s*$/gm, "");

  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}
