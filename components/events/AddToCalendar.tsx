// components/events/AddToCalendar.tsx
"use client";

import * as React from "react";

interface EventLike {
  title?: string;
  start?: string; // ISO date
  end?: string;
  location?: string;
  description?: string;
}

export interface AddToCalendarProps {
  event: EventLike;
}

export default function AddToCalendar({ event }: AddToCalendarProps) {
  if (!event?.title || !event?.start) return null;

  const start = encodeURIComponent(event.start);
  const end = encodeURIComponent(event.end ?? event.start);
  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description ?? "");
  const location = encodeURIComponent(event.location ?? "");

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;

  return (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gold hover:bg-gold/20"
    >
      Add to Calendar
    </a>
  );
}
