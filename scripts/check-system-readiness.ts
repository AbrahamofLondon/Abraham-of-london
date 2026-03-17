/* scripts/check-system-readiness.ts */
import { initializeDb, prisma } from "../lib/db";
import { InquiryStatus } from "@prisma/client";

async function validate() {
  console.log("🔍 Initializing Abraham of London System Audit...");
  
  try {
    // 1. Wake up the DB Bridge
    await initializeDb();

    // 2. Type Guard for the compiler
    if (!prisma) {
      console.error("❌ Critical Error: Prisma client failed to initialize. Check DATABASE_URL.");
      process.exit(1);
    }

    console.log("✅ Database Bridge: ACTIVE");

    // 3. Check DB Connection
    await prisma.$connect();
    console.log("✅ Database Connection: ESTABLISHED");

    // 4. Check Enum Integrity
    const statusValues = Object.values(InquiryStatus);
    if (statusValues.includes("ONBOARDED" as any)) {
      console.log("✅ Schema: ONBOARDED status verified in InquiryStatus enum");
    } else {
      console.log("❌ Schema: ONBOARDED status missing. Run npx prisma generate.");
    }

    // 5. Check Core Table
    const briefCount = await prisma.contentMetadata.count();
    console.log(`✅ Content: ${briefCount} briefs detected in portfolio`);

  } catch (e) {
    console.error("❌ System Audit Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

validate();