// lib/events.ts - PRODUCTION SAFE VERSION
import { allEvents } from "contentlayer/generated";

// Type-safe fallback for Event type
interface SafeEvent {
  _id: string;
  title: string;
  slug: string;
  date: string;
  location: string;
  summary: string;
  url: string;
  time?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Safely get all events with comprehensive error handling
 */
export function getAllEvents(): SafeEvent[] {
  try {
    if (typeof allEvents === 'undefined') {
      console.warn('⚠️ ContentLayer events data is undefined - returning empty array');
      return [];
    }

    if (!Array.isArray(allEvents)) {
      console.error('❌ ContentLayer events is not an array:', typeof allEvents);
      return [];
    }

    const safeEvents = allEvents.filter((event): event is SafeEvent => {
      const isValid = event && 
                     typeof event === 'object' &&
                     typeof event._id === 'string' &&
                     typeof event.title === 'string' &&
                     typeof event.slug === 'string' &&
                     typeof event.date === 'string' &&
                     typeof event.location === 'string' &&
                     typeof event.summary === 'string' &&
                     typeof event.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid event:', event);
      }

      return isValid;
    });

    if (safeEvents.length !== allEvents.length) {
      console.warn(`🔄 Filtered ${allEvents.length - safeEvents.length} invalid events`);
    }

    return safeEvents;

  } catch (error) {
    console.error('💥 Critical error in getAllEvents:', error);
    return [];
  }
}

/**
 * Get upcoming events (future dates)
 */
export function getUpcomingEvents(): SafeEvent[] {
  try {
    const now = new Date();
    return getAllEvents()
      .filter(event => {
        try {
          return new Date(event.date) >= now;
        } catch {
          console.warn(`📅 Invalid date for event "${event.title}": ${event.date}`);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch {
          return 0;
        }
      });

  } catch (error) {
    console.error('💥 Error getting upcoming events:', error);
    return [];
  }
}

/**
 * Get past events (past dates)
 */
export function getPastEvents(): SafeEvent[] {
  try {
    const now = new Date();
    return getAllEvents()
      .filter(event => {
        try {
          return new Date(event.date) < now;
        } catch {
          console.warn(`📅 Invalid date for event "${event.title}": ${event.date}`);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch {
          return 0;
        }
      });

  } catch (error) {
    console.error('💥 Error getting past events:', error);
    return [];
  }
}

/**
 * Safely get an event by slug with fallbacks
 */
export function getEventBySlug(slug: string): SafeEvent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getEventBySlug:', slug);
      return null;
    }

    const events = getAllEvents();
    const event = events.find(event => event.slug === slug);

    if (!event) {
      console.warn(`🔍 Event not found for slug: "${slug}"`);
      return null;
    }

    return event;

  } catch (error) {
    console.error(`💥 Error finding event with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Deduplicate events by title and day - MISSING FUNCTION THAT CAUSED BUILD ERROR
 */
export function dedupeEventsByTitleAndDay(events: SafeEvent[]): SafeEvent[] {
  try {
    if (!Array.isArray(events)) {
      console.warn('⚠️ dedupeEventsByTitleAndDay received non-array input');
      return [];
    }

    const seen = new Map();
    
    return events.filter(event => {
      try {
        if (!event || !event.title || !event.date) {
          console.warn('⚠️ Skipping invalid event in deduplication:', event);
          return false;
        }

        // Create a unique key based on title and date (day only)
        const eventDate = new Date(event.date);
        const dayKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const uniqueKey = `${event.title.toLowerCase()}-${dayKey}`;

        if (seen.has(uniqueKey)) {
          return false;
        }
        
        seen.set(uniqueKey, true);
        return true;
      } catch (error) {
        console.warn('⚠️ Error processing event in deduplication:', error);
        return false;
      }
    });
  } catch (error) {
    console.error('💥 Critical error in dedupeEventsByTitleAndDay:', error);
    return events; // Return original array as fallback
  }
}

// Export types for use in other files
export type { SafeEvent as Event };