// lib/dateUtils.ts

/** Format a date-like value (string or Date) into ISO yyyy-MM-dd string */
export function formatDate(date?: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Parse a date string or Date object, fallback to epoch if invalid */
export function parseDate(date?: string | Date): Date {
  if (!date) return new Date(0);
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? new Date(0) : d;
}
