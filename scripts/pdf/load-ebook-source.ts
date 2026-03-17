// scripts/pdf/load-ebook-source.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { logger } from "../../lib/logging";

export type EbookSource = {
  slug: string;
  sourcePath: string;
  title: string;
  subtitle?: string;
  description?: string;
  tier: string;
  author: string;
  date?: string;
  version?: string;
  status?: string;
  category?: string;
  readingTime?: string;
  format?: string;
  documentId?: string;
  content: string;
  wordCount: number;
};

type FrontmatterRecord = Record<string, unknown>;

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function safeText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredText(
  data: FrontmatterRecord,
  field: string,
  fallback?: string,
): string {
  const value = safeText(data[field]);
  if (value) return value;
  if (fallback) return fallback;
  throw new Error(`Missing required frontmatter field: ${field}`);
}

function normalizeTier(value: unknown): string {
  const raw = safeText(value)?.toLowerCase() || "public";

  switch (raw) {
    case "public":
    case "member":
    case "inner-circle":
    case "architect":
    case "owner":
      return raw;
    case "inner_circle":
      return "inner-circle";
    default:
      return "public";
  }
}

function normalizeDate(value: unknown): string | undefined {
  const raw = safeText(value);
  if (!raw) return undefined;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return raw;
}

function countWords(content: string): number {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

function inferReadingTime(wordCount: number): string | undefined {
  if (wordCount <= 0) return undefined;
  const minutes = Math.max(1, Math.round(wordCount / 225));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function normalizeContent(content: string): string {
  return content.replace(/\r\n/g, "\n").trim();
}

export function loadEbookSource(slug: string): EbookSource {
  const requestId = Math.random().toString(36).slice(2, 8);
  const sourcePath = abs(`scripts/pdf/print-sources/${slug}.print.md`);

  logger.debug(`[EbookSource:${requestId}] Loading source`, {
    slug,
    sourcePath,
  });

  if (!fs.existsSync(sourcePath)) {
    logger.error(`[EbookSource:${requestId}] Source file not found`, {
      slug,
      sourcePath,
    });
    throw new Error(`Missing ebook source: ${slug}.print.md (tried: ${sourcePath})`);
  }

  try {
    const raw = fs.readFileSync(sourcePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as FrontmatterRecord;

    const content = normalizeContent(parsed.content);
    const wordCount = countWords(content);

    const title = requiredText(data, "title", slug);
    const author = requiredText(data, "author", "Abraham of London");

    const readingTime =
      safeText(data.readingTime) || inferReadingTime(wordCount);

    const source: EbookSource = {
      slug,
      sourcePath,
      title,
      subtitle: safeText(data.subtitle),
      description: safeText(data.description),
      tier: normalizeTier(data.tier),
      author,
      date: normalizeDate(data.date),
      version: safeText(data.version),
      status: safeText(data.status),
      category: safeText(data.category),
      readingTime,
      format: safeText(data.format),
      documentId: safeText(data.documentId),
      content,
      wordCount,
    };

    logger.info(`[EbookSource:${requestId}] Loaded successfully`, {
      slug: source.slug,
      title: source.title,
      author: source.author,
      tier: source.tier,
      wordCount: source.wordCount,
      readingTime: source.readingTime ?? null,
      documentId: source.documentId ?? null,
      contentLength: source.content.length,
    });

    return source;
  } catch (error) {
    logger.error(`[EbookSource:${requestId}] Failed to load source`, {
      slug,
      sourcePath,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    });

    throw error instanceof Error
      ? error
      : new Error(`Failed to load ebook source for slug: ${slug}`);
  }
}