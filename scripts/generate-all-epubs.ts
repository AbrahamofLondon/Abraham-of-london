// scripts/generate-all-epubs.ts
import { EPub } from "epub-gen-memory";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

type Chapter = {
  title: string;
  content: string;
};

type SourceFile = {
  slug: string;
  sourcePath: string;
};

type BuildSuccess = {
  slug: string;
  sourcePath: string;
  outputPath: string;
  sizeBytes: number;
  title: string;
  author: string;
};

type BuildFailure = {
  slug: string;
  sourcePath: string;
  error: string;
};

type BuildManifestItem = {
  slug: string;
  title: string;
  author: string;
  sourcePath: string;
  outputPath: string;
  publicHref: string;
  sizeBytes: number;
  generatedAt: string;
};

type BuildManifest = {
  generatedAt: string;
  count: number;
  items: BuildManifestItem[];
};

const PRINT_SOURCE_DIR = path.join(
  process.cwd(),
  "scripts",
  "pdf",
  "print-sources",
);

const OUTPUT_DIR = path.join(process.cwd(), "public", "epubs");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "epub-manifest.json");

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMarkdownContent(markdown: string): string {
  return String(markdown || "").replace(/\r\n/g, "\n").trim();
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function discoverPrintSources(): SourceFile[] {
  if (!fs.existsSync(PRINT_SOURCE_DIR)) {
    throw new Error(`Print source directory not found: ${PRINT_SOURCE_DIR}`);
  }

  return fs
    .readdirSync(PRINT_SOURCE_DIR)
    .filter((name) => name.toLowerCase().endsWith(".print.md"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      slug: name.replace(/\.print\.md$/i, ""),
      sourcePath: path.join(PRINT_SOURCE_DIR, name),
    }));
}

function splitIntoChapters(markdown: string, fallbackTitle: string): Chapter[] {
  const normalized = normalizeMarkdownContent(markdown);

  if (!normalized) {
    return [
      {
        title: fallbackTitle,
        content: `<h1>${escapeHtml(fallbackTitle)}</h1><p>No content available.</p>`,
      },
    ];
  }

  const lines = normalized.split("\n");
  const chapters: Array<{ title: string; markdown: string[] }> = [];

  let currentTitle = fallbackTitle;
  let currentLines: string[] = [];

  const pushCurrent = () => {
    const joined = currentLines.join("\n").trim();
    if (!joined) return;

    chapters.push({
      title: currentTitle || fallbackTitle,
      markdown: [...currentLines],
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("# ")) {
      pushCurrent();
      currentTitle = line.slice(2).trim() || fallbackTitle;
      currentLines = [];
      continue;
    }

    currentLines.push(rawLine);
  }

  pushCurrent();

  if (chapters.length === 0) {
    return [
      {
        title: fallbackTitle,
        content: String(marked.parse(normalized)),
      },
    ];
  }

  return chapters.map((chapter) => ({
    title: chapter.title,
    content: String(marked.parse(chapter.markdown.join("\n"))),
  }));
}

function makeFrontMatterChapter(
  title: string,
  subtitle: string,
  description: string,
  author: string,
  date: string,
  version: string,
  documentId: string,
  category: string,
): Chapter {
  return {
    title: "Introduction",
    content: `
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<h2>${escapeHtml(subtitle)}</h2>` : ""}
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <hr />
      <p><strong>Author:</strong> ${escapeHtml(author)}</p>
      ${date ? `<p><strong>Date:</strong> ${escapeHtml(date)}</p>` : ""}
      ${version ? `<p><strong>Version:</strong> ${escapeHtml(version)}</p>` : ""}
      ${documentId ? `<p><strong>Document ID:</strong> ${escapeHtml(documentId)}</p>` : ""}
      ${category ? `<p><strong>Category:</strong> ${escapeHtml(category)}</p>` : ""}
    `,
  };
}

async function buildOneEpub(source: SourceFile): Promise<BuildSuccess> {
  const raw = fs.readFileSync(source.sourcePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const title = safeText(data.title, source.slug);
  const subtitle = safeText(data.subtitle);
  const description = safeText(data.description);
  const author = safeText(data.author, "Abraham of London");
  const date = safeText(data.date);
  const version = safeText(data.version);
  const documentId = safeText(data.documentId);
  const category = safeText(data.category);
  const language = safeText(data.lang || data.language, "en");

  const markdown = normalizeMarkdownContent(parsed.content);

  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  const frontMatterChapter = makeFrontMatterChapter(
    title,
    subtitle,
    description,
    author,
    date,
    version,
    documentId,
    category,
  );

  const chapters = splitIntoChapters(markdown, title);
  const content: Chapter[] = [frontMatterChapter, ...chapters];

  if (!content.length) {
    throw new Error("EPUB chapter array is empty.");
  }

  const options = {
    title,
    author,
    publisher: "Abraham of London",
    description,
    lang: language,
    tocTitle: "Contents",
    appendChapterTitles: false,
  };

  const instance = new EPub(options, content) as unknown as {
    genEpub?: () => Promise<Buffer | Uint8Array>;
    genEpubToBuffer?: () => Promise<Buffer | Uint8Array>;
  };

  let buffer: Buffer | Uint8Array | undefined;

  if (typeof instance.genEpub === "function") {
    buffer = await instance.genEpub();
  } else if (typeof instance.genEpubToBuffer === "function") {
    buffer = await instance.genEpubToBuffer();
  } else {
    throw new Error(
      "EPub instance does not expose genEpub() or genEpubToBuffer().",
    );
  }

  if (!buffer) {
    throw new Error("EPUB generation returned empty output.");
  }

  const normalizedBuffer = Buffer.from(buffer);
  if (normalizedBuffer.byteLength <= 0) {
    throw new Error("Generated EPUB buffer is empty.");
  }

  const outputPath = path.join(OUTPUT_DIR, `${source.slug}.epub`);
  fs.writeFileSync(outputPath, normalizedBuffer);

  const stats = fs.statSync(outputPath);
  if (stats.size <= 0) {
    throw new Error("Generated EPUB file is empty on disk.");
  }

  return {
    slug: source.slug,
    sourcePath: source.sourcePath,
    outputPath,
    sizeBytes: stats.size,
    title,
    author,
  };
}

function toManifestItem(result: BuildSuccess): BuildManifestItem {
  return {
    slug: result.slug,
    title: result.title,
    author: result.author,
    sourcePath: result.sourcePath,
    outputPath: result.outputPath,
    publicHref: `/epubs/${result.slug}.epub`,
    sizeBytes: result.sizeBytes,
    generatedAt: new Date().toISOString(),
  };
}

function writeManifest(items: BuildManifestItem[]): void {
  const manifest: BuildManifest = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function generateAllEpubs(): Promise<void> {
  ensureDir(OUTPUT_DIR);

  const sources = discoverPrintSources();

  if (sources.length === 0) {
    console.log("No .print.md sources found. Nothing to generate.");
    return;
  }

  console.log(`Found ${sources.length} print source(s).`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  const successes: BuildSuccess[] = [];
  const failures: BuildFailure[] = [];

  for (const source of sources) {
    console.log(`\n[EPUB] Building: ${source.slug}`);
    console.log(`[EPUB] Source: ${source.sourcePath}`);

    try {
      const result = await buildOneEpub(source);
      successes.push(result);

      console.log(`[EPUB] Success: ${result.outputPath}`);
      console.log(`[EPUB] Size: ${formatKb(result.sizeBytes)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      failures.push({
        slug: source.slug,
        sourcePath: source.sourcePath,
        error: message,
      });

      console.error(`[EPUB] Failed: ${source.slug}`);
      console.error(`[EPUB] Reason: ${message}`);
    }
  }

  const manifestItems = successes.map(toManifestItem);
  writeManifest(manifestItems);

  console.log("\n==================================================");
  console.log("EPUB GENERATION SUMMARY");
  console.log("==================================================");
  console.log(`Succeeded: ${successes.length}`);
  console.log(`Failed:    ${failures.length}`);
  console.log(`Manifest:  ${MANIFEST_PATH}`);

  if (successes.length) {
    console.log("\nSuccessful builds:");
    for (const item of successes) {
      console.log(`- ${item.slug} (${formatKb(item.sizeBytes)})`);
    }
  }

  if (failures.length) {
    console.log("\nFailed builds:");
    for (const item of failures) {
      console.log(`- ${item.slug}`);
      console.log(`  ${item.error}`);
    }

    process.exitCode = 1;
  }
}

generateAllEpubs().catch((error) => {
  console.error("[EPUB_BATCH_FATAL]", error);
  process.exit(1);
});