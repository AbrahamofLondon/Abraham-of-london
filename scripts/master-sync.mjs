/* scripts/master-sync.mjs */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import chalk from "chalk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CONTENT_PATH = path.join(process.cwd(), "content");

// --- Fixed Prefix Registry ---
const AUTHORIZED_PREFIXES = [
  '/vault',       // Changed: Removed trailing slash to prevent false regressions
  '/lexicon', 
  '/blog', 
  '/resources', 
  '/downloads', 
  '/assets', 
  '/contact', 
  '/subscribe',
  '/books', 
  '/inner-circle'
];

const mapContentType = (folder) => {
  const map = { 'blog': 'Briefing', 'briefs': 'Briefing', 'lexicon': 'Briefing', 'resources': 'Briefing' };
  return map[folder] || 'Briefing';
};

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFiles(res) : res;
  });
};

async function masterSync() {
  console.log(chalk.blue("🚀 [MASTER SYNC]: Initiating Fixed Audit & Neon Synchronization..."));

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
  const activeSlugs = [];
  let regressionCount = 0;

  const operations = mdxFiles.map((file) => {
    const fileContent = fs.readFileSync(file, "utf8");
    const { data, content } = matter(fileContent);
    const relativePath = path.relative(CONTENT_PATH, file);
    const folder = relativePath.split(path.sep)[0];
    const slug = '/' + relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
    
    activeSlugs.push(slug);

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) continue;
      
      // Fixed Logic: Check against base routes without forcing trailing slash
      const isValid = AUTHORIZED_PREFIXES.some(prefix => url.startsWith(prefix));
      if (!isValid) {
        console.log(chalk.red(`⚠️  [REGRESSION] ${relativePath}: Invalid Link "${url}"`));
        regressionCount++;
      }
    }

    return prisma.contentMetadata.upsert({
      where: { slug },
      update: {
        title: data.title || path.basename(file, path.extname(file)),
        classification: 'RESTRICTED',
        contentType: mapContentType(folder),
        metadata: data,
        updatedAt: new Date(),
      },
      create: {
        slug,
        title: data.title || path.basename(file, path.extname(file)),
        classification: 'RESTRICTED',
        contentType: mapContentType(folder),
        metadata: data,
        summary: data.description || data.excerpt || null,
        version: "1.0.0"
      },
    });
  });

  if (regressionCount > 0) {
    console.log(chalk.red(`\n❌ SYNC ABORTED: ${regressionCount} institutional path regressions found.`));
    process.exit(1);
  }

  try {
    const results = await prisma.$transaction(operations);
    console.log(chalk.green(`✅ [DATABASE]: ${results.length} records synchronized.`));
    await prisma.contentMetadata.deleteMany({ where: { slug: { notIn: activeSlugs } } });
  } catch (error) {
    console.error(chalk.red("❌ [CRITICAL FAILURE]:"), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

masterSync();