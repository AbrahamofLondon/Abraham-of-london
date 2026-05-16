/**
 * lib/product/public-provenance-demo-record.ts
 *
 * Canonical fixed demo record for the public provenance demonstration.
 *
 * IMMUTABLE — changing any field here changes the stored hash and will cause
 * demo-verify to return MISMATCH until DEMO_PROVENANCE_HASH is updated to match.
 *
 * To update: change the record, re-run `node -e "..."` (see comments below),
 * paste the new hash into DEMO_PROVENANCE_HASH, and update the test.
 *
 * Hash computed with buildGovernedCaseHash (lib/product/governed-case-hash.ts)
 * using SHA-256 over stable canonical JSON (keys sorted alphabetically).
 */

export const PUBLIC_PROVENANCE_DEMO_RECORD = {
  version: 1,
  demoId: "DEMO-GOVERNED-CASE-001",
  caseReference: "DEMO-CASE-2605-001",
  generatedAt: "2026-05-15T00:00:00.000Z",
  surface: "PUBLIC_PROVENANCE_DEMO",
  summary: {
    band: "STRUCTURAL_RISK",
    governanceImplication:
      "Authority and execution responsibility are not yet aligned.",
    nextEarnedAction:
      "Create a governed case to preserve the record and continue in Decision Centre.",
  },
  confidenceBands: {
    userReported: 2,
    systemInferred: 3,
    operatorVerified: 0,
    thirdParty: 0,
  },
  boundary:
    "Demonstration data only. Not connected to any account, case, client, or live governed record.",
} as const;

/**
 * SHA-256 hash of the canonical demo record.
 *
 * Computed via:
 *   node -e "
 *     const {createHash}=require('crypto');
 *     function canonicalize(v){if(Array.isArray(v))return v.map(canonicalize);if(v!==null&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonicalize(v)]));return v;}
 *     const r=require('./lib/product/public-provenance-demo-record').PUBLIC_PROVENANCE_DEMO_RECORD;
 *     console.log(createHash('sha256').update(JSON.stringify(canonicalize(r))).digest('hex'));
 *   "
 */
export const DEMO_PROVENANCE_HASH =
  "6b8e6c3b1b385687920cc4c52fd9100643b48e7e80a9ca9c46805a2f40d0169a";
