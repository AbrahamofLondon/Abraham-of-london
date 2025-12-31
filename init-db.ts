// init-db.ts
import { PrismaClient } from '@prisma/client';

// Use the exact path you want for your dev database
const DATABASE_URL = "file:./dev.db";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

async function main() {
  console.log("🚀 Starting Manual Database Initialization...");
  
  try {
    // Attempting a simple query forces Prisma to check for/create the SQLite file
    // and attempt to connect.
    await prisma.$connect();
    console.log("✅ Connection successful. If dev.db didn't exist, it has been initialized.");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
