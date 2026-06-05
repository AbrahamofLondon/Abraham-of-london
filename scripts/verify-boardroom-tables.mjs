/* scripts/verify-boardroom-tables.mjs — Verify production DB tables exist */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT
        to_regclass('public.boardroom_brief_orders') IS NOT NULL AS boardroom_brief_orders_exists,
        to_regclass('public.boardroom_bridge_handoffs') IS NOT NULL AS boardroom_bridge_handoffs_exists
    `);

    console.log("Table verification result:", JSON.stringify(result, null, 2));

    const row = Array.isArray(result) ? result[0] : result;
    if (row?.boardroom_brief_orders_exists && row?.boardroom_bridge_handoffs_exists) {
      console.log("\n✅ Both tables exist in production database.");
    } else {
      console.log("\n❌ Tables missing!");
      if (!row?.boardroom_brief_orders_exists) console.log("   - boardroom_brief_orders MISSING");
      if (!row?.boardroom_bridge_handoffs_exists) console.log("   - boardroom_bridge_handoffs MISSING");
    }
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
