import { getAllEvents } from "@/lib/events";
import type { EventMeta } from "@/lib/events";

export async function getEventSlugs(): Promise<string[]> {
  return getAllEvents().map(e => e.slug);
}
export async function getAllEventsAsync(): Promise<EventMeta[]> {
  return getAllEvents();
}
export async function getEventBySlug(slug: string): Promise<EventMeta | null> {
  const all = getAllEvents();
  return all.find(e => e.slug === slug) ?? null;
}
