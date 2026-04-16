import * as React from "react";
import { escapeHtml, safeString } from "./utils";

export function renderMarkdownLikeToHtml(content: string): string {
  let processed = safeString(content).replace(/\r\n/g, "\n").trim();
  processed = escapeHtml(processed);

  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="smdx-link">$1</a>',
  );

  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  processed = processed.replace(/^###### (.+)$/gm, '<h6 class="smdx-h6">$1</h6>');
  processed = processed.replace(/^##### (.+)$/gm, '<h5 class="smdx-h5">$1</h5>');
  processed = processed.replace(/^#### (.+)$/gm, '<h4 class="smdx-h4">$1</h4>');
  processed = processed.replace(/^### (.+)$/gm, '<h3 class="smdx-h3">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="smdx-h2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="smdx-h1">$1</h1>');

  const blocks = processed.split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      if (/^<h[1-6]/.test(trimmed)) return trimmed;
      if (/^---$/.test(trimmed)) return '<hr class="smdx-hr" />';

      if (/^&gt;/.test(trimmed)) {
        const quoteBody = trimmed
          .split("\n")
          .map((line) => line.replace(/^&gt;\s?/, "").trim())
          .join("<br />");

        return `<blockquote class="smdx-blockquote">${quoteBody}</blockquote>`;
      }

      if (/^[-*+]\s+/m.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .map((line) => line.replace(/^[-*+]\s+/, "").trim())
          .filter(Boolean)
          .map((item) => `<li class="smdx-li">${item}</li>`)
          .join("");

        return `<ul class="smdx-ul">${items}</ul>`;
      }

      if (/^\d+\.\s+/m.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .map((line) => line.replace(/^\d+\.\s+/, "").trim())
          .filter(Boolean)
          .map((item) => `<li class="smdx-oli">${item}</li>`)
          .join("");

        return `<ol class="smdx-ol">${items}</ol>`;
      }

      return `<p class="smdx-p">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

export function RawMarkdownFallback({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const html = React.useMemo(() => renderMarkdownLikeToHtml(content), [content]);

  return (
    <div
      className={className ?? "smdx-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
