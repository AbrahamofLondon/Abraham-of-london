import { test, expect } from "@playwright/test";
test("asset ok", async ({ request }) => { const r = await request.get("/assets/sample.txt"); expect(r.status()).toBe(200); });
test("pdf ok", async ({ request }) => { const r = await request.get("/downloads/Fathering_Without_Fear.pdf"); expect(r.status()).toBe(200); });
