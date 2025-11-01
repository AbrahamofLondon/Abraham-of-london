import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inputs = [
  // Blog Images
  "public/assets/images/blog/fathering-principles.jpg",
  "public/assets/images/blog/fathering-without-fear-teaser.jpg",
  "public/assets/images/blog/in-my-fathers-house.jpg",
  "public/assets/images/blog/kingdom-strategies-for-a-loving-legacy.jpg",
  "public/assets/images/blog/leadership-begins-at-home.jpg",
  "public/assets/images/blog/lessons-from-noah.jpg",
  "public/assets/images/blog/out-of-context-truth.jpg",
  "public/assets/images/blog/principles-for-my-son.jpg",
  "public/assets/images/blog/reclaiming-the-narrative.jpg",
  "public/assets/images/blog/sovereignty-truth-fathers.jpg",
  "public/assets/images/blog/when-the-foundation-is-destroyed.jpg",
  "public/assets/images/blog/when-the-system-breaks-you.jpg",
  
  // Book Images
  "public/assets/images/books/the-fiction-adaptation.jpg",
  
  // Event Images
  "public/assets/images/events/leadership-workshop.jpg",

  // Other Assets
  "public/assets/images/abraham-of-london-cursive.svg",
  "public/assets/images/contact.element.svg",
  "public/assets/images/endureluxe-ltd.webp",
  "public/assets/images/innovatehub.svg",
  "public/assets/images/profile-portrait.webp",
  "public/assets/images/tiny.png",
  "public/assets/images/blog/christianity-not-extremism.svg",
  "public/assets/images/logo/endureluxe.svg",
  "public/assets/images/social/email.svg",
  "public/assets/images/social/facebook.svg",
  "public/assets/images/social/instagram.svg",
  "public/assets/images/social/linkedin.svg",
  "public/assets/images/social/mail.svg",
  "public/assets/images/social/og-image.jpg",
  "public/assets/images/social/phone.svg",
  "public/assets/images/social/tiktok.svg",
  "public/assets/images/social/twitter-image.jpg",
  "public/assets/images/social/twitter.svg",
  "public/assets/images/social/Untitled.svg",
  "public/assets/images/social/whatsapp.svg",
  "publicm/assets/images/social/x.svg",
  "public/assets/images/social/mono/facebook.svg",
  "public/assets/images/social/mono/instagram.svg",
  "public/assets/images/social/mono/linkedin.svg",
  "public/assets/images/social/mono/mail.svg",
  "public/assets/images/social/mono/phone.svg",
  "public/assets/images/social/mono/whatsapp.svg",
  "public/assets/images/social/mono/x.svg",
  "public/assets/images/social/mono/youtube.svg",
];

async function resizeImages() {
  console.log(`Starting resize process for ${inputs.length} images...`);
  let processed = 0;
  let skipped = 0;

  for (const inPath of inputs) {
    try {
      // Skip non-raster images
      if (inPath.endsWith(".svg")) {
        console.log(`- Skipping SVG: ${inPath}`);
        skipped++;
        continue;
      }
      
      const outWebp = inPath.replace(/\.(jpe?g|png|webp)$/i, "@1600.webp");
      const outJpg  = inPath.replace(/\.(jpe?g|png|webp)$/i, "@1600.jpg");

      await sharp(inPath).resize({ width: 1600 }).webp({ quality: 72 }).toFile(outWebp);
      await sharp(inPath).resize({ width: 1600 }).jpeg({ quality: 80 }).toFile(outJpg);
      
      console.log(`✔ Wrote: ${outJpg}`);
      processed++;
    } catch (err) {
      console.error(`✖ Error processing ${inPath}:`, err.message);
    }
  }
  console.log(`\nDone. Processed ${processed} images. Skipped ${skipped}.`);
}

resizeImages();