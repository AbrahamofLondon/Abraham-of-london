type MetaProps = {
  iso: string;           // "YYYY-MM-DD" or full ISO with time
  location: string;
  durationMins?: number; // default 90
  tz?: string;           // default "Europe/London"
};

export function EventMeta({ iso, location, durationMins = 90, tz = "Europe/London" }: MetaProps) {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = isDateOnly ? null : new Date(iso);

  const dayFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: tz,
  });
  const dateOnly = isDateOnly ? dayFmt.format(new Date(iso + "T00:00:00Z")) : null;

  const dateTime = !isDateOnly && d
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short", timeZone: tz,
      }).format(d)
    : null;

  const endFmt = !isDateOnly && d
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short", timeZone: tz,
      }).format(new Date(d.getTime() + durationMins * 60_000))
    : null;

  return (
    <div className="mt-2 grid gap-1 text-sm text-neutral-600">
      <div>
        <span className="font-semibold">When:</span>{" "}
        {isDateOnly && dateOnly ? dateOnly : `${dateTime} – ${endFmt}`}
      </div>
      <div><span className="font-semibold">Where:</span> {location}</div>
    </div>
  );
}
