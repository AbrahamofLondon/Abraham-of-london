import pako from "pako";

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function decodeBodyCodePayload(payload: {
  bodyCode?: unknown;
  compressed?: unknown;
  encoding?: unknown;
}): string {
  return decodeCompressedPayload(payload?.bodyCode, payload?.compressed, payload?.encoding);
}

export function decodeBodyHtmlPayload(payload: {
  bodyHtml?: unknown;
  compressed?: unknown;
  encoding?: unknown;
}): string {
  return decodeCompressedPayload(payload?.bodyHtml, payload?.compressed, payload?.encoding);
}

function decodeCompressedPayload(value: unknown, compressedValue?: unknown, encodingValue?: unknown): string {
  const bodyCode = safeString(value);
  if (!bodyCode) return "";

  const compressed = compressedValue === true;
  const encoding = safeString(encodingValue).toLowerCase();

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
