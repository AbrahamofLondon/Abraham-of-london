// tests/e2e/axe-helpers.ts
import { Page, test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type AxeRunOptions = {
  tags?: string[];
  rules?: Record<string, { enabled: boolean }>;
};

export async function runAxe(page: Page, opts: AxeRunOptions = {}) {
  const builder = new AxeBuilder({ page });
  if (opts.tags?.length) builder.withTags(opts.tags);
  if (opts.rules) {
    for (const [id, cfg] of Object.entries(opts.rules)) builder.disableRules(id);
  }
  const results = await builder.analyze();
  if (results.violations.length) {
    // Fail with a compact message + attach JSON
    await test.info().attach('axe-violations.json', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(results.violations, null, 2)),
    });
  }
  expect(results.violations, 'Accessibility violations found').toEqual([]);
}
