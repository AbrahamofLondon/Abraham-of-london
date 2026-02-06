import { PrismaClient } from "@prisma/client";
import { encryptDocument } from "../lib/security"; // Ensure this path exists

const prisma = new PrismaClient();

async function onboardPrivateAssets(slugs: string[]) {
  console.log("🔐 GENERATING ENCRYPTION KEYS FOR PRIVATE ASSETS...");

  for (const slug of slugs) {
    const asset = await prisma.contentMetadata.findUnique({ where: { slug } });

    if (!asset || !asset.content) {
      console.warn(`⚠️ Asset ${slug} not found or has no content to encrypt.`);
      continue;
    }

    // Encrypt the content
    const encrypted = encryptDocument(asset.content);

    // Update DB with the encrypted payload and mark as PRIVATE
    await prisma.contentMetadata.update({
      where: { slug },
      data: {
        classification: "PRIVATE",
        metadata: JSON.stringify({
          content: encrypted.content,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          onboardingRequired: true
        }),
        content: "[RESTRICTED ACCESS]" // Wipe the plain text from the content field
      }
    });

    console.log(`✅ ${slug} secured and gated.`);
  }
}

// Example usage: npx tsx scripts/onboard-assets.ts brief-01 brief-02
const targetSlugs = process.argv.slice(2);
onboardPrivateAssets(targetSlugs).finally(() => prisma.$disconnect());