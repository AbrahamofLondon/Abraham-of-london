// scripts/pdf/build-ebook-manifest.ts
import { loadEbookSource } from "./load-ebook-source";
import { parseEbookBlocks } from "./parse-ebook-content";
import { logger } from "../../lib/logging";

export type TocItem = {
  label: string;
  page?: number;
  section?: string;
  isSubsection?: boolean;
  level?: number;
};

export type EbookManifest = {
  toc: TocItem[];
  metadata: {
    title: string;
    author: string;
    chapterCount: number;
    sourceWordCount: number;
    readingTime?: string;
    documentId?: string;
    version?: string;
    category?: string;
  };
};

function safeText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeHeadingLabel(input: string): string {
  return safeText(input)
    .replace(/\s+/g, " ")
    .replace(/\s+$/g, "");
}

function dedupeToc(items: TocItem[]): TocItem[] {
  const seen = new Set<string>();
  const out: TocItem[] = [];

  for (const item of items) {
    const label = normalizeHeadingLabel(item.label);
    if (!label) continue;

    const key = [
      label.toLowerCase(),
      item.section?.toLowerCase() || "",
      String(item.level || 0),
      item.isSubsection ? "1" : "0",
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      label,
      page: item.page,
      section: safeText(item.section) || undefined,
      isSubsection: Boolean(item.isSubsection),
      level: typeof item.level === "number" ? item.level : undefined,
    });
  }

  return out;
}

function extractHeadingsFromMarkdown(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = String(markdown || "").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ignore code fences
    if (line.startsWith("```")) continue;

    if (line.startsWith("# ")) {
      items.push({
        label: normalizeHeadingLabel(line.slice(2)),
        isSubsection: false,
        level: 1,
      });
      continue;
    }

    if (line.startsWith("## ")) {
      items.push({
        label: normalizeHeadingLabel(line.slice(3)),
        isSubsection: true,
        level: 2,
      });
      continue;
    }

    if (line.startsWith("### ")) {
      items.push({
        label: normalizeHeadingLabel(line.slice(4)),
        isSubsection: true,
        level: 3,
      });
    }
  }

  return items;
}

function detectSectionFromLabel(label: string): string | undefined {
  const normalized = normalizeHeadingLabel(label).toLowerCase();

  if (!normalized) return undefined;
  if (normalized.startsWith("introduction")) return "Introduction";
  if (normalized.startsWith("epilogue")) return "Closing";
  if (normalized.startsWith("institutional record")) return "Record";
  return undefined;
}

export function buildEbookManifest(slug: string): EbookManifest {
  const requestId = Math.random().toString(36).slice(2, 8);
  const source = loadEbookSource(slug);
  const blocks = parseEbookBlocks(source.content);

  logger.debug(`[Manifest:${requestId}] Building manifest`, {
    slug,
    title: source.title,
    blockCount: blocks.length,
  });

  const toc: TocItem[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "opening": {
        toc.push({
          label: "Prologue",
          section: "Frontmatter",
          isSubsection: false,
          level: 1,
        });
        break;
      }

      case "chapter": {
        const chapterLabel = block.numeral
          ? `${block.numeral}. ${block.title}`
          : block.title;

        toc.push({
          label: normalizeHeadingLabel(chapterLabel),
          section: detectSectionFromLabel(block.title),
          isSubsection: false,
          level: 1,
        });
        break;
      }

      case "markdown": {
        toc.push(...extractHeadingsFromMarkdown(block.markdown));
        break;
      }

      default:
        break;
    }
  }

  const cleanToc = dedupeToc(toc);

  const chapterCount = cleanToc.filter((item) => (item.level || 1) === 1).length;

  const manifest: EbookManifest = {
    toc: cleanToc,
    metadata: {
      title: source.title,
      author: source.author,
      chapterCount,
      sourceWordCount: source.wordCount,
      readingTime: source.readingTime,
      documentId: source.documentId,
      version: source.version,
      category: source.category,
    },
  };

  logger.info(`[Manifest:${requestId}] Manifest built`, {
    slug,
    tocItems: manifest.toc.length,
    chapterCount: manifest.metadata.chapterCount,
    documentId: manifest.metadata.documentId ?? null,
  });

  return manifest;
}