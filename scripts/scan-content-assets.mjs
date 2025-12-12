// scripts/scan-content-assets.mjs
// Enforces that every published content item has its required assets.

import fs from "fs";
import path from "path";
import process from "process";

// --- CONFIG ------------------------------------------------

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

const IMAGE_FALLBACK = "/assets/images/writing-desk.webp";

// folders that may legally share a fallback image
const ALLOW_FALLBACK_FOR = new Set([
  "event", // events may use fallback
]);

// ----------------------------------------------------------

function exists(relPath) {
  if (!relPath) return false;
  const full = path.join(PUBLIC_DIR, relPath.replace(/^\/+/, ""));
  return fs.existsSync(full);
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

// Load contentlayer output directly (safe in CI)
let docs;
try {
  const generated = await import(
    path.join(ROOT, ".contentlayer/generated/index.mjs")
  );
  docs = generated.allDocuments ?? [];
} catch (e) {
  console.error("❌ Cannot load Contentlayer documents.");
  console.error(e);
  process.exit(1);
}

if (!docs.length) {
  fail("No Contentlayer documents found.");
}

// ----------------------------------------------------------
// helpers mirrored from lib/contentlayer-helper.ts
// ----------------------------------------------------------

function cleanSlug(s) {
  return String(s || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

function slugFor(doc) {
  return cleanSlug(
    doc.slug ||
      doc._raw?.flattenedPath?.split("/").pop() ||
      "untitled",
  );
}

function kindFor(doc) {
  return String(doc.type || "").toLowerCase();
}

function expectedImage(doc) {
  if (doc.coverImage) return doc.coverImage;

  const slug = slugFor(doc);
  const kind = kindFor(doc);

  switch (kind) {
    case "post":
    case "short":
      return `/assets/images/blog/${slug}.jpg`;
    case "book":
      return `/assets/images/books/${slug}.jpg`;
    case "canon":
      return `/assets/images/canon/${slug}.jpg`;
    case "resource":
      return `/assets/images/resources/${slug}.jpg`;
    case "print":
      return `/assets/images/prints/${slug}.jpg`;
    case "download":
      return `/assets/images/downloads/${slug}.jpg`;
    case "strategy":
      return `/assets/images/strategy/${slug}.jpg`;
    case "event":
      return IMAGE_FALLBACK;
    default:
      return IMAGE_FALLBACK;
  }
}

function expectedPdf(doc) {
  const slug = slugFor(doc);
  const kind = kindFor(doc);

  if (doc.downloadUrl) return doc.downloadUrl;

  if (kind === "resource")
    return `/assets/resources/pdfs/${slug}.pdf`;
  if (kind === "download")
    return `/assets/downloads/pdfs/${slug}.pdf`;
  if (kind === "canon")
    return `/assets/canon/pdfs/${slug}.pdf`;

  return null;
}

// ----------------------------------------------------------
// SCAN
// ----------------------------------------------------------

let missingImages = [];
let missingPdfs = [];

for (const doc of docs) {
  if (doc.draft === true) continue;

  const slug = slugFor(doc);
  const kind = kindFor(doc);

  // ---- IMAGE CHECK ----
  const img = expectedImage(doc);
  if (
    img &&
    img !== IMAGE_FALLBACK &&
    !exists(img)
  ) {
    missingImages.push({
      type: kind,
      slug,
      expected: img,
    });
  }

  // ---- PDF CHECK ----
  const pdf = expectedPdf(doc);
  if (pdf && !exists(pdf)) {
    missingPdfs.push({
      type: kind,
      slug,
      expected: pdf,
    });
  }
}

// ----------------------------------------------------------
// REPORT
// ----------------------------------------------------------

if (missingImages.length) {
  console.error("\n🚨 Missing images:");
  for (const m of missingImages) {
    console.error(
      ` - [${m.type}] ${m.slug} → ${m.expected}`,
    );
  }
}

if (missingPdfs.length) {
  console.error("\n🚨 Missing PDFs:");
  for (const m of missingPdfs) {
    console.error(
      ` - [${m.type}] ${m.slug} → ${m.expected}`,
    );
  }
}

if (!missingImages.length && !missingPdfs.length) {
  console.log("✅ Asset scan passed. No missing images or PDFs.");
} else {
  process.exitCode = 1;
}