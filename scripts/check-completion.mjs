/* scripts/check-completion.mjs - FINAL AUDIT */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit() {
  console.log("🧐 [AUDIT]: Running final check on Institutional Vault...");

  const stats = await prisma.$queryRaw`
    SELECT 
      COUNT(*) as total,
      COUNT(embedding) as indexed,
      (COUNT(*) - COUNT(embedding)) as missing
    FROM "ContentMetadata"
  `;

  const { total, indexed, missing } = stats[0];

  console.log("------------------------------------------------------------");
  console.log(`📊 TOTAL ASSETS:    ${total}`);
  console.log(`✅ INDEXED:         ${indexed}`);
  console.log(`❌ MISSING:         ${missing}`);
  console.log("------------------------------------------------------------");

  if (Number(missing) === 0) {
    console.log("🚀 STATUS: 100% COMPLETE. Semantic Discovery is fully operational.");
  } else {
    console.log(`⚠️  STATUS: ${missing} assets still need processing. Run 'pnpm mdx:embed' again.`);
  }
}

audit().finally(() => prisma.$disconnect());