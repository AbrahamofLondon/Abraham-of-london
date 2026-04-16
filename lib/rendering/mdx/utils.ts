export const IS_DEV = process.env.NODE_ENV !== "production";

export function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function preview(code: string, max = 250): string {
  return code.slice(0, max);
}
