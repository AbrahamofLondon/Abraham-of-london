// components/DateFormatter.tsx
import React from "react";
import { format, parseISO } from "date-fns";

interface DateFormatterProps {
  dateString: string;
  className?: string;
  /** date-fns format string (default 'PPP') */
  pattern?: string;
}

export default function DateFormatter({
  dateString,
  className,
  pattern = "PPP",
}: DateFormatterProps) {
  let date: Date;

  try {
    // ISO-8601 strings like "2024-06-01" or "2024-06-01T12:34:56Z"
    date = parseISO(dateString);
  } catch {
    const ts = Date.parse(dateString);
    date = Number.isNaN(ts) ? new Date(NaN) : new Date(ts);
  }

  const output = Number.isNaN(date.getTime())
    ? dateString
    : format(date, pattern);

  return (
    <time dateTime={dateString} className={className}>
      {output}
    </time>
  );
}
