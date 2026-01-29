// lib/utils/safe-extras.ts - NEW FILE
// Add missing safe functions here to avoid circular dependencies

export const safeInteger = (
  value: any,
  defaultValue: number = 0
): number => {
  if (typeof value === 'number') {
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  return defaultValue;
};

export const safeBoolean = (
  value: any,
  defaultValue: boolean = false
): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
};

export const clamp = (
  value: number,
  min: number = 0,
  max: number = 100
): number => {
  return Math.min(max, Math.max(min, value));
};