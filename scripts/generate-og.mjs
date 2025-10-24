// scripts/generate-og.mjs
import fs from "node:fs/promises";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import glob from "glob";
import matter from "gray-matter";

const ROOT = process.cwd();
const out = (p) => path.join(ROOT, "public", p.replace(/^\/+/, ""));

const BRAND = {
  forest: "#0b2e1f",
  gold: "#d4af37",
  cream: "#f7f5ef",
  ink: "#0e0e0e",
};

async function loadFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const fonts = {
  playfairBold: await loadFont(
    "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXDTzYhcncM3M.ttf"
  ),
  interSemi: await loadFont(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnM-ZuL7xw.ttf"
  ),
};

async function renderPNG(width, height, jsx) {
  const svg = await satori(jsx, {
    width,
    height,
    fonts: [
      { name: "Playfair", data: fonts.playfairBold, weight: 700, style: "normal" },
      { name: "Inter", data: fonts.interSemi, weight: 600, style: "normal" },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  const png = resvg.render().asPng();
  return Buffer.from(png);
}

function Card({ title, subtitle, tag, dark = true }) {
  const fg = dark ? "#ffffff" : BRAND.ink;
  const bgA = dark ? BRAND.forest : BRAND.cream;
  const bgB = dark ? "#183f2d" : "#ffffff";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${bgA}, ${bgB})`,
        padding: 64,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          fontFamily: "Inter",
          fontSize: 24,
          letterSpacing: 0.5,
        }}
      >
        {tag ?? "Abraham of London"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontFamily: "Playfair",
            fontWeight: 700,
            color: fg,
            fontSize: 96,
            lineHeight: 1.02,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: "Inter",
              color: "rgba(255,255,255,0.9)",
              fontSize: 32,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: fg,
          fontFamily: "Inter",
          fontSize: 24,
          opacity: 0.9,
        }}
      >
        <span>abrahamoflondon.org</span>
        <span style={{ color: BRAND.gold }}>Leadership • Fatherhood • Legacy</span>
      </div>
    </div>
  );
}

async function saveSocialDefaults() {
  await fs.mkdir(out("/assets/images/social"), { recursive: true });

  // OG 1200x630 (JPEG) + Twitter 1200x630 (WEBP)
  const png = await renderPNG(
    1200,
    630,
    Card({
      title: "Abraham of London",
      subtitle:
        "Global Strategist, Author, and Visionary Leader. Join a movement shaping family, leadership, and legacy.",
      tag: "Official",
      dark: true,
    })
  );

  await sharp(png).jpeg({ quality: 90 }).toFile(out("/assets/images/social/og-image.jpg"));
  await sharp(png).webp({ quality: 92 }).toFile(out("/assets/images/social/twitter-image.webp"));
}

async function saveHeroBanner() {
  await fs.mkdir(out("/assets/images"), { recursive: true });

  const png = await renderPNG(
    2400,
    1350,
    Card({
      title: "Abraham of London",
      subtitle: "Strategy. Fatherhood. Legacy.",
      tag: "Welcome",
      dark: true,
    })
  );

  await sharp(png).webp({ quality: 92 }).toFile(out("/assets/images/abraham-of-london-banner.webp"));
}

function guessPosts() {
  // scan a few common post locations for md/mdx
  const patterns = [
    "posts/**/*.{md,mdx}",
    "content/posts/**/*.{md,mdx}",
    "data/posts/**/*.{md,mdx}",
    "_posts/**/*.{md,mdx}",
    "blog/**/*.{md,mdx}",
  ];
  const files = patterns.flatMap((p) => glob.sync(p, { cwd: ROOT, nodir: true }));
  return Array.from(new Set(files));
}

function fileToSlug(fp) {
  const base = path.basename(fp, path.extname(fp));
  return base.toLowerCase().replace(/\s+/g, "-");
}

async function saveBlogCovers() {
  const files = guessPosts();
  if (!files.length) return;

  const dir = out("/assets/images/blog/generated");
  await fs.mkdir(dir, { recursive: true });

  for (const file of files) {
    const src = await fs.readFile(path.join(ROOT, file), "utf8");
    const fm = matter(src);
    const title = (fm.data?.title || fileToSlug(file)).toString().trim();
    const slug = (fm.data?.slug || fileToSlug(file)).toString().trim();
    const hasCover = typeof fm.data?.coverImage === "string" && fm.data.coverImage.trim() !== "";
    if (hasCover) continue;

    const png = await renderPNG(
      1200,
      630,
      Card({
        title,
        subtitle: "Read the full story",
        tag: fm.data?.category || "Blog",
        dark: true,
      })
    );

    await sharp(png).jpeg({ quality: 88 }).toFile(path.join(dir, `${slug}.jpg`));
  }
}

async function main() {
  await saveSocialDefaults();
  await saveHeroBanner();
  await saveBlogCovers();
  console.log("generate-og: social defaults, hero banner, and covers ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
