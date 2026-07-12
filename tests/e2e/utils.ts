import { Page } from "@playwright/test";
export async function stabilizeForSnapshot(page: Page) {
  await page.addStyleTag({ content: `*{animation:none!important;transition:none!important;caret-color:transparent!important}html,body{scroll-behavior:auto!important}` });
  await page.waitForLoadState("networkidle");
}
export function originOf(u: string){const x=new URL(u);return `${x.protocol}//${x.host}`;}
