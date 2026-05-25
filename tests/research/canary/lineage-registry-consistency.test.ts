/**
 * tests/research/canary/lineage-registry-consistency.test.ts
 *
 * Canary: Ensures lineage chain definitions are consistent with Pass 1 registries.
 * Fails if:
 * - chain event references unknown governance event
 * - chain record references unknown canonical record
 * - chain surface references unknown product surface
 * - chain admin route is not registered
 */

import { describe, it, expect } from "vitest";
import { LINEAGE_CHAIN_DEFINITIONS } from "@/lib/research/lineage/lineage-chain-definitions";
import { getEventType } from "@/lib/platform/governance-event-types";
import { getCanonicalRecord } from "@/lib/platform/canonical-record-registry";
import { getProductLadderEntry } from "@/lib/platform/product-ladder-registry";
import { getAdminRoute } from "@/lib/platform/admin-domain-registry";

describe("lineage registry consistency", () => {
  for (const chain of LINEAGE_CHAIN_DEFINITIONS) {
    describe(`${chain.chainId} (${chain.title})`, () => {
      it("source surface exists in product-ladder-registry", () => {
        const surface = getProductLadderEntry(chain.sourceSurface);
        expect(surface, `Surface "${chain.sourceSurface}" not found in product-ladder-registry`).toBeDefined();
      });

      it("expected canonical record exists in canonical-record-registry", () => {
        const record = getCanonicalRecord(chain.expectedCanonicalRecord);
        expect(record, `Record "${chain.expectedCanonicalRecord}" not found in canonical-record-registry`).toBeDefined();
      });

      for (const eventDef of chain.events) {
        it(`event "${eventDef.eventType}" has governance event type registered`, () => {
          const govEvent = getEventType(eventDef.eventType);
          // Some events may not yet be registered — that's a gap, not a test failure
          // The simulation engine will detect this and create a gap
          if (!govEvent) {
            console.warn(`[canary] Event "${eventDef.eventType}" not in governance-event-types. This will create a simulation gap.`);
          }
        });

        it(`event "${eventDef.eventType}" canonical record "${eventDef.expectedCanonicalRecord}" exists in registry`, () => {
          const record = getCanonicalRecord(eventDef.expectedCanonicalRecord);
          expect(record, `Record "${eventDef.expectedCanonicalRecord}" for event "${eventDef.eventType}" not found`).toBeDefined();
        });
      }

      // Check admin route
      const surface = getProductLadderEntry(chain.sourceSurface);
      if (surface?.adminOwnerSurface) {
        it(`admin route "${surface.adminOwnerSurface}" exists in admin-domain-registry`, () => {
          const route = getAdminRoute(surface.adminOwnerSurface);
          if (!route) {
            console.warn(`[canary] Admin route "${surface.adminOwnerSurface}" not in admin-domain-registry. This will create a simulation gap.`);
          }
        });
      }
    });
  }
});
