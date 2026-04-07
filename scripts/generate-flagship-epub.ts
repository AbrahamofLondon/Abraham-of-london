// scripts/generate-flagship-epub.ts
import { EPub } from "epub-gen-memory";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

type Chapter = {
  title: string;
  content: string;
};

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

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

function splitIntoChapters(markdown: string, fallbackTitle: string): Chapter[] {
  const normalized = normalizeMarkdownContent(markdown);

  if (!normalized) {
    return [{
      title: fallbackTitle,
      content: `<h1>${escapeHtml(fallbackTitle)}</h1><p>No content available.</p>`,
    }];
  }

  const lines = normalized.split("\n");
  const chapters: Array<{ title: string; markdown: string[] }> = [];
  let currentTitle = fallbackTitle;
  let currentLines: string[] = [];

  const pushCurrent = () => {
    if (currentLines.join("\n").trim()) {
      chapters.push({ title: currentTitle, markdown: [...currentLines] });
    }
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
    return [{ title: fallbackTitle, content: String(marked.parse(normalized)) }];
  }

  return chapters.map((ch) => ({
    title: ch.title,
    content: String(marked.parse(ch.markdown.join("\n"))),
  }));
}

async function generateFlagshipEpub(): Promise<void> {
  const slug = "ultimate-purpose-of-man-editorial";
  const sourcePath = abs(`scripts/pdf/print-sources/${slug}.print.md`);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const raw = fs.readFileSync(sourcePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const title       = safeText(data.title,   "The Ultimate Purpose of Man");
  const subtitle    = safeText(data.subtitle);
  const author      = safeText(data.author,   "Abraham of London");
  const description = safeText(data.description);
  const language    = safeText((data.lang as string) || (data.language as string), "en");
  const publisher   = "Abraham of London";

  console.log(`Generating EPUB for: ${title}`);
  console.log(`Using source: ${sourcePath}`);

  marked.setOptions({ gfm: true, breaks: false });

  const chapters = splitIntoChapters(normalizeMarkdownContent(parsed.content), title);

  const frontMatterChapter: Chapter = {
    title: "Introduction",
    content: `
      <h1>${escapeHtml(title)}</h1>
      ${subtitle    ? `<h2>${escapeHtml(subtitle)}</h2>`                                                             : ""}
      ${description ? `<p>${escapeHtml(description)}</p>`                                                            : ""}
      <hr />
      <p><strong>Author:</strong> ${escapeHtml(author)}</p>
      ${safeText(data.date)       ? `<p><strong>Date:</strong> ${escapeHtml(safeText(data.date))}</p>`              : ""}
      ${safeText(data.version)    ? `<p><strong>Version:</strong> ${escapeHtml(safeText(data.version))}</p>`        : ""}
      ${safeText(data.documentId) ? `<p><strong>Document ID:</strong> ${escapeHtml(safeText(data.documentId))}</p>` : ""}
    `,
  };

  const content: Chapter[] = [frontMatterChapter, ...chapters];
  if (!content.length) throw new Error("EPUB chapter content is empty");

  const outputDir = path.join(process.cwd(), "public", "epubs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }
  const outputPath = path.join(outputDir, `${slug}.epub`);

  const options = {
    title,
    author,
    publisher,
    description,
    lang: language,
    tocTitle: "Contents",
    appendChapterTitles: false,
  };

  // Correct API for this version of epub-gen-memory:
  //   new EPub(options, content)  — constructor sets up the instance
  //   instance.genEpub()          — renders templates, downloads assets,
  //                                 zips everything, returns a Buffer
  // There is no .promise property on this version.
  const epub = new EPub(options, content) as any;
  const buffer: Buffer = await epub.genEpub();

  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new Error(
      `genEpub() resolved to unexpected type: ${typeof buffer}`
    );
  }

  fs.writeFileSync(outputPath, Buffer.from(buffer));

  const stats = fs.statSync(outputPath);
  if (stats.size <= 0) throw new Error("Generated EPUB file is empty.");

  console.log(`✅ EPUB successfully generated at: ${outputPath}`);
  console.log(`📦 Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

generateFlagshipEpub().catch((error) => {
  console.error("[FLAGSHIP_EPUB_GENERATION_FAILED]", error);
  process.exit(1);
});
