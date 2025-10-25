// lib/date.ts
export type FormatDateOptions = {
  locale?: string;
  timeZone?: string; // e.g. "Europe/London"
  format?: Intl.DateTimeFormatOptions;
  invalidFallback?: string; // default: "Invalid Date"
};

function parseDateSafe(input: string | number | Date): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    // ISO date-only (YYYY-MM-DD) Ãƒ¢Ã¢â‚¬Ã¢â‚¬â„¢ construct as UTC midnight to avoid TZ shifts
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, y, mo, d] = m;
      const dUTC = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
      return isNaN(dUTC.getTime()) ? null : dUTC;
    }
    // Fallback to native parsing (handles full ISO w/ time)
    const t = Date.parse(input);
    return Number.isNaN(t) ? null : new Date(t);
  }
  return null;
}

export function formatDate(
  dateInput: string | number | Date,
  {
    locale = "en-GB",
    timeZone, // if omitted, browser/Node default TZ is used
    format,
    invalidFallback = "Invalid Date",
  }: FormatDateOptions = {},
): string {
  const d = parseDateSafe(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : invalidFallback;

  const opts: Intl.DateTimeFormatOptions = format ?? {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (timeZone) opts.timeZone = timeZone;

  return new Intl.DateTimeFormat(locale, opts).format(d);
}
