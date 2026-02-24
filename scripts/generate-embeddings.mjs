/* scripts/generate-embeddings.mjs - HARDENED RATE-LIMIT VERSION */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper for rate-limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbeddings() {
  console.log("🔍 [SEMANTIC]: Auditing 427 synchronized assets...");

  const assets = await prisma.$queryRaw`
    SELECT id, title, summary, content 
    FROM "ContentMetadata" 
    WHERE embedding IS NULL 
    LIMIT 100
  `;

  if (assets.length === 0) {
    console.log("✨ [SEMANTIC]: All intelligence assets are semantically indexed.");
    return;
  }

  for (const asset of assets) {
    try {
      console.log(`📡 [EMBEDDING]: Indexing "${asset.title}"...`);

      const input = `Title: ${asset.title}\nSummary: ${asset.summary}\nContent: ${asset.content?.slice(0, 1000)}`;

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: input.replace(/\n/g, " "),
      });

      const embedding = response.data[0].embedding;
      const vectorString = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `UPDATE "ContentMetadata" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        asset.id
      );

      // Institutional Pacing: Wait 500ms to avoid 429 errors
      await sleep(500);

    } catch (error) {
      if (error.status === 429) {
        console.error("🚨 [QUOTA EXCEEDED]: Please add credits to OpenAI or wait for rate-limit reset.");
        break; 
      }
      console.error(`❌ [ERROR]: Asset ${asset.id} failed:`, error.message);
    }
  }

  console.log("✅ [BATCH COMPLETE]: Run the script again to process the next 100 assets.");
}

generateEmbeddings().finally(() => prisma.$disconnect());