// lib/date.ts
export function formatDate(input: string | number | Date, locale = 'en-GB'): string {
  try {
    const d =
      input instanceof Date
        ? input
        : typeof input === 'number'
        ? new Date(input)
        : new Date(input);

    if (isNaN(d.getTime())) return String(input); // fallback to raw if truly invalid

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(d);
  } catch {
    return String(input);
  }
}
