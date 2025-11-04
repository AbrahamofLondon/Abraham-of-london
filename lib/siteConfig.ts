export const siteConfig = { siteUrl: "https://www.abrahamoflondon.org" };
export function absUrl(p: string): string {
  const base = siteConfig.siteUrl.replace(/\/+$/, "");
  const path = String(p || "").replace(/^\/+/, "");
  return `${base}/${path}`;
}
