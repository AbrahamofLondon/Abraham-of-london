// scripts/pdf/compile-ebook-body.ts
import { marked } from "marked";
import { parseEbookBlocks } from "./parse-ebook-content";
import { renderOpeningPage } from "./templates/opening-template";
import { renderChapterOpener } from "./templates/chapter-template";
import { renderCallout } from "./templates/components/callout";
import { renderPullQuote } from "./templates/components/pullquote";
import { renderFigureBlock } from "./templates/figure-template";
import { logger } from "../../lib/logging";

export type CompiledEbookBody = {
  openingHtml: string | null;
  bodyHtml: string;
  stats: {
    totalBlocks: number;
    openingCount: number;
    chapterCount: number;
    calloutCount: number;
    pullquoteCount: number;
    figureCount: number;
    markdownCount: number;
  };
  metadata: {
    wordCount: number;
    estimatedReadTimeMinutes: number;
  };
};

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(input: string): string {
  return String(input || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function countWords(text: string): number {
  const cleaned = normalizeText(text).replace(/\s+/g, " ");
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

function estimateReadingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 225));
}

async function renderInlineMarkdown(text: string): Promise<string> {
  const normalized = normalizeText(text);
  if (!normalized) return "";
  return marked.parseInline(normalized);
}

async function renderMarkdownBlock(markdown: string): Promise<string> {
  const normalized = normalizeText(markdown);
  if (!normalized) return "";

  try {
    const html = await marked.parse(normalized);

    return `
      <section class="ebook-content-block" style="
        margin: 0 0 18px 0;
      ">
        ${html}
      </section>
    `;
  } catch (error) {
    logger.error("[Ebook] Failed to parse markdown block", {
      error: error instanceof Error ? error.message : String(error),
      preview: normalized.slice(0, 160),
    });

    return `
      <section style="
        margin: 18px 0;
        padding: 16px 18px;
        border: 1px solid #c53030;
        background: #fff5f5;
        color: #9b2c2c;
        border-radius: 4px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.6;
      ">
        <strong>Markdown render error</strong>
        <div style="margin-top: 10px; white-space: pre-wrap;">${escapeHtml(normalized)}</div>
      </section>
    `;
  }
}

function renderBlockError(label: string): string {
  return `
    <section style="
      margin: 18px 0;
      padding: 16px 18px;
      border: 1px solid #c53030;
      background: #fff5f5;
      color: #9b2c2c;
      border-radius: 4px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.6;
    ">
      <strong>Render error:</strong> ${escapeHtml(label)}
    </section>
  `;
}

/**
 * Renders a subtle divider between chapters only.
 * Never used within a chapter's content.
 */
function renderChapterDivider(): string {
  return `
    <div style="
      margin: 48px 0 24px 0;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #b8923f 20%, 
        #b8923f 80%, 
        transparent 100%
      );
      width: 30%;
      margin-left: auto;
      margin-right: auto;
    "></div>
  `;
}

export async function compileEbookBody(
  markdown: string,
): Promise<CompiledEbookBody> {
  const startedAt = Date.now();
  const requestId = Math.random().toString(36).slice(2, 8);
  const normalizedMarkdown = normalizeText(markdown);

  if (!normalizedMarkdown) {
    logger.warn(`[Ebook:${requestId}] Empty markdown provided`);

    return {
      openingHtml: null,
      bodyHtml: "",
      stats: {
        totalBlocks: 0,
        openingCount: 0,
        chapterCount: 0,
        calloutCount: 0,
        pullquoteCount: 0,
        figureCount: 0,
        markdownCount: 0,
      },
      metadata: {
        wordCount: 0,
        estimatedReadTimeMinutes: 1,
      },
    };
  }

  try {
    const blocks = parseEbookBlocks(normalizedMarkdown);

    const htmlParts: string[] = [];
    let openingHtml: string | null = null;
    let totalWordCount = 0;
    
    // Track if we've encountered the first chapter
    let firstChapterProcessed = false;

    const stats = {
      totalBlocks: blocks.length,
      openingCount: 0,
      chapterCount: 0,
      calloutCount: 0,
      pullquoteCount: 0,
      figureCount: 0,
      markdownCount: 0,
    };

    for (const block of blocks) {
      try {
        switch (block.type) {
          case "opening": {
            const renderedOpening = renderOpeningPage(block.text);
            openingHtml = renderedOpening || null;
            stats.openingCount += 1;
            totalWordCount += countWords(block.text);
            break;
          }

          case "chapter": {
            // ✅ Only add divider BEFORE this chapter if it's NOT the first chapter
            if (firstChapterProcessed) {
              htmlParts.push(renderChapterDivider());
            }
            
            htmlParts.push(
              renderChapterOpener({
                numeral: block.numeral,
                title: block.title,
                intro: block.intro,
              }),
            );

            stats.chapterCount += 1;
            totalWordCount += countWords(block.title);
            totalWordCount += countWords(block.intro || "");
            
            firstChapterProcessed = true;
            break;
          }

          case "callout": {
            const bodyHtml = await renderInlineMarkdown(block.body);

            htmlParts.push(
              renderCallout({
                label: block.label,
                body: bodyHtml,
              }),
            );

            stats.calloutCount += 1;
            totalWordCount += countWords(block.label);
            totalWordCount += countWords(block.body);
            break;
          }

          case "pullquote": {
            const quoteHtml = await renderInlineMarkdown(block.text);

            htmlParts.push(renderPullQuote(quoteHtml));

            stats.pullquoteCount += 1;
            totalWordCount += countWords(block.text);
            break;
          }

          case "figure": {
            htmlParts.push(
              renderFigureBlock({
                title: block.title,
                body: block.body,
              }),
            );

            stats.figureCount += 1;
            totalWordCount += countWords(block.title);
            totalWordCount += countWords(block.body);
            break;
          }

          case "markdown": {
            if (normalizeText(block.markdown)) {
              htmlParts.push(await renderMarkdownBlock(block.markdown));
              stats.markdownCount += 1;
              totalWordCount += countWords(block.markdown);
            }
            break;
          }

          default: {
            const exhaustive: never = block;
            logger.warn(`[Ebook:${requestId}] Unknown block type`, {
              block: exhaustive,
            });
          }
        }
      } catch (blockError) {
        logger.error(`[Ebook:${requestId}] Error rendering block`, {
          blockType: block.type,
          error: blockError instanceof Error ? blockError.message : String(blockError),
        });

        htmlParts.push(renderBlockError(block.type));
      }
    }

    const estimatedReadTimeMinutes = estimateReadingTimeMinutes(totalWordCount);
    const durationMs = Date.now() - startedAt;

    logger.info(`[Ebook:${requestId}] Compilation complete`, {
      durationMs,
      wordCount: totalWordCount,
      estimatedReadTimeMinutes,
      stats,
    });

    return {
      openingHtml,
      bodyHtml: htmlParts.join("\n\n"),
      stats,
      metadata: {
        wordCount: totalWordCount,
        estimatedReadTimeMinutes,
      },
    };
  } catch (error) {
    logger.error(`[Ebook:${requestId}] Fatal compilation error`, {
      error: error instanceof Error ? error.message : String(error),
      preview: normalizedMarkdown.slice(0, 220),
    });

    const wordCount = countWords(normalizedMarkdown);

    return {
      openingHtml: null,
      bodyHtml: `
        <section style="
          padding: 34px;
          border: 2px solid #c53030;
          background: #fff5f5;
          color: #9b2c2c;
          border-radius: 8px;
          text-align: center;
          font-family: Arial, Helvetica, sans-serif;
        ">
          <h2 style="margin: 0 0 12px; font-size: 22px;">Content Compilation Error</h2>
          <p style="margin: 0 0 8px; line-height: 1.6;">
            The manuscript could not be compiled into book-ready HTML.
          </p>
          <p style="margin: 0; font-size: 12px; color: #742a2a;">
            Error ID: ${escapeHtml(requestId)}
          </p>
        </section>
      `,
      stats: {
        totalBlocks: 0,
        openingCount: 0,
        chapterCount: 0,
        calloutCount: 0,
        pullquoteCount: 0,
        figureCount: 0,
        markdownCount: 0,
      },
      metadata: {
        wordCount,
        estimatedReadTimeMinutes: estimateReadingTimeMinutes(wordCount),
      },
    };
  }
}