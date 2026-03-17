// lib/pricing/event-pricing.ts
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

// Check if prisma is available and has the eventPrice model
if (!prisma || !('eventPrice' in prisma)) {
  console.warn('[PRICING WARNING] EventPrice model not found in Prisma client. Run `npx prisma generate`');
}

// Fallback static pricing matrix (used if no dynamic prices exist)
// All prices are in GBP pence (e.g., 15000 = £150.00)
const FALLBACK_PRICE_MATRIX: Record<string, Record<string, number>> = {
  'briefing-omega': {
    'public': 15000,
    'member': 12500,
    'verified': 15000,
    'restricted': 20000,
    'top-secret': 25000,
  },
  'briefing-alpha': {
    'public': 10000,
    'member': 7500,
    'verified': 10000,
    'restricted': 15000,
    'top-secret': 20000,
  },
  'leadership-workshop': {
    'public': 7500,
    'member': 5000,
    'verified': 7500,
    'restricted': 10000,
    'top-secret': 15000,
  },
  'founders-salon': {
    'public': 5000,
    'member': 3500,
    'verified': 5000,
    'restricted': 7500,
    'top-secret': 10000,
  },
};

// Default pricing per tier if event/tier not found (GBP pence)
const DEFAULT_TIER_PRICES = {
  'public': 5000,        // £50.00
  'member': 4500,        // £45.00
  'verified': 7500,      // £75.00
  'restricted': 10000,   // £100.00
  'top-secret': 15000,   // £150.00
} as const;

// Valid tier types (must match AccessTier from contentlayer)
const VALID_TIERS = ['public', 'member', 'verified', 'restricted', 'top-secret'] as const;
export type TierType = typeof VALID_TIERS[number];

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

// Format price from pence to GBP string
export function formatPriceGBP(priceInPence: number): string {
  return `£${(priceInPence / 100).toFixed(2)}`;
}

// Parse price from GBP string to pence
export function parsePriceGBP(priceString: string): number {
  // Remove £ symbol and convert to pence
  const cleaned = priceString.replace(/[^0-9.]/g, '');
  const pounds = parseFloat(cleaned) || 0;
  return Math.round(pounds * 100);
}

/**
 * Get event price from database (cached for performance)
 * This is the SINGLE SOURCE OF TRUTH for pricing
 * Returns price in GBP pence
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

    // Try to get from database if model exists
    let dbPrice = null;
    try {
      // Check if eventPrice model exists on prisma
      if (prisma && 'eventPrice' in prisma) {
        dbPrice = await (prisma as any).eventPrice.findUnique({
          where: {
            eventId_ticketId: {
              eventId: normalizedEventId,
              ticketId: normalizedTicketId,
            },
          },
        });
      }
    } catch (dbError) {
      console.warn(`[PRICING] Database error (using fallback):`, dbError);
    }

    if (dbPrice?.price && dbPrice.price > 0) {
      console.log(`[PRICING] Using DB price for ${eventId}/${ticketId}: ${formatPriceGBP(dbPrice.price)}`);
      return dbPrice.price;
    }

    // 2. Fallback to static matrix
    if (FALLBACK_PRICE_MATRIX[normalizedEventId]?.[normalizedTicketId]) {
      const price = FALLBACK_PRICE_MATRIX[normalizedEventId][normalizedTicketId];
      console.log(`[PRICING] Using fallback matrix price for ${eventId}/${ticketId}: ${formatPriceGBP(price)}`);
      return price;
    }

    // 3. Ultimate fallback - tier-based default
    const defaultPrice = getDefaultPrice(normalizedTicketId);
    console.log(`[PRICING] Using default tier price for ${eventId}/${ticketId}: ${formatPriceGBP(defaultPrice)}`);
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
    // Try to get from database if model exists
    let dbPrices: any[] = [];
    try {
      if (prisma && 'eventPrice' in prisma) {
        dbPrices = await (prisma as any).eventPrice.findMany({
          orderBy: [
            { eventId: 'asc' },
            { ticketId: 'asc' },
          ],
        });
      }
    } catch (dbError) {
      console.warn('[PRICING] Database error in getAllEventPrices:', dbError);
    }
    
    // Transform to the format expected by the admin UI
    const priceMap: Record<string, Record<string, { 
      price: number; 
      updatedBy?: string | null; 
      updatedAt: Date;
      isOverridden: boolean;
    }>> = {};
    
    // Add database prices (overrides)
    dbPrices.forEach(({ eventId, ticketId, price, updatedBy, updatedAt }) => {
      if (!priceMap[eventId]) {
        priceMap[eventId] = {};
      }
      priceMap[eventId][ticketId] = { 
        price, 
        updatedBy, 
        updatedAt,
        isOverridden: true 
      };
    });
    
    // Add fallback prices for any missing events/tiers
    const allEvents = new Set([
      ...Object.keys(FALLBACK_PRICE_MATRIX),
      ...Object.keys(priceMap)
    ]);
    
    allEvents.forEach(eventId => {
      // SAFETY CHECK: Ensure the event object exists
      if (!priceMap[eventId]) {
        priceMap[eventId] = {};
      }
      
      // Now TypeScript knows priceMap[eventId] is defined
      const eventPrices = priceMap[eventId];
      
      VALID_TIERS.forEach(tier => {
        // Check if this tier is missing
        if (!eventPrices[tier]) {
          // Try matrix first, then default
          const fallbackPrice = FALLBACK_PRICE_MATRIX[eventId]?.[tier] || getDefaultPrice(tier);
          eventPrices[tier] = { 
            price: fallbackPrice,
            updatedBy: null,
            updatedAt: new Date(),
            isOverridden: false
          };
        }
      });
    });
    
    return priceMap;
  } catch (error) {
    console.error('[PRICING ERROR] Failed to get all prices:', error);
    return {};
  }
}

/**
 * Get prices for a specific event (for admin UI)
 */
export async function getEventPrices(eventId: string) {
  try {
    const normalizedEventId = eventId.toLowerCase();
    
    // Get from database
    let dbPrices: any[] = [];
    try {
      if (prisma && 'eventPrice' in prisma) {
        dbPrices = await (prisma as any).eventPrice.findMany({
          where: { eventId: normalizedEventId },
        });
      }
    } catch (dbError) {
      console.warn('[PRICING] Database error in getEventPrices:', dbError);
    }
    
    // Create price map
    const priceMap: Record<string, { 
      price: number; 
      isOverridden: boolean; 
      updatedBy?: string | null; 
      updatedAt?: Date 
    }> = {};
    
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
          updatedBy: null,
          updatedAt: new Date(),
        };
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to get prices for ${eventId}:`, error);
    return null;
  }
}

/**
 * Update event price (called from EventPriceManager)
 * Price should be in GBP pence
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

    // Check if database model exists
    if (!prisma || !('eventPrice' in prisma)) {
      console.warn('[PRICING] EventPrice model not available, skipping database update');
      return false;
    }

    // If this is a verified tier, ensure it's >= member price (institutional rule)
    if (ticketId === 'verified') {
      // Get member price for this event to validate
      const memberPrice = await (prisma as any).eventPrice.findUnique({
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

    // Use upsert to create or update
    await (prisma as any).eventPrice.upsert({
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

    console.log(`[PRICING] Updated ${eventId}/${ticketId} to ${formatPriceGBP(price)} by ${updatedBy || 'system'}`);
    
    return true;
  } catch (error) {
    console.error(`[PRICING ERROR] Failed to update price for ${eventId}/${ticketId}:`, error);
    throw error;
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
    // Validate all prices first
    for (const { ticketId, price } of prices) {
      if (price < 0 || price > 1000000) {
        throw new Error(`Price for ${ticketId} must be between £0 and £10,000`);
      }
      if (!isValidTier(ticketId)) {
        throw new Error(`Invalid ticket tier: ${ticketId}`);
      }
    }

    // Check if database model exists
    if (!prisma || !('eventPrice' in prisma)) {
      console.warn('[PRICING] EventPrice model not available, skipping database update');
      return false;
    }

    // Use a transaction to ensure atomic updates
    await (prisma as any).$transaction(
      prices.map(({ ticketId, price }) =>
        (prisma as any).eventPrice.upsert({
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
    if (!prisma || !('eventPrice' in prisma)) {
      return false;
    }

    await (prisma as any).eventPrice.delete({
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
    if (!prisma || !('eventPrice' in prisma)) {
      return false;
    }

    await (prisma as any).eventPrice.deleteMany({
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
    let dbEvents: { eventId: string }[] = [];
    try {
      if (prisma && 'eventPrice' in prisma) {
        dbEvents = await (prisma as any).eventPrice.findMany({
          select: { eventId: true },
          distinct: ['eventId'],
        });
      }
    } catch (dbError) {
      console.warn('[PRICING] Database error in getAllEvents:', dbError);
    }
    
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