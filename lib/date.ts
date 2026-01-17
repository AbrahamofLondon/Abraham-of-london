/**
 * Premium Date Utility Functions
 * Strict validation with no compromises
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateValidationResult {
  valid: boolean;
  message?: string;
  details?: {
    startValid: boolean;
    endValid: boolean;
    rangeValid: boolean;
    maxDaysValid?: boolean;
  };
}

export interface TimeSpan {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Validates date range with strict rules
 */
export function validateDateRange(
  start: Date, 
  end: Date, 
  maxDays?: number,
  minDays?: number
): DateValidationResult {
  const details = {
    startValid: false,
    endValid: false,
    rangeValid: false,
    maxDaysValid: true,
    minDaysValid: true
  };

  // Validate start date
  if (!start) {
    return { 
      valid: false, 
      message: 'Start date is required',
      details 
    };
  }
  
  if (!(start instanceof Date)) {
    return { 
      valid: false, 
      message: 'Start must be a valid Date object',
      details 
    };
  }
  
  if (isNaN(start.getTime())) {
    return { 
      valid: false, 
      message: 'Invalid start date value',
      details 
    };
  }
  
  details.startValid = true;

  // Validate end date
  if (!end) {
    return { 
      valid: false, 
      message: 'End date is required',
      details 
    };
  }
  
  if (!(end instanceof Date)) {
    return { 
      valid: false, 
      message: 'End must be a valid Date object',
      details 
    };
  }
  
  if (isNaN(end.getTime())) {
    return { 
      valid: false, 
      message: 'Invalid end date value',
      details 
    };
  }
  
  details.endValid = true;

  // Validate range
  if (start > end) {
    return { 
      valid: false, 
      message: 'Start date must be before end date',
      details 
    };
  }
  
  details.rangeValid = true;

  // Validate max days if specified
  if (maxDays) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > maxDays) {
      details.maxDaysValid = false;
      return { 
        valid: false, 
        message: `Date range exceeds maximum of ${maxDays} days (actual: ${diffDays} days)`,
        details 
      };
    }
  }

  // Validate min days if specified
  if (minDays) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < minDays) {
      details.minDaysValid = false;
      return { 
        valid: false, 
        message: `Date range is less than minimum of ${minDays} days (actual: ${diffDays} days)`,
        details 
      };
    }
  }

  return { 
    valid: true, 
    details: {
      ...details,
      maxDaysValid: true,
      minDaysValid: true
    }
  };
}

/**
 * Parses date with strict validation
 */
export function parseDateStrict(
  dateInput: string | Date, 
  formatHint?: string
): Date {
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      throw new Error('Invalid Date object provided');
    }
    return dateInput;
  }

  if (typeof dateInput !== 'string') {
    throw new Error('Date input must be a string or Date object');
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: "${dateInput}"`);
  }

  // Validate ISO format if specified
  if (formatHint === 'ISO') {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
    if (!isoRegex.test(dateInput)) {
      throw new Error(`Date must be in ISO format: "${dateInput}"`);
    }
  }

  // Validate YYYY-MM-DD format if specified
  if (formatHint === 'YYYY-MM-DD') {
    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!ymdRegex.test(dateInput)) {
      throw new Error(`Date must be in YYYY-MM-DD format: "${dateInput}"`);
    }
  }

  return date;
}

/**
 * Formats date to ISO string with UTC timezone
 */
export function formatDateISOUTC(date: Date): string {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

/**
 * Formats date to YYYY-MM-DD with validation
 */
export function formatDateYMD(date: Date): string {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Adds time span to date with validation
 */
export function addTimeSpan(date: Date, span: TimeSpan): Date {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const result = new Date(date);
  
  if (span.years !== undefined) {
    if (!Number.isInteger(span.years)) {
      throw new Error('Years must be an integer');
    }
    result.setFullYear(result.getFullYear() + span.years);
  }
  
  if (span.months !== undefined) {
    if (!Number.isInteger(span.months)) {
      throw new Error('Months must be an integer');
    }
    result.setMonth(result.getMonth() + span.months);
  }
  
  if (span.days !== undefined) {
    if (!Number.isInteger(span.days)) {
      throw new Error('Days must be an integer');
    }
    result.setDate(result.getDate() + span.days);
  }
  
  if (span.hours !== undefined) {
    if (!Number.isInteger(span.hours)) {
      throw new Error('Hours must be an integer');
    }
    result.setHours(result.getHours() + span.hours);
  }
  
  if (span.minutes !== undefined) {
    if (!Number.isInteger(span.minutes)) {
      throw new Error('Minutes must be an integer');
    }
    result.setMinutes(result.getMinutes() + span.minutes);
  }
  
  if (span.seconds !== undefined) {
    if (!Number.isInteger(span.seconds)) {
      throw new Error('Seconds must be an integer');
    }
    result.setSeconds(result.getSeconds() + span.seconds);
  }

  return result;
}

/**
 * Gets start of day with validation
 */
export function startOfDay(date: Date): Date {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets end of day with validation
 */
export function endOfDay(date: Date): Date {
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calculates difference between dates in specified unit
 */
export function dateDiff(
  date1: Date,
  date2: Date,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'
): number {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    throw new Error('Both inputs must be Date objects');
  }
  
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    throw new Error('Invalid date values');
  }

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
    case 'months':
      const yearDiff = date2.getFullYear() - date1.getFullYear();
      const monthDiff = date2.getMonth() - date1.getMonth();
      return Math.abs(yearDiff * 12 + monthDiff);
    case 'years':
      return Math.abs(date2.getFullYear() - date1.getFullYear());
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Checks if date is within range (inclusive)
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  if (!(date instanceof Date) || !(start instanceof Date) || !(end instanceof Date)) {
    throw new Error('All inputs must be Date objects');
  }
  
  if (isNaN(date.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date values');
  }

  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Validates if string is a valid date
 */
export function isValidDateString(dateString: string, format?: string): boolean {
  if (typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return false;
  }

  // Additional format validation
  if (format === 'ISO') {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
    return isoRegex.test(dateString);
  }
  
  if (format === 'YYYY-MM-DD') {
    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    return ymdRegex.test(dateString);
  }

  return true;
}

/**
 * Gets current date in UTC
 */
export function getCurrentUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
}

/**
 * Generates date range with validation
 */
export function generateDateRange(
  start: Date,
  end: Date,
  step: TimeSpan = { days: 1 }
): Date[] {
  const validation = validateDateRange(start, end);
  if (!validation.valid) {
    throw new Error(`Invalid date range: ${validation.message}`);
  }

  const dates: Date[] = [];
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current = addTimeSpan(current, step);
  }
  
  return dates;
}

/**
 * Calculates age from birth date
 */
export function calculateAge(birthDate: Date, referenceDate = new Date()): number {
  if (!(birthDate instanceof Date) || !(referenceDate instanceof Date)) {
    throw new Error('Both inputs must be Date objects');
  }
  
  if (isNaN(birthDate.getTime()) || isNaN(referenceDate.getTime())) {
    throw new Error('Invalid date values');
  }

  if (birthDate > referenceDate) {
    throw new Error('Birth date cannot be in the future');
  }

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
  
  return Math.max(0, age);
}

// Export all premium functions
export default {
  validateDateRange,
  parseDateStrict,
  formatDateISOUTC,
  formatDateYMD,
  addTimeSpan,
  startOfDay,
  endOfDay,
  dateDiff,
  isDateInRange,
  isValidDateString,
  getCurrentUTC,
  generateDateRange,
  calculateAge,
};