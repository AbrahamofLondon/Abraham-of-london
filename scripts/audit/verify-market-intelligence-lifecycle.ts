import { MARKET_INTELLIGENCE_LIFECYCLE } from "@/lib/intelligence/market-intelligence-lifecycle";

const ids = new Set(MARKET_INTELLIGENCE_LIFECYCLE.map((record) => record.id));
const errors: string[] = [];

for (const record of MARKET_INTELLIGENCE_LIFECYCLE) {
  if (
    (record.lifecycleState === "ACTIVE" || record.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED") &&
    !record.purchasable
  ) {
    errors.push(`${record.id} is active but not purchasable.`);
  }

  if (record.lifecycleState === "DRAFT" && record.purchasable) {
    errors.push(`${record.id} is draft but purchasable.`);
  }

  if (record.lifecycleState === "RETIRED" && record.publicVisible && !record.archiveVisible) {
    errors.push(`${record.id} is retired and public-visible without archive visibility.`);
  }

  if (record.supersededBy && record.supersededBy === record.id) {
    errors.push(`${record.id} supersedes itself.`);
  }

  for (const linkedId of [record.nextExpected, record.replaces, record.supersededBy]) {
    if (linkedId && !ids.has(linkedId)) {
      errors.push(`${record.id} references missing lifecycle record ${linkedId}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Market intelligence lifecycle registry is valid.");
