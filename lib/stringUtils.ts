export function safeSplit(str: string | undefined | null, separator: string): string[] {
  if (!str || typeof str !== 'string') {
    return [];
  }
  return str.split(separator);
}

export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export function safeExcerpt(content: string | undefined, maxLength: number = 150): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength).trim() + '...';
}