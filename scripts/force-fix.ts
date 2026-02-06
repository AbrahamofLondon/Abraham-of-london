import { PrismaClient } from "@prisma/client";

const user = "neondb_owner";
const pass = "npg_iEBMhzYJ4p8k"; 
const host = "ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech";
const db   = "abraham_of_london";

const URL = `postgresql://${user}:${pass}@${host}/${db}?sslmode=require`;
process.env.DATABASE_URL = URL;

async function audit() {
  const prisma = new PrismaClient();
  try {
    console.log("📊 INITIATING PORTFOLIO AUDIT...");

    // 1. Get a breakdown of all classifications
    const stats = await prisma.contentMetadata.groupBy({
      by: ['classification'],
      _count: { _all: true }
    });

    console.log("--- Current Registry Status ---");
    stats.forEach(stat => {
      console.log(`${(stat.classification || 'NULL').padEnd(15)} : ${stat._count._all} assets`);
    });

    // 2. Sample the first few to check case-sensitivity
    const samples = await prisma.contentMetadata.findMany({
      take: 5,
      select: { slug: true, classification: true }
    });
    
    console.log("\n--- Sample Metadata ---");
    samples.forEach(s => console.log(`Slug: ${s.slug.padEnd(30)} | Status: ${s.classification}`));

  } catch (error: any) {
    console.error("❌ AUDIT FAILED:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

audit();