/* scripts/portfolio-report.mjs */
import { PrismaClient } from "@prisma/client";
import chalk from "chalk";

const prisma = new PrismaClient();

async function generateReport() {
  console.log(chalk.blue.bold("\n📊 ABRAHAM-OF-LONDON: INTELLIGENCE PORTFOLIO REPORT\n"));

  try {
    const allRecords = await prisma.contentMetadata.findMany();

    // 1. Distribution by Content Type
    const typeCounts = allRecords.reduce((acc, rec) => {
      acc[rec.contentType] = (acc[rec.contentType] || 0) + 1;
      return acc;
    }, {});

    // 2. Distribution by Thematic Category (from Metadata)
    const categoryCounts = allRecords.reduce((acc, rec) => {
      const cat = rec.metadata?.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    console.log(chalk.cyan("--- Content Type Distribution ---"));
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${chalk.white(type.padEnd(15))} : ${chalk.green(count)} assets`);
    });

    console.log(chalk.cyan("\n--- Strategic Thematic Categories ---"));
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`${chalk.white(cat.padEnd(20))} : ${chalk.yellow(count)} briefs`);
      });

    console.log(chalk.blue.bold("\n--- 🏁 End of Intelligence Briefing ---\n"));

  } catch (error) {
    console.error(chalk.red("❌ Failed to generate report:"), error);
  } finally {
    await prisma.$disconnect();
  }
}

generateReport();