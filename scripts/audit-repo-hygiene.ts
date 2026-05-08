import { promises as fs } from "fs";
import path from "path";

type Classification =
  | "KEEP_ROOT"
  | "MOVE_TO_DOCS_ARCHIVE"
  | "MOVE_TO_SCRIPTS_ARCHIVE"
  | "DELETE_CANDIDATE"
  | "REVIEW_REQUIRED";

type Entry = {
  name: string;
  size: number;
  classification: Classification;
  reason: string;
};

const root = process.cwd();
const outputPath = path.join(root, "docs", "repository-hygiene-ledger.md");

const KEEP_ROOT = new Set([
  ".dockerignore",
  ".editorconfig",
  ".env.example",
  ".env.local.example",
  ".eslintignore",
  ".eslintrc.cjs",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
  ".nvmrc",
  ".pnpmfile.cjs",
  ".prettierrc",
  ".secretscannerignore",
  "components.json",
  "contentlayer.config.ts",
  "deno.lock",
  "docker-compose.yml",
  "Dockerfile",
  "env.d.ts",
  "eslint.config.mjs",
  "global.d.ts",
  "globals.d.ts",
  "jest.config.mjs",
  "jest.setup.js",
  "jsconfig.json",
  "MIGRATION.md",
  "neon.json",
  "netlify.toml",
  "next-env.d.ts",
  "next-sitemap.config.js",
  "next.config.mjs",
  "package-lock.json",
  "package.json",
  "playwright.config.ts",
  "pnpm-lock.yaml",
  "postcss.config.cjs",
  "proxy.ts",
  "README.md",
  "tailwind.config.cjs",
  "tsconfig.app.json",
  "tsconfig.build.json",
  "tsconfig.json",
  "tsconfig.next.json",
  "tsconfig.scripts.json",
  "vercel.json",
  "vitest.config.ts",
]);

function classify(name: string, size: number): Entry {
  const lower = name.toLowerCase();

  if (KEEP_ROOT.has(name)) {
    return { name, size, classification: "KEEP_ROOT", reason: "Core config or canonical repository file." };
  }

  if (
    lower.endsWith(".log")
    || lower.endsWith(".tmp")
    || lower.startsWith("_tmp_")
    || name === "$null"
    || lower === "run"
    || lower === "commitment"
    || lower === "signal"
    || lower === "q2"
    || lower === "q3"
    || lower.includes("tsbuildinfo")
  ) {
    return { name, size, classification: "DELETE_CANDIDATE", reason: "Temporary, generated, or shell-debris artifact." };
  }

  if (
    lower.endsWith(".txt")
    || lower.endsWith(".json")
    || lower.endsWith(".md")
    || lower.endsWith(".pdf")
    || lower.includes("report")
    || lower.includes("audit")
    || lower.includes("summary")
    || lower === "homepage.html"
  ) {
    return { name, size, classification: "MOVE_TO_DOCS_ARCHIVE", reason: "Report, audit, manual, or static artifact better kept under documentation/archive." };
  }

  if (
    lower.endsWith(".ps1")
    || lower.endsWith(".sh")
    || lower.endsWith(".bat")
    || lower.endsWith(".sql")
    || lower.endsWith(".mjs")
    || lower.endsWith(".cjs")
    || lower.endsWith(".js")
    || lower.endsWith(".py")
  ) {
    return { name, size, classification: "MOVE_TO_SCRIPTS_ARCHIVE", reason: "Root-level script or one-off repair utility that should live under scripts/archive." };
  }

  if (
    lower.endsWith(".mp4")
    || lower.endsWith(".mp3")
    || lower.endsWith(".jpg")
    || lower.endsWith(".srt")
    || lower.endsWith(".ass")
  ) {
    return { name, size, classification: "REVIEW_REQUIRED", reason: "Media artifact at repository root; likely not source-critical but requires owner confirmation." };
  }

  return { name, size, classification: "REVIEW_REQUIRED", reason: "Unclassified root artifact requires manual review." };
}

function formatSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function buildCommands(entries: Entry[]): string[] {
  const commands: string[] = [];
  const docsMoves = entries.filter((entry) => entry.classification === "MOVE_TO_DOCS_ARCHIVE");
  const scriptMoves = entries.filter((entry) => entry.classification === "MOVE_TO_SCRIPTS_ARCHIVE");

  if (docsMoves.length) {
    commands.push("New-Item -ItemType Directory -Force -Path 'docs/archive/reports' | Out-Null");
    for (const entry of docsMoves) {
      commands.push(`Move-Item -LiteralPath '${entry.name.replace(/'/g, "''")}' -Destination 'docs/archive/reports/'`);
    }
  }

  if (scriptMoves.length) {
    commands.push("New-Item -ItemType Directory -Force -Path 'scripts/archive' | Out-Null");
    for (const entry of scriptMoves) {
      commands.push(`Move-Item -LiteralPath '${entry.name.replace(/'/g, "''")}' -Destination 'scripts/archive/'`);
    }
  }

  return commands;
}

async function main() {
  const rootEntries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    rootEntries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const stat = await fs.stat(path.join(root, entry.name));
        return classify(entry.name, stat.size);
      }),
  );

  files.sort((a, b) => {
    if (a.classification !== b.classification) {
      return a.classification.localeCompare(b.classification);
    }
    return a.name.localeCompare(b.name);
  });

  const counts = files.reduce<Record<Classification, number>>((acc, file) => {
    acc[file.classification] += 1;
    return acc;
  }, {
    KEEP_ROOT: 0,
    MOVE_TO_DOCS_ARCHIVE: 0,
    MOVE_TO_SCRIPTS_ARCHIVE: 0,
    DELETE_CANDIDATE: 0,
    REVIEW_REQUIRED: 0,
  });

  const commands = buildCommands(files);
  const lines = [
    "# Repository Hygiene Ledger",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- KEEP_ROOT: ${counts.KEEP_ROOT}`,
    `- MOVE_TO_DOCS_ARCHIVE: ${counts.MOVE_TO_DOCS_ARCHIVE}`,
    `- MOVE_TO_SCRIPTS_ARCHIVE: ${counts.MOVE_TO_SCRIPTS_ARCHIVE}`,
    `- DELETE_CANDIDATE: ${counts.DELETE_CANDIDATE}`,
    `- REVIEW_REQUIRED: ${counts.REVIEW_REQUIRED}`,
    "",
    "## Classified Root Files",
    "",
    "| File | Size | Classification | Reason |",
    "| --- | ---: | --- | --- |",
    ...files.map((file) => `| \`${file.name}\` | ${formatSize(file.size)} | \`${file.classification}\` | ${file.reason} |`),
    "",
    "## Safe PowerShell Commands For Review",
    "",
    "```powershell",
    ...(commands.length ? commands : ["# No move/delete commands generated."]),
    "```",
    "",
    "## Notes",
    "",
    "- This ledger does not delete automatically and no delete commands are emitted.",
    "- `REVIEW_REQUIRED` items should be owner-confirmed before any move or deletion.",
    "- `DELETE_CANDIDATE` items remain review-only until separately approved.",
    "- Config, lock, and canonical repo files remain in place under `KEEP_ROOT`.",
  ];

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error("[audit-repo-hygiene] failed", error);
  process.exitCode = 1;
});
