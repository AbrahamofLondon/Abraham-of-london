// components/DateFormatter.tsx
import * as React from "react";
import { format as dfFormat, parseISO, isValid as isValidDate } from "date-fns";
import type { Locale } from "date-fns";

interface DateFormatterProps {
  /** ISO string (preferred), timestamp (ms), or Date */
  dateString: string | number | Date;
  className?: string;
  /** date-fns format string (default 'PPP') */
  pattern?: string;
  /** Optional date-fns locale, e.g. import { enGB } from 'date-fns/locale' */
  locale?: Locale;
  /**
   * How to populate the <time dateTime> attribute:
   *  - 'iso'   => use parsedDate.toISOString() (default)
   *  - 'input' => use the original string if it looks ISO-ish, else ISO
   *  - false   => omit the attribute
   */
  dateTimeAttr?: "iso" | "input" | false;
}

export default function DateFormatter({
  dateString,
  className,
  pattern = "PPP",
  locale,
  dateTimeAttr = "iso",
}: DateFormatterProps) {
  const { formatted, dateTime } = React.useMemo(() => {
    // Normalize to Date
    let d: Date | null = null;

    if (dateString instanceof Date) {
      d = isValidDate(dateString) ? dateString : null;
    } else if (typeof dateString === "number") {
      const tmp = new Date(dateString);
      d = isValidDate(tmp) ? tmp : null;
    } else if (typeof dateString === "string") {
      // Prefer strict ISO parse; if invalid, fall back to Date.parse
      const iso = parseISO(dateString);
      d = isValidDate(iso) ? iso : (() => {
        const t = Date.parse(dateString);
        const tmp = Number.isNaN(t) ? null : new Date(t);
        return tmp && isValidDate(tmp) ? tmp : null;
      })();
    }

    // If valid date, format; else fall back to original text
    if (d) {
      let out = "";
      try {
        out = dfFormat(d, pattern, locale ? { locale } : undefined);
      } catch {
        // Pattern/locale error: safe fallback (YYYY-MM-DD)
        out = d.toISOString().slice(0, 10);
      }

      let dt: string | undefined;
      if (dateTimeAttr === "iso") dt = d.toISOString();
      else if (dateTimeAttr === "input") {
        const looksIso = typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateString);
        dt = looksIso ? dateString : d.toISOString();
      } // false => undefined

      return { formatted: out, dateTime: dt };
    }

    return { formatted: String(dateString), dateTime: undefined };
  }, [dateString, pattern, locale, dateTimeAttr]);

  return (
    <time dateTime={dateTime} className={className}>
      {formatted}
    </time>
  );
}
