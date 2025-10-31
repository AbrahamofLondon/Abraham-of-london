// scripts/resize-covers.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inputs = [
  "public/assets/images/blog/lessons-from-noah.jpg",
  // add more weak images here…
];

for (const inPath of inputs) {
  const outWebp = inPath.replace(/\.jpe?g$/i, "@1600.webp");
  const outJpg  = inPath.replace(/\.jpe?g$/i, "@1600.jpg");
  await sharp(inPath).resize({ width: 1600 }).webp({ quality: 72 }).toFile(outWebp);
  await sharp(inPath).resize({ width: 1600 }).jpeg({ quality: 80 }).toFile(outJpg);
  console.log("Wrote", outWebp, "and", outJpg);
}
