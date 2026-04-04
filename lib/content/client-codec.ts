import pako from "pako";

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function decodeBodyCodePayload(payload: {
  bodyCode?: unknown;
  compressed?: unknown;
  encoding?: unknown;
}): string {
  const bodyCode = safeString(payload?.bodyCode);
  if (!bodyCode) return "";

  const compressed = payload?.compressed === true;
  const encoding = safeString(payload?.encoding).toLowerCase();

  if (!compressed) return bodyCode;
  if (encoding && encoding !== "gzip-base64") return bodyCode;

  try {
    const binary = atob(bodyCode);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return pako.ungzip(bytes, { to: "string" });
  } catch {
    return "";
  }
}