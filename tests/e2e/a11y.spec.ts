// tests/e2e/a11y.spec.ts
import { test } from '@playwright/test';
import { runAxe } from './axe-helpers';

const ROUTES = ['/', '/downloads', '/ventures', '/blog'];

test.describe('A11y core routes (axe)', () => {
  for (const route of ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await runAxe(page, {
        tags: ['wcag2a', 'wcag2aa'],
        // Disable heavy/brand-dependent rules if needed by uncommenting:
        // rules: { 'color-contrast': { enabled: false } },
      });
    });
  }
});
