import { describe, it, expect } from 'vitest';
import { fuseScores } from '../deal-fusion';

describe('DEAL FUSION ENGINE v3.0 — Institutional Validation', () => {

  it('identifies the SOVEREIGN WHALE (Priority Override)', () => {
    const input = {
      ruleScore: 40,        // Low initial rules
      aiScore: 45,          // Low AI sentiment
      revenue: 15_000_000,  // WHALE TIER ($10M+)
      authority: "CEO",
      problem: "We need a global restructure and board alignment.", // High value
      sessionDepth: 2,
      timeOnSite: 60
    };

    const result = fuseScores(input);

    expect(result.priority).toBe('SOVEREIGN');
    expect(result.route).toBe('STRATEGY');
    expect(result.rationale).toContain("Direct Decision Authority confirmed (+5).");
    expect(result.rationale).toContain("Signal Resonance: High-value problem matched with scale (+7).");
  });

  it('elevates the STRATEGIC PROXY (Vetting recognition)', () => {
    const input = {
      ruleScore: 75,
      aiScore: 80,
      aiConfidence: 0.9,
      revenue: 2_500_000,
      authority: "Chief of Staff", // Not the owner, but a power-gate
      problem: "Strategic friction in execution layers.",
      sessionDepth: 12,
      timeOnSite: 900
    };

    const result = fuseScores(input);

    expect(result.route).toBe('STRATEGY');
    expect(result.rationale).toContain("Strategic Proxy detected (High-level vetting) (+3).");
    expect(result.temperature).toBe('SCORCHING'); // High behavior + proxy + rev
  });

  it('handles HIGH-SIGNAL DISSONANCE (Confidence checking)', () => {
    const input = {
      ruleScore: 90,        // Rules say YES
      aiScore: 20,          // AI says NO (Dissonance)
      aiConfidence: 0.9,
      revenue: 500_000,
      authority: "Manager",
      problem: "Small issue."
    };

    const result = fuseScores(input);

    // Large gap between 90 and 20 should tank routeConfidence
    expect(result.routeConfidence).toBeLessThan(60); 
    expect(result.route).toBe('DIAGNOSTIC'); // Falls back to diagnostic due to low authority and resonance
  });

  it('silently REJECTS the CONSULTING TOURIST', () => {
    const input = {
      ruleScore: 20,
      aiScore: 20,
      revenue: 50_000,
      authority: "Student",
      problem: "Just looking for info.",
      sessionDepth: 1,
      timeOnSite: 10
    };

    const result = fuseScores(input);

    expect(result.route).toBe('REJECT');
    expect(result.priority).toBe('MEDIUM'); // Default floor
    expect(result.rationale).toContain("Insufficient signal density for premium route.");
  });

  it('validates the NON-LINEAR RESONANCE SNAP', () => {
    const highResonance = fuseScores({
      ruleScore: 70,
      aiScore: 70,
      revenue: 2_000_000,
      problem: "Governance and alignment friction", // 2 keywords found
      authority: "Founder"
    });

    const lowResonance = fuseScores({
      ruleScore: 70,
      aiScore: 70,
      revenue: 2_000_000,
      problem: "Generic help needed", // 0 keywords found
      authority: "Founder"
    });

    // The resonance bonus (+7) should create a clear separation
    expect(highResonance.fusedScore - lowResonance.fusedScore).toBeGreaterThanOrEqual(7);
    expect(highResonance.rationale).toContain("Signal Resonance: High-value problem matched with scale (+7).");
  });
});