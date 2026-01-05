// scripts/utils/pdf-validators.ts
export function validateTier(tier: string): void {
  const validTiers = ['basic', 'member', 'premium', 'all'];
  if (!validTiers.includes(tier)) {
    throw new Error(`Invalid tier: ${tier}. Valid values: ${validTiers.join(', ')}`);
  }
}

export function validateQuality(quality: string): void {
  const validQualities = ['draft', 'standard', 'high', 'print'];
  if (!validQualities.includes(quality)) {
    throw new Error(`Invalid quality: ${quality}. Valid values: ${validQualities.join(', ')}`);
  }
}

export function validateFormats(formats: string[]): string[] {
  const validFormats = ['A4', 'Letter', 'A3', 'Legal'];
  const invalid = formats.filter(f => !validFormats.includes(f));
  
  if (invalid.length > 0) {
    throw new Error(`Invalid formats: ${invalid.join(', ')}. Valid values: ${validFormats.join(', ')}`);
  }
  
  return formats;
}