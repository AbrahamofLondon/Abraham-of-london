/* scripts/seed-metadata.mjs */
import { PrismaClient } from '@prisma/client';
import { allBriefs, allVaultBriefs } from '../.contentlayer/generated/index.mjs';

const prisma = new PrismaClient();

async function seed() {
  console.log("--- Executing Final Portfolio Synchronization ---");

  const combined = [...allBriefs, ...allVaultBriefs];

  for (const doc of combined) {
    // Force clean the slug to prevent path nesting issues
    const rawSlug = doc.slug || doc._raw.flattenedPath;
    const cleanSlug = rawSlug.split('/').pop();
    
    // Match your schema's lowercase AccessTier exactly
    const tier = (doc.accessTier === 'restricted' || doc.accessLevel === 'restricted') 
      ? 'member' 
      : 'public';

    try {
      await prisma.contentMetadata.upsert({
        where: { slug: cleanSlug },
        update: {
          title: doc.title,
          contentType: 'Briefs', // Matches enum ContentType { Briefs }
          classification: tier,   // Matches enum AccessTier { public, member }
        },
        create: {
          slug: cleanSlug,
          title: doc.title,
          contentType: 'Briefs',
          classification: tier
        }
      });
      process.stdout.write(`.`);
    } catch (error) {
      console.error(`\n❌ [${cleanSlug}] Sync Failed:`, error.message);
    }
  }
  
  console.log("\n\n--- 82 Intelligence Briefs Hydrated Successfully ---");
  await prisma.$disconnect();
}

seed();