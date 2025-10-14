New-Item -Path tests/e2e -ItemType Directory -Force
Set-Content -Path tests/e2e/blog.spec.ts -Value @'
import { test, expect } from '@playwright/test';

test('Blog page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/blog/kingdom-strategies-for-a-loving-legacy');
  await expect(page.locator('h1')).toHaveText('Kingdom Strategies for a Loving Legacy: Fathering O.J.A-Y');
  await expect(page.locator('text=Explore Fatherhood Resources')).toBeVisible();
});
'@