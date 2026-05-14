/**
 * lib/admin/admin-navigation.test.ts
 *
 * Navigation reality hardening tests.
 *
 * Enforces the core principle: admin navigation must not lie.
 * No broken/stub surface should appear as active to operators.
 */

import { describe, expect, it } from "vitest";
import { ADMIN_NAVIGATION, getAllAdminNavItems, getNavItemsForRole } from "@/lib/admin/admin-navigation";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function allItems() {
  return getAllAdminNavItems();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin navigation registry", () => {
  it("contains at least one section with items", () => {
    expect(ADMIN_NAVIGATION.length).toBeGreaterThan(0);
    expect(allItems().length).toBeGreaterThan(0);
  });

  it("every item has a non-empty id, label, href, router, visibility, and status", () => {
    for (const item of allItems()) {
      expect(item.id, `item.id blank`).toBeTruthy();
      expect(item.label, `label blank for ${item.id}`).toBeTruthy();
      expect(item.href, `href blank for ${item.id}`).toBeTruthy();
      expect(item.router, `router blank for ${item.id}`).toMatch(/^(pages|app)$/);
      expect(item.visibility, `visibility blank for ${item.id}`).toBeTruthy();
      expect(item.status, `status blank for ${item.id}`).toBeTruthy();
    }
  });

  it("every item has a description", () => {
    const missing = allItems().filter((item) => !item.description || item.description.trim() === "");
    expect(missing.map((i) => i.id)).toEqual([]);
  });

  it("no operator-visible nav item has status 'broken'", () => {
    const operatorBroken = allItems().filter(
      (item) => item.visibility === "operator" && item.status === "broken",
    );
    expect(
      operatorBroken.map((i) => i.id),
      "Broken items must not be visible to operator role",
    ).toEqual([]);
  });

  it("no operator-visible nav item has status 'stub'", () => {
    const operatorStub = allItems().filter(
      (item) => item.visibility === "operator" && item.status === "stub",
    );
    expect(
      operatorStub.map((i) => i.id),
      "Stub items must not be visible to operator role",
    ).toEqual([]);
  });

  it("/admin/outcome-verification is present in nav", () => {
    const item = allItems().find((i) => i.href === "/admin/outcome-verification");
    expect(item, "/admin/outcome-verification must be registered in ADMIN_NAVIGATION").toBeDefined();
    expect(item?.id).toBe("outcome-verification");
    expect(item?.status).toBe("active");
  });

  it("/admin/reporting/executive is registered and its href matches an existing route (page.tsx created)", () => {
    const item = allItems().find((i) => i.href === "/admin/reporting/executive");
    expect(item, "/admin/reporting/executive must be in nav").toBeDefined();
    // The page was created — status should be active, not broken
    expect(item?.status).toBe("active");
  });

  it("broken items are not visible to operator role via getNavItemsForRole", () => {
    const operatorSections = getNavItemsForRole("operator");
    const operatorItems = operatorSections.flatMap((s) => s.items);
    const broken = operatorItems.filter((i) => i.status === "broken");
    expect(broken.map((i) => i.id)).toEqual([]);
  });

  it("internal items are not returned by getNavItemsForRole for any normal role", () => {
    for (const role of ["admin", "operator", "sponsor_safe"] as const) {
      const sections = getNavItemsForRole(role);
      const items = sections.flatMap((s) => s.items);
      const internal = items.filter((i) => i.visibility === "internal");
      expect(internal.map((i) => i.id), `internal items visible to ${role}`).toEqual([]);
    }
  });

  it("no two nav items share the same id", () => {
    const ids = allItems().map((i) => i.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    expect(duplicates, "duplicate nav item ids found").toEqual([]);
  });

  it("all hrefs start with /admin", () => {
    const bad = allItems().filter((i) => !i.href.startsWith("/admin"));
    expect(bad.map((i) => `${i.id}: ${i.href}`)).toEqual([]);
  });
});
