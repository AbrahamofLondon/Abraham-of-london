// File: tests/e2e/a11y.spec.ts
import { test } from '@playwright/test';
import { runAxe } from './axe-helpers';

const ROUTES = ['/', '/downloads', '/ventures', '/blog'];

// Skip axe on CI unless explicitly enabled (A11Y=1), run locally by default
const skipA11y = !!process.env.CI && process.env.A11Y !== '1';
test.skip(skipA11y, 'Skip axe a11y on CI unless A11Y=1');

test.describe('A11y core routes (axe)', () => {
  for (const route of ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await runAxe(page, { tags: ['wcag2a', 'wcag2aa'] });
    });
  }
