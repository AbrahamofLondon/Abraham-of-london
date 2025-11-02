// utils/events.ts
import { dayKey, isMidnightLocal, localMinutes } from "./dates";

export type EventLite = {
  slug: string;
  title: string;
  date: string;
  location?: string | null;
  summary?: string | null;
};

function normTitle(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Dedupe by (normalized title + same calendar day in London).
 * Preference order:
 *   1) Non-midnight wins over midnight.
 *   2) If both non-midnight, the earlier local time wins.
 *   3) If both midnight, keep the first.
 */
export function dedupeEventsByTitleAndDay<T extends EventLite>(
  items: T[],
  tz = "Europe/London"
): T[] {
  const map = new Map<string, T>();

  for (const ev of items) {
    if (!ev?.title || !ev?.date) continue;
    const key = `${normTitle(ev.title)}|${dayKey(ev.date, tz)}`;
    if (!key.endsWith("|")) {
      const existing = map.get(key);
      if (!existing) {
        map.set(key, ev);
      } else {
        const aMid = isMidnightLocal(existing.date, tz);
        const bMid = isMidnightLocal(ev.date, tz);

        if (aMid && !bMid) {
          map.set(key, ev);
        } else if (!aMid && !bMid) {
          // both non-midnight → earlier time wins
          const aMin = localMinutes(existing.date, tz);
          const bMin = localMinutes(ev.date, tz);
          if (bMin < aMin) map.set(key, ev);
        }
        // else keep existing
      }
    }
  }

  // Also remove exact slug duplicates across different groups
  const seenSlugs = new Set<string>();
  const out: T[] = [];
  // ✅ Avoid downlevel iteration issue
  Array.from(map.values()).forEach((ev) => {
    if (seenSlugs.has(ev.slug)) return;
    seenSlugs.add(ev.slug);
    out.push(ev);
  });

  return out;
}
