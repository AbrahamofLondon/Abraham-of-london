/**
 * tests/platform/admin-nav-registry-alignment.test.ts
 *
 * Enforces: every active, non-internal admin navigation item must be
 * registered in admin-domain-registry.
 *
 * Failure here means the nav exposes a route that has no declared domain,
 * role, risk level, or audit requirement — an ungoverned surface.
 */

import { describe, it, expect } from "vitest";
import { validateAdminNavAgainstRegistry } from "@/lib/admin/admin-navigation";
import { getAdminRoute } from "@/lib/platform/admin-domain-registry";

describe("admin navigation → admin-domain-registry alignment", () => {
  it("every active non-internal nav item is registered in admin-domain-registry", () => {
    const violations = validateAdminNavAgainstRegistry(getAdminRoute);
    if (violations.length > 0) {
      const details = violations
        .map((v) => `  • ${v.id} (${v.href}): ${v.reason}`)
        .join("\n");
      throw new Error(
        `${violations.length} active nav item(s) not in admin-domain-registry:\n${details}\n\n` +
          "Fix: add the route to ADMIN_ROUTES in lib/platform/admin-domain-registry.ts, " +
          'or set the nav item status to "stub"/"broken"/"deprecated", ' +
          'or set visibility to "internal".',
      );
    }
    expect(violations).toHaveLength(0);
  });
});
