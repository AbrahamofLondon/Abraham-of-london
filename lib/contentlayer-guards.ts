// lib/contentlayer-guards.ts
// Simple stub implementation

export function isContentlayerLoaded(): boolean {
  if (typeof window !== 'undefined') {
    return !!(window as any).__contentlayer;
  }
  return true;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) {
    console.warn('ContentLayer data is not loaded.');
  }
}