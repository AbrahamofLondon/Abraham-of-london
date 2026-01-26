declare global {
  interface String {
    safeCharAt(index?: number, fallback?: string): string;
    safeCapitalize(fallback?: string): string;
    safeFirstChar(fallback?: string): string;
  }
}

// Implementation
if (typeof String.prototype.safeCharAt === 'undefined') {
  String.prototype.safeCharAt = function(index = 0, fallback = '') {
    if (this.length === 0 || index >= this.length || index < 0) {
      return fallback;
    }
    return this.charAt(index);
  };
  
  String.prototype.safeCapitalize = function(fallback = '') {
    if (this.length === 0) return fallback;
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  };
  
  String.prototype.safeFirstChar = function(fallback = '?') {
    const char = this.safeCharAt(0, fallback);
    return char.toUpperCase();
  };
}

export {}; // Make it a module