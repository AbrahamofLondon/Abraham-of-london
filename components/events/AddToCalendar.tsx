"use client";

type Props = {
  title: string;
  description: string;
  isoStart: string;             // ISO with offset
  durationMins?: number;        // default 90
  location: string;
  url?: string;                 // canonical event URL
};

export function AddToCalendar({ title, description, isoStart, durationMins = 90, location, url }: Props) {
  const start = new Date(isoStart);
  const end = new Date(start.getTime() + durationMins * 60_000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toCal = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Abraham of London//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    `DTSTAMP:${toCal(new Date())}`,
    `DTSTART:${toCal(start)}`,
    `DTEND:${toCal(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}${url ? `\\n${url}` : ""}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const href = typeof window !== "undefined" ? URL.createObjectURL(blob) : "#";

  // Google Calendar link
  const g = new URL("https://www.google.com/calendar/render");
  g.searchParams.set("action", "TEMPLATE");
  g.searchParams.set("text", title);
  g.searchParams.set("details", `${description}${url ? `\n${url}` : ""}`);
  g.searchParams.set("location", location);
  g.searchParams.set("dates", `${toCal(start)}/${toCal(end)}`);

  return (
    <div className="mt-4 flex gap-3">
      <a download={`${title.replace(/\s+/g, "-").toLowerCase()}.ics`} href={href} className="rounded-xl border px-3 py-2 text-sm font-medium">
        Add to Calendar (.ics)
      </a>
      <a href={g.toString()} target="_blank" rel="noopener" className="rounded-xl border px-3 py-2 text-sm font-medium">
        Add to Google
      </a>
    </div>
  );
}
