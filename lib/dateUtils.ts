/**
 * Date utility functions for the application
 */

// === TYPE DEFINITIONS ===

export interface DateRangeValidationResult {
  ok: boolean;
  message?: string;
  statusCode?: number;
}

export interface TimeUnit {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

// === DATE VALIDATION ===

/**
 * Validates a date range with constraints
 */
export function validateDateRange(input: {
  since: Date;
  until: Date;
  maxDays: number;
}): DateRangeValidationResult {
  const { since, until, maxDays } = input;

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return { 
      ok: false, 
      message: "Invalid date format provided", 
      statusCode: 400 
    };
  }
  
  if (since > until) {
    return { 
      ok: false, 
      message: "Temporal paradox: Start date is after end date", 
      statusCode: 400 
    };
  }
  
  const diffTime = Math.abs(until.getTime() - since.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > maxDays) {
    return { 
      ok: false, 
      message: `Oversight limit exceeded: max ${maxDays} days per export`, 
      statusCode: 400 
    };
  }

  return { ok: true };
}

/**
 * Validates if a string is a valid date
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Parses a date string or returns current date if invalid
 */
export function parseDateSafe(dateString: string | Date, fallback = new Date()): Date {
  try {
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? fallback : dateString;
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? fallback : date;
  } catch {
    return fallback;
  }
}

// === DATE FORMATTING ===

/**
 * Formats a date to ISO string without timezone offset
 */
export function formatToISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Formats date to human-readable string
 */
export function formatDateHuman(date: Date, includeTime = true): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats date to YYYY-MM-DD string
 */
export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats date to filename-safe string
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}`;
}

// === DATE CALCULATIONS ===

/**
 * Adds time units to a date
 */
export function addTimeToDate(date: Date, units: TimeUnit): Date {
  const result = new Date(date);
  
  if (units.years) result.setFullYear(result.getFullYear() + units.years);
  if (units.months) result.setMonth(result.getMonth() + units.months);
  if (units.days) result.setDate(result.getDate() + units.days);
  if (units.hours) result.setHours(result.getHours() + units.hours);
  if (units.minutes) result.setMinutes(result.getMinutes() + units.minutes);
  if (units.seconds) result.setSeconds(result.getSeconds() + units.seconds);
  
  return result;
}

/**
 * Subtracts time units from a date
 */
export function subtractTimeFromDate(date: Date, units: TimeUnit): Date {
  const negativeUnits: TimeUnit = {};
  
  Object.keys(units).forEach(key => {
    negativeUnits[key as keyof TimeUnit] = 
      -(units[key as keyof TimeUnit] as number);
  });
  
  return addTimeToDate(date, negativeUnits);
}

/**
 * Gets the start of the day (00:00:00)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of the day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calculates the difference between two dates in specified unit
 */
export function dateDiff(
  date1: Date,
  date2: Date,
  unit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  
  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    default:
      return diffMs;
  }
}

/**
 * Checks if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// === TIMEZONE HELPERS ===

/**
 * Converts a date to UTC
 */
export function toUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ));
}

/**
 * Gets the current timezone offset in hours
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset() / -60;
}

// === AGE CALCULATION ===

/**
 * Calculates age from birth date
 */
export function calculateAge(birthDate: Date, referenceDate = new Date()): number {
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();
  
  let age = refYear - birthYear;
  
  // Adjust if birthday hasn't occurred yet this year
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age--;
  }
  
  return age;
}

// === BATCH DATE PROCESSING ===

/**
 * Generates an array of dates between two dates
 */
export function generateDateRange(start: Date, end: Date, stepInDays = 1): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + stepInDays);
  }
  
  return dates;
}

/**
 * Splits a date range into chunks
 */
export function splitDateRange(
  start: Date,
  end: Date,
  maxChunkDays: number
): Array<{ start: Date; end: Date }> {
  const chunks: Array<{ start: Date; end: Date }> = [];
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + maxChunkDays);
    
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }
    
    chunks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });
    
    currentStart.setDate(currentStart.getDate() + maxChunkDays + 1);
  }
  
  return chunks;
}

// === DEFAULT EXPORT ===

const dateUtils = {
  validateDateRange,
  isValidDateString,
  parseDateSafe,
  formatToISODate,
  formatDateHuman,
  formatDateYMD,
  formatDateForFilename,
  addTimeToDate,
  subtractTimeFromDate,
  startOfDay,
  endOfDay,
  dateDiff,
  isDateInRange,
  isSameDay,
  toUTC,
  getTimezoneOffset,
  calculateAge,
  generateDateRange,
  splitDateRange,
};

export default dateUtils;