import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const productionEntrypoints = [
  "pages/api/demo/signal-consent-continuation.ts",
  "pages/api/corridor/recommendation-context.ts",
  "pages/corridor/index.tsx",
  "pages/api/demo/funnel-event.ts",
  "pages/admin/demo-conversion.tsx",
  "pages/api/engagements/operator-pilot.ts",
  "pages/api/admin/operator-pilot.ts",
];

const forbiddenDirectStores = [
  "@/lib/demo/signal-consent-transition-store\"",
  "@/lib/intelligence/corridor/recommendation-context-store\"",
  "@/lib/demo/funnel-event-store\"",
];

describe("serverless production route store boundaries", () => {
  it("routes use composed production-safe stores rather than direct local SQLite adapters", () => {
    for (const file of productionEntrypoints) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      for (const forbidden of forbiddenDirectStores) {
        expect(text, `${file} must not import ${forbidden}`).not.toContain(forbidden);
      }
    }
  });
});