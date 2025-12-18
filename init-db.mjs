// init-db.mjs
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const dbUrl = `file:${dbPath}`;

async function main() {
  console.log("🛠️ Step 1: Manually creating the database file...");
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "");
    console.log(`✅ Created empty file at: ${dbPath}`);
  }

  console.log("🛠️ Step 2: Connecting via Prisma Client...");
  
  // FIX: Prisma 7 requires an object passed to the constructor.
  // Passing datasourceUrl directly is the cleanest way for SQLite.
  const prisma = new PrismaClient({
    datasourceUrl: dbUrl,
  });

  try {
    await prisma.$connect();
    console.log("🚀 Connection Successful!");
    
    // Check if tables exist. If not, this will catch.
    await prisma.innerCircleMember.count();
    console.log("📊 Database schema is already in sync.");
  } catch (error) {
    if (error.message.includes("no such table")) {
      console.log("ℹ️ File created, but tables are missing. Running sync next...");
    } else {
      console.error("❌ Prisma Connection Error:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);