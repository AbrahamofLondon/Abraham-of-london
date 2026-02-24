/* scripts/test-semantic.mjs - PRE-FLIGHT DIAGNOSTICS */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

async function dryRun() {
  console.log("🛡️  [DRY RUN]: Initiating Semantic Discovery Diagnostics...");

  // 1. Check API Key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("YOUR_ACTUAL_KEY")) {
    console.error("❌ FAILURE: OPENAI_API_KEY is missing or using placeholder in .env");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // 2. Test OpenAI Connectivity
    console.log("📡 [DRY RUN]: Testing OpenAI Embedding API...");
    const aiResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "Abraham of London Institutional Intelligence Test",
    });

    if (aiResponse.data[0].embedding.length === 1536) {
      console.log("✅ [DRY RUN]: OpenAI API active (1536d vector generated).");
    }

    // 3. Test Database Extension (pgvector)
    console.log("🗄️  [DRY RUN]: Checking Neon/PostgreSQL Vector Extension...");
    const extensionCheck = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `;

    if (extensionCheck.length > 0) {
      console.log("✅ [DRY RUN]: pgvector extension is ENABLED in Neon.");
    } else {
      console.warn("⚠️  [DRY RUN]: pgvector extension NOT FOUND. Run 'CREATE EXTENSION IF NOT EXISTS vector;' in your Neon console.");
    }

    console.log("\n🚀 PRE-FLIGHT SUCCESSFUL: You are clear to run 'pnpm mdx:embed'.");

  } catch (error) {
    console.error("\n❌ [DRY RUN FAILED]:");
    console.error(`Error: ${error.message}`);
    if (error.message.includes("401")) console.error("Tip: Your API Key is likely invalid or expired.");
    if (error.message.includes("402")) console.error("Tip: Check your OpenAI billing balance.");
  } finally {
    await prisma.$disconnect();
  }
}

dryRun();