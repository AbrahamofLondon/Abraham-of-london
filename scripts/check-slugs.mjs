import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const allContent = await prisma.contentMetadata.findMany({
    select: { slug: true, title: true }
  });
  console.log("📊 CURRENT DATABASE SLUGS:");
  console.table(allContent);
}

check().finally(() => prisma.$disconnect());