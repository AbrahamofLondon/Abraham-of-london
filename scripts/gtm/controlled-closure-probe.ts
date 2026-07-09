import { generateAllVerdicts } from "@/lib/fulfilment/estate-verdict-layer";
import { buildControlledReleaseProofMatrix } from "@/lib/fulfilment/controlled-release-proof-matrix";

const verdicts = generateAllVerdicts();
const tally: Record<string, number> = {};
for (const v of verdicts) tally[v.disposition] = (tally[v.disposition] ?? 0) + 1;
console.log("verdict tally:", JSON.stringify(tally), "total:", verdicts.length);

const matrix = buildControlledReleaseProofMatrix();
console.log("controlled products:", matrix.length);
const deficits = matrix.filter((r) => r.temporaryImplementationDeficit);
console.log("temporaryImplementationDeficit=true:", deficits.length, deficits.map((r) => r.productCode).join(", ") || "(none)");
const unprovenCells: string[] = [];
for (const r of matrix) {
  for (const key of ["checkoutDisabledWhereRequired", "directApiBypassBlocked", "commercialResolverAction", "fulfilmentPath", "deliveryGate", "claimBoundary", "bypassPrevention"] as const) {
    if (!r[key].proven) unprovenCells.push(`${r.productCode}.${key}`);
  }
}
console.log("unproven proof cells:", unprovenCells.length, unprovenCells.slice(0, 40).join(", ") || "(none)");
console.log("controlled product codes:", matrix.map((r) => r.productCode).join(", "));
