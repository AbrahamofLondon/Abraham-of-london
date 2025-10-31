// lib/date.ts

// --- Type Definitions ---

export type FormatDateOptions = {
  locale?: string;
  timeZone?: string; // e.g. "Europe/London"
  format?: Intl.DateTimeFormatOptions;
  invalidFallback?: string; // default: "Invalid Date"
};

// --- Constants ---

const DEFAULT_LOCALE = "en-GB";
const DEFAULT_FALLBACK = "Invalid Date";
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * Safely determines the timezone, prioritizing the user's explicit option, 
 * falling back to the environment variable, and then undefined (system default).
 */
export function getSafeTimeZone(timeZone?: string): string | undefined {
  if (timeZone) return timeZone;
  // Fallback to a common environment variable used in Next.js/Vercel setups
  if (process.env.TZ) return process.env.TZ;
  return undefined; // Uses system default (browser or Node runtime)
}


// --- Parsing Utility ---

/**
 * Safely parses various inputs into a Date object or returns null if invalid.
 * Key improvement: Explicitly handles ISO date-only strings (YYYY-MM-DD) as UTC
 * to prevent local timezone construction shifts.
 * * @param input The date input (Date, number/timestamp, or string).
 * @returns A valid Date object or null.
 */
export function parseDateSafe(input: string | number | Date): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === "number") {
    // Treat numbers as milliseconds since epoch
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    // 1. ISO date-only (YYYY-MM-DD): construct as UTC midnight
    const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [_, y, mo, d] = dateOnlyMatch;
      // Month is 0-indexed in Date.UTC
      const dUTC = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
      return isNaN(dUTC.getTime()) ? null : dUTC;
    }
    
    // 2. Full ISO or other recognized format: rely on native parser
    const t = Date.parse(input);
    return Number.isNaN(t) ? null : new Date(t);
  }

  return null;
}


// --- Formatting Utility ---

/**
 * Formats a date input (string, number, or Date) into a localized, human-readable string.
 *
 * @param dateInput The date to format.
 * @param options Formatting options, including locale, timeZone, and format structure.
 * @returns The formatted date string.
 */
export function formatDate(
  dateInput: string | number | Date,
  {
    locale = DEFAULT_LOCALE,
    timeZone,
    format,
    invalidFallback = DEFAULT_FALLBACK,
  }: FormatDateOptions = {},
): string {
  const d = parseDateSafe(dateInput);

  // Return fallback if parsing failed
  if (!d) return invalidFallback;

  // Build the final options object
  const opts: Intl.DateTimeFormatOptions = {
    ...DEFAULT_DATE_FORMAT,
    ...format,
  };

  // Set timezone, prioritizing options.timeZone, then process.env.TZ
  const safeTimeZone = getSafeTimeZone(timeZone);
  if (safeTimeZone) opts.timeZone = safeTimeZone;

  // Use the browser's Intl API for formatting
  try {
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch (e) {
    console.error("Error formatting date:", e);
    return invalidFallback;
  }
}

/**
 * Convenience function to format a date including time.
 */
export function formatDateTime(
    dateInput: string | number | Date,
    options: FormatDateOptions = {},
): string {
    const defaultTimeFormat: Intl.DateTimeFormatOptions = {
        ...DEFAULT_DATE_FORMAT,
        hour: "numeric",
        minute: "numeric",
        hour12: true, // Example default, can be overridden
    };

    return formatDate(dateInput, {
        ...options,
        format: {
            ...defaultTimeFormat,
            ...(options.format || {}),
        }
    });
}