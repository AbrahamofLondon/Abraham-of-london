#!/usr/bin/env node
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

/* ───────────────────────────────────────────────────────────────────
   CLI
   ─────────────────────────────────────────────────────────────────── */
const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^-+/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);
const BASE = args.base || "http://localhost:3000";
const OUT_DIRS = ["public/downloads", "public/resources"];
OUT_DIRS.forEach((d) => fs.mkdirSync(d, { recursive: true }));

/* ───────────────────────────────────────────────────────────────────
   ROUTES (primary + fallbacks you asked for)
   ─────────────────────────────────────────────────────────────────── */
const PRINT_ROUTES = [
  "/print/board-investor-one-pager-template",
  "/print/entrepreneur-survival-checklist",
  "/print/brotherhood-covenant",
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up",
  "/print/a6/principles-for-my-son-cue-card-two-up",
];

const FALLBACK_ROUTES = [
  "/print/leadership-playbook",
  "/print/mentorship-starter-kit",
  "/print/family-altar-liturgy",
  "/print/standards-brief",
  "/print/principles-for-my-son",
  "/print/scripture-track-john14",
  "/print/fathering-without-fear-teaser",
  "/print/fathering-without-fear-teaser-mobile",
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up",
];

// exact file names to also emit (in addition to standard variants)
const FALLBACK_FILEMAP = {
  "/print/leadership-playbook": "Leadership_Playbook.pdf",
  "/print/mentorship-starter-kit": "Mentorship_Starter_Kit.pdf",
  "/print/family-altar-liturgy": "Family_Altar_Liturgy.pdf",
  "/print/standards-brief": "Standards_Brief.pdf",
  "/print/principles-for-my-son": "Principles_for_My_Son.pdf",
  "/print/scripture-track-john14": "Scripture_Track_John14.pdf",
  "/print/fathering-without-fear-teaser": "Fathering_Without_Fear_Teaser_A4.pdf",
  "/print/fathering-without-fear-teaser-mobile": "Fathering_Without_Fear_Teaser_Mobile.pdf",
  "/print/a6/leaders-cue-card-two-up": "Leaders_Cue_Card.pdf",
  "/print/a6/brotherhood-cue-card-two-up": "Brotherhood_Cue_Card.pdf",
};

// final set to render
const ROUTES = Array.from(new Set([...PRINT_ROUTES, ...FALLBACK_ROUTES]));

/* ───────────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────────── */
const toTitleCase = (slug) =>
  slug
    .replace(/[-_/]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();

const titleCasePdf = (slug) => `${toTitleCase(slug).replace(/\s+/g, "_")}.pdf`;
const kebabPdf = (slug) => `${slug}.pdf`;

function routeToSlug(route) {
  const parts = route.split("/").filter(Boolean);
  return parts[parts.length - 1] || "index";
}

function saveAllVariants(pdfBuffer, route) {
  const slug = routeToSlug(route);

  // standard variants
  const titleCaseName = titleCasePdf(slug);         // e.g. Leaders_Cue_Card.pdf
  const kebabName = kebabPdf(slug);                 // e.g. leaders-cue-card-two-up.pdf

  // explicit fallback (if any)
  const mappedName = FALLBACK_FILEMAP[route];

  for (const dir of OUT_DIRS) {
    fs.writeFileSync(path.join(dir, titleCaseName), pdfBuffer);
    fs.writeFileSync(path.join(dir, kebabName), pdfBuffer);
    if (mappedName) fs.writeFileSync(path.join(dir, mappedName), pdfBuffer);

    // special case: validator expects /downloads/leaders-cue-card.pdf (singular)
    // when the route is the two-up, also provide the simplified kebab
    if (route === "/print/a6/leaders-cue-card-two-up") {
      fs.writeFileSync(path.join(dir, "leaders-cue-card.pdf"), pdfBuffer);
    }
  }

  const written = [titleCaseName, kebabName].concat(mappedName ? [mappedName] : []);
  console.log(`📝 ${route} → ${written.join(", ")}`);
}

/* ───────────────────────────────────────────────────────────────────
   Main
   ─────────────────────────────────────────────────────────────────── */
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.emulateMediaType("print");

  for (const route of ROUTES) {
    const full = new url.URL(route, BASE).toString();
    const res = await page.goto(full, { waitUntil: "networkidle2", timeout: 60000 });
    if (!res || !res.ok()) {
      throw new Error(`Failed to open ${full} → ${res?.status?.() || "no response"}`);
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });

    saveAllVariants(pdf, route);
  }

  await browser.close();
  console.log("✅ PDF render complete.");
})().catch((e) => {
  console.error("❌ PDF render failed:", e);
  process.exit(1);
});
