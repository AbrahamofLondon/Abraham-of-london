/**
 * lib/research/fixture-registry.ts
 *
 * Central registry of all Foundry test fixtures.
 * Every fixture used by any adapter test should be registered here.
 * Enables single-command adapter test runs and fixture discovery.
 */

export type FixtureEntry = {
  id: string;
  name: string;
  adapterId: string;
  description: string;
  category: "qualifying" | "non-qualifying" | "borderline" | "malformed" | "edge-case";
};

export const FIXTURE_REGISTRY: FixtureEntry[] = [
  // ── Executive Reporting ─────────────────────────────────────────────────
  { id: "er-disordered", name: "Disordered (high dissonance)", adapterId: "executive-reporting", description: "averageDissonance ≈ 65%, HCD CRITICAL, not authorized", category: "qualifying" },
  { id: "er-misaligned", name: "Misaligned (moderate dissonance)", adapterId: "executive-reporting", description: "averageDissonance ≈ 16%, not authorized", category: "borderline" },
  { id: "er-ordered", name: "Ordered (low dissonance)", adapterId: "executive-reporting", description: "averageDissonance ≈ 3%, authorized", category: "non-qualifying" },

  // ── Boardroom Mode ──────────────────────────────────────────────────────
  { id: "boardroom-qualifying", name: "Qualifying (£8.5k/month)", adapterId: "boardroom-dossier", description: "Cost ≥ £5k, accuracy yes, authority condition", category: "qualifying" },
  { id: "boardroom-borderline", name: "Borderline (£5.2k/month)", adapterId: "boardroom-dossier", description: "Cost just above £5k, accuracy partial, execution condition", category: "borderline" },
  { id: "boardroom-non-qualifying", name: "Non-qualifying (£1.8k/month)", adapterId: "boardroom-dossier", description: "Cost below £5k, accuracy no", category: "non-qualifying" },
  { id: "boardroom-high-cost", name: "High-cost (£22k/month)", adapterId: "boardroom-dossier", description: "Cost ≥ £20k, qualifies by default regardless of accuracy", category: "qualifying" },
  { id: "boardroom-malformed", name: "Malformed spine", adapterId: "boardroom-dossier", description: "Missing required fields, tests safe failure", category: "malformed" },

  // ── ER → Boardroom Bridge ───────────────────────────────────────────────
  { id: "bridge-disordered-qualifies", name: "Disordered high cost (qualifies)", adapterId: "executive-report-boardroom-bridge", description: "DISORDERED state, £256k exposure, should qualify", category: "qualifying" },
  { id: "bridge-misaligned-borderline", name: "Misaligned borderline", adapterId: "executive-report-boardroom-bridge", description: "MISALIGNED state, £125k exposure", category: "borderline" },
  { id: "bridge-ordered-no-qualify", name: "Ordered (does not qualify)", adapterId: "executive-report-boardroom-bridge", description: "ORDERED state, £15k exposure", category: "non-qualifying" },
  { id: "bridge-mapping-gap", name: "Mapping gap insufficient", adapterId: "executive-report-boardroom-bridge", description: "Minimal report with missing fields", category: "edge-case" },

  // ── Strategy Room ───────────────────────────────────────────────────────
  { id: "strategy-strong", name: "Strong fixture (passes threshold)", adapterId: "strategy-room", description: "Authority yes, score ≥ 16", category: "qualifying" },
  { id: "strategy-weak", name: "Weak fixture (below threshold)", adapterId: "strategy-room", description: "Authority no, score < 16", category: "non-qualifying" },

  // ── Fast Diagnostic ─────────────────────────────────────────────────────
  { id: "fast-default", name: "Default answers", adapterId: "fast-diagnostic", description: "Mid-range answers for self-test", category: "qualifying" },

  // ── Constitutional Diagnostic ───────────────────────────────────────────
  { id: "constitutional-default", name: "Default answers", adapterId: "constitutional-diagnostic", description: "Uniform mid-range answers", category: "qualifying" },
];

export function getFixturesByAdapter(adapterId: string): FixtureEntry[] {
  return FIXTURE_REGISTRY.filter((f) => f.adapterId === adapterId);
}

export function getFixture(id: string): FixtureEntry | undefined {
  return FIXTURE_REGISTRY.find((f) => f.id === id);
}

export function getAdapterIds(): string[] {
  return [...new Set(FIXTURE_REGISTRY.map((f) => f.adapterId))];
}
