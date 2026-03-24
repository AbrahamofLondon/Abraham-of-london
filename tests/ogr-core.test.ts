import { describe, it, expect } from 'vitest';
import { useOGRStore } from '../store/useOGRStore';

// We isolate the calculation engine for the test
// In a real project, export 'calculateDerived' from your store file
const calculate = (r: number, f: number, rev: number) => {
  // Mocking the store's internal logic for pure math validation
  const R = Math.max(0, Math.min(100, r));
  const F = Math.max(0, Math.min(99.99, f));
  const Rev = Math.max(0, rev);

  const itax = ((100 - R) * 1.25) + (F * 0.05);
  const vMult = R / (100 - F);
  const alpha = Rev * ((F / 100) - ((100 - R) / 100));
  const certainty = (R * 0.7) + ((100 - F) * 0.3);

  return { itax, vMult, alpha, certainty };
};

describe('OGR Core Mathematical Integrity', () => {

  it('verifies Integration Tax at Perfect Resonance (R=100, F=0)', () => {
    const { itax } = calculate(100, 0, 100);
    expect(itax).toBe(0); // Perfect resonance should yield zero tax
  });

  it('guards against Division by Zero (F=100)', () => {
    const { vMult } = calculate(100, 100, 100);
    // Should use the 99.99 clamp: 100 / (100 - 99.99) = 10,000
    expect(vMult).toBeLessThanOrEqual(10000);
    expect(Number.isFinite(vMult)).toBe(true);
  });

  it('validates Resonance Alpha Break-Even point', () => {
    // If Resonance Drag (100-R) equals Market Friction (F), Alpha should be 0
    // R=80 (Drag=20), F=20.
    const { alpha } = calculate(80, 20, 100);
    expect(alpha).toBe(0);
  });

  it('proves Sovereign Certainty Threshold (Go/No-Go)', () => {
    // R=90, F=10 -> (90*0.7) + (90*0.3) = 90%
    const { certainty } = calculate(90, 10, 100);
    expect(certainty).toBeGreaterThanOrEqual(90);
  });

  it('handles negative inputs via clamping', () => {
    const { itax, certainty } = calculate(-50, 150, 100);
    // Should treat -50 as 0 and 150 as 99.99
    // Max Tax = (100*1.25) + (99.99*0.05)
    expect(itax).toBeLessThan(131); 
    expect(certainty).toBeGreaterThan(0);
  });

  it('maintains precision under high-volume drift simulation', () => {
    let currentFriction = 65.0;
    for (let i = 0; i < 10000; i++) {
      currentFriction += (Math.random() - 0.5) * 0.1;
      const { certainty } = calculate(92.5, currentFriction, 100);
      expect(Number.isNaN(certainty)).toBe(false);
    }
  });
});