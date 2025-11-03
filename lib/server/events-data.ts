// lib/server/events-data.ts (FINAL ROBUST VERSION)

import { allEvents } from "contentlayer/generated";
import type { EventMeta, EventResources } from "@/types/event"; 

export function getAllEvents(fields?: string[]): EventMeta[] {
    const events: EventMeta[] = allEvents.map(event => {
        const { 
            slug, 
            title, 
            date, 
            location, 
            summary, 
            chatham, 
            tags, 
            resources, 
            ...rest 
        } = event;
        
        return {
            ...rest, 
            slug: slug ?? '', 
            title: title ?? 'Untitled Event', 
            date: date ?? new Date().toISOString(), 
            location: location ?? null, 
            summary: summary ?? null, 
            chatham: chatham ?? false, 
            tags: Array.isArray(tags) ? tags : null, 
            resources: (resources as EventResources) ?? null, 
        } as EventMeta; 
    });
    return events.sort((a, b) => (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
}

export function getEventSlugs(): string[] {
    const events = getAllEvents([]); 
    if (!Array.isArray(events)) return []; 
    return events.map((event) => event.slug).filter(Boolean);
}

export function getEventBySlug(slug: string, fields?: string[]): (EventMeta & { content?: string }) | null {
    const doc = allEvents.find((event) => event.slug === slug) || null;
    
    if (doc) {
        const { 
            slug: docSlug, 
            title, 
            date, 
            location, 
            summary, 
            chatham, 
            tags, 
            resources,
            body, 
            ...rest 
        } = doc;

        const anyBody = body as unknown as { code?: string; raw?: string; html?: string };
        const mdxOrMd = anyBody?.code ?? anyBody?.raw ?? anyBody?.html ?? "";

        return {
            ...rest,
            slug: docSlug ?? '',
            title: title ?? 'Untitled Event',
            date: date ?? new Date().toISOString(),
            location: location ?? null,
            summary: summary ?? null,
            tags: Array.isArray(tags) ? tags : null,
            content: mdxOrMd, 
            resources: (resources as EventResources) ?? null,
        } as EventMeta & { content?: string };
    }
    return null;
}

function dateKey(d: string): string {
  if (!d || typeof d !== 'string') return "";
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
    const seen = new Set<string>();
    const out: EventMeta[] = [];
    if (!Array.isArray(events)) return [];
    for (const ev of events) {
        const title = String(ev.title || "").trim().toLowerCase().replace(/\s+/g, " ");
        const key = `${title}::${dateKey(String(ev.date || ""))}`;
        if (!seen.has(key)) {
            seen.add(key);
            out.push(ev);
        }
    }
    return out;
}

export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
    if (!Array.isArray(events)) return { downloads: 0, reads: 0 };
    return events.reduce(
        (acc, event) => ({
            downloads: acc.downloads + (event.resources?.downloads?.length || 0),
            reads: acc.reads + (event.resources?.reads?.length || 0),
        }),
        { downloads: 0, reads: 0 }
    );
}