import { Page } from "@playwright/test";
export async function stabilizeForSnapshot(page: Page) {
  await page.addStyleTag({
    content: `*{animation:none!import ant;transition:none!import ant;caret-color:transparent!import ant}html,body{scroll-behavior:auto!import ant}`,
  });
  await page.waitForLoadState("networkidle");
}
export function originOf(u: string) {
  const x = new URL(u);
  return `${x.protocol}//${x.host}`;
}
