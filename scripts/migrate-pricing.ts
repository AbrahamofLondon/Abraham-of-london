// scripts/migrate-pricing.ts
import { prisma } from '@/lib/prisma';

async function migratePricing() {
  console.log('Starting pricing migration to new schema...');

  // If you had the old EventPricing model with columns, migrate it
  try {
    // @ts-ignore - This is for migration only
    const oldPricing = await prisma.eventPricing.findMany();
    
    for (const old of oldPricing) {
      // Migrate verified price
      if (old.verified) {
        await prisma.eventPrice.upsert({
          where: {
            eventId_ticketId: {
              eventId: old.eventId,
              ticketId: 'verified',
            },
          },
          update: { price: old.verified },
          create: {
            eventId: old.eventId,
            ticketId: 'verified',
            price: old.verified,
            updatedBy: old.updatedBy,
          },
        });
      }

      // Migrate member price
      if (old.member) {
        await prisma.eventPrice.upsert({
          where: {
            eventId_ticketId: {
              eventId: old.eventId,
              ticketId: 'member',
            },
          },
          update: { price: old.member },
          create: {
            eventId: old.eventId,
            ticketId: 'member',
            price: old.member,
            updatedBy: old.updatedBy,
          },
        });
      }

      // Migrate public price
      if (old.public) {
        await prisma.eventPrice.upsert({
          where: {
            eventId_ticketId: {
              eventId: old.eventId,
              ticketId: 'public',
            },
          },
          update: { price: old.public },
          create: {
            eventId: old.eventId,
            ticketId: 'public',
            price: old.public,
            updatedBy: old.updatedBy,
          },
        });
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migratePricing();