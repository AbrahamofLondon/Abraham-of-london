// lib/pricing/event-pricing.ts
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

// Fallback static pricing matrix (used if no dynamic prices exist)
const FALLBACK_PRICE_MATRIX: Record<string, Record<string, number>> = {
  'briefing-omega': {
    'verified': 15000,
    'member': 12500,
    'public': 15000,
    'restricted': 20000,
    'top-secret': 25000,
  },
  'briefing-alpha': {
    'verified': 10000,
    'member': 7500,
    'public': 10000,
    'restricted': 15000,
    'top-secret': 20000,
  },
  'leadership-workshop': {
    'verified': 7500,
    'member': 5000,
    'public': 7500,
    'restricted': 10000,
    'top-secret': 15000,
  },
  'founders-salon': {
    'verified': 5000,
    'member': 3500,
    'public': 5000,
    'restricted': 7500,
    'top-secret': 10000,
  },
};

// Default pricing per tier if event/tier not found
// Use 'as const' to ensure TypeScript knows these values exist
const DEFAULT_TIER_PRICES = {
  'public': 5000,
  'member': 4500,
  'verified': 7500,
  'restricted': 10000,
  'top-secret': 15000,
} as const;

// Valid tier types
const VALID_TIERS = ['public', 'member', 'verified', 'restricted', 'top-secret'] as const;
type TierType = typeof VALID_TIERS[number];

// Type guard to check if a string is a valid tier
function isValidTier(tier: string): tier is TierType {
  return VALID_TIERS.includes(tier as TierType);
}

// Safe getter for default prices
function getDefaultPrice(tier: string): number {
  if (isValidTier(tier)) {
    return DEFAULT_TIER_PRICES[tier];
  }
  // Fallback to public if invalid tier
  return DEFAULT_TIER_PRICES.public;
}

/**
 * Get event price from database (cached for performance)
 * This is the SINGLE SOURCE OF TRUTH for pricing
 */
export const getEventPrice = cache(async (
  eventId: string, 
  ticketId: string
): Promise<number> => {
  try {
    // Normalize inputs
    const normalizedEventId = eventId.toLowerCase();
    const normalizedTicketId = ticketId.toLowerCase();

    // Validate ticketId is a valid tier
    if (!isValidTier(normalizedTicketId)) {
      console.warn(`[PRICING] Invalid ticket tier: ${ticketId}, falling back to public`);
      return getDefaultPrice('public');
    }

    // 1. Try to get from database (configured via EventPriceManager)
    const dbPrice = await prisma.eventPrice.findUnique({
      where: {
        eventId_ticketId: {
          eventId: normalizedEventId,
          ticketId: normalizedTicketId,
        },
      },
    });

    if (dbPrice?.price && dbPrice.price > 0) {
      console.log(`[PRICING] Using DB price for ${eventId}/${ticketId}: £${(dbPrice.price/100).toFixed(2)}`);
      return dbPrice.price;
    }

    // 2. Fallback to static matrix
    if (FALLBACK_PRICE_MATRIX[normalizedEventId]?.[normalizedTicketId]) {
      const price = FALLBACK_PRICE_MATRIX[normalizedEventId][normalizedTicketId];
      console.log(`[PRICING] Using fallback matrix price for ${eventId}/${ticketId}: £${(price/100).toFixed(2)}`);
      return price;
    }

    // 3. Ultimate fallback - tier-based default
    const defaultPrice = getDefaultPrice(normalizedTicketId);
    console.log(`[PRICING] Using default tier price for ${eventId}/${ticketId}: £${(defaultPrice/100).toFixed(2)}`);
    return defaultPrice;

  } catch (error) {
    console.error(`[PRICING ERROR] Failed to get price for ${eventId}/${ticketId}:`, error);
    // Safe fallback - return default public price
    return getDefaultPrice('public');
  }
});

/**
 * Get all event prices (for EventPriceManager)
 * Returns data organized by eventId with tier prices
 */
export async function getAllEventPrices() {
  try {
    const dbPrices = await prisma.eventPrice.findMany({
      orderBy: [
        { eventId: 'asc' },
        { ticketId: 'asc' },
      ],
    });
    
    // Transform to the format expected by the admin UI
    const priceMap: Record<string, Record<string, { price: number; updatedBy?: string | null; updatedAt: Date }>> = {};
    
    dbPrices.forEach(({ eventId, ticketId, price, updatedBy, updatedAt }) => {
      if (!priceMap[eventId]) {
        priceMap[eventId] = {};
      }
      priceMap[eventId][ticketId] = { price, updatedBy, updatedAt };
    });
    
    return priceMap;
  } catch (error) {
    console.error('[PRICING ERROR] Failed to get all prices:', error);
    return {};
  }
}

/**
 * Update event price (called from EventPriceManager)
 */
export async function updateEventPrice(
  eventId: string,
  ticketId: string,
  price: number,
  updatedBy?: string
): Promise<boolean> {
  try {
    // Validate price (must be in pence, positive, and within reasonable range)
    if (price < 0 || price > 1000000) {
      throw new Error(`Price must be between £0 and £10,000`);
    }

    // Validate ticketId
    if (!isValidTier(ticketId)) {
      throw new Error(`Invalid ticket tier: ${ticketId}`);
    }

    // If this is a verified tier, ensure it's >= member price (institutional rule)
    if (ticketId === 'verified') {
      // Get member price for this event to validate
      const memberPrice = await prisma.eventPrice.findUnique({
        where: {
          eventId_ticketId: {
            eventId: eventId.toLowerCase(),
            ticketId: 'member',
          },
        },
      });
      
      if (memberPrice && price < memberPrice.price) {
        throw new Error('Verified tier price must be greater than or equal to Member tier');
      }
    }

    await prisma.eventPrice.upsert({
      where: {
        eventId_ticketId: {
          eventId: eventId.toLowerCase(),
          ticketId: ticketId.toLowerCase(),
        },
      },
      update: {
        price,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        eventId: eventId.toLowerCase(),
        ticketId: ticketId.toLowerCase(),
        price,
        updatedBy,
      },
    });

    console.log(`[PRICING] Updated ${eventId}/${ticketId} to £${(price/100).toFixed(2)} by ${updatedBy || 'system'}`);
    
    return true;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to update price for ${eventId}/${ticketId}:`, error);
    throw error; // Re-throw for API to handle
  }
}

/**
 * Update multiple prices for an event atomically
 */
export async function updateEventPrices(
  eventId: string,
  prices: Array<{ ticketId: string; price: number }>,
  updatedBy?: string
): Promise<boolean> {
  try {
    // Use a transaction to ensure atomic updates
    await prisma.$transaction(
      prices.map(({ ticketId, price }) =>
        prisma.eventPrice.upsert({
          where: {
            eventId_ticketId: {
              eventId: eventId.toLowerCase(),
              ticketId: ticketId.toLowerCase(),
            },
          },
          update: {
            price,
            updatedBy,
            updatedAt: new Date(),
          },
          create: {
            eventId: eventId.toLowerCase(),
            ticketId: ticketId.toLowerCase(),
            price,
            updatedBy,
          },
        })
      )
    );

    console.log(`[PRICING] Batch updated ${prices.length} prices for ${eventId}`);
    return true;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to batch update prices for ${eventId}:`, error);
    throw error;
  }
}

/**
 * Delete event price (revert to fallback)
 */
export async function deleteEventPrice(eventId: string, ticketId: string): Promise<boolean> {
  try {
    await prisma.eventPrice.delete({
      where: {
        eventId_ticketId: {
          eventId: eventId.toLowerCase(),
          ticketId: ticketId.toLowerCase(),
        },
      },
    });
    
    console.log(`[PRICING] Deleted price override for ${eventId}/${ticketId}`);
    return true;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to delete price for ${eventId}/${ticketId}:`, error);
    return false;
  }
}

/**
 * Delete all prices for an event (revert to fallback)
 */
export async function deleteEventAllPrices(eventId: string): Promise<boolean> {
  try {
    await prisma.eventPrice.deleteMany({
      where: {
        eventId: eventId.toLowerCase(),
      },
    });
    
    console.log(`[PRICING] Deleted all price overrides for ${eventId}`);
    return true;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to delete prices for ${eventId}:`, error);
    return false;
  }
}

/**
 * Get all available events (for dropdown in admin UI)
 */
export async function getAllEvents() {
  try {
    // Get unique eventIds from database
    const dbEvents = await prisma.eventPrice.findMany({
      select: { eventId: true },
      distinct: ['eventId'],
    });
    
    // Get events from fallback matrix
    const matrixEvents = Object.keys(FALLBACK_PRICE_MATRIX);
    
    // Combine and deduplicate
    const eventSet = new Set([
      ...dbEvents.map(e => e.eventId),
      ...matrixEvents,
    ]);
    
    return Array.from(eventSet).sort();
  } catch (error) {
    console.error('[PRICING ERROR] Failed to get events:', error);
    return Object.keys(FALLBACK_PRICE_MATRIX).sort();
  }
}

/**
 * Get prices for a specific event (for admin UI)
 */
export async function getEventPrices(eventId: string) {
  try {
    const normalizedEventId = eventId.toLowerCase();
    
    // Get from database
    const dbPrices = await prisma.eventPrice.findMany({
      where: { eventId: normalizedEventId },
    });
    
    // Create price map
    const priceMap: Record<string, { price: number; isOverridden: boolean; updatedBy?: string | null; updatedAt?: Date }> = {};
    
    // Add database prices (overrides)
    dbPrices.forEach(({ ticketId, price, updatedBy, updatedAt }) => {
      priceMap[ticketId] = {
        price,
        isOverridden: true,
        updatedBy,
        updatedAt,
      };
    });
    
    // Add fallback prices for missing tiers
    const matrixPrices = FALLBACK_PRICE_MATRIX[normalizedEventId];
    VALID_TIERS.forEach(tier => {
      if (!priceMap[tier]) {
        // Try matrix first, then default
        const fallbackPrice = matrixPrices?.[tier] || getDefaultPrice(tier);
        priceMap[tier] = {
          price: fallbackPrice,
          isOverridden: false,
        };
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to get prices for ${eventId}:`, error);
    return null;
  }
}