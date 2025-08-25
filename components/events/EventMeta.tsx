type MetaProps = {
  iso: string;           // e.g. "2026-09-12T10:00:00+01:00"
  location: string;      // "London, UK"
  durationMins?: number; // default 90
  tz?: string;           // default "Europe/London"
};

export function EventMeta({ iso, location, durationMins = 90, tz = "Europe/London" }: MetaProps) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short", timeZone: tz,
  }).format(d);

  const end = new Date(d.getTime() + durationMins * 60_000);
  const endFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short", timeZone: tz,
  }).format(end);

  return (
    <div className="mt-2 grid gap-1 text-sm text-neutral-600">
      <div><span className="font-semibold">When:</span> {fmt} – {endFmt}</div>
      <div><span className="font-semibold">Where:</span> {location}</div>
    </div>
  );
}
