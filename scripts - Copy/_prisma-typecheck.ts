import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// if types are correct, this should type-check
async function test() {
  await prisma.adminUser.findMany();
}

test().finally(() => prisma.$disconnect());