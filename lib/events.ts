// lib/events.ts
// Thin facade over server-side loaders to keep imports stable and App Router friendly.

export {
  getEventSlugs,
  getEventBySlug,
  getAllEvents,
  getEventsBySlugs,
  getAllContent,
  dedupeEventsByTitleAndDay,
  getEventResourcesSummary,
} from "@/lib/server/events-data";

export type {
  EventMeta,
  EventResources,
  EventResourceLink,
} from "@/lib/server/events-data";