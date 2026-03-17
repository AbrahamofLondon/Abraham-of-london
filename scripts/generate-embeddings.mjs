/* scripts/generate-embeddings.mjs - DEEP ANALYTIC INDEXING */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbeddings() {
  console.log("🔍 [SEMANTIC]: Auditing content_metadata for deep indexing...");

  try {
    // We only target records where content exists but embedding is missing
    const assets = await prisma.$queryRaw`
      SELECT id, title, slug, content, summary 
      FROM content_metadata 
      WHERE embedding IS NULL AND content IS NOT NULL
      LIMIT 50
    `;

    if (!assets || assets.length === 0) {
      console.log("✨ [SEMANTIC]: All synchronized assets are semantically indexed.");
      return;
    }

    for (const asset of assets) {
      try {
        console.log(`📡 [EMBEDDING]: Deep Indexing "${asset.title}"...`);

        // STRATEGY: Weight the Title and Summary heavily, then include the first 2000 chars of content
        // This captures the 'Executive Summary' and 'Strategic Assessment' sections
        const cleanContent = asset.content?.replace(/<[^>]*>?/gm, ''); // Strip MDX components
        const input = `
          Title: ${asset.title}
          Summary: ${asset.summary || 'N/A'}
          Analysis: ${cleanContent?.slice(0, 2000)}
        `.trim().replace(/\n/g, " ");

        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: input,
        });

        const embedding = response.data[0].embedding;
        const vectorString = `[${embedding.join(",")}]`;

        await prisma.$executeRawUnsafe(
          `UPDATE content_metadata SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          asset.id
        );

        // 500ms pacing to maintain institutional stability and avoid 429s
        await sleep(500);

      } catch (error) {
        if (error.status === 429) {
          console.error("🚨 [RATE LIMIT]: OpenAI threshold reached. Pausing batch.");
          break; 
        }
        console.error(`❌ [ERROR]: Asset ${asset.slug} failed:`, error.message);
      }
    }
  } catch (globalError) {
    console.error("🚨 [FATAL]: Connection or Schema mismatch.");
    console.error(globalError.message);
  }

  console.log("✅ [BATCH COMPLETE]: Deep Semantic Indexing has been updated.");
}

generateEmbeddings().finally(() => prisma.$disconnect());