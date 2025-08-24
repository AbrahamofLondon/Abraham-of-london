// utils/dates.ts

// "YYYY-MM-DD" for a given ISO and TZ (default London)
export function dayKey(iso: string, tz = "Europe/London"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "invalid";
  // en-CA gives predictable YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function isMidnightLocal(iso: string, tz = "Europe/London"): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return false;
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );
  return hh === 0 && mm === 0;
}

export function localMinutes(iso: string, tz = "Europe/London"): number {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return Number.POSITIVE_INFINITY;
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );
  return hh * 60 + mm;
}

// Pretty date; hides 00:00
export function formatPretty(iso: string, tz = "Europe/London"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);

  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );

  if (hh === 0 && mm === 0) return date;

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return `${date}, ${time}`;
}
